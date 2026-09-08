"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";
import styles from "./checkout.module.css";

export default function CheckoutPage() {
  const { cart, removeFromCart } = useCart();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [delivery, setDelivery] = useState("standard");

  const shipping = 0;
  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email || "");
        setFullName(
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          ""
        );
      }
    }

    loadUser();
  }, []);

  async function placeOrder() {
    setError("");

    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !state.trim() ||
      !pincode.trim()
    ) {
      setError("Please complete all contact and shipping fields.");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone.replace(/\D/g, ""))) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!/^[0-9]{6}$/.test(pincode.trim())) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    try {
      setLoading(true);

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Please log in before placing an order.");
        return;
      }

      const { data: addressData, error: addressError } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          full_name: fullName.trim(),
          phone: phone.trim(),
          address_line1: address.trim(),
          city: city.trim(),
          state: state.trim(),
          postal_code: pincode.trim(),
          country: "India",
          is_default: false,
        })
        .select("id")
        .single();

      if (addressError) {
        console.error("Address error:", addressError);
        throw new Error(addressError.message);
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          address_id: addressData.id,
          status: "pending",
          subtotal: total,
          shipping,
          total: total + shipping,
          payment_status: "pending",
          payment_method: "COD",
        })
        .select("id")
        .single();

      if (orderError) {
        console.error("Order error:", orderError);
        throw new Error(orderError.message);
      }

      const orderItems = cart.map((item) => ({
        order_id: orderData.id,
        product_id: item.id,
        product_name: item.name,
        product_price: Number(item.price),
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Order items error:", itemsError);
        throw new Error(itemsError.message);
      }

      setOrderPlaced(true);

      cart.forEach((item) => removeFromCart(item.id));

      router.push(`/order-success?orderId=${orderData.id}`);
    } catch (err) {
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
      <div className={styles.container}>
        <Link href="/cart" className={styles.back}>
          ← BACK TO SHOPPING BAG
        </Link>

        <p className={styles.crumb}>GREENO / CHECKOUT</p>
        <h1 className={styles.title}>CHECKOUT</h1>

        <div className={styles.layout}>
          <section className={styles.formSection}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>PERSONAL INFORMATION</h2>

              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.label}>FULL NAME</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>EMAIL ADDRESS</label>
                  <input
                    className={styles.input}
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>PHONE NUMBER</label>
                  <input
                    className={styles.input}
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>SHIPPING INFORMATION</h2>

              <div className={styles.fields}>
                <div className={`${styles.field} ${styles.full}`}>
                  <label className={styles.label}>ADDRESS</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="House / street / locality"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    autoComplete="street-address"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>CITY</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    autoComplete="address-level2"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>STATE</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    autoComplete="address-level1"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>PINCODE</label>
                  <input
                    className={styles.input}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    autoComplete="postal-code"
                  />
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>DELIVERY</h2>

              <div className={styles.deliveryOptions}>
                <label
                  className={`${styles.option} ${delivery === "standard" ? styles.optionActive : ""}`}
                >
                  <span className={styles.optionLeft}>
                    <input
                      className={styles.radio}
                      type="radio"
                      name="delivery"
                      value="standard"
                      checked={delivery === "standard"}
                      onChange={(e) => setDelivery(e.target.value)}
                    />
                    <span>
                      <span className={styles.optionName}>STANDARD DELIVERY</span>
                      <span className={styles.optionDescription}>
                        Reliable delivery across India
                      </span>
                    </span>
                  </span>
                  <span className={styles.optionPrice}>FREE</span>
                </label>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>PAYMENT</h2>

              <div className={styles.paymentBox}>
                <p className={styles.paymentTitle}>CASH ON DELIVERY</p>
                <p className={styles.paymentText}>
                  Pay securely when your GreenO order arrives. Online payment
                  can be added later without changing your order flow.
                </p>
              </div>
            </div>

            <div className={styles.actions}>
              {error && <p className={styles.error}>{error}</p>}

              <button
                className={styles.placeButton}
                onClick={placeOrder}
                disabled={loading}
              >
                {loading ? "PLACING ORDER..." : "PAY NOW / PLACE ORDER"}
              </button>
            </div>
          </section>

          <aside className={styles.summary}>
            <div className={styles.summaryHeader}>
              <h2 className={styles.summaryTitle}>SHOPPING BAG</h2>
              <span className={styles.itemCount}>{cart.length} ITEM TYPES</span>
            </div>

            <div className={styles.items}>
              {cart.map((item) => (
                <div className={styles.item} key={item.id}>
                  <img
                    className={styles.image}
                    src={item.image}
                    alt={item.name}
                  />

                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.meta}>
                      Quantity: {item.quantity}
                      {item.size ? ` · Size: ${item.size}` : ""}
                      {item.color ? ` · ${item.color}` : ""}
                    </p>
                  </div>

                  <span className={styles.itemPrice}>
                    ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>SUBTOTAL</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>

              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>DELIVERY</span>
                <span>FREE</span>
              </div>

              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>TOTAL</span>
                <strong>
                  ₹{(total + shipping).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}