"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "@/app/account/orders/orders.module.css";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    // Try to load cached order snapshot from checkout
    const saved = localStorage.getItem("greeno_last_order");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!orderId || parsed.id === orderId) {
          setOrder(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, [orderId]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <p className={styles.crumb}>GREENO / CHECKOUT / CONFIRMATION</p>
        <h1 className={styles.title}>ORDER CONFIRMED</h1>

        {/* Status Tracker */}
        <div className={styles.timeline}>
          <div className={`${styles.step} ${styles.stepActive}`}>
            <div className={styles.stepDot} />
            <span className={styles.stepLabel}>1. ORDER PLACED</span>
          </div>

          <div className={`${styles.step} ${styles.stepActive}`}>
            <div className={styles.stepDot} />
            <span className={styles.stepLabel}>2. CONFIRMED</span>
          </div>

          <div className={styles.step}>
            <div className={styles.stepDot} />
            <span className={styles.stepLabel}>3. IN TRANSIT</span>
          </div>

          <div className={styles.step}>
            <div className={styles.stepDot} />
            <span className={styles.stepLabel}>4. DELIVERED</span>
          </div>
        </div>

        <div className={styles.detailsGrid}>
          <div>
            <div className={styles.sectionBox}>
              <h2 className={styles.sectionTitle}>THANK YOU FOR YOUR ORDER</h2>
              <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#444" }}>
                We have received your order and our workshop is preparing your pieces.
                A confirmation with delivery updates will be sent to your email.
              </p>

              {orderId && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "16px",
                    background: "#f7f7f5",
                    border: "1px solid #deded9",
                  }}
                >
                  <span style={{ fontSize: "10px", letterSpacing: "0.14em", color: "#777" }}>
                    YOUR ORDER REFERENCE
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: 600, marginTop: "4px" }}>
                    {orderId}
                  </div>
                </div>
              )}
            </div>

            {order?.items && order.items.length > 0 && (
              <div className={styles.sectionBox}>
                <h2 className={styles.sectionTitle}>ORDERED PIECES</h2>
                {order.items.map((item: any, idx: number) => {
                  const rawP = item.price ?? item.product_price ?? 0;
                  const unitPrice =
                    typeof rawP === "number" && !isNaN(rawP)
                      ? rawP
                      : parseFloat(String(rawP).replace(/[^0-9.]/g, "")) || 0;
                  const qty = Number(item.quantity) || 1;
                  const itName = item.name || item.product_name || "Streetwear Piece";

                  return (
                    <div className={styles.orderItem} key={item.id || idx}>
                      <img
                        src={item.image || "/black-tee.jfif"}
                        alt={itName}
                        className={styles.itemImage}
                      />
                      <div className={styles.itemInfo}>
                        <p className={styles.itemName}>{itName}</p>
                        <p className={styles.itemMeta}>
                          Quantity: {qty}
                          {item.size ? ` · Size: ${item.size}` : ""}
                          {item.color ? ` · ${item.color}` : ""}
                        </p>
                      </div>
                      <span className={styles.itemPrice}>
                        ₹{(unitPrice * qty).toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {order?.shippingAddress && (
              <div className={styles.sectionBox}>
                <h2 className={styles.sectionTitle}>DELIVERY DESTINATION</h2>
                <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: "13px" }}>
                  {order.shippingAddress.fullName}
                </p>
                <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#555" }}>
                  {order.shippingAddress.address}
                </p>
                <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#555" }}>
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                  {order.shippingAddress.pincode}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#777" }}>
                  Phone: {order.shippingAddress.phone}
                </p>
              </div>
            )}
          </div>

          <aside>
            <div className={styles.sectionBox}>
              <h2 className={styles.sectionTitle}>ORDER SUMMARY</h2>

              <div className={styles.summaryRow}>
                <span style={{ color: "#777" }}>ESTIMATED DELIVERY</span>
                <strong>3 - 5 Business Days</strong>
              </div>

              <div className={styles.summaryRow}>
                <span style={{ color: "#777" }}>PAYMENT METHOD</span>
                <strong>{order?.paymentMethod || "CASH ON DELIVERY"}</strong>
              </div>

              <div className={styles.summaryRow}>
                <span style={{ color: "#777" }}>PAYMENT STATUS</span>
                <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                  PAY ON DELIVERY
                </span>
              </div>

              {order?.total !== undefined && (
                <>
                  <div
                    style={{
                      margin: "18px 0",
                      borderTop: "1px solid #e5e5e0",
                    }}
                  />

                  <div className={styles.summaryRow}>
                    <span style={{ color: "#777" }}>SUBTOTAL</span>
                    <span>₹{Number(order.subtotal || order.total).toLocaleString("en-IN")}</span>
                  </div>

                  <div className={styles.summaryRow}>
                    <span style={{ color: "#777" }}>DELIVERY</span>
                    <span>{order.shipping === 0 ? "FREE" : `₹${order.shipping}`}</span>
                  </div>

                  {order.discount > 0 && (
                    <div className={styles.summaryRow} style={{ color: "#16a34a" }}>
                      <span>PROMO APPLIED</span>
                      <span>-₹{Number(order.discount).toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className={styles.summaryTotal}>
                    <span>TOTAL</span>
                    <span>₹{Number(order.total).toLocaleString("en-IN")}</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Link
                href="/shop"
                className={styles.primaryButton}
                style={{ textAlign: "center" }}
              >
                CONTINUE SHOPPING
              </Link>

              <Link
                href="/account/orders"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "14px",
                  background: "#fff",
                  border: "1px solid #cfcfcb",
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  color: "#111",
                  textDecoration: "none",
                }}
              >
                VIEW ALL ORDERS →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.container}>
            <div className={styles.emptyState}>
              <p>LOADING CONFIRMATION...</p>
            </div>
          </div>
        </main>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}