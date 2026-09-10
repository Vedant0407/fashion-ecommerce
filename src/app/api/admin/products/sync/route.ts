import { NextRequest, NextResponse } from "next/server";
import { syncStoreProducts } from "@/lib/store-data";
import { Product } from "@/lib/catalog";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const products: Product[] = Array.isArray(body.products)
      ? body.products
      : body.product
      ? [body.product]
      : [];

    if (products.length === 0) {
      return NextResponse.json({ success: true, message: "No products to sync", count: 0 });
    }

    const updatedProducts = await syncStoreProducts(products);

    const res = NextResponse.json({
      success: true,
      count: updatedProducts.length,
      products: updatedProducts,
    });
    res.cookies.set("greeno_custom_products", encodeURIComponent(JSON.stringify(updatedProducts)), {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return res;
  } catch (error: any) {
    console.error("POST /api/admin/products/sync error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to sync products" },
      { status: 500 }
    );
  }
}
