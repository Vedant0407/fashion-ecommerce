"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, User, Wallet, LogOut, Check, Pencil, MapPin } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { formatShortOrderId } from "@/lib/order-utils";
import styles from "./account.module.css";

type TabKey = "account" | "orders" | "address" | "wallet";

interface OrderItemSummary {
  id?: string;
  product_id?: string;
  name?: string;
  product_name?: string;
  price?: number;
  quantity?: number;
  image?: string;
  size?: string;
  color?: string;
}

interface OrderSummary {
  id: string;
  created_at: string;
  status: string;
  total: number;
  subtotal?: number;
  shipping?: number;
  payment_method?: string;
  payment_status?: string;
  items?: OrderItemSummary[];
  customer?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabKey | null;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("account");

  // Sync tab with URL search parameter
  useEffect(() => {
    if (tabParam && ["orders", "address", "wallet", "account"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    router.replace(`/account?tab=${tab}`, { scroll: false });
  }

  // User Profile
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");

  // Edit State for Account Details
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Address State
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    async function loadAccount() {
      try {
        let authEmail = "";
        let authName = "";
        let authPhone = "";

        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            authEmail = user.email || "";
            authName =
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              "";
            authPhone = user.phone || user.user_metadata?.phone || "";
          }
        } catch {}

        if (typeof window !== "undefined") {
          const localEmail = localStorage.getItem("greeno_user_email");
          const localName = localStorage.getItem("greeno_user_name");
          const localPhone = localStorage.getItem("greeno_user_phone");

          if (!authEmail && localEmail) authEmail = localEmail;
          if (!authName && localName) authName = localName;
          if (!authPhone && localPhone) authPhone = localPhone;
        }

        if (!authEmail) {
          router.push("/login");
          return;
        }

        const cleanEmail = authEmail.trim().toLowerCase();
        const displayName = authName || cleanEmail.split("@")[0];

        // Ensure session cookie is refreshed and synchronized
        if (typeof document !== "undefined") {
          document.cookie = `greeno_session=${encodeURIComponent(cleanEmail)}; path=/; max-age=2592000; SameSite=Lax`;
        }

        setUserEmail(cleanEmail);
        setUserName(displayName);
        setEditName(displayName);

        // Try to retrieve phone and address from recent order or saved address
        let detectedPhone = authPhone;
        let detectedAddress = {
          fullName: displayName,
          phone: authPhone,
          address: "",
          city: "",
          state: "",
          pincode: "",
        };

        if (typeof window !== "undefined") {
          const savedAddr = localStorage.getItem("greeno_default_address");
          if (savedAddr) {
            try {
              const parsed = JSON.parse(savedAddr);
              detectedAddress = { ...detectedAddress, ...parsed };
              if (parsed.phone && !detectedPhone) detectedPhone = parsed.phone;
            } catch {}
          }

          // Check scoped orders if address/phone not yet found
          if (!detectedPhone || !detectedAddress.address) {
            const rawOrders = localStorage.getItem(`greeno_orders_${cleanEmail}`);
            if (rawOrders) {
              try {
                const list = JSON.parse(rawOrders);
                if (Array.isArray(list) && list.length > 0 && list[0]?.customer) {
                  const cust = list[0].customer;
                  if (cust.phone && !detectedPhone) detectedPhone = cust.phone;
                  if (cust.address && !detectedAddress.address) {
                    detectedAddress = {
                      fullName: cust.fullName || displayName,
                      phone: cust.phone || detectedPhone,
                      address: cust.address || "",
                      city: cust.city || "",
                      state: cust.state || "",
                      pincode: cust.pincode || "",
                    };
                  }
                }
              } catch {}
            }
          }
        }

        setUserPhone(detectedPhone || "+91 9039353101");
        setEditPhone(detectedPhone || "+91 9039353101");
        setShippingAddress(detectedAddress);
        setLoading(false);
      } catch (err) {
        console.warn("Account load notice:", err);
        setLoading(false);
      }
    }

    loadAccount();
  }, [router]);

  // Load orders when the Orders tab is active, and listen for real-time updates
  useEffect(() => {
    if (activeTab !== "orders" || !userEmail) return;

    const cleanEmail = userEmail.trim().toLowerCase();
    setOrdersLoading(true);

    function loadLocalOrders() {
      if (typeof window === "undefined") return;
      let cookieStatuses: Record<string, string> = {};
      try {
        const cookieMatch = document.cookie
          .split("; ")
          .find((row) => row.startsWith("greeno_order_statuses="));
        if (cookieMatch) {
          cookieStatuses = JSON.parse(decodeURIComponent(cookieMatch.split("=")[1]));
        }
      } catch {}

      const raw = localStorage.getItem(`greeno_orders_${cleanEmail}`);
      if (raw) {
        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const withOverrides = list.map((o: any) => {
              const statusOverride = cookieStatuses[o.id];
              return statusOverride ? { ...o, status: statusOverride } : o;
            });
            setOrders(withOverrides);
          }
        } catch {}
      }
    }

    // Check local cache immediately for instant render
    loadLocalOrders();

    // Query server for latest orders and merge intelligently
    function fetchServerOrders() {
      fetch(`/api/orders?email=${encodeURIComponent(cleanEmail)}&t=${Date.now()}`, {
        cache: "no-store",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.orders)) {
            let cookieStatuses: Record<string, string> = {};
            try {
              const cookieMatch = document.cookie
                .split("; ")
                .find((row) => row.startsWith("greeno_order_statuses="));
              if (cookieMatch) {
                cookieStatuses = JSON.parse(decodeURIComponent(cookieMatch.split("=")[1]));
              }
            } catch {}

            const rawLocal = localStorage.getItem(`greeno_orders_${cleanEmail}`);
            const localList = rawLocal ? JSON.parse(rawLocal) : [];
            const localMap = new Map<string, any>(
              Array.isArray(localList) ? localList.map((o: any) => [o.id, o]) : []
            );

            const merged = data.orders.map((so: any) => {
              const lo = localMap.get(so.id);
              const statusOverride = cookieStatuses[so.id];
              const finalStatus = statusOverride || so.status || lo?.status || "confirmed";
              return {
                ...(lo || {}),
                ...so,
                status: finalStatus,
              };
            });

            // Also include any local orders not yet in server response
            const serverIds = new Set(data.orders.map((o: any) => o.id));
            if (Array.isArray(localList)) {
              for (const lo of localList) {
                if (lo?.id && !serverIds.has(lo.id)) {
                  const statusOverride = cookieStatuses[lo.id];
                  merged.push({
                    ...lo,
                    status: statusOverride || lo.status || "confirmed",
                  });
                }
              }
            }

            merged.sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            setOrders(merged);
            try {
              localStorage.setItem(`greeno_orders_${cleanEmail}`, JSON.stringify(merged));
            } catch {}
          }
        })
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }

    fetchServerOrders();

    // Listen to real-time events across tabs/windows and on re-focus
    function handleStorageOrOrderUpdated() {
      loadLocalOrders();
      fetchServerOrders();
    }

    const handleRevalidate = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchServerOrders();
      }
    };

    window.addEventListener("storage", handleStorageOrOrderUpdated);
    window.addEventListener("greeno_order_updated", handleStorageOrOrderUpdated);
    window.addEventListener("focus", handleRevalidate);
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleRevalidate);
    }
    const intervalId = setInterval(handleRevalidate, 20000);

    return () => {
      window.removeEventListener("storage", handleStorageOrOrderUpdated);
      window.removeEventListener("greeno_order_updated", handleStorageOrOrderUpdated);
      window.removeEventListener("focus", handleRevalidate);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleRevalidate);
      }
      clearInterval(intervalId);
    };
  }, [activeTab, userEmail]);

  function handleSaveDetails() {
    if (!editName.trim()) return;
    setUserName(editName.trim());
    setUserPhone(editPhone.trim());
    setIsEditing(false);
    setSaveSuccess(true);

    if (typeof window !== "undefined") {
      localStorage.setItem("greeno_user_name", editName.trim());
      localStorage.setItem("greeno_user_phone", editPhone.trim());
      window.dispatchEvent(new Event("storage"));
    }

    setTimeout(() => setSaveSuccess(false), 3000);
  }

  function handleSaveAddress() {
    setIsEditingAddress(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("greeno_default_address", JSON.stringify(shippingAddress));
      window.dispatchEvent(new Event("storage"));
    }
  }

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

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p className={styles.message}>LOADING ACCOUNT...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Mobile Tab Navigation Strip (Horizontal luxury pill tabs for phone view) */}
        <div className={styles.mobileTabNav}>
          <button
            type="button"
            className={`${styles.mobileTabBtn} ${activeTab === "account" ? styles.mobileTabBtnActive : ""}`}
            onClick={() => switchTab("account")}
          >
            <User className={styles.mobileTabIcon} />
            <span>Account</span>
          </button>

          <button
            type="button"
            className={`${styles.mobileTabBtn} ${activeTab === "orders" ? styles.mobileTabBtnActive : ""}`}
            onClick={() => switchTab("orders")}
          >
            <Package className={styles.mobileTabIcon} />
            <span>Orders{orders.length > 0 ? ` (${orders.length})` : ""}</span>
          </button>

          <button
            type="button"
            className={`${styles.mobileTabBtn} ${activeTab === "address" ? styles.mobileTabBtnActive : ""}`}
            onClick={() => switchTab("address")}
          >
            <MapPin className={styles.mobileTabIcon} />
            <span>Address</span>
          </button>

          <button
            type="button"
            className={`${styles.mobileTabBtn} ${activeTab === "wallet" ? styles.mobileTabBtnActive : ""}`}
            onClick={() => switchTab("wallet")}
          >
            <Wallet className={styles.mobileTabIcon} />
            <span>Wallet</span>
          </button>

          <button
            type="button"
            className={`${styles.mobileTabBtn} ${styles.mobileLogoutBtn}`}
            onClick={handleLogout}
          >
            <LogOut className={styles.mobileTabIcon} />
            <span>Log out</span>
          </button>
        </div>

        {/* Main Reference Card Container */}
        <div className={`${styles.accountCard} ${activeTab === "orders" ? styles.ordersActive : ""}`}>
          {/* Left Sidebar Navigation */}
          <aside className={styles.sidebar}>
            <button
              type="button"
              className={`${styles.navButton} ${activeTab === "account" ? styles.navButtonActive : ""}`}
              onClick={() => switchTab("account")}
            >
              <User className={styles.navIcon} />
              <span>Account details</span>
            </button>

            <button
              type="button"
              className={`${styles.navButton} ${activeTab === "orders" ? styles.navButtonActive : ""}`}
              onClick={() => switchTab("orders")}
            >
              <Package className={styles.navIcon} />
              <span>Order history</span>
            </button>

            <button
              type="button"
              className={`${styles.navButton} ${activeTab === "address" ? styles.navButtonActive : ""}`}
              onClick={() => switchTab("address")}
            >
              <MapPin className={styles.navIcon} />
              <span>Shipping Address</span>
            </button>

            <button
              type="button"
              className={`${styles.navButton} ${activeTab === "wallet" ? styles.navButtonActive : ""}`}
              onClick={() => switchTab("wallet")}
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
          <section className={`${styles.contentArea} ${activeTab === "orders" ? styles.ordersContentArea : ""}`}>
            {/* 1. Account Details */}
            {activeTab === "account" && (
              <div>
                <div className={styles.tabHeader}>
                  <h2 className={styles.tabTitle}>Account details</h2>
                  <p className={styles.tabSubtitle}>Manage your personal details, email and phone number.</p>
                </div>

                <div className={styles.fieldList}>
                  {/* Name Card */}
                  <div className={styles.fieldCard}>
                    <span className={styles.fieldLabel}>Name:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={styles.fieldInput}
                        placeholder="Enter your name"
                      />
                    ) : (
                      <span className={styles.fieldValue}>{userName || "—"}</span>
                    )}
                  </div>

                  {/* Email Card */}
                  <div className={styles.fieldCard}>
                    <span className={styles.fieldLabel}>Email:</span>
                    <span className={styles.fieldValue}>{userEmail || "—"}</span>
                  </div>

                  {/* Phone Card */}
                  <div className={styles.fieldCard}>
                    <span className={styles.fieldLabel}>Phone:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className={styles.fieldInput}
                        placeholder="+91 9876543210"
                      />
                    ) : (
                      <span className={styles.fieldValue}>{userPhone || "—"}</span>
                    )}
                  </div>
                </div>

                <div className={styles.editActions}>
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveDetails}
                        className={styles.saveButton}
                      >
                        Save Details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditName(userName);
                          setEditPhone(userPhone);
                          setIsEditing(false);
                        }}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className={styles.cancelButton}
                      style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <Pencil style={{ width: 14, height: 14 }} />
                      <span>Edit Details</span>
                    </button>
                  )}
                </div>

                {saveSuccess && (
                  <p className={styles.toastMsg}>
                    <Check style={{ width: 14, height: 14, display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                    Profile details updated successfully.
                  </p>
                )}
              </div>
            )}

            {/* 2. Order History Tab */}
            {activeTab === "orders" && (
              <div className={styles.ordersTabContent}>
                <div className={styles.tabHeader}>
                  <h2 className={styles.tabTitle}>Order history</h2>
                  <p className={styles.tabSubtitle}>Review your previous orders and check delivery status.</p>
                </div>

                {ordersLoading ? (
                  <p className={styles.message}>Loading your orders...</p>
                ) : orders.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No orders placed yet.</p>
                    <Link href="/shop" className={styles.saveButton} style={{ display: "inline-block", marginTop: 12, textDecoration: "none" }}>
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className={styles.ordersListContainer}>
                    {orders.map((o) => {
                      const st = (o.status || "confirmed").toLowerCase();
                      const statusClass =
                        st === "delivered" || st === "reached"
                          ? styles.statusDelivered
                          : st === "shipped"
                          ? styles.statusShipped
                          : st === "cancelled"
                          ? styles.statusCancelled
                          : styles.statusConfirmed;

                      const formattedDate = o.created_at
                        ? new Date(o.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Recent";

                      const orderItems = Array.isArray(o.items) ? o.items : [];
                      const itemCount = orderItems.reduce((acc, it) => acc + (it.quantity || 1), 0) || 1;

                      return (
                        <div key={o.id} className={styles.orderCardItem}>
                          {/* Top Header of the Order Card */}
                          <div className={styles.orderCardHeader}>
                            <div className={styles.orderInfo}>
                              <span className={styles.orderIdText}>{formatShortOrderId(o.id)}</span>
                              <span className={styles.orderDateText}>Placed on {formattedDate}</span>
                            </div>
                            <span className={`${styles.orderStatusBadge} ${statusClass}`}>
                              {o.status || "Confirmed"}
                            </span>
                          </div>

                          {/* Ordered Items Preview with Thumbnails */}
                          {orderItems.length > 0 && (
                            <div className={styles.orderItemsPreview}>
                              {orderItems.slice(0, 3).map((item, idx) => (
                                <div key={item.id || idx} className={styles.orderItemRow}>
                                  <div className={styles.orderItemThumb}>
                                    {item.image ? (
                                      <img src={item.image} alt={item.name || item.product_name || "Piece"} />
                                    ) : (
                                      <Package style={{ width: 18, height: 18, color: "#888888" }} />
                                    )}
                                  </div>
                                  <div className={styles.orderItemDetails}>
                                    <span className={styles.orderItemName}>{item.name || item.product_name || "Atelier Piece"}</span>
                                    <span className={styles.orderItemMeta}>
                                      {item.size ? `Size: ${item.size}` : ""}{item.color ? ` • ${item.color}` : ""}{` • Qty: ${item.quantity || 1}`}
                                    </span>
                                    <span className={styles.orderItemPrice}>
                                      ₹{(item.price || 0).toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {orderItems.length > 3 && (
                                <span className={styles.moreItemsText}>
                                  +{orderItems.length - 3} more item{orderItems.length - 3 > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Bottom Footer with Total and View Details Action */}
                          <div className={styles.orderCardFooter}>
                            <div className={styles.orderTotalGroup}>
                              <span className={styles.orderTotalLabel}>
                                Total ({itemCount} {itemCount === 1 ? "item" : "items"}):
                              </span>
                              <span className={styles.orderTotalText}>
                                ₹{(o.total || 0).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <Link href={`/account/orders/${o.id}`} className={styles.viewOrderBtn}>
                              View Details &#8594;
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. Shipping Address Tab */}
            {activeTab === "address" && (
              <div>
                <div className={styles.tabHeader}>
                  <h2 className={styles.tabTitle}>Shipping Address</h2>
                  <p className={styles.tabSubtitle}>Your primary delivery destination for orders.</p>
                </div>

                {isEditingAddress ? (
                  <div className={styles.fieldList}>
                    <div className={styles.fieldCard}>
                      <span className={styles.fieldLabel}>Street:</span>
                      <input
                        type="text"
                        value={shippingAddress.address}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, address: e.target.value })
                        }
                        className={styles.fieldInput}
                        placeholder="House, street, locality"
                      />
                    </div>
                    <div className={styles.fieldCard}>
                      <span className={styles.fieldLabel}>City:</span>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, city: e.target.value })
                        }
                        className={styles.fieldInput}
                        placeholder="City"
                      />
                    </div>
                    <div className={styles.fieldCard}>
                      <span className={styles.fieldLabel}>State:</span>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, state: e.target.value })
                        }
                        className={styles.fieldInput}
                        placeholder="State"
                      />
                    </div>
                    <div className={styles.fieldCard}>
                      <span className={styles.fieldLabel}>PIN Code:</span>
                      <input
                        type="text"
                        value={shippingAddress.pincode}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, pincode: e.target.value })
                        }
                        className={styles.fieldInput}
                        placeholder="PIN Code"
                      />
                    </div>

                    <div className={styles.editActions}>
                      <button
                        type="button"
                        onClick={handleSaveAddress}
                        className={styles.saveButton}
                      >
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.addressBox}>
                    <div className={styles.addressRow}>
                      <span className={styles.addressRowLabel}>Recipient:</span>
                      <span className={styles.addressRowVal}>{shippingAddress.fullName || userName}</span>
                    </div>
                    <div className={styles.addressRow}>
                      <span className={styles.addressRowLabel}>Phone:</span>
                      <span className={styles.addressRowVal}>{shippingAddress.phone || userPhone}</span>
                    </div>
                    <div className={styles.addressRow}>
                      <span className={styles.addressRowLabel}>Address:</span>
                      <span className={styles.addressRowVal}>
                        {shippingAddress.address
                          ? `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`
                          : "No delivery address saved yet."}
                      </span>
                    </div>

                    <div style={{ marginTop: 20 }}>
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(true)}
                        className={styles.cancelButton}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <Pencil style={{ width: 14, height: 14 }} />
                        <span>{shippingAddress.address ? "Edit Address" : "Add Address"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Wallet Details Tab */}
            {activeTab === "wallet" && (
              <div>
                <div className={styles.tabHeader}>
                  <h2 className={styles.tabTitle}>Wallet Details</h2>
                  <p className={styles.tabSubtitle}>View your GreenO Credits and store balance.</p>
                </div>

                <div className={styles.walletCard}>
                  <div className={styles.walletHeader}>
                    <span className={styles.walletBrand}>GREENO CASH</span>
                    <Wallet style={{ width: 22, height: 22, color: "#e4e4e7" }} />
                  </div>
                  <h3 className={styles.walletAmount}>₹0.00</h3>
                  <p className={styles.walletSub}>Available Store Balance &amp; Refund Credits</p>
                </div>

                <div className={styles.walletNote}>
                  <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#111827" }}>
                    How it works
                  </p>
                  Any approved return refunds or promotional store credits are automatically deposited into your GreenO Cash wallet and can be instantly applied at checkout.
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.container}>
            <p className={styles.message}>LOADING ACCOUNT...</p>
          </div>
        </main>
      }
    >
      <AccountPageContent />
    </Suspense>
  );
}