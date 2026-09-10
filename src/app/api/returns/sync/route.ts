import { NextRequest, NextResponse } from "next/server";
import { syncStoreReturns, ReturnExchangeRequest } from "@/lib/store-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const returns: ReturnExchangeRequest[] = Array.isArray(body.returns)
      ? body.returns
      : body.request
      ? [body.request]
      : [];

    if (returns.length === 0) {
      return NextResponse.json({ success: true, message: "No returns to sync", count: 0 });
    }

    const updated = await syncStoreReturns(returns);

    return NextResponse.json({
      success: true,
      count: updated.length,
      returns: updated,
    });
  } catch (error: any) {
    console.error("POST /api/returns/sync error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to sync returns" },
      { status: 500 }
    );
  }
}
