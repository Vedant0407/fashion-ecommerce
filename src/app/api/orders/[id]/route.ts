import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase
      .from("orders")
      .select(
        "id, status, subtotal, shipping, total, payment_status, payment_method, created_at, address_id, addresses(*)"
      )
      .eq("id", id);

    if (user) {
      query = query.eq("user_id", user.id);
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
