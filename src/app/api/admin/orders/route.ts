import { NextRequest, NextResponse } from "next/server";
import {
  getStoreOrders,
  updateStoreOrderStatus,
  readStoreData,
  writeStoreData,
  StoreOrder,
} from "@/lib/store-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const storeOrders = await getStoreOrders(true);

    // Read cookie-based status overrides to bridge serverless environments
    const cookieHeader = request.cookies.get("greeno_order_statuses")?.value;
    let cookieStatuses: Record<string, string> = {};
    if (cookieHeader) {
      try {
        cookieStatuses = JSON.parse(decodeURIComponent(cookieHeader));
      } catch {}
    }

    // Apply cookie status overrides first
    for (const o of storeOrders) {
      if (cookieStatuses[o.id]) {
        o.status = cookieStatuses[o.id] as StoreOrder["status"];
      }
    }

    // Optionally merge with any orders from Supabase and synchronize status
    try {
      const supabase = await createClient();
      const { data: dbOrders } = await supabase
        .from("orders")
        .select(
          "id, status, subtotal, shipping, total, payment_status, payment_method, created_at, addresses(*)"
        )
        .order("created_at", { ascending: false });

      if (dbOrders && dbOrders.length > 0) {
        for (const dbOrder of (dbOrders as any[])) {
          const rawAddr = dbOrder.addresses;
          const addr = (Array.isArray(rawAddr) ? rawAddr[0] : rawAddr) || {};
          const existing = storeOrders.find((o) => o.id === dbOrder.id);
          if (existing) {
            // If cookie had an explicit status override from admin console, preserve it; otherwise apply DB status
            if (cookieStatuses[dbOrder.id]) {
              existing.status = cookieStatuses[dbOrder.id] as StoreOrder["status"];
            } else if (dbOrder.status) {
              existing.status = dbOrder.status as StoreOrder["status"];
            }
            if (dbOrder.payment_status) {
              existing.payment_status = dbOrder.payment_status as StoreOrder["payment_status"];
            }
          } else {
            const finalStatus = (cookieStatuses[dbOrder.id] || dbOrder.status) as StoreOrder["status"];
            storeOrders.push({
              id: dbOrder.id,
              created_at: dbOrder.created_at,
              customer: {
                fullName: addr.full_name || "Customer",
                email: "customer@example.com",
                phone: addr.phone || "",
                address: addr.address_line1 || "",
                city: addr.city || "",
                state: addr.state || "",
                pincode: addr.postal_code || "",
              },
              items: [],
              subtotal: Number(dbOrder.subtotal) || 0,
              shipping: Number(dbOrder.shipping) || 0,
              discount: 0,
              total: Number(dbOrder.total) || 0,
              status: finalStatus,
              payment_method: dbOrder.payment_method || "COD",
              payment_status: dbOrder.payment_status || "pending",
            });
          }
        }
      }
    } catch {
      // Supabase fetch optional
    }

    storeOrders.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json(
      { success: true, count: storeOrders.length, orders: storeOrders },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error: any) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load orders" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, payment_status, order: clientOrder } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: "Order ID and status are required." },
        { status: 400 }
      );
    }

    // 1. Update in persistent store data
    const updated = await updateStoreOrderStatus(id, status, payment_status, clientOrder);

    // 2. Also update in Supabase orders table if id is a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      try {
        const supabase = await createClient();
        await supabase
          .from("orders")
          .update({
            status,
            ...(payment_status ? { payment_status } : {}),
          })
          .eq("id", id);
      } catch (dbErr) {
        console.warn("Supabase status sync notice:", dbErr);
      }
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, message: `Order '${id}' not found.` },
        { status: 404 }
      );
    }

    // 3. Maintain cookie-based status map for serverless cross-lambda persistence
    const cookieHeader = request.cookies.get("greeno_order_statuses")?.value;
    let cookieStatuses: Record<string, string> = {};
    if (cookieHeader) {
      try {
        cookieStatuses = JSON.parse(decodeURIComponent(cookieHeader));
      } catch {}
    }
    cookieStatuses[id] = status;

    const response = NextResponse.json({ success: true, order: updated });
    response.cookies.set(
      "greeno_order_statuses",
      encodeURIComponent(JSON.stringify(cookieStatuses)),
      {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      }
    );

    return response;
  } catch (error: any) {
    console.error("PATCH /api/admin/orders error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID parameter is required." },
        { status: 400 }
      );
    }

    const data = await readStoreData();
    const initialLen = data.orders.length;
    data.orders = data.orders.filter((o) => o.id !== id);

    if (data.orders.length === initialLen) {
      return NextResponse.json(
        { success: false, message: `Order '${id}' not found.` },
        { status: 404 }
      );
    }

    await writeStoreData(data);
    return NextResponse.json({
      success: true,
      message: `Order '${id}' deleted successfully.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/orders error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete order" },
      { status: 500 }
    );
  }
}
