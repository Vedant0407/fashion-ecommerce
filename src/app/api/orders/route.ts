import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncUserProfile } from "@/lib/user-store";
import { prisma } from "@/lib/prisma";
import { formatShortOrderId } from "@/lib/order-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

class CheckoutError extends Error {
  constructor(message: string, readonly status: number = 400) {
    super(message);
  }
}

function parseSizeStock(value: string): Record<string, number> | null {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return NextResponse.json(
        { success: false, message: "Please log in to view your orders." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    await syncUserProfile(data.user);
    const orders = await prisma.order.findMany({
      where: { user_id: data.user.id },
      include: { items: true },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        orders: orders.map((order) => ({
          id: order.id,
          short_id: formatShortOrderId(order.id),
          created_at: order.created_at.toISOString(),
          user_id: order.user_id,
          customer: {
            fullName: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone,
            address: order.address,
            city: order.city,
            state: order.state,
            pincode: order.pincode,
          },
          items: order.items.map((item) => ({
            id: item.id,
            product_id: item.product_id || "",
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image || undefined,
            size: item.size || undefined,
            color: item.color || undefined,
          })),
          subtotal: order.subtotal,
          shipping: order.shipping,
          discount: order.discount,
          total: order.total,
          status: order.status,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          notes: order.notes || undefined,
        })),
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load orders right now." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      paymentMethod = "COD",
      couponCode,
    } = body;

    if (
      typeof fullName !== "string" || fullName.trim().length < 2 ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof address !== "string" ||
      typeof city !== "string" ||
      typeof state !== "string" ||
      typeof pincode !== "string" ||
      !Array.isArray(items) || items.length < 1 || items.length > 30
    ) {
      return NextResponse.json({ success: false, message: "Complete the delivery details and add valid items." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    const cleanEmail = (user?.email || email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ success: false, message: "Enter a valid email address." }, { status: 400 });
    }
    if (user) await syncUserProfile(user);

    const cleanItems = items.map((item: any) => ({
      id: typeof item?.id === "string" ? item.id : "",
      quantity: Number(item?.quantity),
      size: typeof item?.size === "string" ? item.size : null,
      color: typeof item?.color === "string" ? item.color : null,
    }));
    if (cleanItems.some((item: any) => !item.id || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) {
      return NextResponse.json({ success: false, message: "One or more cart items are invalid." }, { status: 400 });
    }

    const payment = typeof paymentMethod === "string" ? paymentMethod.toUpperCase() : "COD";
    const allowedPayments = new Set(["COD", "ONLINE", "CARD", "UPI"]);
    if (!allowedPayments.has(payment)) {
      return NextResponse.json({ success: false, message: "Choose a valid payment method." }, { status: 400 });
    }

    const orderId = "GO-" + Date.now().toString(36).toUpperCase() + "-" + randomUUID().slice(0, 6).toUpperCase();
    const created = await prisma.$transaction(async (tx) => {
      const orderItems: Array<{
        product_id: string;
        name: string;
        price: number;
        quantity: number;
        size: string | null;
        color: string | null;
        image: string;
      }> = [];
      let subtotal = 0;

      for (const requested of cleanItems) {
        const product = await tx.product.findUnique({ where: { id: requested.id } });
        if (!product) throw new CheckoutError("A product in your cart is no longer available.", 409);
        if (product.stock < requested.quantity) {
          throw new CheckoutError("There is not enough stock for " + product.name + ".", 409);
        }

        const sizeStock = parseSizeStock(product.size_stock);
        if (requested.size && sizeStock) {
          const available = sizeStock[requested.size];
          if (typeof available !== "number" || available < requested.quantity) {
            throw new CheckoutError("The selected size is out of stock for " + product.name + ".", 409);
          }
          sizeStock[requested.size] = available - requested.quantity;
        }

        const changed = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: requested.quantity } },
          data: {
            stock: { decrement: requested.quantity },
            ...(requested.size && sizeStock ? { size_stock: JSON.stringify(sizeStock) } : {}),
          },
        });
        if (changed.count !== 1) throw new CheckoutError("Stock changed while checking out. Please refresh your cart.", 409);

        subtotal += product.price * requested.quantity;
        orderItems.push({
          product_id: product.id,
          name: product.name,
          price: product.price,
          quantity: requested.quantity,
          size: requested.size,
          color: requested.color,
          image: product.image,
        });
      }

      const shipping = subtotal > 5000 ? 0 : 199;
      let discount = 0;
      if (typeof couponCode === "string" && couponCode.trim()) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } });
        if (!coupon || !coupon.active || subtotal < coupon.minOrder) {
          throw new CheckoutError("This coupon is invalid or does not apply to this order.");
        }
        if (coupon.type === "percentage") discount = Math.min(subtotal, subtotal * coupon.value / 100);
        else if (coupon.type === "fixed") discount = Math.min(subtotal, coupon.value);
        else if (coupon.type === "free_shipping") discount = shipping;
        await tx.coupon.update({ where: { id: coupon.id }, data: { usage_count: { increment: 1 } } });
      }

      const savedAddress = user
        ? await tx.address.create({
            data: {
              user_id: user.id,
              full_name: fullName.trim(),
              phone: phone.trim(),
              address_line1: address.trim(),
              city: city.trim(),
              state: state.trim(),
              postal_code: pincode.trim(),
              country: "India",
            },
          })
        : null;

      return tx.order.create({
        data: {
          id: orderId,
          user_id: user?.id || null,
          address_id: savedAddress?.id || null,
          customer_name: fullName.trim(),
          customer_email: cleanEmail,
          customer_phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          subtotal,
          shipping,
          discount,
          total: Math.max(0, subtotal + shipping - discount),
          status: "confirmed",
          payment_method: payment,
          payment_status: "pending",
          items: { create: orderItems },
        },
        include: { items: true },
      });
    }, { isolationLevel: "Serializable" });

    return NextResponse.json(
      {
        success: true,
        orderId: formatShortOrderId(created.id),
        rawOrderId: created.id,
        order: {
          id: created.id,
          short_id: formatShortOrderId(created.id),
          created_at: created.created_at.toISOString(),
          user_id: created.user_id || undefined,
          customer: {
            fullName: created.customer_name,
            email: created.customer_email,
            phone: created.customer_phone,
            address: created.address,
            city: created.city,
            state: created.state,
            pincode: created.pincode,
          },
          items: created.items.map((item) => ({
            id: item.id,
            product_id: item.product_id || "",
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image || undefined,
            size: item.size || undefined,
            color: item.color || undefined,
          })),
          subtotal: created.subtotal,
          shipping: created.shipping,
          discount: created.discount,
          total: created.total,
          status: created.status,
          payment_method: created.payment_method,
          payment_status: created.payment_status,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { success: false, message: "We could not place this order. Please try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
