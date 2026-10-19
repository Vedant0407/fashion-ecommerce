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
    let active = true;
    const loadAccount = async () => {
      try {
        const response = await fetch("/api/account", { cache: "no-store" });
        if (response.status === 401) { router.push("/login"); return; }
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Unable to load account.");
        if (!active) return;
        const profile = data.profile;
        setUserEmail(profile.email);
        setUserName(profile.name);
        setEditName(profile.name);
        setUserPhone(profile.phone || "");
        setEditPhone(profile.phone || "");
        setShippingAddress(data.address || { fullName: profile.name, phone: profile.phone || "", address: "", city: "", state: "", pincode: "" });
      } catch (error) {
        console.error("Account load failed:", error);
        if (active) router.push("/login");
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadAccount();
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (activeTab !== "orders") return;
    let active = true;
    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const response = await fetch("/api/orders", { cache: "no-store" });
        const data = await response.json();
        if (active && response.ok && data.success && Array.isArray(data.orders)) setOrders(data.orders);
        else if (active) setOrders([]);
      } catch {
        if (active) setOrders([]);
      } finally {
        if (active) setOrdersLoading(false);
      }
    };
    void fetchOrders();
    window.addEventListener("focus", fetchOrders);
    return () => { active = false; window.removeEventListener("focus", fetchOrders); };
  }, [activeTab]);
  async function handleSaveDetails() {
    if (!editName.trim()) return;
    try {
      const response = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: { name: editName, phone: editPhone } }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to save details.");
      setUserName(data.profile.name);
      setUserPhone(data.profile.phone || "");
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Account update failed:", error);
    }
  }

  async function handleSaveAddress() {
    try {
      const response = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: shippingAddress }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to save address.");
      if (data.address) setShippingAddress(data.address);
      setIsEditingAddress(false);
    } catch (error) {
      console.error("Address update failed:", error);
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
