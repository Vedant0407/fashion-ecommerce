"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const supabase = createClient();

        // Get logged-in user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError("Please log in to view your orders.");
          setLoading(false);
          return;
        }

        // Get user's orders
        const { data, error: ordersError } = await supabase
          .from("orders")
          .select(
            "id, status, subtotal, shipping, total, payment_status, payment_method, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (ordersError) {
          console.error("Orders error:", ordersError);
          setError(ordersError.message);
          setLoading(false);
          return;
        }

        setOrders(data || []);
      } catch (err) {
        console.error("FETCH ORDERS ERROR:", err);
        setError("Something went wrong while loading your orders.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  return (
    <main className="account-page">
      <div className="account-container">
        <p className="account-label">GREENO / ORDERS</p>

        <h1>YOUR ORDERS</h1>

        {loading && (
          <p className="orders-message">LOADING ORDERS...</p>
        )}

        {error && (
          <p className="orders-error">{error}</p>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="empty-orders">
            <p>You haven't placed any orders yet.</p>

            <Link href="/shop" className="continue-shopping">
              START SHOPPING
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => (
              <Link
  href={`/account/orders/${order.id}`}
  className="order-card"
  key={order.id}
>
                <div className="order-card-header">
                  <div>
                    <span>ORDER ID</span>
                    <strong>{order.id}</strong>
                  </div>

                  <div>
                    <span>DATE</span>
                    <strong>
                      {new Date(order.created_at).toLocaleDateString(
                        "en-IN"
                      )}
                    </strong>
                  </div>
                </div>

                <div className="order-card-details">
                  <div>
                    <span>STATUS</span>
                    <strong>{order.status.toUpperCase()}</strong>
                  </div>

                  <div>
                    <span>PAYMENT</span>
                    <strong>
                      {order.payment_method}
                    </strong>
                  </div>

                  <div>
                    <span>TOTAL</span>
                    <strong>
                      ₹{Number(order.total).toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Link href="/account" className="back-link">
          ← BACK TO ACCOUNT
        </Link>
      </div>
    </main>
  );
}