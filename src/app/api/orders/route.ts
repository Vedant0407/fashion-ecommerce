import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addStoreOrder, getStoreOrders } from "@/lib/store-data";

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
    const effectiveEmail = queryEmail || authenticatedUser?.email?.toLowerCase() || cookieEmail;

    if (!authenticatedUser && !effectiveEmail) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const emailsToMatch = new Set<string>();
    if (queryEmail) emailsToMatch.add(queryEmail);
    if (authenticatedUser?.email) emailsToMatch.add(authenticatedUser.email.toLowerCase().trim());
    if (cookieEmail) emailsToMatch.add(cookieEmail);

    let dbOrders: any[] = [];
    if (authenticatedUser) {
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
    }

    const allStoreOrders = await getStoreOrders();
    const storeUserOrders = allStoreOrders.filter((o) => {
      const custEmail = o.customer?.email?.trim().toLowerCase();
      return custEmail ? emailsToMatch.has(custEmail) : false;
    });

    const orderMap = new Map<string, any>();

    // First add DB orders
    for (const dbOrder of dbOrders) {
      const rawAddr = dbOrder.addresses;
      const addr = (Array.isArray(rawAddr) ? rawAddr[0] : rawAddr) || {};
      orderMap.set(dbOrder.id, {
        id: dbOrder.id,
        created_at: dbOrder.created_at,
        status: dbOrder.status,
        subtotal: dbOrder.subtotal,
        shipping: dbOrder.shipping,
        total: dbOrder.total,
        payment_status: dbOrder.payment_status,
        payment_method: dbOrder.payment_method,
        customer: {
          fullName: addr.full_name || "Customer",
          email: effectiveEmail,
          phone: addr.phone || "",
          address: addr.address_line1 || "",
          city: addr.city || "",
          state: addr.state || "",
          pincode: addr.postal_code || "",
        },
      });
    }

    // Store orders take precedence because they contain admin status updates and items
    for (const stOrder of storeUserOrders) {
      orderMap.set(stOrder.id, stOrder);
    }

    const mergedOrders = Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      success: true,
      orders: mergedOrders,
    });
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const calculatedSubtotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.price) * item.quantity,
      0
    );
    const calculatedShipping =
      calculatedSubtotal > 5000 || calculatedSubtotal === 0 ? 0 : 199;
    const finalShipping = shipping !== undefined ? shipping : calculatedShipping;
    const finalTotal = Math.max(0, calculatedSubtotal + finalShipping - discount);

    let createdOrderId = `GO-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    if (user) {
      try {
        const { data: addressData, error: addressError } = await supabase
          .from("addresses")
          .insert({
            user_id: user.id,
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
              user_id: user.id,
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

    // Save order to persistent store data for admin dashboard
    const savedStoreOrder = await addStoreOrder({
      id: createdOrderId,
      created_at: new Date().toISOString(),
      customer: {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      },
      items: items.map((item: any) => ({
        product_id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity) || 1,
        image: item.image,
        size: item.size || "M",
        color: item.color,
      })),
      subtotal: calculatedSubtotal,
      shipping: finalShipping,
      discount,
      total: finalTotal,
      status: "confirmed",
      payment_method: paymentMethod,
      payment_status: paymentMethod === "COD" ? "pending" : "paid",
    });

    return NextResponse.json({
      success: true,
      orderId: createdOrderId,
      order: savedStoreOrder,
    });
  } catch (error: any) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to place order" },
      { status: 500 }
    );
  }
}
