"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";
import { INDIAN_STATES, INDIA_STATES_AND_CITIES, getPincodeForCity } from "@/data/india-states-cities";
import styles from "./checkout.module.css";

export default function CheckoutPage() {
  const { cart, clearCart, subtotal, shipping, discount, total, appliedCoupon } = useCart();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [delivery, setDelivery] = useState("standard");

  useEffect(() => {
    let active = true;
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!active || !user) return;
        setIsLoggedIn(true);
        setEmail(user.email || "");
        setFullName(
          (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
          (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
          ""
        );
        setPhone(user.phone || "");
        const accountResponse = await fetch("/api/account", { cache: "no-store" });
        if (accountResponse.ok) {
          const account = await accountResponse.json();
          if (account.profile?.name) setFullName(account.profile.name);
          if (account.profile?.phone) setPhone(account.profile.phone);
          if (account.address) {
            setFullName(account.address.fullName || account.profile?.name || "");
            setPhone(account.address.phone || account.profile?.phone || "");
            setAddress(account.address.address || "");
            setCity(account.address.city || "");
            setState(account.address.state || "");
            setPincode(account.address.pincode || "");
          }
        }
      } catch {
        if (active) setIsLoggedIn(false);
      }
    }
    void loadUser();
    return () => { active = false; };
  }, []);

  function handlePhoneChange(val: string) {
    setPhone(val);
  }

  // Available cities computed based on selected state
  const availableCities = state ? (INDIA_STATES_AND_CITIES[state] || []) : [];

  function handleStateChange(val: string) {
    setState(val);
    setCity("");
    setCustomCity("");
    setPincode("");
  }

  function handleCityChange(val: string) {
    setCity(val);
    if (val !== "Other") {
      setCustomCity("");
      const autoPin = getPincodeForCity(state, val);
      if (autoPin) {
        setPincode(autoPin);
      }
    } else {
      setPincode("");
    }
  }

  async function placeOrder() {
    setError("");

    const finalCity = city === "Other" ? customCity.trim() : city.trim();

    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !state.trim() ||
      !finalCity ||
      !pincode.trim()
    ) {
      setError("Please complete all contact and shipping fields, including State and City.");
      return;
    }

    const cleanDigits = phone.replace(/\D/g, "");
    if (cleanDigits.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!/^[0-9]{6}$/.test(pincode.trim())) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          address,
          city: finalCity,
          state: state.trim(),
          pincode,
          items: cart.map((item: any) => {
            const rawP = item.price ?? item.product_price ?? 0;
            const cleanP =
              typeof rawP === "number"
                ? rawP
                : parseFloat(String(rawP).replace(/[^0-9.]/g, "")) || 0;
            const nm = item.name || item.product_name || "Streetwear Piece";
            return {
              ...item,
              id: item.id || item.product_id,
              product_id: item.id || item.product_id,
              name: nm,
              product_name: nm,
              price: cleanP,
              product_price: cleanP,
              quantity: Number(item.quantity) || 1,
            };
          }),
          subtotal,
          shipping,
          discount,
          paymentMethod: "COD",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to place order");
      }

      setOrderPlaced(true);

      const completeOrderFallback = {
        id: data.orderId || data.order?.id,
        created_at: new Date().toISOString(),
        customer: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: finalCity,
          state: state.trim(),
          pincode: pincode.trim(),
        },
        items: cart.map((item: any) => {
          const rawP = item.price ?? item.product_price ?? 0;
          const cleanP =
            typeof rawP === "number"
              ? rawP
              : parseFloat(String(rawP).replace(/[^0-9.]/g, "")) || 0;
          const nm = item.name || item.product_name || "Streetwear Piece";
          return {
            id: item.id || item.product_id,
            product_id: item.id || item.product_id,
            name: nm,
            product_name: nm,
            price: cleanP,
            product_price: cleanP,
            quantity: Number(item.quantity) || 1,
            image: item.image,
            size: item.size || "M",
            color: item.color,
          };
        }),
        subtotal,
        shipping,
        discount,
        total: Math.max(0, subtotal + shipping - discount),
        status: "confirmed",
        payment_method: "COD",
        payment_status: "pending",
      };

      const placedOrder = {
        ...completeOrderFallback,
        ...(data.order || {}),
        items:
          Array.isArray(data.order?.items) && data.order.items.length > 0
            ? data.order.items
            : completeOrderFallback.items,
        customer: {
          ...completeOrderFallback.customer,
          ...(data.order?.customer || {}),
          fullName:
            data.order?.customer?.fullName && data.order.customer.fullName !== "Customer"
              ? data.order.customer.fullName
              : completeOrderFallback.customer.fullName,
        },
        subtotal: data.order?.subtotal || completeOrderFallback.subtotal,
        total: data.order?.total || completeOrderFallback.total,
      };

      window.dispatchEvent(new CustomEvent("greeno_order_updated"));

      clearCart();

      router.push(`/order-success?orderId=${data.orderId}`);
    } catch (err: any) {
      console.error("PLACE ORDER ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while placing your order."
      );
    } finally {
      setLoading(false);
    }
  }

  if (orderPlaced) {
    return (
      <main className={styles.page}>
        <div className={styles.success}>
          <div>
            <h1>ATELIER ORDER PLACED</h1>
            <p>Preparing your bespoke atelier order confirmation...</p>
          </div>
        </div>
      </main>
    );
  }

  if (cart.length === 0 && !loading) {
    return (
      <main className={styles.page}>
        <div className={styles.empty}>
          <div>
            <p className={styles.crumb}>GREENO ATELIER / CONCIERGE CHECKOUT</p>
            <h1>YOUR ATELIER BAG IS EMPTY</h1>
            <Link href="/shop">EXPLORE ATELIER COLLECTION</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Compact Top Header */}
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <Link href="/cart" className={`${styles.back} page-back-button`}>
              ← BAG
            </Link>
            <h1 className={styles.compactTitle}>CONCIERGE CHECKOUT</h1>
          </div>
          <div className={styles.secureBadge}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>256-BIT ENCRYPTED</span>
          </div>
        </div>

        {!isLoggedIn && (
          <div className={styles.guestNotice}>
            <span>Ordering as guest · Want to save this order to your client dossier?</span>
            <Link href="/login?redirect=/checkout">LOG IN →</Link>
          </div>
        )}

        <div className={styles.layout}>
          {/* Left Column: Delivery & Payment Details */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.stepNum}>01</span>
              <h2 className={styles.cardTitle}>Client &amp; Concierge Delivery</h2>
            </div>

            <div className={styles.fieldsGrid}>
              {/* Row 1: Full Name & Email */}
              <div className={styles.field}>
                <label className={styles.label}>Full Name</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Email Address</label>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Phone Number</label>
                <input
                  className={styles.input}
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  autoComplete="tel"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Street Address</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="House, street, area"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete="street-address"
                  required
                />
              </div>

              {/* Row 3: State (left), City (right), Pincode */}
              <div className={styles.row3}>
                <div className={styles.field}>
                  <label className={styles.label}>State</label>
                  <select
                    className={styles.select}
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    required
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>City</label>
                  <select
                    className={styles.select}
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    disabled={!state}
                    required
                  >
                    <option value="">
                      {state ? "Select City" : "Select State first"}
                    </option>
                    {availableCities.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                    {state && <option value="Other">Other / Not Listed</option>}
                  </select>
                  {city === "Other" && (
                    <input
                      className={styles.input}
                      style={{ marginTop: "8px" }}
                      type="text"
                      placeholder="Type your city / town"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      required
                      autoFocus
                    />
                  )}
                </div>

                <div className={`${styles.field} ${styles.row3Pincode}`}>
                  <label className={styles.label}>Pincode</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="6 digits"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    autoComplete="postal-code"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className={styles.paymentSection}>
              <div className={styles.cardHeader} style={{ marginBottom: "10px" }}>
                <span className={styles.stepNum}>02</span>
                <h2 className={styles.cardTitle}>Atelier Settlement Method</h2>
              </div>

              <div className={styles.codBox}>
                <div className={styles.codLeft}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    id="payment-cod"
                    checked
                    readOnly
                    className={styles.codRadio}
                  />
                  <div>
                    <div className={styles.codName}>Cash on Delivery (COD)</div>
                    <div className={styles.codSub}>
                      Pay via Cash or UPI upon delivery at your doorstep
                    </div>
                  </div>
                </div>
                <span className={styles.codBadge}>PRIORITY DISPATCH</span>
              </div>
            </div>
          </section>

          {/* Right Column: Compact Order Summary Card */}
          <aside className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <h2 className={styles.summaryTitle}>Atelier Summary</h2>
              <span className={styles.itemCount}>
                {cart.reduce((s, i) => s + i.quantity, 0)}{" "}
                {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? "Piece" : "Pieces"}
              </span>
            </div>

            {/* Items List */}
            <div className={styles.itemsList}>
              {cart.map((item) => (
                <div key={`${item.id}-${item.size}`} className={styles.itemRow}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image || "/black-tee.jfif"}
                    alt={item.name}
                    className={styles.itemImg}
                  />
                  <div className={styles.itemDetails}>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.itemMeta}>
                      Qty: {item.quantity}
                      {item.size ? ` · ${item.size}` : ""}
                      {item.color ? ` · ${item.color}` : ""}
                    </div>
                  </div>
                  <span className={styles.itemPrice}>
                    ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals Breakdown */}
            <div className={styles.totalRows}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              <div className={styles.totalRow}>
                <span>Delivery</span>
                <span
                  style={{
                    color: shipping === 0 ? "#16a34a" : "inherit",
                    fontWeight: 600,
                  }}
                >
                  {shipping === 0 ? "FREE" : `₹${shipping.toLocaleString("en-IN")}`}
                </span>
              </div>

              {discount > 0 && (
                <div className={styles.totalRow} style={{ color: "#16a34a" }}>
                  <span>Promo ({appliedCoupon?.code})</span>
                  <span>-₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className={styles.grandTotalRow}>
                <span>Total Amount</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}

            <button
              className={styles.placeBtn}
              disabled={loading}
              onClick={placeOrder}
            >
              {loading ? "PLACING ORDER..." : "CONFIRM & PLACE ATELIER ORDER (COD)"}
            </button>

            <div className={styles.trustBadges}>
              <span>100% SECURE</span>
              <span>•</span>
              <span>EXPRESS DISPATCH</span>
              <span>•</span>
              <span>EASY RETURNS</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
