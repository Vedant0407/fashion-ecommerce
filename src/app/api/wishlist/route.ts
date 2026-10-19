import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { syncUserProfile } from "@/lib/user-store";

const noStore = { "Cache-Control": "no-store" };

async function getIdentity() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  await syncUserProfile(data.user);
  return data.user;
}

export async function GET() {
  try {
    const user = await getIdentity();
    if (!user) return NextResponse.json({ success: false, message: "Please log in to view your wishlist." }, { status: 401, headers: noStore });
    const records = await prisma.wishlistItem.findMany({
      where: { user_id: user.id },
      include: { product: true },
      orderBy: { created_at: "desc" },
    });
    const wishlist = records.filter((record) => record.product).map((record) => ({
      id: record.product!.id,
      name: record.product!.name,
      price: record.product!.price,
      image: record.product!.image,
      category: record.product!.category_name,
    }));
    return NextResponse.json({ success: true, wishlist }, { headers: noStore });
  } catch (error) {
    console.error("GET /api/wishlist error:", error);
    return NextResponse.json({ success: false, message: "Unable to load your wishlist." }, { status: 503, headers: noStore });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getIdentity();
    if (!user) return NextResponse.json({ success: false, message: "Please log in to save your wishlist." }, { status: 401, headers: noStore });
    const body = await request.json();
    if (!Array.isArray(body.wishlist) || body.wishlist.length > 100) {
      return NextResponse.json({ success: false, message: "Wishlist must contain at most 100 items." }, { status: 400, headers: noStore });
    }
    const productIds: string[] = Array.from(new Set<string>(
      body.wishlist
        .map((item: any): string => typeof item?.id === "string" ? item.id.trim() : "")
        .filter((id: string) => id.length > 0)
    ));
    const products = productIds.length ? await prisma.product.findMany({ where: { id: { in: productIds } } }) : [];
    if (products.length !== productIds.length) {
      return NextResponse.json({ success: false, message: "One or more saved products are no longer available." }, { status: 409, headers: noStore });
    }
    await prisma.$transaction(async (tx) => {
      await tx.wishlistItem.deleteMany({ where: { user_id: user.id } });
      if (products.length) await tx.wishlistItem.createMany({
        data: products.map((product) => ({
          user_id: user.id,
          product_id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category_name,
        })),
      });
    });
    return NextResponse.json({ success: true, message: "Wishlist saved." }, { headers: noStore });
  } catch (error) {
    console.error("POST /api/wishlist error:", error);
    return NextResponse.json({ success: false, message: "Unable to save your wishlist." }, { status: 503, headers: noStore });
  }
}
