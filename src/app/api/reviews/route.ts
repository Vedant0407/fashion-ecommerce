import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getStoreReviews, saveStoreReview, StoreReview } from "@/lib/store-data";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { syncUserProfile } from "@/lib/user-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || undefined;

    const reviews = await getStoreReviews(productId);

    const total = reviews.length;
    const averageRating =
      total > 0
        ? Number((reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / total).toFixed(1))
        : 0;

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
    const supabase = await createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      return NextResponse.json({ success: false, message: "Log in to leave a review." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const profile = await syncUserProfile(auth.user);
    const body = await request.json();
    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const rating = Number(body.rating);
    const allowedFits = new Set(["Runs Small", "True to Size", "Runs Large"]);
    const fitFeedback = allowedFits.has(body.fitFeedback) ? body.fitFeedback : "True to Size";
    const sizePurchased = typeof body.sizePurchased === "string" ? body.sizePurchased.trim().slice(0, 12) : "";
    if (!productId || comment.length < 5 || comment.length > 2000 || title.length > 120 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, message: "Enter a product, a 1–5 star rating, and a review between 5 and 2,000 characters." }, { status: 400 });
    }

    const [product, purchase] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true } }),
      prisma.order.findFirst({
        where: {
          user_id: auth.user.id,
          status: { in: ["delivered", "reached"] },
          items: { some: { product_id: productId } },
        },
        select: { id: true },
      }),
    ]);
    if (!product) return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
    if (!purchase) return NextResponse.json({ success: false, message: "A review is available after this product has been delivered to your account." }, { status: 403 });
    const existing = await prisma.review.findFirst({ where: { product_id: productId, user_id: auth.user.id }, select: { id: true } });
    if (existing) return NextResponse.json({ success: false, message: "You have already reviewed this product." }, { status: 409 });

    const review: StoreReview = {
      id: "rev-" + randomUUID(),
      product_id: product.id,
      user_id: auth.user.id,
      product_name: product.name,
      author: profile.name,
      location: typeof body.location === "string" ? body.location.trim().slice(0, 120) : "India",
      rating,
      date: "Just now",
      title: title || "Verified purchase",
      comment,
      verified: true,
      sizePurchased: sizePurchased || undefined,
      fitFeedback,
      helpfulCount: 0,
      is_featured: false,
      created_at: new Date().toISOString(),
    };
    const saved = await saveStoreReview(review);
    const publicReview = {
      id: saved.id,
      product_id: saved.product_id,
      product_name: saved.product_name,
      author: saved.author,
      location: saved.location,
      rating: saved.rating,
      date: saved.date,
      title: saved.title,
      comment: saved.comment,
      verified: saved.verified,
      sizePurchased: saved.sizePurchased,
      fitFeedback: saved.fitFeedback,
      helpfulCount: saved.helpfulCount,
      is_featured: saved.is_featured,
      created_at: saved.created_at,
    };
    return NextResponse.json({ success: true, message: "Verified purchase review submitted.", review: publicReview }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/reviews failed.", error);
    return NextResponse.json({ success: false, message: "Unable to submit this review." }, { status: 503 });
  }
}