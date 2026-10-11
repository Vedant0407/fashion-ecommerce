import { NextRequest, NextResponse } from "next/server";
import { syncStoreOrders, StoreOrder } from "@/lib/store-data";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    let authenticatedUser: any = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      authenticatedUser = user;
    } catch {}

    const authEmail = authenticatedUser?.email
      ? authenticatedUser.email.trim().toLowerCase()
      : null;
    if (!authEmail) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in to sync orders." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const orders: StoreOrder[] = Array.isArray(body.orders)
      ? body.orders
      : body.order
      ? [body.order]
      : [];

    if (orders.length === 0) {
      return NextResponse.json({ success: true, message: "No orders to sync", count: 0 });
    }

    // Strict account isolation: Only sync orders belonging to the authenticated session email
    const safeOrders = orders.filter((o) => {
      const orderEmail = o.customer?.email?.trim().toLowerCase();
      return orderEmail === authEmail;
    });

    if (safeOrders.length === 0) {
      return NextResponse.json({
        success: false,
        message: "None of the submitted orders belong to your authenticated account.",
      }, { status: 403 });
    }

    const updatedOrders = await syncStoreOrders(safeOrders);

    return NextResponse.json({
      success: true,
      count: safeOrders.length,
      orders: updatedOrders.filter(
        (o) => o.customer?.email?.trim().toLowerCase() === authEmail
      ),
    });
  } catch (error: any) {
    console.error("POST /api/orders/sync error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to sync orders" },
      { status: 500 }
    );
  }
}
