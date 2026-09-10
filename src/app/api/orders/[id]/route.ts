import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStoreOrders } from "@/lib/store-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    let authenticatedUser: any = null;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      authenticatedUser = user;
    } catch {
      // Supabase user fetch failed
    }

    // Check store-data first to get full item options and latest admin status
    const allStoreOrders = await getStoreOrders();
    const matched = allStoreOrders.find((o) => o.id === id);

    if (matched) {
      return NextResponse.json({
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
          items: matched.items.map((it) => ({
            id: it.id || it.product_id,
            product_id: it.product_id,
            product_name: it.name,
            product_price: it.price,
            quantity: it.quantity,
            image: it.image,
            size: it.size,
            color: it.color,
          })),
        },
      });
    }

    let query = supabase
      .from("orders")
      .select(
        "id, status, subtotal, shipping, total, payment_status, payment_method, created_at, address_id, addresses(*)"
      )
      .eq("id", id);

    if (authenticatedUser) {
      query = query.eq("user_id", authenticatedUser.id);
    }

    const { data: order, error: orderError } = await query.maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("id, product_id, product_name, product_price, quantity")
      .eq("order_id", id);

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        items: items || [],
      },
    });
  } catch (error: any) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch order" },
      { status: 500 }
    );
  }
}
