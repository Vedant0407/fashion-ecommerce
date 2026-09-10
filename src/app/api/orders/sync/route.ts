import { NextRequest, NextResponse } from "next/server";
import { syncStoreOrders, StoreOrder } from "@/lib/store-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orders: StoreOrder[] = Array.isArray(body.orders)
      ? body.orders
      : body.order
      ? [body.order]
      : [];

    if (orders.length === 0) {
      return NextResponse.json({ success: true, message: "No orders to sync", count: 0 });
    }

    const updatedOrders = await syncStoreOrders(orders);

    return NextResponse.json({
      success: true,
      count: updatedOrders.length,
      orders: updatedOrders,
    });
  } catch (error: any) {
    console.error("POST /api/orders/sync error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to sync orders" },
      { status: 500 }
    );
  }
}
