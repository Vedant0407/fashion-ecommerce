import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStoreOrders } from "@/lib/store-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cleanId = (id || "").trim();

    const cookieEmail = request.cookies.get("greeno_session")?.value
      ? decodeURIComponent(request.cookies.get("greeno_session")!.value).trim().toLowerCase()
      : null;

    let authenticatedUser: any = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      authenticatedUser = user;
    } catch {
      // Supabase user fetch failed
    }

    const authEmail =
      cookieEmail ||
      (authenticatedUser?.email ? authenticatedUser.email.trim().toLowerCase() : null);

    if (!authEmail) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Check store-data first to get full item options and latest admin status
    const allStoreOrders = await getStoreOrders(true);
    const matched = allStoreOrders.find((o) => o.id === cleanId);

    if (matched) {
      const orderCustomerEmail = matched.customer?.email?.trim().toLowerCase();

      // Strict per-account security check: Order must belong to this user
      if (orderCustomerEmail && orderCustomerEmail !== authEmail) {
        return NextResponse.json(
          { success: false, message: "Forbidden. You cannot view an order belonging to another account." },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        order: {
          id: matched.id,
          status: matched.status,
          subtotal: matched.subtotal,
          shipping: matched.shipping,
          discount: matched.discount || 0,
          total: matched.total,
          payment_status: matched.payment_status,
          payment_method: matched.payment_method,
          created_at: matched.created_at,
          customer: matched.customer,
          addresses: {
            full_name: matched.customer?.fullName || "Customer",
            name: matched.customer?.fullName || "Customer",
            phone: matched.customer?.phone || "",
            address_line1: matched.customer?.address || "",
            city: matched.customer?.city || "",
            state: matched.customer?.state || "",
            postal_code: matched.customer?.pincode || "",
            pincode: matched.customer?.pincode || "",
            country: "India",
          },
          items: matched.items.map((it) => ({
            id: it.id || it.product_id,
            product_id: it.product_id,
            product_name: it.name,
            product_price: it.price,
            quantity: it.quantity,
            image: it.image,
            size: it.size,
            color: it.color,
          })),
        },
      });
    }

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

    if (isUuid && authenticatedUser) {
      try {
        const supabase = await createClient();
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select(
            "id, status, subtotal, shipping, total, payment_status, payment_method, created_at, address_id, addresses(*)"
          )
          .eq("id", cleanId)
          .eq("user_id", authenticatedUser.id)
          .maybeSingle();

        if (!orderError && order) {
          const { data: items } = await supabase
            .from("order_items")
            .select("id, product_id, product_name, product_price, quantity")
            .eq("order_id", cleanId);

          return NextResponse.json({
            success: true,
            order: {
              ...order,
              items: items || [],
            },
          });
        }
      } catch {}
    }

    return NextResponse.json(
      { success: false, message: "Order not found." },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const clientOrder = body.order;

    if (!clientOrder || clientOrder.id !== id) {
      return NextResponse.json(
        { success: false, message: "Valid order object matching ID is required" },
        { status: 400 }
      );
    }

    const cookieEmail = request.cookies.get("greeno_session")?.value
      ? decodeURIComponent(request.cookies.get("greeno_session")!.value).trim().toLowerCase()
      : null;

    let authenticatedUser: any = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      authenticatedUser = user;
    } catch {}

    const authEmail =
      cookieEmail ||
      (authenticatedUser?.email ? authenticatedUser.email.trim().toLowerCase() : null);

    const clientOrderEmail = clientOrder.customer?.email?.trim().toLowerCase();

    // Verify ownership: client cannot heal/sync an order belonging to another email
    if (authEmail && clientOrderEmail && clientOrderEmail !== authEmail) {
      return NextResponse.json(
        { success: false, message: "Forbidden. You cannot modify an order for another account." },
        { status: 403 }
      );
    }

    const { syncStoreOrders } = await import("@/lib/store-data");
    const updated = await syncStoreOrders([clientOrder]);
    const matched = updated.find((o) => o.id === id) || clientOrder;

    return NextResponse.json({
      success: true,
      order: matched,
    });
  } catch (error: any) {
    console.error("POST /api/orders/[id] error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to sync order" },
      { status: 500 }
    );
  }
}
