import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { syncUserProfile } from "@/lib/user-store";

const noStore = { "Cache-Control": "no-store" };
type SavedCart = { items?: Array<{ id: string; quantity: number; size?: string; color?: string }>; couponCode?: string | null };

async function getIdentity() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  await syncUserProfile(data.user);
  return data.user;
}

function readSaved(value: Prisma.JsonValue | null): SavedCart {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as SavedCart;
}

async function makeResponse(userId: string, saved: SavedCart) {
  const savedItems = Array.isArray(saved.items) ? saved.items : [];
  const ids = Array.from(new Set(savedItems.map((item) => item.id).filter(Boolean)));
  const products = ids.length ? await prisma.product.findMany({ where: { id: { in: ids } } }) : [];
  const byId = new Map(products.map((product) => [product.id, product]));
  const cart = savedItems.flatMap((item) => {
    const product = byId.get(item.id);
    if (!product || !Number.isInteger(item.quantity) || item.quantity < 1) return [];
    return [{ id: product.id, name: product.name, price: product.price, image: product.image, quantity: Math.min(item.quantity, 20), size: item.size, color: item.color }];
  });
  let coupon: any = null;
  if (saved.couponCode) {
    const record = await prisma.coupon.findUnique({ where: { code: saved.couponCode } });
    if (record?.active) {
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 199;
      const discountAmount = record.type === "percentage" ? Math.min(subtotal, subtotal * record.value / 100) : record.type === "fixed" ? Math.min(subtotal, record.value) : record.type === "free_shipping" ? shipping : 0;
      coupon = { code: record.code, type: record.type, value: record.value, description: record.description, discountAmount };
    }
  }
  await prisma.cart.upsert({
    where: { user_id: userId },
    create: { user_id: userId, items: { items: cart.map(({ id, quantity, size, color }) => ({ id, quantity, size: size || null, color: color || null })), couponCode: coupon?.code || null } as Prisma.InputJsonValue },
    update: {},
  });
  return { cart, coupon };
}

export async function GET() {
  try {
    const user = await getIdentity();
    if (!user) return NextResponse.json({ success: false, message: "Please log in to view your saved cart." }, { status: 401, headers: noStore });
    const record = await prisma.cart.findUnique({ where: { user_id: user.id } });
    const result = await makeResponse(user.id, readSaved(record?.items ?? null));
    return NextResponse.json({ success: true, ...result }, { headers: noStore });
  } catch (error) {
    console.error("GET /api/cart error:", error);
    return NextResponse.json({ success: false, message: "Unable to load your saved cart." }, { status: 503, headers: noStore });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getIdentity();
    if (!user) return NextResponse.json({ success: false, message: "Please log in to save your cart." }, { status: 401, headers: noStore });
    const body = await request.json();
    if (!Array.isArray(body.cart) || body.cart.length > 30) return NextResponse.json({ success: false, message: "Cart must contain at most 30 items." }, { status: 400, headers: noStore });
    const normalized = new Map<string, { id: string; quantity: number; size?: string; color?: string }>();
    for (const item of body.cart) {
      const id = typeof item?.id === "string" ? item.id.trim() : "";
      const quantity = Number(item?.quantity);
      if (!id || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return NextResponse.json({ success: false, message: "One or more cart items are invalid." }, { status: 400, headers: noStore });
      const key = `${id}::${String(item.size || "")}::${String(item.color || "")}`;
      const prior = normalized.get(key);
      if ((prior?.quantity || 0) + quantity > 20) return NextResponse.json({ success: false, message: "Cart item quantity exceeds the limit." }, { status: 400, headers: noStore });
      normalized.set(key, { id, quantity: (prior?.quantity || 0) + quantity, ...(typeof item.size === "string" && { size: item.size.slice(0, 12) }), ...(typeof item.color === "string" && { color: item.color.slice(0, 32) }) });
    }
    const items = Array.from(normalized.values());
    const products = items.length ? await prisma.product.findMany({ where: { id: { in: Array.from(new Set(items.map((item) => item.id))) } } }) : [];
    if (products.length !== new Set(items.map((item) => item.id)).size) return NextResponse.json({ success: false, message: "One or more cart products are unavailable." }, { status: 409, headers: noStore });
    let couponCode: string | null = null;
    if (typeof body.coupon?.code === "string" && body.coupon.code.trim()) {
      const coupon = await prisma.coupon.findUnique({ where: { code: body.coupon.code.trim().toUpperCase() } });
      const subtotal = items.reduce((sum, item) => sum + (products.find((product) => product.id === item.id)?.price || 0) * item.quantity, 0);
      if (coupon?.active && subtotal >= coupon.minOrder) couponCode = coupon.code;
    }
    await prisma.cart.upsert({
      where: { user_id: user.id },
      create: { user_id: user.id, items: { items, couponCode } as Prisma.InputJsonValue },
      update: { items: { items, couponCode } as Prisma.InputJsonValue },
    });
    return NextResponse.json({ success: true }, { headers: noStore });
  } catch (error) {
    console.error("POST /api/cart error:", error);
    return NextResponse.json({ success: false, message: "Unable to save your cart." }, { status: 503, headers: noStore });
  }
}
