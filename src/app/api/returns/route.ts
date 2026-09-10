import { NextRequest, NextResponse } from "next/server";
import {
  getStoreReturns,
  addStoreReturn,
  updateStoreReturnStatus,
  ReturnExchangeRequest,
} from "@/lib/store-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id")?.trim();
    const email = searchParams.get("email")?.trim().toLowerCase();

    let allReturns = await getStoreReturns();

    if (orderId) {
      allReturns = allReturns.filter((r) => r.order_id.toLowerCase() === orderId.toLowerCase());
    }

    if (email) {
      allReturns = allReturns.filter((r) => r.customer?.email?.toLowerCase() === email);
    }

    return NextResponse.json({
      success: true,
      count: allReturns.length,
      returns: allReturns,
    });
  } catch (error: any) {
    console.error("GET /api/returns error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load returns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      type = "exchange",
      customer,
      items,
      reason_category,
      customer_notes = "",
      pickup_address,
    } = body;

    if (!order_id || !customer || !items || !items.length || !reason_category) {
      return NextResponse.json(
        { success: false, message: "Missing required return/exchange fields." },
        { status: 400 }
      );
    }

    const prefix = type === "return" ? "RET" : "EXC";
    const generatedId = `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase()}`;

    const newRequest: ReturnExchangeRequest = {
      id: generatedId,
      order_id: String(order_id).trim(),
      created_at: new Date().toISOString(),
      type: type === "return" ? "return" : "exchange",
      status: "pending",
      customer: {
        fullName: customer.fullName || "Customer",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        pincode: customer.pincode || "",
      },
      items: items.map((item: any) => ({
        product_id: item.product_id || item.id,
        name: item.name || item.product_name || "Streetwear Piece",
        price: Number(item.price || item.product_price || 0),
        quantity: Number(item.quantity) || 1,
        size: item.size || "M",
        color: item.color || "",
        image: item.image || "",
        exchange_size: item.exchange_size || "",
        exchange_color: item.exchange_color || "",
        reason: item.reason || reason_category,
      })),
      reason_category,
      customer_notes: customer_notes?.trim() || "",
      pickup_address: pickup_address || customer.address || "",
    };

    const saved = await addStoreReturn(newRequest);

    return NextResponse.json({
      success: true,
      message: `${type === "return" ? "Return" : "Exchange"} request submitted successfully.`,
      request: saved,
    });
  } catch (error: any) {
    console.error("POST /api/returns error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit return request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, admin_notes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: "Request ID and status are required." },
        { status: 400 }
      );
    }

    const updated = await updateStoreReturnStatus(id, status, admin_notes);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: `Request '${id}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Request status updated to ${status}.`,
      request: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/returns error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update return request" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Request ID is required." },
        { status: 400 }
      );
    }

    const { deleteStoreReturn } = await import("@/lib/store-data");
    const deleted = await deleteStoreReturn(id);

    return NextResponse.json({
      success: true,
      message: deleted ? `Request '${id}' removed.` : `Request '${id}' not found.`,
      deleted,
    });
  } catch (error: any) {
    console.error("DELETE /api/returns error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete return request" },
      { status: 500 }
    );
  }
}
