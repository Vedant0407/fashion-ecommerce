"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../orders.module.css";

type Address = {
  full_name?: string;
  phone?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
};

type Order = {
  id: string;
  address_id?: string | null;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
  addresses?: any;
};

type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  image?: string;
};

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = String(params.id || "");

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
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
          router.push("/login");
          return;
        }

        // 1. Fetch via API route
        try {
          const res = await fetch(`/api/orders/${orderId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.order) {
              setOrder(data.order);
              setItems(data.order.items || []);
              setLoading(false);
              return;
            }
          }
        } catch (apiErr) {
          console.warn("Order details API fetch warning:", apiErr);
        }

        // 2. Direct Supabase fallback
        if (user) {
          const supabase = createClient();
          const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .select(
              "id, address_id, status, subtotal, shipping, total, payment_status, payment_method, created_at, addresses(*)"
            )
            .eq("id", orderId)
            .eq("user_id", user.id)
            .maybeSingle();

          if (orderData) {
            setOrder(orderData);

            const { data: itemsData } = await supabase
              .from("order_items")
              .select("id, product_id, product_name, product_price, quantity")
              .eq("order_id", orderId);

            setItems(itemsData || []);
            setLoading(false);
            return;
          }
        }

        setError("Order not found.");
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
  }, [orderId, router]);

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

  const getStepActiveIndex = (status: string) => {
    const s = status.toLowerCase();
    if (s === "delivered") return 4;
    if (s === "shipped") return 3;
    if (s === "confirmed" || s === "processing") return 2;
    return 1;
  };

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <p>LOADING ORDER DETAILS...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <h2>{error || "ORDER NOT FOUND"}</h2>
            <p>We could not retrieve this order from your account.</p>
            <Link href="/account/orders" className={styles.primaryButton}>
              BACK TO ORDERS
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const activeStep = getStepActiveIndex(order.status);
  const rawAddress = order.addresses;
  const address: Address | null = Array.isArray(rawAddress) ? rawAddress[0] : rawAddress;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/account/orders" className={styles.back}>
          ← BACK TO ALL ORDERS
        </Link>

        <p className={styles.crumb}>GREENO / ORDERS / {order.id}</p>
        <h1 className={styles.title}>ORDER DETAILS</h1>

        {/* Status Tracker */}
        <div className={styles.timeline}>
          <div className={`${styles.step} ${activeStep >= 1 ? styles.stepActive : ""}`}>
            <div className={styles.stepDot} />
            <span className={styles.stepLabel}>1. ORDER PLACED</span>
          </div>

          <div className={`${styles.step} ${activeStep >= 2 ? styles.stepActive : ""}`}>
            <div className={styles.stepDot} />
            <span className={styles.stepLabel}>2. CONFIRMED</span>
          </div>

          <div className={`${styles.step} ${activeStep >= 3 ? styles.stepActive : ""}`}>
            <div className={styles.stepDot} />
            <span className={styles.stepLabel}>3. IN TRANSIT</span>
          </div>

          <div className={`${styles.step} ${activeStep >= 4 ? styles.stepActive : ""}`}>
            <div className={styles.stepDot} />
            <span className={styles.stepLabel}>4. DELIVERED</span>
          </div>
        </div>

        <div className={styles.detailsGrid}>
          <div>
            {/* Items Box */}
            <div className={styles.sectionBox}>
              <h2 className={styles.sectionTitle}>
                ORDERED ITEMS ({items.length})
              </h2>

              {items.map((item) => (
                <div className={styles.orderItem} key={item.id}>
                  <img
                    src="/black-tee.jfif"
                    alt={item.product_name}
                    className={styles.itemImage}
                  />

                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.product_name}</p>
                    <p className={styles.itemMeta}>Quantity: {item.quantity}</p>
                  </div>

                  <span className={styles.itemPrice}>
                    ₹{(Number(item.product_price) * item.quantity).toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Shipping Address Box */}
            {address && (
              <div className={styles.sectionBox}>
                <h2 className={styles.sectionTitle}>SHIPPING ADDRESS</h2>
                <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: "14px" }}>
                  {address.full_name}
                </p>
                <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#555" }}>
                  {address.address_line1}
                </p>
                <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#555" }}>
                  {address.city}, {address.state} - {address.postal_code}
                </p>
                <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#555" }}>
                  {address.country || "India"}
                </p>
                {address.phone && (
                  <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#777" }}>
                    Contact Phone: {address.phone}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Summary */}
          <aside>
            <div className={styles.sectionBox}>
              <h2 className={styles.sectionTitle}>ORDER SUMMARY</h2>

              <div className={styles.summaryRow}>
                <span style={{ color: "#777" }}>ORDER ID</span>
                <strong style={{ fontSize: "11px" }}>{order.id}</strong>
              </div>

              <div className={styles.summaryRow}>
                <span style={{ color: "#777" }}>DATE</span>
                <span>
                  {new Date(order.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className={styles.summaryRow}>
                <span style={{ color: "#777" }}>STATUS</span>
                <span
                  className={`${styles.statusBadge} ${getStatusBadgeClass(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>

              <div className={styles.summaryRow}>
                <span style={{ color: "#777" }}>PAYMENT</span>
                <span>{order.payment_method}</span>
              </div>

              <div
                style={{
                  margin: "18px 0",
                  borderTop: "1px solid #e5e5e0",
                }}
              />

              <div className={styles.summaryRow}>
                <span style={{ color: "#777" }}>SUBTOTAL</span>
                <span>₹{Number(order.subtotal).toLocaleString("en-IN")}</span>
              </div>

              <div className={styles.summaryRow}>
                <span style={{ color: "#777" }}>DELIVERY</span>
                <span>
                  {Number(order.shipping) === 0
                    ? "FREE"
                    : `₹${Number(order.shipping).toLocaleString("en-IN")}`}
                </span>
              </div>

              <div className={styles.summaryTotal}>
                <span>TOTAL</span>
                <span>₹{Number(order.total).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className={styles.sectionBox} style={{ textAlign: "center" }}>
              <p style={{ fontSize: "12px", color: "#666", margin: "0 0 16px" }}>
                Need support with this order? Have your Order ID handy.
              </p>
              <Link href="/account" className={styles.primaryButton} style={{ width: "100%" }}>
                ACCOUNT DASHBOARD
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}