import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  getStoreReviews,
  updateStoreReview,
  deleteStoreReview,
} from "@/lib/store-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const adminAccess = await requireAdmin();
  if (adminAccess) return adminAccess;
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || undefined;
    const search = searchParams.get("search")?.toLowerCase();

    let reviews = await getStoreReviews(productId);

    if (search) {
      reviews = reviews.filter(
        (r) =>
          r.author.toLowerCase().includes(search) ||
          r.comment.toLowerCase().includes(search) ||
          (r.title && r.title.toLowerCase().includes(search)) ||
          (r.location && r.location.toLowerCase().includes(search)) ||
          (r.product_name && r.product_name.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error: any) {
    console.error("GET /api/admin/reviews error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const adminAccess = await requireAdmin();
  if (adminAccess) return adminAccess;
  try {
    const body = await request.json();
    const { id, verified, is_featured, rating, comment, title } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Review ID is required" },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {};
    if (verified !== undefined) updates.verified = Boolean(verified);
    if (is_featured !== undefined) updates.is_featured = Boolean(is_featured);
    if (rating !== undefined) updates.rating = Number(rating);
    if (comment !== undefined) updates.comment = String(comment).trim();
    if (title !== undefined) updates.title = String(title).trim();

    const updated = await updateStoreReview(id, updates);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review updated successfully",
      review: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/reviews error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update review" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminAccess = await requireAdmin();
  if (adminAccess) return adminAccess;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Review ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteStoreReview(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Review not found or could not be removed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/reviews error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete review" },
      { status: 500 }
    );
  }
}
