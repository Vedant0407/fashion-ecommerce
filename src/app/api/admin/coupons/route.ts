import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  getStoreCoupons,
  saveStoreCoupon,
  deleteStoreCoupon,
  StoreCoupon,
} from "@/lib/store-data";

export async function GET() {
  const adminAccess = await requireAdmin();
  if (adminAccess) return adminAccess;
  try {
    const coupons = await getStoreCoupons();
    return NextResponse.json({ success: true, count: coupons.length, coupons });
  } catch (error: any) {
    console.error("GET /api/admin/coupons error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load coupons" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const adminAccess = await requireAdmin();
  if (adminAccess) return adminAccess;
  try {
    const body = await request.json();
    const { code, type = "percentage", value, minOrder = 0, description = "", active = true } = body;

    if (!code || value === undefined) {
      return NextResponse.json(
        { success: false, message: "Coupon code and value are required." },
        { status: 400 }
      );
    }

    const newCoupon: StoreCoupon = {
      code: code.trim().toUpperCase(),
      type,
      value: Number(value),
      minOrder: Number(minOrder) || 0,
      description: description.trim(),
      active: Boolean(active),
      usage_count: 0,
    };

    const saved = await saveStoreCoupon(newCoupon);
    return NextResponse.json({ success: true, coupon: saved });
  } catch (error: any) {
    console.error("POST /api/admin/coupons error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to add coupon" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const adminAccess = await requireAdmin();
  if (adminAccess) return adminAccess;
  try {
    const body = await request.json();
    const { code, ...updates } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Coupon code is required for update." },
        { status: 400 }
      );
    }

    const coupons = await getStoreCoupons();
    const existing = coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());

    if (!existing) {
      return NextResponse.json(
        { success: false, message: `Coupon '${code}' not found.` },
        { status: 404 }
      );
    }

    const updatedCoupon: StoreCoupon = {
      ...existing,
      ...updates,
      code: existing.code,
      value: updates.value !== undefined ? Number(updates.value) : existing.value,
      minOrder: updates.minOrder !== undefined ? Number(updates.minOrder) : existing.minOrder,
      active: updates.active !== undefined ? Boolean(updates.active) : existing.active,
    };

    const saved = await saveStoreCoupon(updatedCoupon);
    return NextResponse.json({ success: true, coupon: saved });
  } catch (error: any) {
    console.error("PUT /api/admin/coupons error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminAccess = await requireAdmin();
  if (adminAccess) return adminAccess;
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Coupon code parameter is required." },
        { status: 400 }
      );
    }

    const deleted = await deleteStoreCoupon(code);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: `Coupon '${code}' not found or already deleted.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Coupon '${code}' deleted successfully.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/coupons error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
