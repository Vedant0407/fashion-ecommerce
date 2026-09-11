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

  // Helper to find order in local storage
  function findLocalOrder(id: string): any | null {
    if (typeof window === "undefined") return null;
    try {
      const cleanId = (id || "").trim().toLowerCase();
      const rawLast = localStorage.getItem("greeno_last_order");
      if (rawLast) {
        const parsed = JSON.parse(rawLast);
        if (parsed?.id && parsed.id.trim().toLowerCase() === cleanId) return parsed;
      }
      const rawCustomer = localStorage.getItem("greeno_customer_orders");
      if (rawCustomer) {
        const list = JSON.parse(rawCustomer);
        const match = Array.isArray(list)
          ? list.find((o: any) => o?.id && o.id.trim().toLowerCase() === cleanId)
          : null;
        if (match) return match;
      }
      const rawAll = localStorage.getItem("greeno_all_orders");
      if (rawAll) {
        const list = JSON.parse(rawAll);
        const match = Array.isArray(list)
          ? list.find((o: any) => o?.id && o.id.trim().toLowerCase() === cleanId)
          : null;
        if (match) return match;
      }
    } catch {}
    return null;
  }

  useEffect(() => {
    if (!orderId) return;

    // 1. Immediately render locally cached order if available
    const cachedOrder = findLocalOrder(orderId);
    if (cachedOrder) {
      setOrder(cachedOrder);
      setItems(cachedOrder.items || []);
      setLoading(false);
    }

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

        const storedEmail =
          typeof window !== "undefined"
            ? localStorage.getItem("greeno_user_email")
            : null;

        if (!user && !storedEmail && !cachedOrder) {
          router.push("/login");
          return;
        }

        // 1. Fetch via API route
        try {
          const res = await fetch(`/api/orders/${orderId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.order) {
              const currentCached = findLocalOrder(orderId) || cachedOrder;

              // Ensure real items are never wiped out by a hollow server order
              const resolvedItems =
                Array.isArray(data.order.items) && data.order.items.length > 0
                  ? data.order.items
                  : Array.isArray(currentCached?.items) && currentCached.items.length > 0
                  ? currentCached.items
                  : [];

              const resolvedCustomer =
                data.order.customer?.address ||
                (data.order.customer?.fullName &&
                  data.order.customer.fullName !== "Customer")
                  ? data.order.customer
                  : currentCached?.customer || data.order.customer;

              const resolvedAddresses =
                data.order.addresses?.address_line1 ||
                (data.order.addresses?.full_name &&
                  data.order.addresses.full_name !== "Customer")
                  ? data.order.addresses
                  : currentCached?.addresses ||
                    currentCached?.customer ||
                    data.order.addresses;

              const resolvedSubtotal =
                data.order.subtotal > 0
                  ? data.order.subtotal
                  : currentCached?.subtotal || 0;

              const resolvedTotal =
                data.order.total > 0
                  ? data.order.total
                  : currentCached?.total || 0;

              const mergedOrder = {
                ...currentCached,
                ...data.order,
                items: resolvedItems,
                customer: resolvedCustomer,
                addresses: resolvedAddresses,
                subtotal: resolvedSubtotal,
                total: resolvedTotal,
              };

              setOrder(mergedOrder);
              setItems(resolvedItems);
              setLoading(false);

              // If server was missing items but client has them, heal server immediately
              if (
                (!data.order.items || data.order.items.length === 0) &&
                resolvedItems.length > 0
              ) {
                fetch(`/api/orders/${orderId}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ order: mergedOrder }),
                }).catch(() => {});
              }

              // Update local cache
              try {
                const updateLocalList = (key: string) => {
                  const raw = localStorage.getItem(key);
                  if (raw) {
                    const list = JSON.parse(raw);
                    if (Array.isArray(list)) {
                      const updated = list.map((o: any) =>
                        o.id === data.order.id ? { ...o, ...mergedOrder } : o
                      );
                      localStorage.setItem(key, JSON.stringify(updated));
                    }
                  }
                };
                updateLocalList("greeno_customer_orders");
                updateLocalList("greeno_all_orders");
                const rawLast = localStorage.getItem("greeno_last_order");
                if (rawLast) {
                  const last = JSON.parse(rawLast);
                  if (last?.id === data.order.id) {
                    localStorage.setItem(
                      "greeno_last_order",
                      JSON.stringify({ ...last, ...mergedOrder })
                    );
                  }
                }
              } catch {}
              return;
            }
          }
        } catch (apiErr) {
          console.warn("Order details API fetch warning:", apiErr);
        }

        // 2. Direct Supabase fallback
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            orderId
          );
        if (user && isUuid) {
          try {
            const supabase = createClient();
            const { data: orderData } = await supabase
              .from("orders")
              .select(
                "id, address_id, status, subtotal, shipping, total, payment_status, payment_method, created_at, addresses(*)"
              )
              .eq("id", orderId)
              .eq("user_id", user.id)
              .maybeSingle();

            if (orderData) {
              const { data: itemsData } = await supabase
                .from("order_items")
                .select("id, product_id, product_name, product_price, quantity")
                .eq("order_id", orderId);

              const mergedOrder = {
                ...cachedOrder,
                ...orderData,
                items:
                  itemsData && itemsData.length > 0
                    ? itemsData
                    : cachedOrder?.items || [],
              };
              setOrder(mergedOrder);
              setItems(mergedOrder.items || []);
              setLoading(false);
              return;
            }
          } catch {}
        }

        if (cachedOrder) {
          setOrder(cachedOrder);
          setItems(cachedOrder.items || []);
          setLoading(false);

          fetch(`/api/orders/${orderId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: cachedOrder }),
          }).catch(() => {});
          return;
        }

        setError("Order not found.");
      } catch (err) {
        console.error("ORDER DETAILS ERROR:", err);
        if (cachedOrder) {
          setOrder(cachedOrder);
          setItems(cachedOrder.items || []);
        } else {
          setError("Something went wrong while loading the order.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();

    // Fetch any return or exchange request for this order
    try {
      const rawReturns = localStorage.getItem("greeno_returns");
      if (rawReturns) {
        const list = JSON.parse(rawReturns);
        const match = Array.isArray(list)
          ? list.find((r: any) => r.order_id === orderId)
          : null;
        if (match) setExistingReturn(match);
      }

      fetch(`/api/returns?order_id=${encodeURIComponent(orderId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.returns) && data.returns.length > 0) {
            setExistingReturn(data.returns[0]);
            try {
              const raw = localStorage.getItem("greeno_returns");
              const list = raw ? JSON.parse(raw) : [];
              const filtered = list.filter((r: any) => r.id !== data.returns[0].id);
              filtered.unshift(data.returns[0]);
              localStorage.setItem("greeno_returns", JSON.stringify(filtered));
            } catch {}
          }
        })
        .catch(() => {});
    } catch {}

    function handleStorageChange() {
      const refreshed = findLocalOrder(orderId);
      if (refreshed) {
        setOrder(refreshed);
        if (refreshed.items?.length) setItems(refreshed.items);
      }
      try {
        const rawReturns = localStorage.getItem("greeno_returns");
        if (rawReturns) {
          const list = JSON.parse(rawReturns);
          const match = Array.isArray(list)
            ? list.find((r: any) => r.order_id === orderId)
            : null;
          if (match) setExistingReturn(match);
        }
      } catch {}
    }

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("greeno_order_updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("greeno_order_updated", handleStorageChange);
    };
  }, [orderId, router]);

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

  const getStepActiveIndex = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "delivered" || s === "reached") return 4;
    if (s === "shipped") return 3;
    if (s === "confirmed" || s === "processing") return 2;
    return 1;
  };

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
            product_id: it.product_id || it.id,
            name: (it as any).name || it.product_name || "Streetwear Piece",
            price: parsePrice((it as any).price ?? it.product_price),
            quantity: Number(it.quantity) || 1,
            size: (it as any).size || "M",
            color: (it as any).color || "",
            image: (it as any).image || "",
            exchange_size: returnModalType === "exchange" ? exchangeSizes[itId] || "L" : undefined,
            reason: reasonCategory,
          };
        });

      const customerObj = {
        fullName:
          order?.addresses?.full_name ||
          (order as any)?.customer?.fullName ||
          "Customer",
        email:
          (order as any)?.customer?.email ||
          (typeof window !== "undefined"
            ? localStorage.getItem("greeno_user_email") || ""
            : ""),
        phone:
          order?.addresses?.phone || (order as any)?.customer?.phone || "",
        address:
          pickupAddress ||
          order?.addresses?.address_line1 ||
          (order as any)?.customer?.address ||
          "",
        city: order?.addresses?.city || (order as any)?.customer?.city || "",
        state: order?.addresses?.state || (order as any)?.customer?.state || "",
        pincode:
          order?.addresses?.postal_code ||
          (order as any)?.customer?.pincode ||
          "",
      };

      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          type: returnModalType,
          customer: customerObj,
          items: chosenItems,
          reason_category: reasonCategory,
          customer_notes: customerNotes,
          pickup_address: pickupAddress || customerObj.address,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit return request.");
      }

      setExistingReturn(data.request);

      try {
        const raw = localStorage.getItem("greeno_returns");
        const list = raw ? JSON.parse(raw) : [];
        const filtered = list.filter((r: any) => r.id !== data.request.id);
        filtered.unshift(data.request);
        localStorage.setItem("greeno_returns", JSON.stringify(filtered));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(
          new CustomEvent("greeno_order_updated", { detail: { returnReq: data.request } })
        );
      } catch {}

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
            <span className={styles.stepLabel}>
              2. {order.status?.toLowerCase() === "processing" ? "PROCESSING" : "CONFIRMED"}
            </span>
          </div>

          <div className={`${styles.step} ${activeStep >= 3 ? styles.stepActive : ""}`}>
            <div className={styles.stepDot} />
            <span className={styles.stepLabel}>3. SHIPPED / IN TRANSIT</span>
          </div>

          <div className={`${styles.step} ${activeStep >= 4 ? styles.stepActive : ""}`}>
            <div className={styles.stepDot} />
            <span className={styles.stepLabel}>
              4. {order.status?.toLowerCase() === "reached" ? "REACHED" : "DELIVERED"}
            </span>
          </div>
        </div>

        {/* ==================== 3-DAY EXCHANGE & RETURN POLICY SECTION ==================== */}
        {returnSuccessMsg && (
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #10b981",
              padding: "16px 20px",
              marginBottom: "30px",
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
          <div
            style={{
              background: "#fafafa",
              border: "1px solid #000000",
              padding: "24px 28px",
              marginBottom: "36px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                borderBottom: "1px solid #e5e5e5",
                paddingBottom: "14px",
                marginBottom: "16px",
              }}
            >
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    background: existingReturn.type === "exchange" ? "#000000" : "#4f46e5",
                    color: "#ffffff",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    marginRight: "10px",
                  }}
                >
                  {existingReturn.type.toUpperCase()} REQUESTED
                </span>
                <strong style={{ fontSize: "13px" }}>REF: {existingReturn.id}</strong>
              </div>

              <div
                style={{
                  padding: "4px 12px",
                  background:
                    existingReturn.status === "approved"
                      ? "#ecfdf5"
                      : existingReturn.status === "completed"
                      ? "#dcfce7"
                      : existingReturn.status === "rejected"
                      ? "#fee2e2"
                      : "#fef3c7",
                  color:
                    existingReturn.status === "approved"
                      ? "#065f46"
                      : existingReturn.status === "completed"
                      ? "#15803d"
                      : existingReturn.status === "rejected"
                      ? "#991b1b"
                      : "#92400e",
                  fontWeight: 700,
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                ● {existingReturn.status.replace("_", " ")}
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.6, margin: "0 0 10px" }}>
              <strong>Reason:</strong> {existingReturn.reason_category}
              {existingReturn.customer_notes ? ` — "${existingReturn.customer_notes}"` : ""}
            </p>

            {existingReturn.items && existingReturn.items.length > 0 && (
              <div style={{ fontSize: "12px", color: "#555", marginTop: "8px" }}>
                <strong>Items:</strong>{" "}
                {existingReturn.items.map((it: any, i: number) => (
                  <span key={i}>
                    {it.name} (Current: {it.size || "M"}
                    {it.exchange_size ? ` → Desired Exchange: ${it.exchange_size}` : ""})
                    {i < existingReturn.items.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: "14px",
                fontSize: "11px",
                color: "#888",
                borderTop: "1px solid #eee",
                paddingTop: "12px",
              }}
            >
              Pickup Address: {existingReturn.pickup_address || "On file"} • Requested on{" "}
              {new Date(existingReturn.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        ) : (
          <div
            style={{
              background: isEligible ? "#fafaf8" : "#fdfdfc",
              border: `1px solid ${isEligible ? "#111" : "#e5e5e0"}`,
              padding: "24px 28px",
              marginBottom: "36px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      color: isEligible ? "#111" : "#777",
                    }}
                  >
                    3-DAY EXCHANGE &amp; RETURN POLICY
                  </span>
                  {isEligible ? (
                    <span
                      style={{
                        background: "#ecfdf5",
                        color: "#065f46",
                        fontSize: "10px",
                        padding: "2px 8px",
                        fontWeight: 700,
                        borderRadius: "2px",
                      }}
                    >
                      ● ACTIVE · {daysLeft} DAY{daysLeft > 1 ? "S" : ""} ({hoursLeft}H) LEFT
                    </span>
                  ) : isDelivered ? (
                    <span
                      style={{
                        background: "#f3f4f6",
                        color: "#6b7280",
                        fontSize: "10px",
                        padding: "2px 8px",
                        fontWeight: 600,
                      }}
                    >
                      POLICY EXPIRED (3 DAYS POST DELIVERY)
                    </span>
                  ) : (
                    <span
                      style={{
                        background: "#fef3c7",
                        color: "#92400e",
                        fontSize: "10px",
                        padding: "2px 8px",
                        fontWeight: 600,
                      }}
                    >
                      AVAILABLE UPON ORDER DELIVERY
                    </span>
                  )}
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#555",
                    lineHeight: 1.5,
                    maxWidth: "680px",
                  }}
                >
                  {isEligible
                    ? "Need a different size or wish to return? Orders are eligible for complimentary size exchanges or returns within 3 days of delivery."
                    : isDelivered
                    ? "The 3-day post-delivery exchange and return window for this order has expired. Items can no longer be exchanged or returned."
                    : "Your order is en route. Exchange and return options will be available for 3 days as soon as your package is reached / delivered."}
                </p>
              </div>

              {isEligible && (
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => openReturnModal("exchange")}
                    style={{
                      background: "#000000",
                      color: "#ffffff",
                      border: "1px solid #000000",
                      padding: "10px 18px",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    REQUEST EXCHANGE
                  </button>

                  <button
                    onClick={() => openReturnModal("return")}
                    style={{
                      background: "#ffffff",
                      color: "#000000",
                      border: "1px solid #000000",
                      padding: "10px 18px",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    REQUEST RETURN
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.detailsGrid}>
          <div>
            {/* Items Box */}
            <div className={styles.sectionBox}>
              <h2 className={styles.sectionTitle}>
                ORDERED ITEMS ({items.length})
              </h2>

              {items.length === 0 ? (
                <div
                  style={{
                    padding: "24px",
                    background: "#f9f9f9",
                    border: "1px dashed #ddd",
                    textAlign: "center",
                    color: "#666",
                  }}
                >
                  <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: "13px", letterSpacing: "0.08em" }}>
                    PIECE DETAILS SYNCHRONIZING
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
                    Your streetwear drop is confirmed with warehouse fulfillment.
                  </p>
                </div>
              ) : (
                items.map((item, idx) => {
                  const itName =
                    (item as any).name || item.product_name || "Streetwear Piece";
                  let unitPrice = parsePrice(
                    (item as any).price ?? item.product_price
                  );
                  const itemQty = Number(item.quantity) || 1;

                  // If unitPrice is missing or 0, fallback from order subtotal
                  if (unitPrice === 0 && order?.subtotal) {
                    const totalUnits = items.reduce(
                      (sum, it) => sum + (Number(it.quantity) || 1),
                      0
                    );
                    unitPrice = Math.round(
                      parsePrice(order.subtotal) / (totalUnits || 1)
                    );
                  }

                  const itemTotal = unitPrice * itemQty;

                  return (
                    <div className={styles.orderItem} key={item.id || idx}>
                      <img
                        src={(item as any).image || "/black-tee.jfif"}
                        alt={itName}
                        className={styles.itemImage}
                      />

                      <div className={styles.itemInfo}>
                        <p className={styles.itemName}>{itName}</p>
                        <p className={styles.itemMeta}>
                          Quantity: {itemQty}
                          {(item as any).size ? ` · Size: ${(item as any).size}` : ""}
                          {(item as any).color
                            ? ` · Color: ${(item as any).color}`
                            : ""}
                        </p>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span className={styles.itemPrice}>
                          ₹{itemTotal.toLocaleString("en-IN")}
                        </span>
                        {itemQty > 1 && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#888",
                              marginTop: "2px",
                            }}
                          >
                            ₹{unitPrice.toLocaleString("en-IN")} each
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Shipping Address Box */}
            {address && (
              <div className={styles.sectionBox}>
                <h2 className={styles.sectionTitle}>SHIPPING ADDRESS</h2>
                <p
                  style={{
                    margin: "0 0 6px",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  {address.full_name ||
                    address.fullName ||
                    address.name ||
                    "Valued Customer"}
                </p>
                {(address.address_line1 || address.address) && (
                  <p
                    style={{ margin: "0 0 4px", fontSize: "13px", color: "#555" }}
                  >
                    {address.address_line1 || address.address}
                  </p>
                )}
                {[address.city, address.state].filter(Boolean).length > 0 && (
                  <p
                    style={{ margin: "0 0 4px", fontSize: "13px", color: "#555" }}
                  >
                    {[address.city, address.state].filter(Boolean).join(", ")}
                    {address.postal_code || address.pincode
                      ? ` - ${address.postal_code || address.pincode}`
                      : ""}
                  </p>
                )}
                <p
                  style={{ margin: "0 0 4px", fontSize: "13px", color: "#555" }}
                >
                  {address.country || "India"}
                </p>
                {(address.phone || (order as any).customer?.phone) && (
                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: "12px",
                      color: "#777",
                    }}
                  >
                    Contact Phone:{" "}
                    {address.phone || (order as any).customer?.phone}
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
                <span style={{ color: "#777" }}>DATE PLACED</span>
                <span>
                  {new Date(order.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {" at "}
                  {new Date(order.created_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
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
                <span>₹{parsePrice(order.subtotal).toLocaleString("en-IN")}</span>
              </div>

              {parsePrice((order as any).discount) > 0 && (
                <div className={styles.summaryRow} style={{ color: "#16a34a" }}>
                  <span>DISCOUNT</span>
                  <span>-₹{parsePrice((order as any).discount).toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className={styles.summaryRow}>
                <span style={{ color: "#777" }}>DELIVERY</span>
                <span>
                  {parsePrice(order.shipping) === 0
                    ? "FREE"
                    : `₹${parsePrice(order.shipping).toLocaleString("en-IN")}`}
                </span>
              </div>

              <div className={styles.summaryTotal}>
                <span>TOTAL</span>
                <span>₹{parsePrice(order.total).toLocaleString("en-IN")}</span>
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

        {/* ==================== RETURN / EXCHANGE REQUEST MODAL ==================== */}
        {isReturnModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsReturnModalOpen(false);
            }}
          >
            <div
              style={{
                background: "#ffffff",
                maxWidth: "600px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                border: "1px solid #111111",
                padding: "32px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderBottom: "1px solid #eeeeee",
                  paddingBottom: "16px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.15em",
                      fontWeight: 700,
                      color: "#666",
                    }}
                  >
                    GREENO ASSURANCE · 3-DAY POLICY
                  </span>
                  <h2
                    style={{
                      margin: "4px 0 0",
                      fontSize: "18px",
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {returnModalType === "exchange"
                      ? "Request Size Exchange"
                      : "Request Return & Refund"}
                  </h2>
                </div>
                <button
                  onClick={() => setIsReturnModalOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    lineHeight: 1,
                    cursor: "pointer",
                    color: "#666",
                  }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmitReturn}>
                {/* Item Selection */}
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
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
                          style={{
                            border: `1px solid ${isChecked ? "#000" : "#eee"}`,
                            padding: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            background: isChecked ? "#fafafa" : "#fff",
                          }}
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
                            style={{ width: "16px", height: "16px", cursor: "pointer" }}
                          />

                          <img
                            src={(it as any).image || "/black-tee.jfif"}
                            alt={itName}
                            style={{
                              width: "44px",
                              height: "44px",
                              objectFit: "cover",
                              background: "#eee",
                            }}
                          />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "12px",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {itName}
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#666" }}>
                              Current Size: <strong>{itSize}</strong>
                            </p>
                          </div>

                          {returnModalType === "exchange" && isChecked && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <label style={{ fontSize: "10px", fontWeight: 700, color: "#666" }}>
                                NEW SIZE:
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
                                  padding: "4px 8px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  border: "1px solid #111",
                                  background: "#fff",
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
                <div style={{ marginBottom: "18px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    Reason for {returnModalType === "exchange" ? "Exchange" : "Return"}
                  </label>
                  <select
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #ccc",
                      fontSize: "13px",
                      background: "#fff",
                    }}
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
                <div style={{ marginBottom: "18px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    Additional Notes / Feedback (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Specify details, defects, or instructions for the warehouse team..."
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #ccc",
                      fontSize: "13px",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* Reverse Pickup Address */}
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    Reverse Pickup Address
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Complete address for courier reverse pickup"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #ccc",
                      fontSize: "13px",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "#777", marginTop: "4px", display: "block" }}>
                    Our logistics partner will collect the parcel from this address within 24–48 hours of approval.
                  </span>
                </div>

                {/* Modal Buttons */}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setIsReturnModalOpen(false)}
                    style={{
                      background: "#f4f4f5",
                      border: "1px solid #e4e4e7",
                      padding: "12px 20px",
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      cursor: "pointer",
                      color: "#333",
                    }}
                  >
                    CANCEL
                  </button>

                  <button
                    type="submit"
                    disabled={submittingReturn || selectedItemIds.length === 0}
                    style={{
                      background: selectedItemIds.length === 0 ? "#888" : "#000",
                      color: "#fff",
                      border: "1px solid #000",
                      padding: "12px 24px",
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      cursor: selectedItemIds.length === 0 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
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