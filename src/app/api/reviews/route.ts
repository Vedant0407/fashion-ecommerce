import { NextRequest, NextResponse } from "next/server";
import { getStoreReviews, saveStoreReview, StoreReview } from "@/lib/store-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || undefined;

    const reviews = await getStoreReviews(productId);

    const total = reviews.length;
    const averageRating =
      total > 0
        ? Number((reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / total).toFixed(1))
        : 5.0;

    const breakdown = [5, 4, 3, 2, 1].map((stars) => {
      const count = reviews.filter((r) => Math.round(Number(r.rating) || 5) === stars).length;
      return {
        stars,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });

    const fitSummary = {
      runsSmall: reviews.filter((r) => r.fitFeedback === "Runs Small").length,
      trueToSize: reviews.filter((r) => !r.fitFeedback || r.fitFeedback === "True to Size").length,
      runsLarge: reviews.filter((r) => r.fitFeedback === "Runs Large").length,
    };

    return NextResponse.json({
      success: true,
      count: total,
      averageRating,
      breakdown,
      fitSummary,
      reviews,
    });
  } catch (error: any) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      productName,
      author,
      location = "India",
      rating = 5,
      title = "",
      comment,
      sizePurchased = "M",
      fitFeedback = "True to Size",
    } = body;

    if (!productId || !author?.trim() || !comment?.trim()) {
      return NextResponse.json(
        { success: false, message: "Product, client name, and review text are required." },
        { status: 400 }
      );
    }

    const newReview: StoreReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      product_id: productId,
      product_name: productName || "Atelier Silhouette",
      author: author.trim(),
      location: location.trim() || "India",
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      date: "Just now",
      title: title.trim() || "Atelier Client Experience",
      comment: comment.trim(),
      verified: true,
      sizePurchased,
      fitFeedback,
      helpfulCount: 0,
      is_featured: false,
      created_at: new Date().toISOString(),
    };

    const saved = await saveStoreReview(newReview);

    return NextResponse.json({
      success: true,
      message: "Review successfully submitted and verified.",
      review: saved,
    });
  } catch (error: any) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit review" },
      { status: 500 }
    );
  }
}
