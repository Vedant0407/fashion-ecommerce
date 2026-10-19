import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  getStoreCategories,
  saveStoreCategory,
  deleteStoreCategory,
} from "@/lib/store-data";
import { Category } from "@/lib/catalog";

export async function GET() {
  const adminAccess = await requireAdmin();
  if (adminAccess) return adminAccess;
  try {
    const categories = await getStoreCategories();
    return NextResponse.json({ success: true, count: categories.length, categories });
  } catch (error: any) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const adminAccess = await requireAdmin();
  if (adminAccess) return adminAccess;
  try {
    const body = await request.json();
    const { name, slug, image, description } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Category name is required." },
        { status: 400 }
      );
    }

    const cleanSlug =
      slug?.trim().toLowerCase() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const newCategory: Category = {
      id: body.id || `cat-${Date.now()}`,
      name: name.trim().toUpperCase(),
      slug: cleanSlug,
      image: image || "/black-tee.jfif",
      description: description?.trim() || "",
    };

    const saved = await saveStoreCategory(newCategory);
    return NextResponse.json({ success: true, category: saved });
  } catch (error: any) {
    console.error("POST /api/admin/categories error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to add category" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const adminAccess = await requireAdmin();
  if (adminAccess) return adminAccess;
  try {
    const body = await request.json();
    const { id, slug, ...updates } = body;

    const identifier = id || slug;
    if (!identifier) {
      return NextResponse.json(
        { success: false, message: "Category ID or slug is required for update." },
        { status: 400 }
      );
    }

    const currentCategories = await getStoreCategories();
    const existing = currentCategories.find(
      (c) => c.id === identifier || c.slug === identifier
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, message: `Category '${identifier}' not found.` },
        { status: 404 }
      );
    }

    const updatedCategory: Category = {
      ...existing,
      ...updates,
      name: updates.name ? updates.name.trim().toUpperCase() : existing.name,
      slug: updates.slug ? updates.slug.trim().toLowerCase() : existing.slug,
    };

    const saved = await saveStoreCategory(updatedCategory);
    return NextResponse.json({ success: true, category: saved });
  } catch (error: any) {
    console.error("PUT /api/admin/categories error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminAccess = await requireAdmin();
  if (adminAccess) return adminAccess;
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get("id") || searchParams.get("slug");

    if (!identifier) {
      return NextResponse.json(
        { success: false, message: "Category ID or slug is required." },
        { status: 400 }
      );
    }

    const deleted = await deleteStoreCategory(identifier);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: `Category '${identifier}' not found or already deleted.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Category '${identifier}' deleted successfully.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/categories error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}
