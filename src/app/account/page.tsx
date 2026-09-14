"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, User, Wallet, LogOut, Check, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import styles from "./account.module.css";

type TabKey = "account" | "orders" | "address" | "wallet";

interface OrderSummary {
  id: string;
  created_at: string;
  status: string;
  total: number;
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
            const finalStatus = statusOverride || lo?.status || so.status || "confirmed";
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

    // Listen to real-time events across tabs/windows
    function handleStorageOrOrderUpdated() {
      loadLocalOrders();
    }

    window.addEventListener("storage", handleStorageOrOrderUpdated);
    window.addEventListener("greeno_order_updated", handleStorageOrOrderUpdated);

    return () => {
      window.removeEventListener("storage", handleStorageOrOrderUpdated);
      window.removeEventListener("greeno_order_updated", handleStorageOrOrderUpdated);
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
        <p className={styles.breadcrumb}>GREENO / MY ACCOUNT</p>
        <h1 className={styles.title}>MY ACCOUNT</h1>

        {/* Main Reference Card Container */}
        <div className={styles.accountCard}>
          {/* Left Sidebar Navigation */}
          <aside className={styles.sidebar}>
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
              <User className={styles.navIcon} />
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
              className={`${styles.navButton} ${activeTab === "account" ? styles.navButtonActive : ""}`}
              onClick={() => switchTab("account")}
            >
              <User className={styles.navIcon} />
              <span>Account details</span>
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
            {/* 1. Account Details (Default View matching Screenshot) */}
            {activeTab === "account" && (
              <div>
                <div className={styles.tabHeader}>
                  <h2 className={styles.tabTitle}>Account Details</h2>
                  <p className={styles.tabSubtitle}>Manage your personal contact details.</p>
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
              <div>
                <div className={styles.tabHeader}>
                  <h2 className={styles.tabTitle}>Order History</h2>
                  <p className={styles.tabSubtitle}>Review your recent orders and shipment status.</p>
                </div>

                {ordersLoading ? (
                  <p className={styles.message}>Loading your orders...</p>
                ) : orders.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No orders placed yet.</p>
                    <Link href="/shop" className={styles.saveButton} style={{ display: "inline-block", marginTop: 12, textDecoration: "none" }}>
                      Explore Collection
                    </Link>
                  </div>
                ) : (
                  <div>
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

                      return (
                        <div key={o.id} className={styles.orderCardItem}>
                          <div className={styles.orderInfo}>
                            <span className={styles.orderIdText}>{o.id}</span>
                            <span className={styles.orderDateText}>Placed on {formattedDate}</span>
                          </div>

                          <div className={styles.orderMeta}>
                            <span className={`${styles.orderStatusBadge} ${statusClass}`}>
                              {o.status || "Confirmed"}
                            </span>
                            <span className={styles.orderTotalText}>
                              ₹{(o.total || 0).toLocaleString("en-IN")}
                            </span>
                            <Link href={`/account/orders/${o.id}`} className={styles.viewOrderBtn}>
                              Details
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
                  <p className={styles.walletSub}>Available Store Balance & Refund Credits</p>
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