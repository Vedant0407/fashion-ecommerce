import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { syncUserProfile } from "@/lib/user-store";
import { prisma } from "@/lib/prisma";
import type { ReturnExchangeRequest } from "@/lib/store-data";

const noStore = { "Cache-Control": "no-store" };
const returnStatuses = new Set(["pending", "approved", "pickup_scheduled", "received", "completed", "rejected"]);

async function getIdentity() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  await syncUserProfile(data.user);
  return data.user;
}

function serialize(record: any): ReturnExchangeRequest {
  return {
    id: record.id,
    order_id: record.order_id,
    created_at: record.created_at.toISOString(),
    type: record.type as ReturnExchangeRequest["type"],
    status: record.status as ReturnExchangeRequest["status"],
    customer: {
      fullName: record.customer_name,
      email: record.customer_email,
      phone: record.customer_phone,
      address: record.pickup_address || record.order?.address || "",
      city: record.order?.city || "",
      state: record.order?.state || "",
      pincode: record.order?.pincode || "",
    },
    items: record.items.map((item: any) => ({
      product_id: item.product_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size || undefined,
      color: item.color || undefined,
      image: item.image || undefined,
      exchange_size: item.exchange_size || undefined,
      exchange_color: item.exchange_color || undefined,
      reason: item.reason || undefined,
    })),
    reason_category: record.reason_category,
    customer_notes: record.customer_notes || undefined,
    admin_notes: record.admin_notes || undefined,
    pickup_address: record.pickup_address || undefined,
    resolved_at: record.resolved_at?.toISOString() || undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const adminDenied = await requireAdmin();
    const isAdmin = !adminDenied;
    const user = isAdmin ? null : await getIdentity();
    if (!isAdmin && !user) return NextResponse.json({ success: false, message: "Please log in to view return requests." }, { status: 401, headers: noStore });

    const orderId = new URL(request.url).searchParams.get("order_id")?.trim();
    const records = await prisma.returnRequest.findMany({
      where: {
        ...(isAdmin ? {} : { order: { user_id: user!.id } }),
        ...(orderId ? { order_id: orderId } : {}),
      },
      include: { items: true, order: true },
      orderBy: { created_at: "desc" },
    });
    const returns = records.map(serialize);
    return NextResponse.json({ success: true, count: returns.length, returns }, { headers: noStore });
  } catch (error) {
    console.error("GET /api/returns failed.", error);
    return NextResponse.json({ success: false, message: "Unable to load return requests." }, { status: 503, headers: noStore });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getIdentity();
    if (!user) return NextResponse.json({ success: false, message: "Log in to request a return or exchange." }, { status: 401, headers: noStore });
    const body = await request.json();
    const orderId = typeof body.order_id === "string" ? body.order_id.trim() : "";
    const type = body.type === "return" ? "return" : body.type === "exchange" ? "exchange" : null;
    const reason = typeof body.reason_category === "string" ? body.reason_category.trim().slice(0, 120) : "";
    const notes = typeof body.customer_notes === "string" ? body.customer_notes.trim().slice(0, 1000) : "";
    const pickup = typeof body.pickup_address === "string" ? body.pickup_address.trim().slice(0, 1000) : "";
    if (!orderId || !type || !reason || !Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
      return NextResponse.json({ success: false, message: "Provide an order, selected items, return type, and reason." }, { status: 400, headers: noStore });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, user_id: user.id },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ success: false, message: "Order not found." }, { status: 404, headers: noStore });

    const selected: any[] = [];
    const seen = new Set<string>();
    for (const requested of body.items) {
      const lineId = typeof requested?.order_item_id === "string" ? requested.order_item_id : "";
      let line = lineId ? order.items.find((item) => item.id === lineId) : null;
      if (!line && typeof requested?.product_id === "string") {
        const matches = order.items.filter((item) => item.product_id === requested.product_id);
        if (matches.length === 1) line = matches[0];
      }
      if (!line || seen.has(line.id)) return NextResponse.json({ success: false, message: "One or more selected order items are invalid." }, { status: 400, headers: noStore });
      seen.add(line.id);
      const exchangeSize = type === "exchange" && typeof requested.exchange_size === "string" ? requested.exchange_size.trim().slice(0, 12) : null;
      const exchangeColor = type === "exchange" && typeof requested.exchange_color === "string" ? requested.exchange_color.trim().slice(0, 32) : null;
      selected.push({
        product_id: line.product_id || "deleted-" + line.id,
        name: line.name,
        price: line.price,
        quantity: line.quantity,
        size: line.size,
        color: line.color,
        image: line.image,
        exchange_size: exchangeSize,
        exchange_color: exchangeColor,
        reason,
      });
    }

    const record = await prisma.returnRequest.create({
      data: {
        id: (type === "return" ? "RET" : "EXC") + "-" + randomUUID().toUpperCase(),
        order_id: order.id,
        type,
        status: "pending",
        reason_category: reason,
        customer_notes: notes || null,
        pickup_address: pickup || order.address,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        items: { create: selected },
      },
      include: { items: true, order: true },
    });
    return NextResponse.json({ success: true, message: "Request submitted successfully.", request: serialize(record) }, { status: 201, headers: noStore });
  } catch (error) {
    console.error("POST /api/returns failed.", error);
    return NextResponse.json({ success: false, message: "Unable to submit this request." }, { status: 503, headers: noStore });
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const status = typeof body.status === "string" ? body.status : "";
    const adminNotes = typeof body.admin_notes === "string" ? body.admin_notes.trim().slice(0, 1000) : undefined;
    if (!id || !returnStatuses.has(status)) return NextResponse.json({ success: false, message: "Choose a valid request and status." }, { status: 400, headers: noStore });
    const record = await prisma.returnRequest.update({
      where: { id },
      data: { status, ...(adminNotes !== undefined ? { admin_notes: adminNotes } : {}), ...(["completed", "rejected"].includes(status) ? { resolved_at: new Date() } : {}) },
      include: { items: true, order: true },
    }).catch(() => null);
    if (!record) return NextResponse.json({ success: false, message: "Return request not found." }, { status: 404, headers: noStore });
    return NextResponse.json({ success: true, request: serialize(record) }, { headers: noStore });
  } catch (error) {
    console.error("PATCH /api/returns failed.", error);
    return NextResponse.json({ success: false, message: "Unable to update this request." }, { status: 503, headers: noStore });
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) return NextResponse.json({ success: false, message: "Request ID is required." }, { status: 400, headers: noStore });
    const deleted = await prisma.returnRequest.deleteMany({ where: { id } });
    return NextResponse.json({ success: true, deleted: deleted.count > 0 }, { headers: noStore });
  } catch (error) {
    console.error("DELETE /api/returns failed.", error);
    return NextResponse.json({ success: false, message: "Unable to delete this request." }, { status: 503, headers: noStore });
  }
}
