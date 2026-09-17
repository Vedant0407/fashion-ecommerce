import { NextRequest, NextResponse } from "next/server";
import {
  getStoreProducts,
  saveStoreProduct,
  deleteStoreProduct,
} from "@/lib/store-data";
import { Product } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    let products = await getStoreProducts();

    // Cookie bridge: merge any client-saved custom products at the front
    const cookieCustom = request.cookies.get("greeno_custom_products")?.value;
    if (cookieCustom) {
      try {
        const parsedCustom = JSON.parse(decodeURIComponent(cookieCustom));
        if (Array.isArray(parsedCustom) && parsedCustom.length > 0) {
          const cookieIds = new Set(parsedCustom.map((p: any) => p?.id).filter(Boolean));
          products = [
            ...parsedCustom,
            ...products.filter((p) => !cookieIds.has(p.id)),
          ];
        }
      } catch {}
    }

    return NextResponse.json({ success: true, count: products.length, products });
  } catch (error: any) {
    console.error("GET /api/admin/products error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      price,
      description,
      category_id,
      category_name,
      category_slug,
      collection_tag,
      image,
      images,
      stock = 50,
      size_stock,
      is_featured = false,
      is_new = true,
      is_trending = false,
      color,
      colors,
      product_no,
      material,
      fabric,
      fit,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { success: false, message: "Product name and price are required." },
        { status: 400 }
      );
    }

    const id =
      body.id?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    // Calculate total stock from size_stock if provided
    let computedStock = Number(stock) || 0;
    if (size_stock && typeof size_stock === "object") {
      computedStock = Object.values(size_stock).reduce(
        (sum: number, q: any) => sum + Math.max(0, Number(q) || 0),
        0
      );
    }

    const resolvedColors = Array.isArray(colors) && colors.length > 0
      ? colors
      : color ? [color] : ["BLACK"];

    const newProduct: Product = {
      id: id || `prod-${Date.now()}`,
      name: name.trim(),
      price: Number(price),
      description: description?.trim() || "",
      category_id: category_id || null,
      category_name: category_name || "SHIRTS",
      category_slug: category_slug || "shirts",
      collection_tag: collection_tag?.trim() || null,
      image: image || (Array.isArray(images) && images[0]) || "/atelier-shirt.jpg",
      images: Array.isArray(images) && images.length > 0 ? images : image ? [image] : ["/atelier-shirt.jpg"],
      stock: computedStock,
      size_stock: size_stock && typeof size_stock === "object" ? size_stock : undefined,
      is_featured: Boolean(is_featured),
      is_new: Boolean(is_new),
      is_trending: Boolean(is_trending),
      color: resolvedColors[0] || "BLACK",
      colors: resolvedColors,
      product_no: product_no?.trim() || `GO-${Math.floor(1000 + Math.random() * 9000)}`,
      material: material?.trim() || "100% Cotton",
      fabric: fabric?.trim() || "Heavyweight Knit",
      fit: fit?.trim() || "Oversized Fit",
    };

    const saved = await saveStoreProduct(newProduct);
    const updatedStore = await getStoreProducts();
    const res = NextResponse.json({ success: true, product: saved });
    res.cookies.set("greeno_custom_products", encodeURIComponent(JSON.stringify(updatedStore)), {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return res;
  } catch (error: any) {
    console.error("POST /api/admin/products error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to add product" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Product ID is required for update." },
        { status: 400 }
      );
    }

    const currentProducts = await getStoreProducts();
    const existing = currentProducts.find((p) => p.id === id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: `Product with ID '${id}' not found.` },
        { status: 404 }
      );
    }

    let computedStock = updates.stock !== undefined ? Number(updates.stock) : existing.stock;
    if (updates.size_stock && typeof updates.size_stock === "object") {
      computedStock = Object.values(updates.size_stock).reduce(
        (sum: number, q: any) => sum + Math.max(0, Number(q) || 0),
        0
      );
    }

    const resolvedColors = Array.isArray(updates.colors) && updates.colors.length > 0
      ? updates.colors
      : updates.color ? [updates.color] : existing.colors || [existing.color || "BLACK"];

    const updatedProduct: Product = {
      ...existing,
      ...updates,
      price: updates.price !== undefined ? Number(updates.price) : existing.price,
      stock: computedStock,
      size_stock: updates.size_stock !== undefined ? updates.size_stock : existing.size_stock,
      colors: resolvedColors,
      color: resolvedColors[0] || existing.color || "BLACK",
      collection_tag: updates.collection_tag !== undefined ? (updates.collection_tag?.trim() || null) : existing.collection_tag,
      is_featured: updates.is_featured !== undefined ? Boolean(updates.is_featured) : existing.is_featured,
      is_new: updates.is_new !== undefined ? Boolean(updates.is_new) : existing.is_new,
      is_trending: updates.is_trending !== undefined ? Boolean(updates.is_trending) : existing.is_trending,
    };

    const saved = await saveStoreProduct(updatedProduct);
    const updatedStore = await getStoreProducts();
    const res = NextResponse.json({ success: true, product: saved });
    res.cookies.set("greeno_custom_products", encodeURIComponent(JSON.stringify(updatedStore)), {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return res;
  } catch (error: any) {
    console.error("PUT /api/admin/products error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update product" },
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
        { success: false, message: "Product ID parameter is required." },
        { status: 400 }
      );
    }

    const deleted = await deleteStoreProduct(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: `Product '${id}' not found or already deleted.` },
        { status: 404 }
      );
    }

    const updatedStore = await getStoreProducts();
    const res = NextResponse.json({ success: true, message: `Product '${id}' deleted successfully.` });
    res.cookies.set("greeno_custom_products", encodeURIComponent(JSON.stringify(updatedStore)), {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return res;
  } catch (error: any) {
    console.error("DELETE /api/admin/products error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
