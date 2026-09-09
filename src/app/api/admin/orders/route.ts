import { NextRequest, NextResponse } from "next/server";
import {
  getStoreOrders,
  updateStoreOrderStatus,
  readStoreData,
  writeStoreData,
} from "@/lib/store-data";

export async function GET() {
  try {
    const orders = await getStoreOrders();
    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load orders" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, payment_status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: "Order ID and status are required." },
        { status: 400 }
      );
    }

    const updated = await updateStoreOrderStatus(id, status, payment_status);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: `Order '${id}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error("PATCH /api/admin/orders error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update order" },
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
        { success: false, message: "Order ID parameter is required." },
        { status: 400 }
      );
    }

    const data = await readStoreData();
    const initialLen = data.orders.length;
    data.orders = data.orders.filter((o) => o.id !== id);

    if (data.orders.length === initialLen) {
      return NextResponse.json(
        { success: false, message: `Order '${id}' not found.` },
        { status: 404 }
      );
    }

    await writeStoreData(data);
    return NextResponse.json({
      success: true,
      message: `Order '${id}' deleted successfully.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/orders error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete order" },
      { status: 500 }
    );
  }
}
