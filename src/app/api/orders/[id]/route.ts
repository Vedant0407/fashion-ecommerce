import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { formatShortOrderId, isOrderMatch } from "@/lib/order-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const noStore = { "Cache-Control": "no-store, no-cache, must-revalidate" };

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return NextResponse.json({ success: false, message: "Please log in to view this order." }, { status: 401, headers: noStore });
    const { id } = await params;
    const cleanId = (id || "").trim();
    const orders = await prisma.order.findMany({ where: { user_id: data.user.id }, include: { items: true, address_record: true }, orderBy: { created_at: "desc" } });
    const order = orders.find((item) => item.id === cleanId || isOrderMatch(item.id, cleanId));
    if (!order) return NextResponse.json({ success: false, message: "Order not found." }, { status: 404, headers: noStore });
    const savedAddress = order.address_record;
    return NextResponse.json({ success: true, order: {
      id: order.id, short_id: formatShortOrderId(order.id), status: order.status,
      subtotal: order.subtotal, shipping: order.shipping, discount: order.discount, total: order.total,
      payment_status: order.payment_status, payment_method: order.payment_method, created_at: order.created_at.toISOString(),
      customer: { fullName: order.customer_name, email: order.customer_email, phone: order.customer_phone, address: order.address, city: order.city, state: order.state, pincode: order.pincode },
      addresses: { full_name: order.customer_name, name: order.customer_name, phone: order.customer_phone, address_line1: order.address, city: order.city, state: order.state, postal_code: order.pincode, pincode: order.pincode, country: savedAddress?.country || "India" },
      items: order.items.map((item) => ({ id: item.id, product_id: item.product_id || "", product_name: item.name, product_price: item.price, quantity: item.quantity, image: item.image, size: item.size, color: item.color })),
    } }, { headers: noStore });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json({ success: false, message: "Unable to load this order." }, { status: 503, headers: noStore });
  }
}

export async function POST() {
  return NextResponse.json({ success: false, message: "Order changes must be made by the store team." }, { status: 405, headers: { ...noStore, Allow: "GET" } });
}
