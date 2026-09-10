"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import styles from "./admin.module.css";
import { Product, Category } from "@/lib/catalog";
import { StoreOrder, StoreCoupon, StoreSettings } from "@/lib/store-data";

export default function AdminPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passkeyInput, setPasskeyInput] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");

  // Navigation
  const [activeTab, setActiveTab] = useState<
    "overview" | "products" | "categories" | "orders" | "coupons" | "settings" | "sms" | "email"
  >("overview");

  // SMS Testing State
  const [testPhone, setTestPhone] = useState<string>("");
  const [testSmsLoading, setTestSmsLoading] = useState<boolean>(false);
  const [testSmsResult, setTestSmsResult] = useState<{
    success: boolean;
    sent?: boolean;
    provider?: string;
    message: string;
    details?: any;
  } | null>(null);

  // Email Testing State
  const [testEmail, setTestEmail] = useState<string>("");
  const [testEmailLoading, setTestEmailLoading] = useState<boolean>(false);
  const [testEmailResult, setTestEmailResult] = useState<{
    success: boolean;
    sent?: boolean;
    provider?: string;
    message: string;
    error?: string;
    details?: any;
    duration?: string;
  } | null>(null);

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [coupons, setCoupons] = useState<StoreCoupon[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    announcementText: "COMPLIMENTARY SHIPPING ACROSS INDIA • COD AVAILABLE • NEW DROP IS LIVE",
    storeNotice: "All orders dispatched within 24 hours.",
    supportPhone: "+91 98765 43210",
    supportEmail: "concierge@greeno.in",
    adminPasskey: "aman2026",
    currency: "INR",
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Product Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");

  // Category Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [uploadingCategoryCover, setUploadingCategoryCover] = useState<boolean>(false);
  const [categoryUploadError, setCategoryUploadError] = useState<string>("");

  // Coupon Modals
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<StoreCoupon> | null>(null);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);

  // Filter & Search
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");

  // Helper Toast
  function triggerToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  }

  // Always require passkey on every open or refresh
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("greeno_admin_token");
      sessionStorage.removeItem("greeno_admin_token");
    }
    setIsAuthenticated(false);
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [prodRes, catRes, orderRes, coupRes, setRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
        fetch("/api/admin/orders"),
        fetch("/api/admin/coupons"),
        fetch("/api/admin/settings"),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (prodData.products) setProducts(prodData.products);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        if (catData.categories) setCategories(catData.categories);
      }
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        const serverOrders = orderData.orders || [];

        // Also merge with any orders saved locally in browser
        let localOrders: StoreOrder[] = [];
        try {
          const rawAll = localStorage.getItem("greeno_all_orders");
          const rawCust = localStorage.getItem("greeno_customer_orders");
          const arr1 = rawAll ? JSON.parse(rawAll) : [];
          const arr2 = rawCust ? JSON.parse(rawCust) : [];
          localOrders = [...arr1, ...arr2];
        } catch {}

        const orderMap = new Map<string, StoreOrder>();
        for (const o of serverOrders) {
          if (o?.id) orderMap.set(o.id, o);
        }

        let hadMissing = false;
        const missingToSync: StoreOrder[] = [];
        for (const lo of localOrders) {
          if (lo?.id && !orderMap.has(lo.id)) {
            orderMap.set(lo.id, lo);
            missingToSync.push(lo);
            hadMissing = true;
          }
        }

        const mergedOrders = Array.from(orderMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setOrders(mergedOrders);

        // Sync local orders to server if missing
        if (hadMissing && missingToSync.length > 0) {
          fetch("/api/orders/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orders: missingToSync }),
          }).catch(() => {});
        }
      }
      if (coupRes.ok) {
        const coupData = await coupRes.json();
        if (coupData.coupons) setCoupons(coupData.coupons);
      }
      if (setRes.ok) {
        const setData = await setRes.json();
        if (setData.settings) setSettings(setData.settings);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  // Handle Passkey Login
  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    const cleanPass = passkeyInput.trim();

    if (cleanPass === "aman2026" || cleanPass === settings.adminPasskey) {
      setIsAuthenticated(true);
      setAuthError("");
      return;
    }

    // Secondary check against server settings in case passkey was updated in store data
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.adminPasskey && cleanPass === data.settings.adminPasskey) {
          setSettings(data.settings);
          setIsAuthenticated(true);
          setAuthError("");
          return;
        }
      }
    } catch {
      // ignore
    }

    setAuthError("Incorrect passkey. Access denied.");
  }

  function handleLock() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("greeno_admin_token");
      sessionStorage.removeItem("greeno_admin_token");
    }
    setIsAuthenticated(false);
    setPasskeyInput("");
    setAuthError("");
  }

  // ----------------- Products CRUD -----------------
  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || editingProduct.price === undefined) {
      alert("Name and Price are required.");
      return;
    }

    try {
      const isUpdating = Boolean(editingProduct.id && products.some((p) => p.id === editingProduct.id));
      const method = isUpdating ? "PUT" : "POST";

      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct),
      });

      if (res.ok) {
        triggerToast(isUpdating ? "Product updated successfully." : "Product created successfully.");
        setIsProductModalOpen(false);
        setEditingProduct(null);
        await fetchAllData();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to save product.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save product.");
    }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0 || !editingProduct) return;
    setUploadingImages(true);
    setUploadError("");

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to upload photos.");
      }

      const newUrls: string[] = data.urls || [];
      const currentImages = Array.isArray(editingProduct.images) && editingProduct.images.length > 0
        ? [...editingProduct.images]
        : editingProduct.image ? [editingProduct.image] : [];

      const combined = [...currentImages, ...newUrls];
      setEditingProduct({
        ...editingProduct,
        images: combined,
        image: combined[0] || editingProduct.image || "",
      });

      triggerToast(`Uploaded ${newUrls.length} photo${newUrls.length > 1 ? "s" : ""}!`);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploadingImages(false);
    }
  }

  function handleSetCoverImage(index: number) {
    if (!editingProduct) return;
    const currentImages = Array.isArray(editingProduct.images) && editingProduct.images.length > 0
      ? [...editingProduct.images]
      : editingProduct.image ? [editingProduct.image] : [];

    if (index >= 0 && index < currentImages.length) {
      const selected = currentImages.splice(index, 1)[0];
      const reordered = [selected, ...currentImages];
      setEditingProduct({
        ...editingProduct,
        images: reordered,
        image: reordered[0],
      });
      triggerToast("Cover photo updated!");
    }
  }

  function handleRemoveImage(index: number) {
    if (!editingProduct) return;
    const currentImages = Array.isArray(editingProduct.images) && editingProduct.images.length > 0
      ? [...editingProduct.images]
      : editingProduct.image ? [editingProduct.image] : [];

    const updated = currentImages.filter((_, i) => i !== index);
    setEditingProduct({
      ...editingProduct,
      images: updated,
      image: updated[0] || "",
    });
    triggerToast("Photo removed.");
  }

  async function handleCategoryCoverUpload(files: FileList | null) {
    if (!files || files.length === 0 || !editingCategory) return;
    setUploadingCategoryCover(true);
    setCategoryUploadError("");

    try {
      const formData = new FormData();
      formData.append("files", files[0]);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to upload cover photo.");
      }

      const uploadedUrl = (data.urls && data.urls[0]) || data.url;
      setEditingCategory({
        ...editingCategory,
        image: uploadedUrl,
      });
      triggerToast("Category cover photo uploaded successfully!");
    } catch (err: any) {
      setCategoryUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploadingCategoryCover(false);
    }
  }

  async function handleDeleteProduct(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete '${name}'? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        triggerToast(`Product '${name}' deleted.`);
        await fetchAllData();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete product.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete product.");
    }
  }

  async function handleQuickStock(productId: string, newStock: number) {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, stock: Math.max(0, newStock) }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p))
        );
        triggerToast("Stock updated.");
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ----------------- Categories CRUD -----------------
  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name) {
      alert("Category name is required.");
      return;
    }

    try {
      const isUpdating = Boolean(
        editingCategory.id && categories.some((c) => c.id === editingCategory.id)
      );
      const method = isUpdating ? "PUT" : "POST";

      const res = await fetch("/api/admin/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCategory),
      });

      if (res.ok) {
        triggerToast(isUpdating ? "Category updated." : "Category created.");
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
        await fetchAllData();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to save category.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save category.");
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    if (!confirm(`Delete collection '${name}'?`)) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        triggerToast(`Category '${name}' deleted.`);
        await fetchAllData();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete category.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete category.");
    }
  }

  // ----------------- Orders Status Update -----------------
  async function handleUpdateOrderStatus(orderId: string, newStatus: StoreOrder["status"]) {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );

        // Update in localStorage so client and customer account tabs retain it forever
        try {
          const updateLocalList = (key: string) => {
            const raw = localStorage.getItem(key);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                const updated = list.map((o: any) =>
                  o.id === orderId ? { ...o, status: newStatus } : o
                );
                localStorage.setItem(key, JSON.stringify(updated));
              }
            }
          };
          updateLocalList("greeno_all_orders");
          updateLocalList("greeno_customer_orders");
          const rawLast = localStorage.getItem("greeno_last_order");
          if (rawLast) {
            const last = JSON.parse(rawLast);
            if (last?.id === orderId) {
              last.status = newStatus;
              localStorage.setItem("greeno_last_order", JSON.stringify(last));
            }
          }
          window.dispatchEvent(new Event("storage"));
          window.dispatchEvent(
            new CustomEvent("greeno_order_updated", {
              detail: { orderId, status: newStatus },
            })
          );
        } catch {}

        triggerToast(`Order status updated to ${newStatus.toUpperCase()}`);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update order status.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update order status.");
    }
  }

  async function handleDeleteOrder(id: string) {
    if (!confirm(`Remove order '${id}' from records?`)) return;

    try {
      const res = await fetch(`/api/admin/orders?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        triggerToast(`Order '${id}' removed.`);
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ----------------- Coupons CRUD -----------------
  async function handleSaveCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCoupon || !editingCoupon.code || editingCoupon.value === undefined) {
      alert("Code and Value are required.");
      return;
    }

    try {
      const isUpdating = Boolean(
        editingCoupon.code && coupons.some((c) => c.code.toUpperCase() === editingCoupon.code?.toUpperCase())
      );
      const method = isUpdating ? "PUT" : "POST";

      const res = await fetch("/api/admin/coupons", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCoupon),
      });

      if (res.ok) {
        triggerToast(isUpdating ? "Coupon updated." : "Coupon created.");
        setIsCouponModalOpen(false);
        setEditingCoupon(null);
        await fetchAllData();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to save coupon.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save coupon.");
    }
  }

  async function handleToggleCoupon(code: string, active: boolean) {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, active: !active }),
      });

      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => (c.code === code ? { ...c, active: !active } : c))
        );
        triggerToast(`Coupon ${code} ${!active ? "activated" : "deactivated"}.`);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteCoupon(code: string) {
    if (!confirm(`Delete coupon code '${code}'?`)) return;

    try {
      const res = await fetch(`/api/admin/coupons?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        triggerToast(`Coupon '${code}' removed.`);
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ----------------- Settings Save -----------------
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        triggerToast("Storefront settings saved and live!");
      } else {
        alert("Failed to save settings.");
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ----------------- Live SMS Test -----------------
  async function handleTestSms(e: React.FormEvent) {
    e.preventDefault();
    const clean = testPhone.replace(/\D/g, "");
    if (clean.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setTestSmsLoading(true);
    setTestSmsResult(null);

    try {
      const res = await fetch("/api/admin/test-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: clean,
          apiKey: settings.smsApiKey,
          provider: settings.smsProvider || "fast2sms",
          twilioSid: settings.twilioSid,
          twilioToken: settings.twilioToken,
          twilioFrom: settings.twilioFrom,
        }),
      });

      const data = await res.json();
      setTestSmsResult({
        success: data.success,
        sent: data.sent,
        provider: data.provider,
        message: data.message,
        details: data.gatewayResponse,
      });

      if (data.success) {
        triggerToast("Real SMS delivered to phone!");
      }
    } catch (err: any) {
      setTestSmsResult({
        success: false,
        sent: false,
        message: err.message || "Failed to communicate with SMS test endpoint.",
      });
    } finally {
      setTestSmsLoading(false);
    }
  }

  // ----------------- Live Email Test -----------------
  async function handleTestEmail(e: React.FormEvent) {
    e.preventDefault();
    const clean = testEmail.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      alert("Please enter a valid email address to test.");
      return;
    }
    setTestEmailLoading(true);
    setTestEmailResult(null);

    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: clean,
          provider: settings.emailProvider || "gmail",
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort,
          smtpSecure: settings.smtpSecure,
          smtpUser: settings.smtpUser,
          smtpPass: settings.smtpPass,
          smtpFrom: settings.smtpFrom,
          brevoApiKey: settings.brevoApiKey,
          resendApiKey: settings.resendApiKey,
        }),
      });

      const data = await res.json();
      setTestEmailResult({
        success: data.success,
        sent: data.sent,
        provider: data.provider,
        message: data.message,
        error: data.error,
        details: data.details,
        duration: data.duration,
      });

      if (data.success) {
        triggerToast("Real verification email delivered to your inbox!");
      }
    } catch (err: any) {
      setTestEmailResult({
        success: false,
        sent: false,
        message: err.message || "Failed to communicate with Email test endpoint.",
      });
    } finally {
      setTestEmailLoading(false);
    }
  }

  // ----------------- Filtered Data -----------------
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.product_no && p.product_no.toLowerCase().includes(productSearch.toLowerCase()));

      const matchesCat =
        productCategoryFilter === "ALL" ||
        (productCategoryFilter === "NEW_IN" && Boolean(p.is_new)) ||
        (productCategoryFilter === "TRENDING" && Boolean(p.is_trending)) ||
        (productCategoryFilter === "FEATURED" && Boolean(p.is_featured)) ||
        p.category_slug === productCategoryFilter ||
        p.category_name?.toUpperCase() === productCategoryFilter.toUpperCase();

      return matchesSearch && matchesCat;
    });
  }, [products, productSearch, productCategoryFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = orderSearch.toLowerCase();
      const matchesSearch =
        o.id.toLowerCase().includes(q) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        (o.customer.email && o.customer.email.toLowerCase().includes(q)) ||
        o.customer.phone.includes(orderSearch) ||
        o.customer.city.toLowerCase().includes(q);

      const matchesStatus =
        orderStatusFilter === "ALL" || o.status.toLowerCase() === orderStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalSales = orders.reduce((sum, o) => (o.status !== "cancelled" ? sum + o.total : sum), 0);
    const pendingOrders = orders.filter((o) => o.status === "confirmed" || o.status === "processing").length;
    const lowStockCount = products.filter((p) => (p.stock || 0) < 10).length;
    const activeCoupons = coupons.filter((c) => c.active).length;

    return {
      totalSales,
      totalOrders: orders.length,
      pendingOrders,
      totalProducts: products.length,
      lowStockCount,
      activeCoupons,
    };
  }, [orders, products, coupons]);

  // If locked, render luxury PIN gate
  if (!isAuthenticated) {
    return (
      <div className={styles.authOverlay}>
        <div className={styles.authCard}>
          <div className={styles.authBrand}>GREENO</div>
          <div className={styles.authSubtitle}>ADMIN CONSOLE // RESTRICTED ACCESS</div>

          <form onSubmit={handleUnlock}>
            <div className={styles.authInputGroup}>
              <label className={styles.authLabel}>Store Owner Passkey</label>
              <input
                type="password"
                className={styles.authInput}
                placeholder="Enter master passkey..."
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                autoFocus
              />
            </div>

            {authError && (
              <div style={{ color: "#ff5555", fontSize: "11px", marginBottom: "16px" }}>
                {authError}
              </div>
            )}

            <button type="submit" className={styles.authButton}>
              UNLOCK CONSOLE
            </button>
          </form>

          <div className={styles.authHint}>
            Restricted access • Authorized personnel only
          </div>

          <div style={{ marginTop: "24px" }}>
            <Link href="/" style={{ color: "#888888", fontSize: "11px", textDecoration: "none" }}>
              &larr; Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      {/* Top Bar */}
      <header className={styles.topNav}>
        <div className={styles.topNavInner}>
          <div className={styles.brandGroup}>
            <div className={styles.brandLogo}>GREENO</div>
            <div className={styles.brandTag}>ADMINISTRATION DASHBOARD</div>
          </div>

          <div className={styles.topActions}>
            <Link href="/" target="_blank" className={styles.ghostButton}>
              <span>VIEW STORE &#8599;</span>
            </Link>
            <button onClick={handleLock} className={styles.ghostButton}>
              LOCK CONSOLE
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className={styles.tabsBar}>
        <div className={styles.tabsInner}>
          <button
            className={`${styles.tabBtn} ${activeTab === "overview" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            OVERVIEW
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "products" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("products")}
          >
            PRODUCTS ({products.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "categories" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("categories")}
          >
            COLLECTIONS ({categories.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "orders" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            ORDERS ({orders.length})
            {metrics.pendingOrders > 0 && (
              <span
                style={{
                  background: "#000000",
                  color: "#ffffff",
                  padding: "1px 6px",
                  fontSize: "9px",
                  fontWeight: 800,
                  marginLeft: "6px",
                }}
              >
                {metrics.pendingOrders}
              </span>
            )}
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "coupons" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("coupons")}
          >
            COUPONS ({coupons.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "settings" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            STOREFRONT &amp; TICKER
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "sms" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("sms")}
          >
            SMS GATEWAY (REAL SMS)
            {settings.smsApiKey ? (
              <span
                style={{
                  background: "#22c55e",
                  color: "#000000",
                  padding: "1px 6px",
                  fontSize: "9px",
                  fontWeight: 800,
                  marginLeft: "6px",
                }}
              >
                ACTIVE
              </span>
            ) : (
              <span
                style={{
                  background: "#f59e0b",
                  color: "#000000",
                  padding: "1px 6px",
                  fontSize: "9px",
                  fontWeight: 800,
                  marginLeft: "6px",
                }}
              >
                SETUP
              </span>
            )}
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "email" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("email")}
          >
            EMAIL GATEWAY (OTP DISPATCH)
            {settings.smtpUser || settings.brevoApiKey || settings.resendApiKey ? (
              <span
                style={{
                  background: "#22c55e",
                  color: "#000000",
                  padding: "1px 6px",
                  fontSize: "9px",
                  fontWeight: 800,
                  marginLeft: "6px",
                }}
              >
                ACTIVE
              </span>
            ) : (
              <span
                style={{
                  background: "#f59e0b",
                  color: "#000000",
                  padding: "1px 6px",
                  fontSize: "9px",
                  fontWeight: 800,
                  marginLeft: "6px",
                }}
              >
                SETUP
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#888888", letterSpacing: "0.1em" }}>
            SYNCHRONIZING REPOSITORY DATA...
          </div>
        ) : (
          <>
            {/* -------------------- OVERVIEW TAB -------------------- */}
            {activeTab === "overview" && (
              <div>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>TOTAL GROSS SALES</div>
                    <div className={styles.statValue}>
                      ₹{metrics.totalSales.toLocaleString("en-IN")}
                    </div>
                    <div className={styles.statHint}>Across {metrics.totalOrders} total orders</div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>PENDING FULFILLMENT</div>
                    <div className={styles.statValue}>{metrics.pendingOrders}</div>
                    <div className={styles.statHint}>Awaiting shipping &amp; dispatch</div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>PRODUCTS IN CATALOGUE</div>
                    <div className={styles.statValue}>{metrics.totalProducts}</div>
                    <div className={styles.statHint}>
                      {metrics.lowStockCount > 0 ? (
                        <span style={{ color: "#ffaa00" }}>{metrics.lowStockCount} items low in stock</span>
                      ) : (
                        "Stock levels optimal"
                      )}
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>ACTIVE PROMO CODES</div>
                    <div className={styles.statValue}>{metrics.activeCoupons}</div>
                    <div className={styles.statHint}>Ready for checkout discounts</div>
                  </div>
                </div>

                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitle}>RECENT CUSTOMER ORDERS</div>
                  <button className={styles.ghostButton} onClick={() => setActiveTab("orders")}>
                    VIEW ALL ORDERS &rarr;
                  </button>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th>Fulfillment Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id}>
                          <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{order.id}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{order.customer.fullName}</div>
                            <div style={{ fontSize: "11px", color: "#888888" }}>
                              {order.customer.city}, {order.customer.state}
                            </div>
                          </td>
                          <td>{order.items.length} item(s)</td>
                          <td style={{ fontWeight: 700 }}>₹{order.total.toLocaleString("en-IN")}</td>
                          <td>
                            <span className={styles.badge}>{order.payment_method}</span>
                          </td>
                          <td>
                            <span
                              className={`${styles.badge} ${
                                order.status === "delivered" || order.status === "reached"
                                  ? styles.badgeSuccess
                                  : order.status === "cancelled"
                                  ? styles.badgeDanger
                                  : styles.badgeWarning
                              }`}
                            >
                              {order.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <button
                              className={styles.smallBtn}
                              onClick={() => setSelectedOrder(order)}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* -------------------- PRODUCTS TAB -------------------- */}
            {activeTab === "products" && (
              <div>
                <div className={styles.sectionHeader}>
                  <div>
                    <div className={styles.sectionTitle}>PRODUCT INVENTORY MANAGEMENT</div>
                    <div style={{ fontSize: "11px", color: "#888888", marginTop: "4px" }}>
                      Add, modify prices, assign collections, and adjust stock quantities.
                    </div>
                  </div>
                  <button
                    className={styles.primaryButton}
                    onClick={() => {
                      setEditingProduct({
                        id: "",
                        name: "",
                        price: 2499,
                        category_slug: categories[0]?.slug || "t-shirts",
                        category_name: categories[0]?.name || "T-SHIRTS",
                        image: "/black-tee.jfif",
                        stock: 50,
                        is_featured: false,
                        is_new: true,
                        is_trending: false,
                        color: "BLACK",
                        material: "100% Cotton",
                        fabric: "Heavyweight Jersey",
                        fit: "Oversized Fit",
                        description: "",
                      });
                      setIsProductModalOpen(true);
                    }}
                  >
                    + ADD NEW PRODUCT
                  </button>
                </div>

                <div className={styles.controlsBar}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search by title, ID, or product code..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#888888" }}>FILTER SECTION:</span>
                    <select
                      className={styles.filterSelect}
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value)}
                    >
                      <option value="ALL">ALL PRODUCTS ({products.length})</option>
                      <option value="NEW_IN">✦ NEW IN SECTION ({products.filter((p) => p.is_new).length})</option>
                      <option value="TRENDING">★ TRENDING SECTION ({products.filter((p) => p.is_trending).length})</option>
                      <option value="FEATURED">◆ CURATED CATALOGUE ({products.filter((p) => p.is_featured).length})</option>
                      <optgroup label="BY CATEGORY">
                        {categories.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.name} ({products.filter((p) => p.category_slug === c.slug).length})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Product Details</th>
                        <th>Collection</th>
                        <th>Price</th>
                        <th>Stock Units</th>
                        <th>Tags</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={p.id}>
                          <td>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.image} alt={p.name} className={styles.productThumb} />
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, letterSpacing: "0.04em" }}>{p.name}</div>
                            <div style={{ fontSize: "10px", color: "#888888", fontFamily: "monospace" }}>
                              {p.product_no || p.id} &bull; {p.color || "BLACK"}
                            </div>
                          </td>
                          <td>
                            <span className={styles.badge}>
                              {p.category_name || p.category_slug?.toUpperCase() || "STREETWEAR"}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700 }}>₹{p.price.toLocaleString("en-IN")}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <button
                                className={styles.smallBtn}
                                style={{ padding: "2px 6px" }}
                                onClick={() => handleQuickStock(p.id, (p.stock || 0) - 5)}
                              >
                                -5
                              </button>
                              <span
                                style={{
                                  fontWeight: 700,
                                  minWidth: "28px",
                                  textAlign: "center",
                                  color: (p.stock || 0) < 10 ? "#ffaa00" : "#ffffff",
                                }}
                              >
                                {p.stock ?? 0}
                              </span>
                              <button
                                className={styles.smallBtn}
                                style={{ padding: "2px 6px" }}
                                onClick={() => handleQuickStock(p.id, (p.stock || 0) + 5)}
                              >
                                +5
                              </button>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                              {p.is_featured && <span className={styles.badge}>FEATURED</span>}
                              {p.is_new && <span className={styles.badge}>NEW</span>}
                              {p.is_trending && <span className={styles.badge}>TRENDING</span>}
                            </div>
                          </td>
                          <td>
                            <div className={styles.actionGroup}>
                              <button
                                className={styles.smallBtn}
                                onClick={() => {
                                  setEditingProduct({ ...p });
                                  setIsProductModalOpen(true);
                                }}
                              >
                                EDIT
                              </button>
                              <button
                                className={styles.deleteBtn}
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                              >
                                DELETE
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* -------------------- CATEGORIES TAB -------------------- */}
            {activeTab === "categories" && (
              <div>
                <div className={styles.sectionHeader}>
                  <div>
                    <div className={styles.sectionTitle}>COLLECTIONS &amp; CATEGORIES</div>
                    <div style={{ fontSize: "11px", color: "#888888", marginTop: "4px" }}>
                      Manage brand drops, storefront banners, and product taxonomy.
                    </div>
                  </div>
                  <button
                    className={styles.primaryButton}
                    onClick={() => {
                      setEditingCategory({
                        name: "",
                        slug: "",
                        description: "",
                        image: "/black-tee.jfif",
                      });
                      setIsCategoryModalOpen(true);
                    }}
                  >
                    + ADD NEW COLLECTION
                  </button>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Cover</th>
                        <th>Collection Name</th>
                        <th>URL Slug</th>
                        <th>Description</th>
                        <th>Catalogue Items</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((c) => {
                        const itemsCount = products.filter(
                          (p) =>
                            p.category_slug?.toLowerCase() === c.slug.toLowerCase() ||
                            p.category_name?.toLowerCase() === c.name.toLowerCase()
                        ).length;

                        return (
                          <tr key={c.id || c.slug}>
                            <td>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={c.image || "/black-tee.jfif"}
                                alt={c.name}
                                className={styles.productThumb}
                              />
                            </td>
                            <td style={{ fontWeight: 700 }}>{c.name}</td>
                            <td style={{ fontFamily: "monospace", color: "#888888" }}>/category/{c.slug}</td>
                            <td style={{ maxWidth: "340px", color: "#aaaaaa", fontSize: "11px" }}>
                              {c.description || "No description provided."}
                            </td>
                            <td style={{ fontWeight: 700 }}>{itemsCount} items</td>
                            <td>
                              <div className={styles.actionGroup}>
                                <button
                                  className={styles.smallBtn}
                                  onClick={() => {
                                    setEditingCategory({ ...c });
                                    setIsCategoryModalOpen(true);
                                  }}
                                >
                                  EDIT
                                </button>
                                <button
                                  className={styles.deleteBtn}
                                  onClick={() => handleDeleteCategory(c.id || c.slug, c.name)}
                                >
                                  DELETE
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* -------------------- ORDERS TAB -------------------- */}
            {activeTab === "orders" && (
              <div>
                <div className={styles.sectionHeader}>
                  <div>
                    <div className={styles.sectionTitle}>CUSTOMER ORDERS &amp; FULFILLMENT</div>
                    <div style={{ fontSize: "11px", color: "#888888", marginTop: "4px" }}>
                      Track buyer details, update shipping statuses, and view items ordered.
                    </div>
                  </div>
                </div>

                <div className={styles.controlsBar}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search by buyer name, phone, order ID..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#888888" }}>STATUS:</span>
                    <select
                      className={styles.filterSelect}
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                    >
                      <option value="ALL">ALL STATUSES</option>
                      <option value="confirmed">CONFIRMED</option>
                      <option value="processing">PROCESSING</option>
                      <option value="shipped">SHIPPED</option>
                      <option value="reached">REACHED</option>
                      <option value="delivered">DELIVERED</option>
                      <option value="cancelled">CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Order Date</th>
                        <th>Customer</th>
                        <th>Delivery Destination</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th>Fulfillment Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o) => (
                        <tr key={o.id}>
                          <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{o.id}</td>
                          <td style={{ fontSize: "11px", color: "#888888" }}>
                            {new Date(o.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{o.customer.fullName}</div>
                            <div style={{ fontSize: "10px", color: "#888888" }}>{o.customer.phone}</div>
                          </td>
                          <td style={{ fontSize: "11px" }}>
                            {o.customer.city}, {o.customer.state} ({o.customer.pincode})
                          </td>
                          <td style={{ fontWeight: 800 }}>₹{o.total.toLocaleString("en-IN")}</td>
                          <td>
                            <span className={styles.badge}>{o.payment_method}</span>
                          </td>
                          <td>
                            <select
                              value={o.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(o.id, e.target.value as StoreOrder["status"])
                              }
                              className={styles.fieldSelect}
                              style={{
                                padding: "4px 8px",
                                fontSize: "10px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                width: "auto",
                              }}
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="reached">Reached / Delivered</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td>
                            <div className={styles.actionGroup}>
                              <button
                                className={styles.smallBtn}
                                onClick={() => setSelectedOrder(o)}
                              >
                                VIEW
                              </button>
                              <button
                                className={styles.deleteBtn}
                                onClick={() => handleDeleteOrder(o.id)}
                              >
                                &times;
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* -------------------- COUPONS TAB -------------------- */}
            {activeTab === "coupons" && (
              <div>
                <div className={styles.sectionHeader}>
                  <div>
                    <div className={styles.sectionTitle}>DISCOUNT PROMO CODES</div>
                    <div style={{ fontSize: "11px", color: "#888888", marginTop: "4px" }}>
                      Create and manage percentage discounts, flat cashbacks, or free shipping vouchers.
                    </div>
                  </div>
                  <button
                    className={styles.primaryButton}
                    onClick={() => {
                      setEditingCoupon({
                        code: "",
                        type: "percentage",
                        value: 10,
                        minOrder: 1000,
                        description: "",
                        active: true,
                      });
                      setIsCouponModalOpen(true);
                    }}
                  >
                    + CREATE PROMO CODE
                  </button>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Promo Code</th>
                        <th>Type</th>
                        <th>Discount Value</th>
                        <th>Min Order Required</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map((c) => (
                        <tr key={c.code}>
                          <td style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "13px" }}>
                            {c.code}
                          </td>
                          <td>
                            <span className={styles.badge}>{c.type.replace("_", " ")}</span>
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            {c.type === "percentage"
                              ? `${c.value}% OFF`
                              : c.type === "fixed"
                              ? `₹${c.value} FLAT OFF`
                              : "FREE SHIPPING"}
                          </td>
                          <td>₹{c.minOrder ? c.minOrder.toLocaleString("en-IN") : "0"}</td>
                          <td style={{ fontSize: "11px", color: "#aaaaaa" }}>{c.description}</td>
                          <td>
                            <button
                              className={`${styles.badge} ${
                                c.active ? styles.badgeSuccess : styles.badgeDanger
                              }`}
                              style={{ cursor: "pointer" }}
                              onClick={() => handleToggleCoupon(c.code, c.active)}
                            >
                              {c.active ? "ACTIVE (CLICK TO DISABLE)" : "INACTIVE (CLICK TO ENABLE)"}
                            </button>
                          </td>
                          <td>
                            <div className={styles.actionGroup}>
                              <button
                                className={styles.smallBtn}
                                onClick={() => {
                                  setEditingCoupon({ ...c });
                                  setIsCouponModalOpen(true);
                                }}
                              >
                                EDIT
                              </button>
                              <button
                                className={styles.deleteBtn}
                                onClick={() => handleDeleteCoupon(c.code)}
                              >
                                DELETE
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* -------------------- SETTINGS TAB -------------------- */}
            {activeTab === "settings" && (
              <div style={{ maxWidth: "720px" }}>
                <div className={styles.sectionHeader}>
                  <div>
                    <div className={styles.sectionTitle}>STOREFRONT &amp; ANNOUNCEMENT SETTINGS</div>
                    <div style={{ fontSize: "11px", color: "#888888", marginTop: "4px" }}>
                      Customize the top announcement ticker banner text, support contact, and master passkey.
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveSettings} className={styles.formGrid}>
                  <div className={styles.fullSpan}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Top Announcement Bar Ticker Text</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={settings.announcementText}
                        onChange={(e) =>
                          setSettings({ ...settings, announcementText: e.target.value })
                        }
                        placeholder="e.g. COMPLIMENTARY SHIPPING ACROSS INDIA • COD AVAILABLE"
                        required
                      />
                      <span style={{ fontSize: "10px", color: "#666666" }}>
                        Displayed at the very top of every storefront page.
                      </span>
                    </div>
                  </div>

                  <div className={styles.fullSpan}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Store Notice / Dispatch Guarantee</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={settings.storeNotice}
                        onChange={(e) => setSettings({ ...settings, storeNotice: e.target.value })}
                        placeholder="e.g. All orders placed today are dispatched within 24 hours."
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Customer Support Phone / WhatsApp</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={settings.supportPhone}
                      onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Customer Support Email</label>
                    <input
                      type="email"
                      className={styles.fieldInput}
                      value={settings.supportEmail}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      placeholder="concierge@greeno.in"
                    />
                  </div>

                  <div className={styles.fullSpan}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Master Admin Passkey</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={settings.adminPasskey}
                        onChange={(e) =>
                          setSettings({ ...settings, adminPasskey: e.target.value })
                        }
                        placeholder="e.g. aman2026"
                        required
                      />
                      <span style={{ fontSize: "10px", color: "#666666" }}>
                        Used to authenticate and unlock this admin dashboard.
                      </span>
                    </div>
                  </div>

                  <div className={styles.fullSpan} style={{ marginTop: "16px" }}>
                    <button type="submit" className={styles.primaryButton}>
                      SAVE STOREFRONT SETTINGS
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* -------------------- SMS GATEWAY TAB -------------------- */}
            {activeTab === "sms" && (
              <div style={{ maxWidth: "800px" }}>
                <div className={styles.sectionHeader}>
                  <div>
                    <div className={styles.sectionTitle}>REAL-TIME SMS GATEWAY (CARRIER INTEGRATION)</div>
                    <div style={{ fontSize: "11px", color: "#888888", marginTop: "4px" }}>
                      Configure cellular carrier SMS credentials to transmit live 6-digit OTP verification codes directly to mobile phones across India (Airtel, Jio, Vi, BSNL).
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div
                  style={{
                    background: settings.smsApiKey ? "#0a2912" : "#2a1c06",
                    border: settings.smsApiKey ? "1px solid #166534" : "1px solid #78350f",
                    padding: "16px 20px",
                    marginBottom: "28px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        letterSpacing: "0.12em",
                        color: settings.smsApiKey ? "#4ade80" : "#f59e0b",
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      {settings.smsApiKey
                        ? `● GATEWAY ACTIVE: ${(settings.smsProvider || "fast2sms").toUpperCase()}`
                        : "● GATEWAY NOT CONFIGURED (PASSCODES DISPLAYED ON SCREEN)"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#cccccc", lineHeight: "1.4" }}>
                      {settings.smsApiKey
                        ? "Real SMS OTPs will be dispatched to customers' mobile phones upon checkout."
                        : "Add your free Fast2SMS API key below to send real SMS text messages over cellular networks."}
                    </div>
                  </div>

                  <span
                    style={{
                      background: settings.smsApiKey ? "#22c55e" : "#f59e0b",
                      color: "#000000",
                      padding: "4px 10px",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                    }}
                  >
                    {settings.smsApiKey ? "CARRIER LIVE" : "ACTION REQUIRED"}
                  </span>
                </div>

                {/* Configuration Form */}
                <form onSubmit={handleSaveSettings} className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>SMS Gateway Provider</label>
                    <select
                      className={styles.fieldSelect}
                      value={settings.smsProvider || "fast2sms"}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          smsProvider: e.target.value as any,
                        })
                      }
                    >
                      <option value="fast2sms">Fast2SMS (Recommended for India — Free &amp; Instant)</option>
                      <option value="twilio">Twilio (Global International Carrier)</option>
                      <option value="2factor">2Factor.in (India Carrier Gateway)</option>
                    </select>
                  </div>

                  {/* Fast2SMS or 2Factor API Key Field */}
                  {(settings.smsProvider === "fast2sms" || !settings.smsProvider || settings.smsProvider === "2factor") && (
                    <div className={styles.fullSpan}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                          {settings.smsProvider === "2factor" ? "2Factor.in API Key" : "Fast2SMS Authorization API Key *"}
                        </label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={settings.smsApiKey || ""}
                          onChange={(e) => setSettings({ ...settings, smsApiKey: e.target.value })}
                          placeholder="Paste your API key here e.g. a8b9c0d1e2f3g4h5..."
                        />
                        <span style={{ fontSize: "10px", color: "#888888" }}>
                          Used to transmit OTP SMS directly to customer phones via carrier towers.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Twilio Credentials Fields */}
                  {settings.smsProvider === "twilio" && (
                    <>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Twilio Account SID</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={settings.twilioSid || ""}
                          onChange={(e) => setSettings({ ...settings, twilioSid: e.target.value })}
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        />
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Twilio Auth Token</label>
                        <input
                          type="password"
                          className={styles.fieldInput}
                          value={settings.twilioToken || ""}
                          onChange={(e) => setSettings({ ...settings, twilioToken: e.target.value })}
                          placeholder="Twilio secret token"
                        />
                      </div>

                      <div className={styles.fullSpan}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel}>Twilio Sender Phone Number</label>
                          <input
                            type="text"
                            className={styles.fieldInput}
                            value={settings.twilioFrom || ""}
                            onChange={(e) => setSettings({ ...settings, twilioFrom: e.target.value })}
                            placeholder="+1234567890"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Fast2SMS Step-by-Step Guide Box */}
                  {(settings.smsProvider === "fast2sms" || !settings.smsProvider) && (
                    <div className={styles.fullSpan}>
                      <div
                        style={{
                          background: "#111111",
                          border: "1px solid #222222",
                          padding: "16px 20px",
                          fontSize: "12px",
                          lineHeight: "1.6",
                          color: "#aaaaaa",
                        }}
                      >
                        <div style={{ fontWeight: 800, color: "#ffffff", letterSpacing: "0.1em", marginBottom: "8px", fontSize: "11px" }}>
                          👉 HOW TO GET YOUR FREE FAST2SMS API KEY (TAKES 30 SECONDS):
                        </div>
                        <ol style={{ margin: "0 0 10px", paddingLeft: "18px" }}>
                          <li style={{ marginBottom: "4px" }}>
                            Go to{" "}
                            <a
                              href="https://www.fast2sms.com"
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#ffffff", fontWeight: 700, textDecoration: "underline" }}
                            >
                              fast2sms.com &#8599;
                            </a>{" "}
                            and sign up using your mobile number (free wallet balance automatically added).
                          </li>
                          <li style={{ marginBottom: "4px" }}>
                            In the left-hand sidebar menu, click on <strong>Dev API</strong>.
                          </li>
                          <li style={{ marginBottom: "4px" }}>
                            Copy your <strong>Authorization Key</strong>.
                          </li>
                          <li>
                            Paste it into the field above and click <strong>SAVE SMS CONFIGURATION</strong>.
                          </li>
                        </ol>
                        <div style={{ fontSize: "11px", color: "#888888" }}>
                          <em>Note: Fast2SMS has a pre-approved OTP route that delivers SMS across Indian networks instantly without requiring business DLT approval.</em>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={styles.fullSpan} style={{ marginTop: "12px" }}>
                    <button type="submit" className={styles.primaryButton}>
                      SAVE SMS CONFIGURATION
                    </button>
                  </div>
                </form>

                {/* -------------------- LIVE TEST SMS DISPATCHER -------------------- */}
                <div
                  style={{
                    marginTop: "48px",
                    paddingTop: "32px",
                    borderTop: "1px solid #222222",
                  }}
                >
                  <div className={styles.sectionHeader}>
                    <div>
                      <div className={styles.sectionTitle}>LIVE CARRIER TEST DISPATCHER</div>
                      <div style={{ fontSize: "11px", color: "#888888", marginTop: "4px" }}>
                        Send an immediate test SMS to your physical phone to verify cellular tower delivery.
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={handleTestSms}
                    style={{
                      background: "#0c0c0c",
                      border: "1px solid #262626",
                      padding: "24px 20px",
                    }}
                  >
                    <div className={styles.fieldGroup} style={{ marginBottom: "16px" }}>
                      <label className={styles.fieldLabel}>Recipient Mobile Number (+91 India)</label>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <span
                          style={{
                            background: "#1a1a1a",
                            border: "1px solid #333333",
                            padding: "12px 14px",
                            fontSize: "13px",
                            color: "#888888",
                            fontWeight: 700,
                          }}
                        >
                          +91
                        </span>
                        <input
                          type="tel"
                          className={styles.fieldInput}
                          placeholder="e.g. 9876543210"
                          value={testPhone}
                          onChange={(e) => setTestPhone(e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={testSmsLoading || testPhone.replace(/\D/g, "").length < 10}
                      className={styles.primaryButton}
                      style={{
                        background: testPhone.replace(/\D/g, "").length >= 10 ? "#ffffff" : "#333333",
                        color: testPhone.replace(/\D/g, "").length >= 10 ? "#000000" : "#888888",
                        cursor: testPhone.replace(/\D/g, "").length >= 10 ? "pointer" : "not-allowed",
                      }}
                    >
                      {testSmsLoading ? "TRANSMITTING TO CELL TOWER..." : "SEND REAL TEST SMS NOW"}
                    </button>

                    {testSmsResult && (
                      <div
                        style={{
                          marginTop: "20px",
                          padding: "16px",
                          background: testSmsResult.success ? "#052e16" : "#2e0808",
                          border: testSmsResult.success ? "1px solid #15803d" : "1px solid #991b1b",
                          color: testSmsResult.success ? "#86efac" : "#fca5a5",
                          fontSize: "12px",
                          lineHeight: "1.5",
                        }}
                      >
                        <div style={{ fontWeight: 800, letterSpacing: "0.08em", marginBottom: "6px" }}>
                          {testSmsResult.success
                            ? "✓ TEST SMS TRANSMITTED SUCCESSFULLY"
                            : "⚠️ SMS TRANSMISSION FAILED"}
                        </div>
                        <div>{testSmsResult.message}</div>
                        {testSmsResult.details && (
                          <pre
                            style={{
                              marginTop: "10px",
                              padding: "10px",
                              background: "rgba(0,0,0,0.5)",
                              fontSize: "10px",
                              overflowX: "auto",
                              color: "#cccccc",
                            }}
                          >
                            {JSON.stringify(testSmsResult.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* -------------------- EMAIL GATEWAY TAB -------------------- */}
            {activeTab === "email" && (
              <div style={{ maxWidth: "800px" }}>
                <div className={styles.sectionHeader}>
                  <div>
                    <div className={styles.sectionTitle}>REAL-TIME EMAIL GATEWAY (PASSCODE DISPATCH)</div>
                    <div style={{ fontSize: "11px", color: "#888888", marginTop: "4px" }}>
                      Configure email SMTP or API service to transmit real 6-digit verification passcodes directly to customer inboxes (Gmail, Yahoo, Outlook, Apple Mail).
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div
                  style={{
                    background: settings.smtpUser || settings.brevoApiKey || settings.resendApiKey ? "#0a2912" : "#2a1c06",
                    border: settings.smtpUser || settings.brevoApiKey || settings.resendApiKey ? "1px solid #166534" : "1px solid #78350f",
                    padding: "16px 20px",
                    marginBottom: "28px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        letterSpacing: "0.12em",
                        color: settings.smtpUser || settings.brevoApiKey || settings.resendApiKey ? "#4ade80" : "#f59e0b",
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      {settings.smtpUser || settings.brevoApiKey || settings.resendApiKey
                        ? `● GATEWAY ACTIVE: ${(settings.emailProvider || "GMAIL").toUpperCase()}`
                        : "● GATEWAY AWAITING SETUP (PASSCODES INSTANTLY AVAILABLE ON SCREEN)"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#cccccc", lineHeight: "1.4" }}>
                      {settings.smtpUser || settings.brevoApiKey || settings.resendApiKey
                        ? "Real branded emails with 6-digit security passcodes are dispatched to users during login and verification."
                        : "Enter your Gmail App Password or Brevo key below to transmit real emails directly to personal inboxes."}
                    </div>
                  </div>

                  <span
                    style={{
                      background: settings.smtpUser || settings.brevoApiKey || settings.resendApiKey ? "#22c55e" : "#f59e0b",
                      color: "#000000",
                      padding: "4px 10px",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                    }}
                  >
                    {settings.smtpUser || settings.brevoApiKey || settings.resendApiKey ? "LIVE INBOX DISPATCH" : "ACTION REQUIRED"}
                  </span>
                </div>

                {/* Configuration Form */}
                <form onSubmit={handleSaveSettings} className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Email Provider / Dispatch Protocol</label>
                    <select
                      className={styles.fieldSelect}
                      value={settings.emailProvider || "gmail"}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          emailProvider: e.target.value as any,
                          smtpHost: e.target.value === "gmail" ? "smtp.gmail.com" : settings.smtpHost,
                          smtpPort: e.target.value === "gmail" ? 465 : settings.smtpPort || 587,
                          smtpSecure: e.target.value === "gmail" ? true : settings.smtpSecure,
                        })
                      }
                    >
                      <option value="gmail">Gmail SMTP (Recommended — Fast, Free via Google App Password)</option>
                      <option value="brevo">Brevo / Sendinblue (Free 300 emails/day, no DNS setup needed)</option>
                      <option value="resend">Resend API (Developer Email Delivery)</option>
                      <option value="smtp">Custom SMTP Server (Any host, port, credentials)</option>
                    </select>
                  </div>

                  {/* Gmail or Custom SMTP settings */}
                  {(settings.emailProvider === "gmail" || settings.emailProvider === "smtp" || !settings.emailProvider) && (
                    <>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>SMTP Host *</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={settings.smtpHost || (settings.emailProvider === "gmail" ? "smtp.gmail.com" : "")}
                          onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                          placeholder="smtp.gmail.com"
                          required
                        />
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>SMTP Port *</label>
                        <input
                          type="number"
                          className={styles.fieldInput}
                          value={settings.smtpPort || (settings.emailProvider === "gmail" ? 465 : 587)}
                          onChange={(e) => setSettings({ ...settings, smtpPort: Number(e.target.value) })}
                          placeholder="465 or 587"
                          required
                        />
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>SMTP Username / Gmail Address *</label>
                        <input
                          type="email"
                          className={styles.fieldInput}
                          value={settings.smtpUser || ""}
                          onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                          placeholder="yourname@gmail.com"
                          required
                        />
                        <span style={{ fontSize: "10px", color: "#888888" }}>
                          The email address used to send out security passcodes.
                        </span>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>
                          {settings.emailProvider === "gmail" ? "Google 16-Character App Password *" : "SMTP Password *"}
                        </label>
                        <input
                          type="password"
                          className={styles.fieldInput}
                          value={settings.smtpPass || ""}
                          onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                          placeholder={settings.emailProvider === "gmail" ? "xxxx xxxx xxxx xxxx" : "Your SMTP password"}
                          required
                        />
                        <span style={{ fontSize: "10px", color: "#888888" }}>
                          {settings.emailProvider === "gmail"
                            ? "Created under your Google Account Security settings."
                            : "Your mail server secret."}
                        </span>
                      </div>

                      <div className={styles.fullSpan}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel}>From Display Header</label>
                          <input
                            type="text"
                            className={styles.fieldInput}
                            value={settings.smtpFrom || ""}
                            onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })}
                            placeholder="GreenO Security <concierge@greeno.in>"
                          />
                        </div>
                      </div>

                      {/* Gmail Step-by-Step Guide Box */}
                      {settings.emailProvider === "gmail" && (
                        <div className={styles.fullSpan}>
                          <div
                            style={{
                              background: "#111111",
                              border: "1px solid #222222",
                              padding: "16px 20px",
                              fontSize: "12px",
                              lineHeight: "1.6",
                              color: "#aaaaaa",
                            }}
                          >
                            <div style={{ fontWeight: 800, color: "#ffffff", letterSpacing: "0.1em", marginBottom: "8px", fontSize: "11px" }}>
                              👉 HOW TO GET A FREE GMAIL APP PASSWORD (TAKES 30 SECONDS):
                            </div>
                            <ol style={{ margin: "0 0 10px", paddingLeft: "18px" }}>
                              <li style={{ marginBottom: "4px" }}>
                                Open your Google Account at{" "}
                                <a
                                  href="https://myaccount.google.com/security"
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: "#ffffff", fontWeight: 700, textDecoration: "underline" }}
                                >
                                  myaccount.google.com/security &#8599;
                                </a>
                              </li>
                              <li style={{ marginBottom: "4px" }}>
                                Ensure <strong>2-Step Verification</strong> is enabled on your Google account.
                              </li>
                              <li style={{ marginBottom: "4px" }}>
                                In the search bar at the top of your Google Account, search for <strong>App Passwords</strong> (or visit <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: "#ffffff", textDecoration: "underline" }}>myaccount.google.com/apppasswords</a>).
                              </li>
                              <li style={{ marginBottom: "4px" }}>
                                Enter App Name: <strong>GreenO</strong>, then click <strong>Create</strong>.
                              </li>
                              <li>
                                Copy the 16-character password (e.g. <code>abcd efgh ijkl mnop</code>), paste it into the field above, and click <strong>SAVE EMAIL CONFIGURATION</strong>.
                              </li>
                            </ol>
                            <div style={{ fontSize: "11px", color: "#888888" }}>
                              <em>Note: Real emails will immediately start landing in your customers' primary Gmail inboxes without landing in spam!</em>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Brevo Settings */}
                  {settings.emailProvider === "brevo" && (
                    <div className={styles.fullSpan}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Brevo (Sendinblue) API Key *</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={settings.brevoApiKey || ""}
                          onChange={(e) => setSettings({ ...settings, brevoApiKey: e.target.value })}
                          placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          required
                        />
                        <span style={{ fontSize: "10px", color: "#888888" }}>
                          Get a free key from <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noreferrer" style={{ color: "#ffffff", textDecoration: "underline" }}>brevo.com</a> (300 free emails/day).
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Resend Settings */}
                  {settings.emailProvider === "resend" && (
                    <div className={styles.fullSpan}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Resend API Key *</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={settings.resendApiKey || ""}
                          onChange={(e) => setSettings({ ...settings, resendApiKey: e.target.value })}
                          placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                          required
                        />
                        <span style={{ fontSize: "10px", color: "#888888" }}>
                          Get an API key from <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" style={{ color: "#ffffff", textDecoration: "underline" }}>resend.com</a>.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className={styles.fullSpan} style={{ marginTop: "12px" }}>
                    <button type="submit" className={styles.primaryButton}>
                      SAVE EMAIL CONFIGURATION
                    </button>
                  </div>
                </form>

                {/* -------------------- LIVE TEST EMAIL DISPATCHER -------------------- */}
                <div
                  style={{
                    marginTop: "48px",
                    paddingTop: "32px",
                    borderTop: "1px solid #222222",
                  }}
                >
                  <div className={styles.sectionHeader}>
                    <div>
                      <div className={styles.sectionTitle}>LIVE EMAIL TEST DISPATCHER</div>
                      <div style={{ fontSize: "11px", color: "#888888", marginTop: "4px" }}>
                        Send a live test verification passcode to your personal email to verify inbox delivery.
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={handleTestEmail}
                    style={{
                      background: "#0c0c0c",
                      border: "1px solid #262626",
                      padding: "24px 20px",
                    }}
                  >
                    <div className={styles.fieldGroup} style={{ marginBottom: "16px" }}>
                      <label className={styles.fieldLabel}>Recipient Email Address</label>
                      <input
                        type="email"
                        className={styles.fieldInput}
                        placeholder="e.g. yourname@gmail.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={testEmailLoading || !testEmail.includes("@")}
                      className={styles.primaryButton}
                      style={{
                        background: testEmail.includes("@") ? "#ffffff" : "#333333",
                        color: testEmail.includes("@") ? "#000000" : "#888888",
                        cursor: testEmail.includes("@") ? "pointer" : "not-allowed",
                      }}
                    >
                      {testEmailLoading ? "DISPATCHING REAL EMAIL..." : "SEND REAL TEST EMAIL NOW"}
                    </button>

                    {testEmailResult && (
                      <div
                        style={{
                          marginTop: "20px",
                          padding: "16px",
                          background: testEmailResult.sent ? "#0a2912" : "#2a1212",
                          border: testEmailResult.sent ? "1px solid #166534" : "1px solid #7f1d1d",
                          color: testEmailResult.sent ? "#4ade80" : "#fca5a5",
                          fontSize: "12px",
                          lineHeight: "1.5",
                        }}
                      >
                        <div style={{ fontWeight: 800, marginBottom: "4px" }}>
                          {testEmailResult.sent
                            ? `✓ TEST EMAIL DELIVERED VIA ${(testEmailResult.provider || "EMAIL").toUpperCase()}`
                            : "⚠️ EMAIL DISPATCH NOTICE"}
                        </div>
                        <div>{testEmailResult.message}</div>
                        {testEmailResult.duration && (
                          <div style={{ fontSize: "10px", color: "#888888", marginTop: "4px" }}>
                            Delivery speed: {testEmailResult.duration}
                          </div>
                        )}
                        {testEmailResult.error && (
                          <div style={{ fontSize: "11px", color: "#f87171", marginTop: "6px" }}>
                            <strong>Diagnostic:</strong> {testEmailResult.error}
                          </div>
                        )}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ==================== PRODUCT MODAL ==================== */}
      {isProductModalOpen && editingProduct && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalWindow}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                {editingProduct.id ? `EDIT PRODUCT: ${editingProduct.name}` : "ADD NEW STREETWEAR PRODUCT"}
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setIsProductModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.fullSpan}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Product Title / Name *</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={editingProduct.name || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        placeholder="e.g. Oversized Heavyweight Tee"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Price (₹ INR) *</label>
                    <input
                      type="number"
                      className={styles.fieldInput}
                      value={editingProduct.price ?? 2499}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                      }
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Stock Available (Units) *</label>
                    <input
                      type="number"
                      className={styles.fieldInput}
                      value={editingProduct.stock ?? 50}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })
                      }
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Collection / Category *</label>
                    <select
                      className={styles.fieldSelect}
                      value={editingProduct.category_slug || ""}
                      onChange={(e) => {
                        const selectedSlug = e.target.value;
                        const match = categories.find((c) => c.slug === selectedSlug);
                        setEditingProduct({
                          ...editingProduct,
                          category_slug: selectedSlug,
                          category_name: match ? match.name : selectedSlug.toUpperCase(),
                          category_id: match ? match.id : null,
                        });
                      }}
                    >
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Colorway</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={editingProduct.color || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, color: e.target.value })}
                      placeholder="e.g. BLACK, VINTAGE WASH, OLIVE"
                    />
                  </div>

                  <div className={styles.fullSpan}>
                    <div className={styles.fieldGroup}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <label className={styles.fieldLabel} style={{ margin: 0 }}>
                          PRODUCT PHOTOS &amp; GALLERY (DIRECT FILE UPLOADS) *
                        </label>
                        <span style={{ fontSize: "10px", color: "#888888", letterSpacing: "0.08em" }}>
                          {editingProduct.images?.length || (editingProduct.image ? 1 : 0)} PHOTO(S) ATTACHED
                        </span>
                      </div>

                      {/* Direct File Drag & Drop / Multi-Select Box */}
                      <div
                        style={{
                          border: "2px dashed #333333",
                          background: "#0a0a0a",
                          padding: "24px 20px",
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          position: "relative",
                        }}
                      >
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          id="product-photo-upload"
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            opacity: 0,
                            cursor: "pointer",
                          }}
                          onChange={(e) => handleFileUpload(e.target.files)}
                          disabled={uploadingImages}
                        />
                        <div style={{ pointerEvents: "none" }}>
                          <div style={{ fontSize: "24px", marginBottom: "8px" }}>📁</div>
                          <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.12em", color: "#ffffff", textTransform: "uppercase" }}>
                            {uploadingImages ? "UPLOADING PHOTOS... PLEASE WAIT" : "+ CLICK TO UPLOAD MULTIPLE PHOTOS FROM COMPUTER"}
                          </div>
                          <div style={{ fontSize: "11px", color: "#888888", marginTop: "6px" }}>
                            Select one or more photos at once (Front, Back, Fit, Details). Supports JPG, PNG, WEBP, JFIF.
                          </div>
                        </div>
                      </div>

                      {uploadError && (
                        <div style={{ color: "#ff4444", fontSize: "11px", marginTop: "8px" }}>
                          ⚠️ {uploadError}
                        </div>
                      )}

                      {/* Photo Gallery Grid with Cover Badge and Re-ordering */}
                      {((editingProduct.images && editingProduct.images.length > 0) || editingProduct.image) && (
                        <div style={{ marginTop: "18px" }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#aaaaaa", marginBottom: "10px", textTransform: "uppercase" }}>
                            ATTACHED PHOTOS (FIRST PHOTO IS STOREFRONT PRIMARY COVER):
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fill, minmax(115px, 1fr))",
                              gap: "12px",
                            }}
                          >
                            {(editingProduct.images && editingProduct.images.length > 0
                              ? editingProduct.images
                              : [editingProduct.image || "/black-tee.jfif"]
                            ).map((imgUrl, idx) => (
                              <div
                                key={`${imgUrl}-${idx}`}
                                style={{
                                  position: "relative",
                                  border: idx === 0 ? "2px solid #ffffff" : "1px solid #333333",
                                  background: "#111111",
                                  display: "flex",
                                  flexDirection: "column",
                                  overflow: "hidden",
                                }}
                              >
                                {idx === 0 && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: 4,
                                      left: 4,
                                      background: "#ffffff",
                                      color: "#000000",
                                      fontSize: "8px",
                                      fontWeight: 900,
                                      letterSpacing: "0.1em",
                                      padding: "2px 6px",
                                      zIndex: 2,
                                    }}
                                  >
                                    ★ COVER
                                  </div>
                                )}

                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imgUrl}
                                  alt={`Product image ${idx + 1}`}
                                  style={{
                                    width: "100%",
                                    height: "135px",
                                    objectFit: "cover",
                                    display: "block",
                                  }}
                                />

                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    background: "#000000",
                                    padding: "6px 8px",
                                    borderTop: "1px solid #222222",
                                  }}
                                >
                                  {idx > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => handleSetCoverImage(idx)}
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#ffffff",
                                        fontSize: "9px",
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        padding: "0",
                                        letterSpacing: "0.05em",
                                        textDecoration: "underline",
                                      }}
                                      title="Set as primary cover photo"
                                    >
                                      SET COVER
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: "9px", color: "#888888", fontWeight: 700 }}>
                                      PRIMARY
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(idx)}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "#ff4444",
                                      fontSize: "11px",
                                      fontWeight: 800,
                                      cursor: "pointer",
                                      padding: "0",
                                    }}
                                    title="Delete photo"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Material / Composition</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={editingProduct.material || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, material: e.target.value })}
                      placeholder="100% Cotton"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Fabric Weight</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={editingProduct.fabric || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, fabric: e.target.value })}
                      placeholder="240 GSM Combed Jersey"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Fit Type</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={editingProduct.fit || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, fit: e.target.value })}
                      placeholder="Oversized Boxy Fit"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Product Code / SKU</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={editingProduct.product_no || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, product_no: e.target.value })}
                      placeholder="BT-001"
                    />
                  </div>

                  <div className={styles.fullSpan}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Product Description</label>
                      <textarea
                        rows={3}
                        className={styles.fieldTextarea}
                        value={editingProduct.description || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                        placeholder="Detailed editorial description..."
                      />
                    </div>
                  </div>

                  <div className={styles.fullSpan} style={{ marginTop: "12px" }}>
                    <div style={{
                      background: "#111111",
                      border: "1px solid #282828",
                      padding: "16px 18px",
                      borderRadius: "0px"
                    }}>
                      <div style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        color: "#ffffff",
                        marginBottom: "6px",
                        textTransform: "uppercase"
                      }}>
                        STOREFRONT SECTION VISIBILITY & CUSTOMIZATION
                      </div>
                      <div style={{ fontSize: "11px", color: "#888888", marginBottom: "16px" }}>
                        Configure exactly where this product appears across your store:
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                        {/* 1. NEW IN SECTION */}
                        <label style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          background: editingProduct.is_new ? "#181818" : "#0d0d0d",
                          border: `1px solid ${editingProduct.is_new ? "#ffffff" : "#222222"}`,
                          padding: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}>
                          <input
                            type="checkbox"
                            checked={Boolean(editingProduct.is_new)}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, is_new: e.target.checked })
                            }
                            style={{ marginTop: "2px", accentColor: "#ffffff" }}
                          />
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.08em" }}>
                              NEW IN SECTION
                            </div>
                            <div style={{ fontSize: "10px", color: "#777777", marginTop: "2px", lineHeight: "1.3" }}>
                              Shows product in homepage &ldquo;NEW ARRIVALS&rdquo; marquee and &ldquo;NEW IN&rdquo; catalogue filters.
                            </div>
                          </div>
                        </label>

                        {/* 2. TRENDING SECTION */}
                        <label style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          background: editingProduct.is_trending ? "#181818" : "#0d0d0d",
                          border: `1px solid ${editingProduct.is_trending ? "#ffffff" : "#222222"}`,
                          padding: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}>
                          <input
                            type="checkbox"
                            checked={Boolean(editingProduct.is_trending)}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, is_trending: e.target.checked })
                            }
                            style={{ marginTop: "2px", accentColor: "#ffffff" }}
                          />
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.08em" }}>
                              TRENDING SECTION
                            </div>
                            <div style={{ fontSize: "10px", color: "#777777", marginTop: "2px", lineHeight: "1.3" }}>
                              Shows product in homepage &ldquo;TRENDING&rdquo; featured spotlight slider and trending filters.
                            </div>
                          </div>
                        </label>

                        {/* 3. CURATED PRODUCTS */}
                        <label style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          background: editingProduct.is_featured ? "#181818" : "#0d0d0d",
                          border: `1px solid ${editingProduct.is_featured ? "#ffffff" : "#222222"}`,
                          padding: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}>
                          <input
                            type="checkbox"
                            checked={Boolean(editingProduct.is_featured)}
                            onChange={(e) =>
                              setEditingProduct({ ...editingProduct, is_featured: e.target.checked })
                            }
                            style={{ marginTop: "2px", accentColor: "#ffffff" }}
                          />
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.08em" }}>
                              CURATED PRODUCTS
                            </div>
                            <div style={{ fontSize: "10px", color: "#777777", marginTop: "2px", lineHeight: "1.3" }}>
                              Featured prominently in homepage &ldquo;CURATED CATALOGUE&rdquo; grid.
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Category Live Indicator */}
                      <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #222222", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", fontSize: "11px" }}>
                        <span style={{ color: "#777777" }}>Assigned Category Section:</span>
                        <strong style={{ color: "#ffffff", letterSpacing: "0.08em" }}>
                          {editingProduct.category_name ? `${editingProduct.category_name} (/category/${editingProduct.category_slug})` : "SELECT A CATEGORY ABOVE"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => setIsProductModalOpen(false)}
                >
                  CANCEL
                </button>
                <button type="submit" className={styles.primaryButton}>
                  SAVE PRODUCT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CATEGORY MODAL ==================== */}
      {isCategoryModalOpen && editingCategory && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalWindow}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                {editingCategory.id ? `EDIT COLLECTION: ${editingCategory.name}` : "ADD NEW COLLECTION"}
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setIsCategoryModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Collection Name *</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={editingCategory.name || ""}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          name: e.target.value,
                          slug: editingCategory.slug || e.target.value.toLowerCase().replace(/\s+/g, "-"),
                        })
                      }
                      placeholder="e.g. JACKETS"
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>URL Slug *</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={editingCategory.slug || ""}
                      onChange={(e) =>
                        setEditingCategory({ ...editingCategory, slug: e.target.value })
                      }
                      placeholder="e.g. jackets"
                      required
                    />
                  </div>

                  <div className={styles.fullSpan}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>COLLECTION COVER PHOTO (BROWSE &amp; UPLOAD)</label>

                      <div
                        style={{
                          border: "2px dashed #333333",
                          background: "#0a0a0a",
                          padding: "20px",
                          textAlign: "center",
                          cursor: "pointer",
                          position: "relative",
                          marginBottom: "12px",
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            opacity: 0,
                            cursor: "pointer",
                          }}
                          onChange={(e) => handleCategoryCoverUpload(e.target.files)}
                          disabled={uploadingCategoryCover}
                        />
                        <div style={{ pointerEvents: "none" }}>
                          <div style={{ fontSize: "22px", marginBottom: "6px" }}>📁</div>
                          <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.12em", color: "#ffffff", textTransform: "uppercase" }}>
                            {uploadingCategoryCover ? "UPLOADING COVER PHOTO..." : "+ BROWSE & UPLOAD COVER PHOTO FROM COMPUTER"}
                          </div>
                          <div style={{ fontSize: "10px", color: "#888888", marginTop: "4px" }}>
                            Supports JPG, PNG, WEBP, JFIF. Directly uploaded and formatted for this collection.
                          </div>
                        </div>
                      </div>

                      {categoryUploadError && (
                        <div style={{ color: "#ff4444", fontSize: "11px", marginBottom: "10px" }}>
                          ⚠️ {categoryUploadError}
                        </div>
                      )}

                      {editingCategory.image && (
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "#111111", padding: "10px 14px", border: "1px solid #222222" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={editingCategory.image}
                            alt="Cover preview"
                            style={{ width: "50px", height: "50px", objectFit: "cover", border: "1px solid #333333" }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#ffffff" }}>ACTIVE COVER PHOTO</div>
                            <div style={{ fontSize: "10px", color: "#777777", wordBreak: "break-all" }}>{editingCategory.image}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingCategory({ ...editingCategory, image: "" })}
                            className={styles.deleteBtn}
                            style={{ padding: "4px 8px", fontSize: "10px" }}
                          >
                            REMOVE
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.fullSpan}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Collection Description</label>
                      <textarea
                        rows={2}
                        className={styles.fieldTextarea}
                        value={editingCategory.description || ""}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, description: e.target.value })
                        }
                        placeholder="Curated luxury streetwear drop..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  CANCEL
                </button>
                <button type="submit" className={styles.primaryButton}>
                  SAVE COLLECTION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== COUPON MODAL ==================== */}
      {isCouponModalOpen && editingCoupon && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalWindow}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                {editingCoupon.code ? `EDIT PROMO CODE: ${editingCoupon.code}` : "CREATE NEW DISCOUNT CODE"}
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setIsCouponModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCoupon}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Coupon Code *</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={editingCoupon.code || ""}
                      onChange={(e) =>
                        setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g. FLASH25"
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Discount Type *</label>
                    <select
                      className={styles.fieldSelect}
                      value={editingCoupon.type || "percentage"}
                      onChange={(e) =>
                        setEditingCoupon({
                          ...editingCoupon,
                          type: e.target.value as StoreCoupon["type"],
                        })
                      }
                    >
                      <option value="percentage">Percentage (%) Off</option>
                      <option value="fixed">Flat Amount (₹) Off</option>
                      <option value="free_shipping">Free Express Shipping</option>
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                      {editingCoupon.type === "percentage"
                        ? "Discount Percentage (%) *"
                        : "Flat Amount (₹) *"}
                    </label>
                    <input
                      type="number"
                      className={styles.fieldInput}
                      value={editingCoupon.value ?? 10}
                      onChange={(e) =>
                        setEditingCoupon({ ...editingCoupon, value: Number(e.target.value) })
                      }
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Minimum Cart Value Required (₹)</label>
                    <input
                      type="number"
                      className={styles.fieldInput}
                      value={editingCoupon.minOrder ?? 0}
                      onChange={(e) =>
                        setEditingCoupon({ ...editingCoupon, minOrder: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div className={styles.fullSpan}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Description / Terms</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={editingCoupon.description || ""}
                        onChange={(e) =>
                          setEditingCoupon({ ...editingCoupon, description: e.target.value })
                        }
                        placeholder="e.g. 25% off on all streetwear orders"
                      />
                    </div>
                  </div>

                  <div className={styles.fullSpan}>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={editingCoupon.active !== false}
                        onChange={(e) =>
                          setEditingCoupon({ ...editingCoupon, active: e.target.checked })
                        }
                      />
                      <span style={{ fontSize: "11px", fontWeight: 600 }}>
                        ACTIVATED FOR PUBLIC CHECKOUT
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={() => setIsCouponModalOpen(false)}
                >
                  CANCEL
                </button>
                <button type="submit" className={styles.primaryButton}>
                  SAVE PROMO CODE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ORDER DETAILS MODAL ==================== */}
      {selectedOrder && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalWindow} style={{ maxWidth: "780px" }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>ORDER BREAKDOWN: {selectedOrder.id}</div>
              <button className={styles.modalCloseBtn} onClick={() => setSelectedOrder(null)}>
                &times;
              </button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                <div style={{ background: "#050505", border: "1px solid #222", padding: "16px" }}>
                  <div style={{ fontSize: "10px", color: "#888", letterSpacing: "0.12em", marginBottom: "8px" }}>
                    BUYER &amp; CONTACT
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>{selectedOrder.customer.fullName}</div>
                  <div style={{ fontSize: "12px", color: "#aaa", marginTop: "4px" }}>
                    Email: {selectedOrder.customer.email}
                  </div>
                  <div style={{ fontSize: "12px", color: "#aaa", marginTop: "2px" }}>
                    Phone: {selectedOrder.customer.phone}
                  </div>
                </div>

                <div style={{ background: "#050505", border: "1px solid #222", padding: "16px" }}>
                  <div style={{ fontSize: "10px", color: "#888", letterSpacing: "0.12em", marginBottom: "8px" }}>
                    SHIPPING ADDRESS
                  </div>
                  <div style={{ fontSize: "13px", lineHeight: "1.5" }}>
                    {selectedOrder.customer.address}
                    <br />
                    {selectedOrder.customer.city}, {selectedOrder.customer.state} - {selectedOrder.customer.pincode}
                    <br />
                    <span style={{ color: "#888" }}>India</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "12px" }}>
                ITEMS IN THIS ORDER
              </div>

              <div className={styles.tableWrapper} style={{ marginBottom: "20px" }}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, idx) => {
                      const itName = item.name || (item as any).product_name || "Streetwear Item";
                      const rawP = item.price ?? (item as any).product_price ?? 0;
                      const unitP =
                        typeof rawP === "number" && !isNaN(rawP)
                          ? rawP
                          : parseFloat(String(rawP).replace(/[^0-9.]/g, "")) || 0;
                      const itQty = Number(item.quantity) || 1;

                      return (
                        <tr key={idx}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{itName}</div>
                            <div style={{ fontSize: "10px", color: "#888" }}>
                              Size: {item.size || "M"} {item.color ? `• ${item.color}` : ""}
                            </div>
                          </td>
                          <td>{itQty}</td>
                          <td>₹{unitP.toLocaleString("en-IN")}</td>
                          <td style={{ fontWeight: 700 }}>
                            ₹{(unitP * itQty).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #222", paddingTop: "16px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#888" }}>Payment Method: <strong>{selectedOrder.payment_method}</strong></div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                    Payment Status: <span className={styles.badge}>{selectedOrder.payment_status}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "#888" }}>Subtotal: ₹{selectedOrder.subtotal.toLocaleString("en-IN")}</div>
                  {selectedOrder.discount > 0 && (
                    <div style={{ fontSize: "12px", color: "#44bb44" }}>
                      Discount: -₹{selectedOrder.discount.toLocaleString("en-IN")}
                    </div>
                  )}
                  <div style={{ fontSize: "12px", color: "#888" }}>Shipping: ₹{selectedOrder.shipping}</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, marginTop: "6px" }}>
                    Grand Total: ₹{selectedOrder.total.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "11px", color: "#888" }}>Change Status:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => {
                    const newSt = e.target.value as StoreOrder["status"];
                    handleUpdateOrderStatus(selectedOrder.id, newSt);
                    setSelectedOrder({ ...selectedOrder, status: newSt });
                  }}
                  className={styles.fieldSelect}
                  style={{ width: "auto", padding: "6px 12px" }}
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="reached">Reached / Delivered</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <button className={styles.ghostButton} onClick={() => setSelectedOrder(null)}>
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && <div className={styles.toastNotice}>{toastMessage}</div>}
    </div>
  );
}
