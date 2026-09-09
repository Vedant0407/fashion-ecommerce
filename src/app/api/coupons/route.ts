import { NextRequest, NextResponse } from "next/server";
import { getStoreCoupons } from "@/lib/store-data";

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, message: "Please enter a valid coupon code." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const coupons = await getStoreCoupons();
    const coupon = coupons.find(
      (c) => c.code.toUpperCase() === cleanCode && c.active
    );

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: `Promo code "${cleanCode}" is invalid or expired.` },
        { status: 404 }
      );
    }

    const cartSubtotal = Number(subtotal) || 0;

    if (coupon.minOrder && cartSubtotal < coupon.minOrder) {
      return NextResponse.json(
        {
          success: false,
          message: `Code "${cleanCode}" requires a minimum order of ₹${coupon.minOrder.toLocaleString(
            "en-IN"
          )}.`,
        },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    if (coupon.type === "percentage") {
      discountAmount = Math.round((cartSubtotal * coupon.value) / 100);
    } else if (coupon.type === "fixed") {
      discountAmount = Math.min(cartSubtotal, coupon.value);
    } else if (coupon.type === "free_shipping") {
      discountAmount = 199;
    }

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
        discountAmount,
      },
    });
  } catch (error: any) {
    console.error("API /api/coupons error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to validate promo code." },
      { status: 500 }
    );
  }
}
