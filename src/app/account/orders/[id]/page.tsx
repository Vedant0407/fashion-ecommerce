"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  address_id: string;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
};

type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
};

export default function OrderDetailsPage() {
    const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
  router.push("/login");
  return;
}

        // Get the order
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(
            "id, status, subtotal, shipping, total, payment_status, payment_method, created_at"
          )
          .eq("id", orderId)
          .eq("user_id", user.id)
          .single();

        if (orderError) {
          console.error("Order error:", orderError);
          setError("Order not found.");
          setLoading(false);
          return;
        }

        setOrder(orderData);

        // Get order items
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select(
            "id, product_id, product_name, product_price, quantity"
          )
          .eq("order_id", orderId);

        if (itemsError) {
          console.error("Order items error:", itemsError);
          setError(itemsError.message);
          setLoading(false);
          return;
        }

        setItems(itemsData || []);
      } catch (err) {
        console.error("ORDER DETAILS ERROR:", err);
        setError("Something went wrong while loading the order.");
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <main className="account-page">
        <div className="account-container">
          <p>LOADING ORDER...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="account-page">
        <div className="account-container">
          <p className="orders-error">
            {error || "Order not found."}
          </p>

          <Link href="/account/orders" className="back-link">
            ← BACK TO ORDERS
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">
      <div className="account-container">
        <p className="account-label">GREENO / ORDER</p>

        <h1>ORDER DETAILS</h1>

        <div className="order-info">
          <div>
            <span>ORDER ID</span>
            <strong>{order.id}</strong>
          </div>

          <div>
            <span>DATE</span>
            <strong>
              {new Date(order.created_at).toLocaleDateString("en-IN")}
            </strong>
          </div>

          <div>
            <span>STATUS</span>
            <strong>{order.status.toUpperCase()}</strong>
          </div>

          <div>
            <span>PAYMENT</span>
            <strong>{order.payment_method}</strong>
          </div>
        </div>

        <div className="order-items">
          <h2>ITEMS</h2>

          {items.map((item) => (
            <div className="order-detail-item" key={item.id}>
              <div>
                <strong>{item.product_name}</strong>
                <p>Quantity: {item.quantity}</p>
              </div>

              <span>
                ₹
                {(
                  Number(item.product_price) * item.quantity
                ).toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>

        <div className="order-total">
          <div>
            <span>SUBTOTAL</span>
            <strong>
              ₹{Number(order.subtotal).toLocaleString("en-IN")}
            </strong>
          </div>

          <div>
            <span>SHIPPING</span>
            <strong>
              ₹{Number(order.shipping).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="final-total">
            <span>TOTAL</span>
            <strong>
              ₹{Number(order.total).toLocaleString("en-IN")}
            </strong>
          </div>
        </div>

        <Link href="/account/orders" className="back-link">
          ← BACK TO ORDERS
        </Link>
      </div>
    </main>
  );
}