"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./orders.module.css";

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
        let user: any = null;
        try {
          const supabase = createClient();
          const {
            data: { user: supabaseUser },
          } = await supabase.auth.getUser();
          user = supabaseUser;
        } catch {
          // Supabase getUser failed
        }

        const storedEmail = typeof window !== "undefined" ? localStorage.getItem("greeno_user_email") : null;

        if (!user && !storedEmail) {
          setError("Please log in to view your orders.");
          setLoading(false);
          return;
        }

        const effectiveEmail = user?.email || storedEmail || "";

        // First query via API route
        try {
          const res = await fetch(`/api/orders?email=${encodeURIComponent(effectiveEmail)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.orders)) {
              setOrders(data.orders);
              setLoading(false);
              return;
            }
          }
        } catch (apiErr) {
          console.warn("Orders API fetch warning:", apiErr);
        }

        // Direct Supabase fallback
        if (user) {
          const supabase = createClient();
          const { data, error: ordersError } = await supabase
            .from("orders")
            .select(
              "id, status, subtotal, shipping, total, payment_status, payment_method, created_at"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (!ordersError && data) {
            setOrders(data);
            setLoading(false);
            return;
          }
        }

        setOrders([]);
      } catch (err) {
        console.error("FETCH ORDERS ERROR:", err);
        setError("Something went wrong while loading your orders.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return styles.statusConfirmed;
      case "shipped":
        return styles.statusShipped;
      case "delivered":
        return styles.statusDelivered;
      default:
        return styles.statusPending;
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/account" className={styles.back}>
          ← BACK TO ACCOUNT
        </Link>

        <p className={styles.crumb}>GREENO / ACCOUNT</p>
        <h1 className={styles.title}>YOUR ORDERS</h1>

        {loading && (
          <div className={styles.emptyState}>
            <p>LOADING ORDERS...</p>
          </div>
        )}

        {error && (
          <div className={styles.emptyState}>
            <p style={{ color: "#e11d48", marginBottom: "20px" }}>{error}</p>
            <Link href="/login" className={styles.primaryButton}>
              LOG IN NOW
            </Link>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className={styles.emptyState}>
            <h2>NO ORDERS YET</h2>
            <p>You haven&apos;t placed any orders yet. Discover our latest collection.</p>
            <Link href="/shop" className={styles.primaryButton}>
              START SHOPPING
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div>
            {orders.map((order) => (
              <Link
                href={`/account/orders/${order.id}`}
                className={styles.card}
                key={order.id}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>ORDER ID</span>
                      <strong className={styles.metaValue}>{order.id}</strong>
                    </div>

                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>ORDER DATE</span>
                      <strong className={styles.metaValue}>
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </strong>
                    </div>

                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>PAYMENT</span>
                      <strong className={styles.metaValue}>
                        {order.payment_method}
                      </strong>
                    </div>
                  </div>

                  <span
                    className={`${styles.statusBadge} ${getStatusBadgeClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div>
                    <span className={styles.metaLabel}>TOTAL AMOUNT</span>
                    <div className={styles.cardTotal}>
                      ₹{Number(order.total).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <span className={styles.viewLink}>
                    VIEW ORDER DETAILS →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}