import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addStoreOrder, getStoreOrders } from "@/lib/store-data";
import { formatShortOrderId, isOrderMatch } from "@/lib/order-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
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

    const queryEmail = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
    const cookieEmail = request.cookies.get("greeno_session")?.value
      ? decodeURIComponent(request.cookies.get("greeno_session")!.value).trim().toLowerCase()
      : null;

    // Strict authentication: determine the single verified email for this session
    const authEmail =
      cookieEmail ||
      (authenticatedUser?.email ? authenticatedUser.email.trim().toLowerCase() : null) ||
      queryEmail;

    if (!authEmail) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in to view orders." },
        { status: 401 }
      );
    }

    // Security check: If a query email is passed, it MUST match the authenticated session
    if (queryEmail && cookieEmail && queryEmail !== cookieEmail) {
      return NextResponse.json(
        { success: false, message: "Forbidden. You cannot view orders for another account." },
        { status: 403 }
      );
    }

    let dbOrders: any[] = [];
    if (authenticatedUser) {
      try {
        const supabase = await createClient();
        const { data, error: ordersError } = await supabase
          .from("orders")
          .select(
            "id, status, subtotal, shipping, total, payment_status, payment_method, created_at, addresses(*)"
          )
          .eq("user_id", authenticatedUser.id)
          .order("created_at", { ascending: false });

        if (!ordersError && data) {
          dbOrders = data;
        }
      } catch {}
    }

    // Read cookie-based status overrides to bridge serverless environments
    const cookieStatusesRaw = request.cookies.get("greeno_order_statuses")?.value;
    let cookieStatuses: Record<string, string> = {};
    if (cookieStatusesRaw) {
      try {
        cookieStatuses = JSON.parse(decodeURIComponent(cookieStatusesRaw));
      } catch {}
    }

    // Read fresh store orders from disk
    const allStoreOrders = await getStoreOrders(true);

    // Strictly isolate: Only orders placed by this specific email
    const storeUserOrders = allStoreOrders.filter((o) => {
      const custEmail = o.customer?.email?.trim().toLowerCase();
      return custEmail === authEmail;
    });

    const orderMap = new Map<string, any>();

    // First add DB orders
    for (const dbOrder of dbOrders) {
      const rawAddr = dbOrder.addresses;
      const addr = (Array.isArray(rawAddr) ? rawAddr[0] : rawAddr) || {};
      const statusOverride = cookieStatuses[dbOrder.id];
      orderMap.set(dbOrder.id, {
        id: dbOrder.id,
        created_at: dbOrder.created_at,
        status: statusOverride || dbOrder.status || "confirmed",
        subtotal: dbOrder.subtotal,
        shipping: dbOrder.shipping,
        total: dbOrder.total,
        payment_status: dbOrder.payment_status,
        payment_method: dbOrder.payment_method,
        customer: {
          fullName: addr.full_name || "Customer",
          email: authEmail,
          phone: addr.phone || "",
          address: addr.address_line1 || "",
          city: addr.city || "",
          state: addr.state || "",
          pincode: addr.postal_code || "",
        },
      });
    }

    // Merge store orders with DB orders: keep full item details and latest status synchronized
    for (const stOrder of storeUserOrders) {
      const existingDb = orderMap.get(stOrder.id);
      const statusOverride = cookieStatuses[stOrder.id];
      if (!existingDb) {
        orderMap.set(stOrder.id, {
          ...stOrder,
          status: statusOverride || stOrder.status || "confirmed",
        });
      } else {
        // If cookie status or store order has an updated status, let it take precedence
        const finalStatus =
          statusOverride ||
          (stOrder.status && stOrder.status !== "confirmed" ? stOrder.status : existingDb.status) ||
          stOrder.status ||
          existingDb.status ||
          "confirmed";

        const finalPaymentStatus =
          stOrder.payment_status ||
          existingDb.payment_status ||
          "pending";

        orderMap.set(stOrder.id, {
          ...existingDb,
          ...stOrder,
          status: finalStatus,
          payment_status: finalPaymentStatus,
        });
      }
    }

    const mergedOrders = Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json(
      {
        success: true,
        orders: mergedOrders,
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error: any) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    let authenticatedUser: any = null;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      authenticatedUser = user;
    } catch {}

    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      items,
      subtotal,
      shipping,
      discount = 0,
      paymentMethod = "COD",
    } = body;

    if (
      !fullName ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode ||
      !items ||
      !items.length
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required order information." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const calculatedSubtotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.price) * item.quantity,
      0
    );
    const calculatedShipping =
      calculatedSubtotal > 5000 || calculatedSubtotal === 0 ? 0 : 199;
    const finalShipping = shipping !== undefined ? shipping : calculatedShipping;
    const finalTotal = Math.max(0, calculatedSubtotal + finalShipping - discount);

    let createdOrderId = `GO-${Math.floor(1000 + Math.random() * 9000)}-${Math.random()
      .toString(36)
      .substring(2, 4)
      .toUpperCase()}`;

    if (authenticatedUser) {
      try {
        const { data: addressData, error: addressError } = await supabase
          .from("addresses")
          .insert({
            user_id: authenticatedUser.id,
            full_name: fullName.trim(),
            phone: phone.trim(),
            address_line1: address.trim(),
            city: city.trim(),
            state: state.trim(),
            postal_code: pincode.trim(),
            country: "India",
            is_default: false,
          })
          .select("id")
          .single();

        if (!addressError && addressData) {
          const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .insert({
              user_id: authenticatedUser.id,
              address_id: addressData.id,
              status: "confirmed",
              subtotal: calculatedSubtotal,
              shipping: finalShipping,
              total: finalTotal,
              payment_status: "pending",
              payment_method: paymentMethod,
            })
            .select("id, created_at, status, total")
            .single();

          if (!orderError && orderData) {
            createdOrderId = orderData.id;
            const orderItems = items.map((item: any) => ({
              order_id: orderData.id,
              product_id: item.id,
              product_name: item.name,
              product_price: Number(item.price),
              quantity: item.quantity,
            }));

            await supabase.from("order_items").insert(orderItems);
          }
        }
      } catch (dbErr) {
        console.warn("Supabase order insert notice (will persist in store-data):", dbErr);
      }
    }

    // Save order permanently to persistent store data for customer account and admin dashboard
    const savedStoreOrder = await addStoreOrder({
      id: createdOrderId,
      created_at: new Date().toISOString(),
      customer: {
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      },
      items: items.map((item: any) => {
        const rawP = item.price ?? item.product_price ?? 0;
        const cleanP =
          typeof rawP === "number"
            ? rawP
            : parseFloat(String(rawP).replace(/[^0-9.]/g, "")) || 0;
        const nm = item.name || item.product_name || "Streetwear Piece";
        return {
          product_id: item.id || item.product_id,
          name: nm,
          product_name: nm,
          price: cleanP,
          product_price: cleanP,
          quantity: Number(item.quantity) || 1,
          image: item.image,
          size: item.size || "M",
          color: item.color,
        };
      }),
      subtotal: calculatedSubtotal,
      shipping: finalShipping,
      discount,
      total: finalTotal,
      status: "confirmed",
      payment_method: paymentMethod,
      payment_status: paymentMethod === "COD" ? "pending" : "paid",
    });

    const shortOrderId = formatShortOrderId(createdOrderId);
    const response = NextResponse.json({
      success: true,
      orderId: shortOrderId,
      rawOrderId: createdOrderId,
      order: {
        ...savedStoreOrder,
        short_id: shortOrderId,
      },
    });

    // Ensure session cookie matches this order's owner
    response.cookies.set("greeno_session", encodeURIComponent(cleanEmail), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      httpOnly: false,
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to place order" },
      { status: 500 }
    );
  }
}
