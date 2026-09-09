import { NextRequest, NextResponse } from "next/server";
import {
  getStoreProducts,
  saveStoreProduct,
  deleteStoreProduct,
} from "@/lib/store-data";
import { Product } from "@/lib/catalog";

export async function GET() {
  try {
    const products = await getStoreProducts();
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
      image,
      images,
      stock = 50,
      is_featured = false,
      is_new = true,
      is_trending = false,
      color,
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

    const newProduct: Product = {
      id: id || `prod-${Date.now()}`,
      name: name.trim(),
      price: Number(price),
      description: description?.trim() || "",
      category_id: category_id || null,
      category_name: category_name || "STREETWEAR",
      category_slug: category_slug || "streetwear",
      image: image || (Array.isArray(images) && images[0]) || "/black-tee.jfif",
      images: Array.isArray(images) && images.length > 0 ? images : image ? [image] : ["/black-tee.jfif"],
      stock: Number(stock) || 0,
      is_featured: Boolean(is_featured),
      is_new: Boolean(is_new),
      is_trending: Boolean(is_trending),
      color: color?.trim() || "BLACK",
      product_no: product_no?.trim() || `GO-${Math.floor(1000 + Math.random() * 9000)}`,
      material: material?.trim() || "100% Cotton",
      fabric: fabric?.trim() || "Heavyweight Knit",
      fit: fit?.trim() || "Oversized Fit",
    };

    const saved = await saveStoreProduct(newProduct);
    return NextResponse.json({ success: true, product: saved });
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

    const updatedProduct: Product = {
      ...existing,
      ...updates,
      price: updates.price !== undefined ? Number(updates.price) : existing.price,
      stock: updates.stock !== undefined ? Number(updates.stock) : existing.stock,
      is_featured: updates.is_featured !== undefined ? Boolean(updates.is_featured) : existing.is_featured,
      is_new: updates.is_new !== undefined ? Boolean(updates.is_new) : existing.is_new,
      is_trending: updates.is_trending !== undefined ? Boolean(updates.is_trending) : existing.is_trending,
    };

    const saved = await saveStoreProduct(updatedProduct);
    return NextResponse.json({ success: true, product: saved });
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

    return NextResponse.json({ success: true, message: `Product '${id}' deleted successfully.` });
  } catch (error: any) {
    console.error("DELETE /api/admin/products error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
