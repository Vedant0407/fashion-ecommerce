import { NextRequest, NextResponse } from "next/server";
import {
  getStoreOrders,
  updateStoreOrderStatus,
  readStoreData,
  writeStoreData,
  StoreOrder,
} from "@/lib/store-data";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const storeOrders = await getStoreOrders();

    // Optionally merge with any orders from Supabase that aren't in store-data
    try {
      const supabase = await createClient();
      const { data: dbOrders } = await supabase
        .from("orders")
        .select(
          "id, status, subtotal, shipping, total, payment_status, payment_method, created_at, addresses(*)"
        )
        .order("created_at", { ascending: false });

      if (dbOrders && dbOrders.length > 0) {
        const storeOrderIds = new Set(storeOrders.map((o) => o.id));
        for (const dbOrder of (dbOrders as any[])) {
          if (!storeOrderIds.has(dbOrder.id)) {
            const rawAddr = dbOrder.addresses;
            const addr = (Array.isArray(rawAddr) ? rawAddr[0] : rawAddr) || {};
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
              status: dbOrder.status as StoreOrder["status"],
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

    return NextResponse.json({ success: true, count: storeOrders.length, orders: storeOrders });
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
    const { id, status, payment_status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: "Order ID and status are required." },
        { status: 400 }
      );
    }

    // 1. Update in persistent store data
    const updated = await updateStoreOrderStatus(id, status, payment_status);

    // 2. Also update in Supabase orders table
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

    if (!updated) {
      return NextResponse.json(
        { success: false, message: `Order '${id}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order: updated });
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
