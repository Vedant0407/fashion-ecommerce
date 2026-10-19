import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { getStoreOrders, updateStoreOrderStatus } from "@/lib/store-data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const orderStatuses = new Set(["confirmed", "processing", "shipped", "delivered", "reached", "cancelled"]);
const paymentStatuses = new Set(["pending", "paid", "failed"]);

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const orders = await getStoreOrders(true);
    return NextResponse.json({ success: true, count: orders.length, orders }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json({ success: false, message: "Unable to load store orders." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const status = typeof body.status === "string" ? body.status : "";
    const paymentStatus = typeof body.payment_status === "string" ? body.payment_status : undefined;
    if (!id || !orderStatuses.has(status) || (paymentStatus && !paymentStatuses.has(paymentStatus))) {
      return NextResponse.json({ success: false, message: "Choose a valid order and payment status." }, { status: 400 });
    }
    const updated = await updateStoreOrderStatus(id, status as any, paymentStatus as any);
    if (!updated) return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    return NextResponse.json({ success: true, order: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("PATCH /api/admin/orders error:", error);
    return NextResponse.json({ success: false, message: "Unable to update this order." }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) return NextResponse.json({ success: false, message: "Order ID is required." }, { status: 400 });
    const deleted = await prisma.order.deleteMany({ where: { id } });
    if (!deleted.count) return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    return NextResponse.json({ success: true, message: "Order deleted." });
  } catch (error) {
    console.error("DELETE /api/admin/orders error:", error);
    return NextResponse.json({ success: false, message: "Unable to delete this order." }, { status: 503 });
  }
}
