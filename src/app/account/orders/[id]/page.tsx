"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Package, User, Wallet, LogOut, ArrowLeft, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatShortOrderId } from "@/lib/order-utils";
import styles from "../../account.module.css";

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
  customer?: { address?: string };
};

type OrderItem = {
  id?: string;
  product_id?: string;
  product_name?: string;
  name?: string;
  product_price?: number;
  price?: number;
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
};

function parsePrice(val: any): number {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 0 : num;
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = String(params.id || "");

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Return & Exchange states
  const [existingReturn, setExistingReturn] = useState<any | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
  const [returnModalType, setReturnModalType] = useState<"exchange" | "return">("exchange");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [exchangeSizes, setExchangeSizes] = useState<{ [id: string]: string }>({});
  const [reasonCategory, setReasonCategory] = useState<string>("Size too small / tight");
  const [customerNotes, setCustomerNotes] = useState<string>("");
  const [pickupAddress, setPickupAddress] = useState<string>("");
  const [submittingReturn, setSubmittingReturn] = useState<boolean>(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState<string>("");

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}

    if (typeof window !== "undefined") {
      localStorage.removeItem("greeno_user_name");
      localStorage.removeItem("greeno_user_email");
      localStorage.removeItem("greeno_user_phone");
      localStorage.removeItem("greeno_customer_orders");
      localStorage.removeItem("greeno_last_order");
      localStorage.removeItem("greeno_all_orders");
      document.cookie = "greeno_session=; path=/; max-age=0";
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("greeno_auth_change"));
    }
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    let active = true;
    async function loadOrder() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/orders/" + encodeURIComponent(orderId), { cache: "no-store" });
        if (response.status === 401) {
          router.push("/login?redirect=" + encodeURIComponent("/account/orders/" + orderId));
          return;
        }
        const data = await response.json();
        if (!response.ok || !data.success || !data.order) {
          if (active) setError(data.message || "Order not found.");
          return;
        }
        if (!active) return;
        setOrder(data.order);
        setItems(Array.isArray(data.order.items) ? data.order.items : []);
        const returnResponse = await fetch("/api/returns?order_id=" + encodeURIComponent(orderId), { cache: "no-store" });
        const returnData = await returnResponse.json();
        if (active && returnData.success && Array.isArray(returnData.returns)) {
          setExistingReturn(returnData.returns[0] || null);
        }
      } catch {
        if (active) setError("Unable to load this order right now.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadOrder();
    const handleRefresh = () => { void loadOrder(); };
    window.addEventListener("greeno_order_updated", handleRefresh);
    window.addEventListener("focus", handleRefresh);
    return () => {
      active = false;
      window.removeEventListener("greeno_order_updated", handleRefresh);
      window.removeEventListener("focus", handleRefresh);
    };
  }, [orderId, router]);
  function openReturnModal(type: "exchange" | "return") {
    setReturnModalType(type);
    if (items.length > 0) {
      const allIds = items.map((it) => it.id || it.product_id || "");
      setSelectedItemIds(allIds);
      const initialSizes: { [id: string]: string } = {};
      for (const it of items) {
        const id = it.id || it.product_id || "";
        const curSize = (it as any).size || "M";
        initialSizes[id] = curSize === "M" ? "L" : curSize === "L" ? "XL" : "M";
      }
      setExchangeSizes(initialSizes);
    }
    const currentAddr =
      order?.addresses?.address_line1 ||
      (order as any)?.addresses?.address ||
      (order as any)?.customer?.address ||
      "";
    const currentCity =
      order?.addresses?.city || (order as any)?.customer?.city || "";
    const currentState =
      order?.addresses?.state || (order as any)?.customer?.state || "";
    const currentPin =
      order?.addresses?.postal_code ||
      (order as any)?.customer?.pincode ||
      "";
    setPickupAddress(
      currentAddr ? `${currentAddr}, ${currentCity}, ${currentState} - ${currentPin}` : ""
    );
    setIsReturnModalOpen(true);
  }

  async function handleSubmitReturn(e: React.FormEvent) {
    e.preventDefault();
    if (selectedItemIds.length === 0) {
      alert("Please select at least one item.");
      return;
    }

    setSubmittingReturn(true);
    try {
      const chosenItems = items
        .filter((it) => selectedItemIds.includes(it.id || it.product_id || ""))
        .map((it) => {
          const itId = it.id || it.product_id || "";
          return {
            order_item_id: itId,
            product_id: it.product_id,
            exchange_size: returnModalType === "exchange" ? exchangeSizes[itId] || "L" : undefined,
            reason: reasonCategory,
          };
        });
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          type: returnModalType,
          items: chosenItems,
          reason_category: reasonCategory,
          customer_notes: customerNotes,
          pickup_address: pickupAddress || order?.addresses?.address_line1 || order?.customer?.address || "",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit return request.");
      }

      setExistingReturn(data.request);

      setIsReturnModalOpen(false);
      setReturnSuccessMsg(
        `Your ${returnModalType === "exchange" ? "Exchange" : "Return"} request (${data.request.id}) has been recorded! Reverse pickup will be arranged within 24-48 hours.`
      );
      setTimeout(() => setReturnSuccessMsg(""), 8000);
    } catch (err: any) {
      alert(err.message || "Failed to submit request.");
    } finally {
      setSubmittingReturn(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p className={styles.breadcrumb}>GREENO / MY ACCOUNT / ORDERS</p>
          <h1 className={styles.title}>MY ACCOUNT</h1>
          <div className={styles.accountCard} style={{ padding: "60px 40px", textAlign: "center" }}>
            <p className={styles.message}>LOADING ORDER DETAILS...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p className={styles.breadcrumb}>GREENO / MY ACCOUNT / ORDERS</p>
          <h1 className={styles.title}>MY ACCOUNT</h1>
          <div className={styles.accountCard} style={{ padding: "60px 40px", textAlign: "center" }}>
            <div className={styles.emptyState}>
              <h2 style={{ margin: "0 0 10px", fontSize: "20px", fontWeight: 700, color: "#111827" }}>
                {error || "ORDER NOT FOUND"}
              </h2>
              <p style={{ margin: "0 0 20px", color: "#6b7280" }}>
                We could not retrieve this order from your account.
              </p>
              <Link
                href="/account?tab=orders"
                className={styles.saveButton}
                style={{ display: "inline-block", textDecoration: "none" }}
              >
                Back to Order History
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const activeStep = getStepActiveIndex(order.status);
  const rawAddress = order.addresses || (order as any).customer;
  const address: any = Array.isArray(rawAddress) ? rawAddress[0] : rawAddress;

  // 3-Day Return & Exchange Eligibility Calculation
  const isDelivered =
    order.status?.toLowerCase() === "reached" || order.status?.toLowerCase() === "delivered";
  const orderTime = new Date((order as any).delivered_at || order.created_at).getTime();
  const diffHours = (Date.now() - orderTime) / (1000 * 60 * 60);
  const diffDays = diffHours / 24;
  const isEligible = isDelivered && diffDays <= 3;
  const daysLeft = Math.max(0, Math.ceil(3 - diffDays));
  const hoursLeft = Math.max(0, Math.ceil(72 - diffHours));

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <p className={styles.breadcrumb}>GREENO / MY ACCOUNT / ORDERS / {formatShortOrderId(order.id)}</p>
        <h1 className={styles.title}>MY ACCOUNT</h1>

        {/* Main Reference Card Container */}
        <div className={styles.accountCard}>
          {/* Left Sidebar Navigation */}
          <aside className={styles.sidebar}>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => router.push("/account?tab=account")}
            >
              <User className={styles.navIcon} />
              <span>Account details</span>
            </button>

            <button
              type="button"
              className={`${styles.navButton} ${styles.navButtonActive}`}
              onClick={() => router.push("/account?tab=orders")}
            >
              <Package className={styles.navIcon} />
              <span>Order history</span>
            </button>

            <button
              type="button"
              className={styles.navButton}
              onClick={() => router.push("/account?tab=address")}
            >
              <MapPin className={styles.navIcon} />
              <span>Shipping Address</span>
            </button>

            <button
              type="button"
              className={styles.navButton}
              onClick={() => router.push("/account?tab=wallet")}
            >
              <Wallet className={styles.navIcon} />
              <span>Wallet Details</span>
            </button>

            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              <LogOut className={styles.navIcon} />
              <span>Log out</span>
            </button>
          </aside>

          {/* Vertical Divider */}
          <div className={styles.dividerLine} />

          {/* Right Content Area */}
          <section className={styles.contentArea}>
            <Link href="/account?tab=orders" className={`${styles.backToOrdersBtn} page-back-button`}>
              <ArrowLeft style={{ width: 14, height: 14 }} />
              <span>Back to Order History</span>
            </Link>

            <div className={styles.detailHeader}>
              <div>
                <h2 className={styles.tabTitle}>Order {formatShortOrderId(order.id)}</h2>
                <p className={styles.tabSubtitle}>
                  Placed on{" "}
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Recent"}
                  {" • "}
                  Payment: {order.payment_method} ({order.payment_status || "Pending"})
                </p>
              </div>

              <span
                className={`${styles.orderStatusBadge} ${
                  (order.status || "").toLowerCase() === "delivered" ||
                  (order.status || "").toLowerCase() === "reached"
                    ? styles.statusDelivered
                    : (order.status || "").toLowerCase() === "shipped"
                    ? styles.statusShipped
                    : (order.status || "").toLowerCase() === "cancelled"
                    ? styles.statusCancelled
                    : styles.statusConfirmed
                }`}
              >
                {order.status || "Confirmed"}
              </span>
            </div>

            {/* Tracker */}
            <div className={styles.trackerBox}>
              <div className={styles.trackerStep}>
                <div
                  className={`${styles.trackerDot} ${
                    activeStep >= 1 ? styles.trackerDotActive : ""
                  }`}
                />
                <span
                  className={`${styles.trackerLabel} ${
                    activeStep >= 1 ? styles.trackerLabelActive : ""
                  }`}
                >
                  1. Order Placed
                </span>
              </div>
              <div className={styles.trackerStep}>
                <div
                  className={`${styles.trackerDot} ${
                    activeStep >= 2 ? styles.trackerDotActive : ""
                  }`}
                />
                <span
                  className={`${styles.trackerLabel} ${
                    activeStep >= 2 ? styles.trackerLabelActive : ""
                  }`}
                >
                  2. {order.status?.toLowerCase() === "processing" ? "Processing" : "Confirmed"}
                </span>
              </div>
              <div className={styles.trackerStep}>
                <div
                  className={`${styles.trackerDot} ${
                    activeStep >= 3 ? styles.trackerDotActive : ""
                  }`}
                />
                <span
                  className={`${styles.trackerLabel} ${
                    activeStep >= 3 ? styles.trackerLabelActive : ""
                  }`}
                >
                  3. Shipped / In Transit
                </span>
              </div>
              <div className={styles.trackerStep}>
                <div
                  className={`${styles.trackerDot} ${
                    activeStep >= 4 ? styles.trackerDotActive : ""
                  }`}
                />
                <span
                  className={`${styles.trackerLabel} ${
                    activeStep >= 4 ? styles.trackerLabelActive : ""
                  }`}
                >
                  4. {order.status?.toLowerCase() === "reached" ? "Reached" : "Delivered"}
                </span>
              </div>
            </div>

            {/* Return / Exchange Policy Banner */}
            {returnSuccessMsg && (
              <div
                style={{
                  background: "#ecfdf5",
                  border: "1px solid #10b981",
                  padding: "14px 18px",
                  marginBottom: "24px",
                  color: "#065f46",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>✓ {returnSuccessMsg}</span>
                <button
                  onClick={() => setReturnSuccessMsg("")}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: "#065f46",
                  }}
                >
                  &times;
                </button>
              </div>
            )}

            {existingReturn ? (
              <div className={styles.detailCard} style={{ background: "#fbfbfb", marginBottom: "28px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: "12px",
                    marginBottom: "14px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        background: existingReturn.type === "exchange" ? "#111111" : "#4f46e5",
                        color: "#ffffff",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        marginRight: "10px",
                        textTransform: "uppercase",
                      }}
                    >
                      {existingReturn.type} Requested
                    </span>
                    <strong style={{ fontSize: "13px" }}>Ref: {existingReturn.id}</strong>
                  </div>

                  <span
                    style={{
                      padding: "3px 10px",
                      background:
                        existingReturn.status === "approved" || existingReturn.status === "completed"
                          ? "#ecfdf5"
                          : existingReturn.status === "rejected"
                          ? "#fee2e2"
                          : "#fef3c7",
                      color:
                        existingReturn.status === "approved" || existingReturn.status === "completed"
                          ? "#065f46"
                          : existingReturn.status === "rejected"
                          ? "#991b1b"
                          : "#92400e",
                      fontWeight: 700,
                      fontSize: "11px",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    ● {existingReturn.status.replace("_", " ")}
                  </span>
                </div>

                <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.5, margin: "0 0 8px" }}>
                  <strong>Reason:</strong> {existingReturn.reason_category}
                  {existingReturn.customer_notes ? ` — "${existingReturn.customer_notes}"` : ""}
                </p>

                {existingReturn.items && existingReturn.items.length > 0 && (
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>
                    <strong>Items:</strong>{" "}
                    {existingReturn.items.map((it: any, i: number) => (
                      <span key={i}>
                        {it.name} (Current: {it.size || "M"}
                        {it.exchange_size ? ` → Desired: ${it.exchange_size}` : ""})
                        {i < existingReturn.items.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.policyBanner}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "#111827" }}>
                      3-DAY EXCHANGE &amp; RETURN POLICY
                    </span>
                    {isEligible ? (
                      <span className={styles.policyBadgeActive}>
                        ● Active · {daysLeft} Day{daysLeft > 1 ? "s" : ""} ({hoursLeft}h) left
                      </span>
                    ) : isDelivered ? (
                      <span className={styles.policyBadgeInactive}>Policy Expired</span>
                    ) : (
                      <span className={styles.policyBadgeInactive}>Available upon delivery</span>
                    )}
                  </div>

                  <p style={{ margin: 0, fontSize: "12.5px", color: "#6b7280", lineHeight: 1.5, maxWidth: "620px" }}>
                    {isEligible
                      ? "Need a different size or wish to return? Streetwear drops are eligible for complimentary size exchanges or returns within 3 days of delivery."
                      : isDelivered
                      ? "The 3-day post-delivery exchange and return window for this order has expired."
                      : "Exchange and return options will become available for 3 days as soon as your package is reached / delivered."}
                  </p>
                </div>

                {isEligible && (
                  <div className={styles.policyActions}>
                    <button type="button" onClick={() => openReturnModal("exchange")} className={styles.policyBtnDark}>
                      Request Exchange
                    </button>
                    <button type="button" onClick={() => openReturnModal("return")} className={styles.policyBtnLight}>
                      Request Return
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Details Two-column Grid */}
            <div className={styles.detailsGrid}>
              <div>
                {/* Items Card */}
                <div className={styles.detailCard}>
                  <h3 className={styles.detailCardTitle}>
                    Ordered Items ({items.length})
                  </h3>

                  {items.length === 0 ? (
                    <div style={{ padding: "20px 0", color: "#6b7280", fontSize: "13px" }}>
                      Piece details synchronizing with warehouse fulfillment...
                    </div>
                  ) : (
                    items.map((item, idx) => {
                      const itName = (item as any).name || item.product_name || "Streetwear Piece";
                      let unitPrice = parsePrice((item as any).price ?? item.product_price);
                      const itemQty = Number(item.quantity) || 1;
                      if (unitPrice === 0 && order?.subtotal) {
                        const totalUnits = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
                        unitPrice = Math.round(parsePrice(order.subtotal) / (totalUnits || 1));
                      }
                      const itemTotal = unitPrice * itemQty;

                      return (
                        <div className={styles.itemRow} key={item.id || idx}>
                          <img
                            src={(item as any).image || "/black-tee.jfif"}
                            alt={itName}
                            className={styles.itemThumb}
                          />

                          <div className={styles.itemDetails}>
                            <p className={styles.itemTitle}>{itName}</p>
                            <p className={styles.itemSub}>
                              Qty: {itemQty}
                              {(item as any).size ? ` · Size: ${(item as any).size}` : ""}
                              {(item as any).color ? ` · Color: ${(item as any).color}` : ""}
                            </p>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <span className={styles.itemPriceText}>
                              ₹{itemTotal.toLocaleString("en-IN")}
                            </span>
                            {itemQty > 1 && (
                              <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                                ₹{unitPrice.toLocaleString("en-IN")} each
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Shipping Address Card */}
                {address && (
                  <div className={styles.detailCard}>
                    <h3 className={styles.detailCardTitle}>Shipping Address</h3>
                    <div style={{ fontSize: "13.5px", color: "#374151", lineHeight: 1.6 }}>
                      <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#111827" }}>
                        {address.full_name || address.fullName || address.name || "Valued Customer"}
                      </p>
                      {(address.address_line1 || address.address) && (
                        <p style={{ margin: "0 0 2px" }}>
                          {address.address_line1 || address.address}
                        </p>
                      )}
                      {[address.city, address.state].filter(Boolean).length > 0 && (
                        <p style={{ margin: "0 0 2px" }}>
                          {[address.city, address.state].filter(Boolean).join(", ")}
                          {address.postal_code || address.pincode ? ` - ${address.postal_code || address.pincode}` : ""}
                        </p>
                      )}
                      <p style={{ margin: "0 0 2px" }}>{address.country || "India"}</p>
                      {(address.phone || (order as any).customer?.phone) && (
                        <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: "12.5px" }}>
                          Phone: {address.phone || (order as any).customer?.phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary Column */}
              <aside>
                <div className={styles.detailCard}>
                  <h3 className={styles.detailCardTitle}>Order Summary</h3>

                  <div className={styles.summaryRowItem}>
                    <span>Order ID</span>
                    <strong className={styles.summaryRowVal}>{order.id}</strong>
                  </div>

                  <div className={styles.summaryRowItem}>
                    <span>Date Placed</span>
                    <span className={styles.summaryRowVal}>
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className={styles.summaryRowItem}>
                    <span>Payment Method</span>
                    <span className={styles.summaryRowVal}>{order.payment_method}</span>
                  </div>

                  <div className={styles.summaryRowItem}>
                    <span>Payment Status</span>
                    <span className={styles.summaryRowVal} style={{ textTransform: "capitalize" }}>
                      {order.payment_status || "Pending"}
                    </span>
                  </div>

                  <div style={{ margin: "14px 0", borderTop: "1px solid #f3f4f6" }} />

                  <div className={styles.summaryRowItem}>
                    <span>Subtotal</span>
                    <span className={styles.summaryRowVal}>
                      ₹{parsePrice(order.subtotal).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {parsePrice((order as any).discount) > 0 && (
                    <div className={styles.summaryRowItem} style={{ color: "#059669" }}>
                      <span>Discount</span>
                      <span style={{ fontWeight: 600 }}>
                        -₹{parsePrice((order as any).discount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div className={styles.summaryRowItem}>
                    <span>Delivery</span>
                    <span className={styles.summaryRowVal}>
                      {parsePrice(order.shipping) === 0
                        ? "FREE"
                        : `₹${parsePrice(order.shipping).toLocaleString("en-IN")}`}
                    </span>
                  </div>

                  <div className={styles.summaryTotalRow}>
                    <span>Total</span>
                    <span>₹{parsePrice(order.total).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className={styles.detailCard} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "12.5px", color: "#6b7280", margin: "0 0 14px", lineHeight: 1.5 }}>
                    Need assistance or return pickup details? Our concierge team is here to help.
                  </p>
                  <Link
                    href="/account?tab=orders"
                    className={styles.saveButton}
                    style={{ display: "block", textAlign: "center", textDecoration: "none" }}
                  >
                    Back to Order History
                  </Link>
                </div>
              </aside>
            </div>
          </section>
        </div>

        {/* ==================== RETURN / EXCHANGE REQUEST MODAL ==================== */}
        {isReturnModalOpen && (
          <div
            className={styles.modalOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsReturnModalOpen(false);
            }}
          >
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <div>
                  <span className={styles.modalSuperTitle}>
                    GREENO ASSURANCE · 3-DAY POLICY
                  </span>
                  <h2 className={styles.modalTitle}>
                    {returnModalType === "exchange"
                      ? "Request Size Exchange"
                      : "Request Return & Refund"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className={styles.modalCloseBtn}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmitReturn}>
                {/* Item Selection */}
                <div className={styles.modalFieldGroup}>
                  <label className={styles.modalLabel}>
                    Select Items to {returnModalType === "exchange" ? "Exchange" : "Return"}
                  </label>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {items.map((it, idx) => {
                      const itId = it.id || it.product_id || String(idx);
                      const isChecked = selectedItemIds.includes(itId);
                      const itName = (it as any).name || it.product_name || "Streetwear Piece";
                      const itSize = (it as any).size || "M";

                      return (
                        <div
                          key={itId}
                          className={`${styles.modalItemCard} ${
                            isChecked ? styles.modalItemCardSelected : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItemIds([...selectedItemIds, itId]);
                              } else {
                                setSelectedItemIds(selectedItemIds.filter((id) => id !== itId));
                              }
                            }}
                            style={{ width: "16px", height: "16px", cursor: "pointer", flexShrink: 0 }}
                          />

                          <img
                            src={(it as any).image || "/black-tee.jfif"}
                            alt={itName}
                            className={styles.modalItemThumb}
                          />

                          <div className={styles.modalItemInfo}>
                            <p className={styles.modalItemName}>{itName}</p>
                            <p className={styles.modalItemSub}>
                              Current Size: <strong>{itSize}</strong>
                            </p>
                          </div>

                          {returnModalType === "exchange" && isChecked && (
                            <div className={styles.modalExchangeRow}>
                              <label style={{ fontSize: "10px", fontWeight: 700, color: "#666" }}>
                                NEW:
                              </label>
                              <select
                                value={exchangeSizes[itId] || (itSize === "M" ? "L" : "M")}
                                onChange={(e) =>
                                  setExchangeSizes({
                                    ...exchangeSizes,
                                    [itId]: e.target.value,
                                  })
                                }
                                style={{
                                  padding: "5px 8px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  border: "1px solid #111",
                                  background: "#fff",
                                  borderRadius: "0px",
                                }}
                              >
                                {["XS", "S", "M", "L", "XL", "XXL"].map((sz) => (
                                  <option key={sz} value={sz} disabled={sz === itSize}>
                                    {sz} {sz === itSize ? "(Current)" : ""}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reason Selection */}
                <div className={styles.modalFieldGroup}>
                  <label className={styles.modalLabel}>
                    Reason for {returnModalType === "exchange" ? "Exchange" : "Return"}
                  </label>
                  <select
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    className={styles.modalSelect}
                  >
                    <option value="Size too small">Size too small</option>
                    <option value="Size too large">Size too large</option>
                    <option value="Defective / Damaged product">
                      Defective / Damaged product
                    </option>
                    <option value="Received incorrect item">Received incorrect item</option>
                    <option value="Quality not as expected">Quality not as expected</option>
                    <option value="Changed mind / No longer needed">
                      Changed mind / No longer needed
                    </option>
                    <option value="Other">Other reason</option>
                  </select>
                </div>

                {/* Additional Notes */}
                <div className={styles.modalFieldGroup}>
                  <label className={styles.modalLabel}>
                    Additional Notes / Feedback (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Specify details, defects, or instructions for the warehouse team..."
                    className={styles.modalTextarea}
                  />
                </div>

                {/* Reverse Pickup Address */}
                <div className={styles.modalFieldGroup} style={{ marginBottom: "24px" }}>
                  <label className={styles.modalLabel}>
                    Reverse Pickup Address
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Complete address for courier reverse pickup"
                    className={styles.modalInput}
                  />
                  <span className={styles.modalHelpText}>
                    Our logistics partner will collect the parcel from this address within 24–48 hours of approval.
                  </span>
                </div>

                {/* Modal Buttons */}
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => setIsReturnModalOpen(false)}
                    className={styles.modalCancelBtn}
                  >
                    CANCEL
                  </button>

                  <button
                    type="submit"
                    disabled={submittingReturn || selectedItemIds.length === 0}
                    className={styles.modalSubmitBtn}
                  >
                    {submittingReturn
                      ? "SUBMITTING REQUEST..."
                      : returnModalType === "exchange"
                      ? "SUBMIT EXCHANGE REQUEST"
                      : "SUBMIT RETURN REQUEST"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function getStepActiveIndex(status: string): number {
  switch (status.toLowerCase()) {
    case "cancelled":
      return 0;
    case "reached":
    case "delivered":
      return 4;
    case "shipped":
      return 3;
    case "processing":
      return 2;
    default:
      return 1;
  }
}
