"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";

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

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  async function placeOrder() {
    setError("");

    if (
      !fullName ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode
    ) {
      setError("Please fill in all the required fields.");
      return;
    }

    try {
      setLoading(true);

      const supabase = createClient();

      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      console.log("CURRENT USER:", user?.id, user?.email);

      if (userError || !user) {
        setError("Please log in before placing an order.");
        setLoading(false);
        return;
      }

      // 1. Save shipping address
      const { data: addressData, error: addressError } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          full_name: fullName,
          phone: phone,
          address_line1: address,
          city: city,
          state: state,
          postal_code: pincode,
          country: "India",
          is_default: false,
        })
        .select("id")
        .single();

      if (addressError) {
        console.error("Address error:", addressError);
        throw new Error(addressError.message);
      }

      // 2. Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          address_id: addressData.id,
          status: "pending",
          subtotal: total,
          shipping: 0,
          total: total,
          payment_status: "pending",
          payment_method: "COD",
        })
        .select("id")
        .single();

      if (orderError) {
        console.error("Order error:", orderError);
        throw new Error(orderError.message);
      }

      // 3. Create order items
      const orderItems = cart.map((item) => ({
        order_id: orderData.id,
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
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

      // 4. Clear cart
      cart.forEach((item) => {
        removeFromCart(item.id);
      });

      // 5. Go to success page
      router.push(`/order-success?orderId=${orderData.id}`);
    } catch (err) {
      console.error("PLACE ORDER ERROR:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong while placing your order.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (orderPlaced) {
  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <h1>ORDER PLACED</h1>
        <p>Redirecting...</p>
      </div>
    </main>
  );
}

  if (cart.length === 0 && !loading && !orderPlaced) {
    return (
      <main className="checkout-page">
        <div className="checkout-container">
          <h1>YOUR CART IS EMPTY</h1>

          <Link href="/shop" className="continue-shopping">
            CONTINUE SHOPPING
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <Link href="/cart" className="back-link">
          ← BACK TO CART
        </Link>

        <h1>CHECKOUT</h1>

        <div className="checkout-layout">
          <div className="checkout-form">
            <h2>CONTACT INFORMATION</h2>

            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <h2>SHIPPING ADDRESS</h2>

            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <input
              type="text"
              placeholder="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />

            <input
              type="text"
              placeholder="Pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />

            {error && (
              <p className="checkout-error">
                {error}
              </p>
            )}

            <button
              className="place-order-button"
              onClick={placeOrder}
              disabled={loading}
            >
              {loading ? "PLACING ORDER..." : "PLACE ORDER"}
            </button>
          </div>

          <div className="checkout-summary">
            <h2>ORDER SUMMARY</h2>

            {cart.map((item) => (
              <div className="checkout-item" key={item.id}>
                <div>
                  <strong>{item.name}</strong>

                  <p>
                    Quantity: {item.quantity}
                  </p>
                </div>

                <span>
                  ₹
                  {(item.price * item.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            ))}

            <div className="checkout-total">
              <span>TOTAL</span>

              <strong>
                ₹{total.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}