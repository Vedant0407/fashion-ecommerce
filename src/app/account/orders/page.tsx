"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./orders.module.css";

type OrderItem = {
  id?: string;
  product_id?: string;
  name?: string;
  product_name?: string;
  price?: number;
  product_price?: number;
  quantity?: number;
  image?: string;
  size?: string;
  color?: string;
};

type OrderCustomer = {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

type Order = {
  id: string;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
  items?: OrderItem[];
  customer?: OrderCustomer;
  addresses?: any;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Helper to read cached customer orders
  function getLocalOrders(): Order[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("greeno_customer_orders");
      const list = raw ? JSON.parse(raw) : [];
      const lastRaw = localStorage.getItem("greeno_last_order");
      if (lastRaw) {
        const lastOrder = JSON.parse(lastRaw);
        if (lastOrder?.id && !list.some((o: any) => o.id === lastOrder.id)) {
          list.unshift(lastOrder);
        }
      }
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  useEffect(() => {
    // 1. Instantly show locally cached orders so user never sees an empty screen on refresh
    const local = getLocalOrders();
    if (local.length > 0) {
      setOrders(local);
      setLoading(false);
    }

    async function fetchOrders() {
      const currentLocal = getLocalOrders();
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

        if (!user && !storedEmail && currentLocal.length === 0) {
          setError("Please log in to view your orders.");
          setLoading(false);
          return;
        }

        const effectiveEmail = user?.email || storedEmail || currentLocal[0]?.id ? storedEmail || user?.email || "" : "";

        // Query server API
        let serverOrders: Order[] = [];
        try {
          const res = await fetch(`/api/orders?email=${encodeURIComponent(effectiveEmail)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.orders)) {
              serverOrders = data.orders;
            }
          }
        } catch (apiErr) {
          console.warn("Orders API fetch warning:", apiErr);
        }

        // Direct Supabase fallback if user is logged in
        if (user && serverOrders.length === 0) {
          try {
            const supabase = createClient();
            const { data, error: ordersError } = await supabase
              .from("orders")
              .select(
                "id, status, subtotal, shipping, total, payment_status, payment_method, created_at"
              )
              .eq("user_id", user.id)
              .order("created_at", { ascending: false });

            if (!ordersError && data) {
              serverOrders = data;
            }
          } catch {
            // ignore
          }
        }

        // Merge server and local orders: server status wins, but local items and customer details are never lost
        const orderMap = new Map<string, Order>();

        // Add local orders first
        for (const loc of currentLocal) {
          if (loc?.id) orderMap.set(loc.id, loc);
        }

        // Merge with server orders non-destructively
        for (const srv of serverOrders) {
          if (srv?.id) {
            const existing = orderMap.get(srv.id);
            if (!existing) {
              orderMap.set(srv.id, srv);
            } else {
              const mergedItems =
                Array.isArray(srv.items) && srv.items.length > 0
                  ? srv.items
                  : Array.isArray(existing.items) && existing.items.length > 0
                  ? existing.items
                  : [];

              const mergedCustomer = {
                fullName:
                  srv.customer?.fullName && srv.customer.fullName !== "Customer"
                    ? srv.customer.fullName
                    : existing.customer?.fullName || srv.customer?.fullName || "Customer",
                address: srv.customer?.address || existing.customer?.address || "",
                city: srv.customer?.city || existing.customer?.city || "",
                state: srv.customer?.state || existing.customer?.state || "",
                pincode: srv.customer?.pincode || existing.customer?.pincode || "",
                phone: srv.customer?.phone || existing.customer?.phone || "",
                email: srv.customer?.email || existing.customer?.email || "",
              };

              orderMap.set(srv.id, {
                ...existing,
                ...srv,
                items: mergedItems,
                customer: mergedCustomer,
                subtotal: srv.subtotal && srv.subtotal > 0 ? srv.subtotal : existing.subtotal || 0,
                total: srv.total && srv.total > 0 ? srv.total : existing.total || 0,
                status: srv.status || existing.status,
                payment_status: srv.payment_status || existing.payment_status,
                payment_method: srv.payment_method || existing.payment_method,
              });
            }
          }
        }

        const mergedOrders = Array.from(orderMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setOrders(mergedOrders);

        // Update local storage with merged orders
        if (typeof window !== "undefined" && mergedOrders.length > 0) {
          try {
            localStorage.setItem("greeno_customer_orders", JSON.stringify(mergedOrders));
          } catch {}
        }

        // If local had orders missing or hollow on server, heal them back to server
        if (currentLocal.length > 0) {
          const needsHealingOnServer = currentLocal.filter((lo) => {
            const srv = serverOrders.find((so) => so.id === lo.id);
            if (!srv) return true;
            if ((!srv.items || srv.items.length === 0) && lo.items && lo.items.length > 0) return true;
            if ((!srv.total || srv.total === 0) && lo.total && lo.total > 0) return true;
            return false;
          });

          if (needsHealingOnServer.length > 0) {
            fetch("/api/orders/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orders: needsHealingOnServer }),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error("FETCH ORDERS ERROR:", err);
        if (currentLocal.length === 0) {
          setError("Something went wrong while loading your orders.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();

    // Listen for order status updates from admin
    function handleStorageChange() {
      const refreshed = getLocalOrders();
      if (refreshed.length > 0) {
        setOrders(refreshed);
      }
    }

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("greeno_order_updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("greeno_order_updated", handleStorageChange);
    };
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "confirmed":
      case "processing":
        return styles.statusConfirmed;
      case "shipped":
        return styles.statusShipped;
      case "delivered":
      case "reached":
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