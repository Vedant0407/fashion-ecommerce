"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";
import OtpInput from "@/components/ui/OtpInput";
import GatewayNotification from "@/components/ui/GatewayNotification";
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

  // Phone Verification States
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [toastSmsOtp, setToastSmsOtp] = useState<string | null>(null);
  const [realSmsDispatched, setRealSmsDispatched] = useState<boolean>(false);
  const [smsTimer, setSmsTimer] = useState<number>(60);
  const [canResendSms, setCanResendSms] = useState<boolean>(false);

  useEffect(() => {
    let interval: any;
    if (isOtpModalOpen && smsTimer > 0) {
      interval = setInterval(() => {
        setSmsTimer((prev) => prev - 1);
      }, 1000);
    } else if (smsTimer === 0) {
      setCanResendSms(true);
    }
    return () => clearInterval(interval);
  }, [isOtpModalOpen, smsTimer]);

  useEffect(() => {
    async function loadUser() {
      // Check for locally saved user info first
      const savedName = localStorage.getItem("greeno_user_name");
      const savedEmail = localStorage.getItem("greeno_user_email");

      if (savedName) {
        setFullName(savedName);
      }
      if (savedEmail) {
        setEmail(savedEmail);
        setIsLoggedIn(true);
      }

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setIsLoggedIn(true);
          setEmail(user.email || savedEmail || "");
          if (!savedName) {
            setFullName(
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              ""
            );
          }
        }
      } catch (err) {
        // Ignore
      }
    }

    loadUser();
  }, []);

  // Handle phone input change
  function handlePhoneChange(val: string) {
    setPhone(val);
    if (isPhoneVerified && val.replace(/\D/g, "") !== verifiedPhone.replace(/\D/g, "")) {
      setIsPhoneVerified(false);
      setVerifiedPhone("");
    }
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

  // Send SMS OTP
  async function handleSendPhoneOtp() {
    setError("");
    setOtpError("");

    const cleanDigits = phone.replace(/\D/g, "");
    if (cleanDigits.length < 10) {
      setError("Please enter a valid 10-digit mobile number before requesting OTP.");
      return;
    }

    try {
      setOtpLoading(true);

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: cleanDigits.slice(-10),
          type: "phone",
          name: fullName || "Valued Customer",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send SMS verification code.");
      }

      if (data.realSmsSent) {
        setRealSmsDispatched(true);
        setToastSmsOtp(null); // Do not show on-screen passcode toast if delivered to physical phone
      } else {
        setRealSmsDispatched(false);
        setToastSmsOtp(data.code || null);
      }

      setSmsTimer(60);
      setCanResendSms(false);
      setPhoneOtp("");
      setIsOtpModalOpen(true);
    } catch (err: any) {
      console.error("SMS OTP SEND ERROR:", err);
      setError(err.message || "Unable to send verification code.");
    } finally {
      setOtpLoading(false);
    }
  }

  // Verify SMS OTP
  async function handleVerifyPhoneOtp(e?: React.FormEvent, codeToVerify?: string) {
    if (e) e.preventDefault();
    setOtpError("");

    const finalCode = (codeToVerify || phoneOtp).trim();

    if (!finalCode || finalCode.length !== 6) {
      setOtpError("Please enter the 6-digit SMS verification code.");
      return;
    }

    try {
      setOtpLoading(true);

      const cleanDigits = phone.replace(/\D/g, "").slice(-10);

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: cleanDigits,
          code: finalCode,
          type: "phone",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid or expired SMS verification code.");
      }

      setIsPhoneVerified(true);
      setVerifiedPhone(phone);
      setIsOtpModalOpen(false);
      setToastSmsOtp(null);
      setPhoneOtp("");
      setError("");
    } catch (err: any) {
      console.error("SMS OTP VERIFY ERROR:", err);
      setOtpError(err.message || "Verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
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

    // Check phone verification
    if (!isPhoneVerified || cleanDigits.slice(-10) !== verifiedPhone.replace(/\D/g, "").slice(-10)) {
      setError("Please verify your phone number with the SMS OTP code before placing order.");
      handleSendPhoneOtp();
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

      const cleanEmail = email.trim().toLowerCase();

      // 1. Save single latest order
      localStorage.setItem("greeno_last_order", JSON.stringify(placedOrder));

      // 2. Save into scoped customer orders list for this email
      try {
        const scopedKey = `greeno_orders_${cleanEmail}`;
        const rawScopedOrders = localStorage.getItem(scopedKey);
        const scopedOrders = rawScopedOrders ? JSON.parse(rawScopedOrders) : [];
        const filtered = Array.isArray(scopedOrders)
          ? scopedOrders.filter((o: any) => o.id !== placedOrder.id)
          : [];
        filtered.unshift(placedOrder);
        localStorage.setItem(scopedKey, JSON.stringify(filtered));
      } catch (e) {
        console.warn("Failed to persist customer order locally:", e);
      }

      // 3. Keep customer orders list updated strictly for this email
      try {
        const rawCustomerOrders = localStorage.getItem("greeno_customer_orders");
        const customerOrders = rawCustomerOrders ? JSON.parse(rawCustomerOrders) : [];
        const filtered = Array.isArray(customerOrders)
          ? customerOrders.filter(
              (o: any) =>
                o.id !== placedOrder.id &&
                o.customer?.email?.trim().toLowerCase() === cleanEmail
            )
          : [];
        filtered.unshift(placedOrder);
        localStorage.setItem("greeno_customer_orders", JSON.stringify(filtered));
      } catch (e) {}

      // 4. Save user email & name so account and orders load seamlessly
      localStorage.setItem("greeno_user_email", email.trim());
      if (fullName.trim()) {
        localStorage.setItem("greeno_user_name", fullName.trim());
      }
      document.cookie = `greeno_session=${encodeURIComponent(email.trim())}; path=/; max-age=2592000; SameSite=Lax`;
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("greeno_order_updated"));

      // 5. Redundantly ensure backend store has full order saved
      fetch("/api/orders/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: [placedOrder] }),
      }).catch(() => {});

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
            <h1>ORDER PLACED</h1>
            <p>Redirecting to your order confirmation...</p>
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
            <p className={styles.crumb}>GREENO / CHECKOUT</p>
            <h1>YOUR CART IS EMPTY</h1>
            <Link href="/shop">CONTINUE SHOPPING</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      {/* Realistic SMS Gateway Push Notification */}
      {toastSmsOtp && (
        <GatewayNotification
          type="phone"
          target={phone}
          code={toastSmsOtp}
          onAutoFill={(code) => {
            setPhoneOtp(code);
            handleVerifyPhoneOtp(undefined, code);
          }}
          onDismiss={() => setToastSmsOtp(null)}
        />
      )}

      {/* Professional Phone OTP Verification Modal */}
      {isOtpModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.88)",
            backdropFilter: "blur(6px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#0a0a0a",
              border: "1px solid #333333",
              color: "#ffffff",
              width: "100%",
              maxWidth: "460px",
              padding: "40px 32px",
              boxShadow: "0 24px 48px rgba(0,0,0,0.9)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div
                style={{
                  padding: "4px 8px",
                  background: "#ffffff",
                  color: "#000000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                }}
              >
                SMS
              </div>
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.18em", color: "#888888", textTransform: "uppercase" }}>
                GREENO CARRIER VERIFICATION
              </span>
            </div>

            <h2 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "0.06em", margin: "0 0 10px", textTransform: "uppercase" }}>
              CONFIRM MOBILE NUMBER
            </h2>
            <p style={{ fontSize: "12px", color: "#aaaaaa", lineHeight: "1.5", margin: "0 0 14px" }}>
              A 6-digit SMS verification code was dispatched to <strong>+91 {phone.replace(/\D/g, "").slice(-10)}</strong>. Enter the digits below to confirm your delivery contact.
            </p>

            {realSmsDispatched ? (
              <div
                style={{
                  background: "#0c1d12",
                  border: "1px solid #165e31",
                  padding: "12px 14px",
                  fontSize: "11px",
                  color: "#86efac",
                  lineHeight: "1.5",
                  marginBottom: "20px",
                }}
              >
                <strong style={{ display: "block", color: "#4ade80", marginBottom: "3px", letterSpacing: "0.08em" }}>
                  REAL SMS TRANSMITTED TO YOUR PHONE
                </strong>
                A live SMS text message was sent across cellular networks to <strong>+91 {phone.replace(/\D/g, "").slice(-10)}</strong>. Please open your phone&apos;s Messages app to view your 6-digit code.
              </div>
            ) : (
              <div
                style={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  padding: "12px 14px",
                  fontSize: "11px",
                  color: "#d4d4d8",
                  lineHeight: "1.5",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <strong style={{ color: "#f59e0b", letterSpacing: "0.06em" }}>CARRIER GATEWAY NOT CONFIGURED</strong>
                  <Link
                    href="/admin"
                    target="_blank"
                    style={{ color: "#ffffff", fontSize: "10px", textDecoration: "underline", letterSpacing: "0.06em" }}
                  >
                    CONFIG SMS →
                  </Link>
                </div>
                <p style={{ margin: "0 0 6px", color: "#a1a1aa", fontSize: "11px" }}>
                  To deliver real SMS texts to physical phones in India, enter your free Fast2SMS API key in the Admin Console.
                </p>
                {toastSmsOtp && (
                  <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px dashed #333333", fontSize: "11px" }}>
                    Development Passcode: <strong style={{ color: "#ffffff", letterSpacing: "0.2em" }}>{toastSmsOtp}</strong>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={(e) => handleVerifyPhoneOtp(e)}>
              <div style={{ textAlign: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", color: "#666666", textTransform: "uppercase" }}>
                  ENTER 6-DIGIT PASSCODE
                </span>

                <OtpInput
                  value={phoneOtp}
                  onChange={(newCode) => {
                    setPhoneOtp(newCode);
                    if (newCode.length === 6) {
                      handleVerifyPhoneOtp(undefined, newCode);
                    }
                  }}
                  error={Boolean(otpError)}
                  darkMode={true}
                />
              </div>

              {otpError && (
                <div style={{ color: "#ff4444", fontSize: "11px", marginBottom: "16px", textAlign: "center" }}>
                  {otpError}
                </div>
              )}

              <button
                type="submit"
                disabled={otpLoading || phoneOtp.length !== 6}
                style={{
                  width: "100%",
                  background: "#ffffff",
                  color: "#000000",
                  border: "none",
                  padding: "15px",
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  cursor: phoneOtp.length === 6 ? "pointer" : "not-allowed",
                  opacity: phoneOtp.length === 6 ? 1 : 0.6,
                  transition: "opacity 0.2s ease",
                }}
              >
                {otpLoading ? "VERIFYING PASSCODE..." : "CONFIRM & VERIFY NUMBER"}
              </button>
            </form>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "24px",
                paddingTop: "16px",
                borderTop: "1px solid #1f1f1f",
              }}
            >
              {canResendSms ? (
                <button
                  type="button"
                  onClick={handleSendPhoneOtp}
                  disabled={otpLoading}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    cursor: "pointer",
                    textTransform: "uppercase",
                  }}
                >
                  RESEND SMS
                </button>
              ) : (
                <span style={{ fontSize: "11px", color: "#777777", letterSpacing: "0.08em" }}>
                  RESEND SMS IN {String(Math.floor(smsTimer / 60)).padStart(2, "0")}:{String(smsTimer % 60).padStart(2, "0")}
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsOtpModalOpen(false);
                  setOtpError("");
                  setPhoneOtp("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#888888",
                  fontSize: "11px",
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                CANCEL / CHANGE
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.container}>
        {/* Compact Top Header */}
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <Link href="/cart" className={styles.back}>
              ← BAG
            </Link>
            <h1 className={styles.compactTitle}>CHECKOUT</h1>
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
            <span>Ordering as guest · Want to save this order to your profile?</span>
            <Link href="/login?redirect=/checkout">LOG IN →</Link>
          </div>
        )}

        <div className={styles.layout}>
          {/* Left Column: Delivery & Payment Details */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.stepNum}>1</span>
              <h2 className={styles.cardTitle}>Delivery &amp; Contact Details</h2>
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

              {/* Row 2: Phone with integrated OTP Action & Street Address */}
              <div className={styles.field}>
                <label className={styles.label}>Phone Number</label>
                <div className={styles.phoneWrapper}>
                  <input
                    className={styles.phoneInput}
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    autoComplete="tel"
                    required
                  />
                  {isPhoneVerified ? (
                    <div className={styles.phoneVerifiedBadge}>
                      <span className={styles.verifiedPill}>VERIFIED</span>
                      <button
                        type="button"
                        className={styles.changePhoneBtn}
                        onClick={() => {
                          setIsPhoneVerified(false);
                          setVerifiedPhone("");
                        }}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.phoneActionBtn}
                      onClick={handleSendPhoneOtp}
                      disabled={otpLoading || phone.replace(/\D/g, "").length < 10}
                    >
                      {otpLoading ? "SENDING..." : "VERIFY OTP"}
                    </button>
                  )}
                </div>
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
                <span className={styles.stepNum}>2</span>
                <h2 className={styles.cardTitle}>Payment Method</h2>
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
              <h2 className={styles.summaryTitle}>Order Summary</h2>
              <span className={styles.itemCount}>
                {cart.reduce((s, i) => s + i.quantity, 0)}{" "}
                {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? "Item" : "Items"}
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
              {loading ? "PLACING ORDER..." : "PLACE ORDER (COD)"}
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