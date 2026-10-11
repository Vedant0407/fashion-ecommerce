import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStoreOrders, syncStoreOrders } from "@/lib/store-data";
import { isOrderMatch } from "@/lib/order-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate" };

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return null;
  return { supabase, user, email: user.email.trim().toLowerCase() };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in." },
        { status: 401, headers: noStoreHeaders }
      );
    }

    const { id } = await params;
    const cleanId = (id || "").trim();
    const allStoreOrders = await getStoreOrders(true);
    const matched = allStoreOrders.find((order) =>
      order.id === cleanId || isOrderMatch(order.id, cleanId)
    );

    if (matched) {
      const orderEmail = matched.customer?.email?.trim().toLowerCase();
      if (orderEmail !== auth.email) {
        return NextResponse.json(
          { success: false, message: "Forbidden. You cannot view another account's order." },
          { status: 403, headers: noStoreHeaders }
        );
      }

      return NextResponse.json(
        {
          success: true,
          order: {
            id: matched.id,
            status: matched.status,
            subtotal: matched.subtotal,
            shipping: matched.shipping,
            discount: matched.discount || 0,
            total: matched.total,
            payment_status: matched.payment_status,
            payment_method: matched.payment_method,
            created_at: matched.created_at,
            customer: matched.customer,
            addresses: {
              full_name: matched.customer?.fullName || "Customer",
              name: matched.customer?.fullName || "Customer",
              phone: matched.customer?.phone || "",
              address_line1: matched.customer?.address || "",
              city: matched.customer?.city || "",
              state: matched.customer?.state || "",
              postal_code: matched.customer?.pincode || "",
              pincode: matched.customer?.pincode || "",
              country: "India",
            },
            items: (matched.items || []).map((item) => ({
              id: item.id || item.product_id,
              product_id: item.product_id,
              product_name: item.name,
              product_price: item.price,
              quantity: item.quantity,
              image: item.image,
              size: item.size,
              color: item.color,
            })),
          },
        },
        { headers: noStoreHeaders }
      );
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    if (isUuid) {
      const { data: order, error } = await auth.supabase
        .from("orders")
        .select("id, status, subtotal, shipping, total, payment_status, payment_method, created_at, address_id, addresses(*)")
        .eq("id", cleanId)
        .eq("user_id", auth.user.id)
        .maybeSingle();

      if (!error && order) {
        const { data: items } = await auth.supabase
          .from("order_items")
          .select("id, product_id, product_name, product_price, quantity")
          .eq("order_id", cleanId);
        return NextResponse.json(
          { success: true, order: { ...order, items: items || [] } },
          { headers: noStoreHeaders }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: "Order not found." },
      { status: 404, headers: noStoreHeaders }
    );
  } catch (error: any) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch order." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in." },
        { status: 401, headers: noStoreHeaders }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const clientOrder = body?.order;
    if (!clientOrder || clientOrder.id !== id) {
      return NextResponse.json(
        { success: false, message: "Valid order object matching ID is required." },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const orderEmail = clientOrder.customer?.email?.trim().toLowerCase();
    if (orderEmail !== auth.email) {
      return NextResponse.json(
        { success: false, message: "Forbidden. You cannot modify another account's order." },
        { status: 403, headers: noStoreHeaders }
      );
    }

    const updated = await syncStoreOrders([clientOrder]);
    const order = updated.find((item) => item.id === id) || clientOrder;
    return NextResponse.json({ success: true, order }, { headers: noStoreHeaders });
  } catch (error: any) {
    console.error("POST /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to sync order." },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
