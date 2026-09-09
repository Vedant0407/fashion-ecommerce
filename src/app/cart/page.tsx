"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    subtotal,
    shipping,
    discount,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponFeedback(null);

    const result = await applyCoupon(couponCode.trim());
    if (result.success) {
      setCouponFeedback({ type: "success", text: result.message });
      setCouponCode("");
    } else {
      setCouponFeedback({ type: "error", text: result.message });
    }
    setCouponLoading(false);
  };

  return (
    <main className="cart-page">
      <div className="cart-container">
        <div className="cart-breadcrumb">
          GREENO <span>/</span> SHOPPING BAG
        </div>

        <div className="cart-heading-row">
          <div>
            <p className="cart-kicker">YOUR SELECTION</p>
            <h1>SHOPPING BAG <span>({cart.length})</span></h1>
          </div>
          <Link href="/shop" className="cart-continue">
            CONTINUE SHOPPING →
          </Link>
        </div>

        {cart.length === 0 ? (
          <section className="cart-empty-state">
            <div className="cart-empty-mark">○</div>
            <p className="cart-kicker">NOTHING HERE YET</p>
            <h2>Your shopping bag is empty.</h2>
            <p>Discover the latest GreenO pieces and build your look.</p>
            <Link href="/shop" className="cart-primary-button">
              EXPLORE COLLECTION
            </Link>
          </section>
        ) : (
          <div className="cart-layout">
            <section className="cart-products">
              <div className="cart-section-top">
                <span>PRODUCT</span>
                <span>PRICE</span>
              </div>

              {cart.map((item) => (
                <article className="cart-product" key={item.id}>
                  <div className="cart-product-image">
                    <img src={item.image} alt={item.name} />
                  </div>

                  <div className="cart-product-info">
                    <div className="cart-product-main">
                      <div>
                        <p className="cart-product-category">GREЕNO COLLECTION</p>
                        <h2 className="cart-product-name">{item.name}</h2>
                        <p className="cart-product-price mobile-price">
                          ₹{Number(item.price).toLocaleString("en-IN")}
                        </p>

                        <div className="cart-variants">
                          {item.size && <span>SIZE <strong>{item.size}</strong></span>}
                          {item.color && <span>COLOR <strong>{item.color}</strong></span>}
                        </div>
                      </div>

                      <div className="cart-product-price desktop-price">
                        ₹{Number(item.price).toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="cart-product-bottom">
                      <div className="cart-quantity">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.name}`}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.name}`}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>

                      <span className="cart-line-total">
                        ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}
                      </span>

                      <button
                        type="button"
                        className="cart-remove"
                        onClick={() => removeFromCart(item.id)}
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              <div className="cart-benefits">
                <div>
                  <span className="benefit-icon">◇</span>
                  <div>
                    <strong>FREE SHIPPING</strong>
                    <p>On orders above ₹5,000</p>
                  </div>
                </div>
                <div>
                  <span className="benefit-icon">◷</span>
                  <div>
                    <strong>SECURE CHECKOUT</strong>
                    <p>Your order is protected</p>
                  </div>
                </div>
                <div>
                  <span className="benefit-icon">↺</span>
                  <div>
                    <strong>EASY SUPPORT</strong>
                    <p>We're here when you need us</p>
                  </div>
                </div>
              </div>
            </section>

            <aside className="cart-summary-card">
              <div className="summary-heading">
                <span>SUMMARY</span>
                <span>{cart.length} {cart.length === 1 ? "ITEM" : "ITEMS"}</span>
              </div>

              <div className="cart-summary-lines">
                <div>
                  <span>SUBTOTAL</span>
                  <strong>₹{subtotal.toLocaleString("en-IN")}</strong>
                </div>
                <div>
                  <span>SHIPPING</span>
                  <strong>{shipping === 0 ? "FREE" : `₹${shipping.toLocaleString("en-IN")}`}</strong>
                </div>
                {discount > 0 && (
                  <div style={{ color: "#16a34a" }}>
                    <span>
                      DISCOUNT ({appliedCoupon?.code})
                    </span>
                    <strong>-₹{discount.toLocaleString("en-IN")}</strong>
                  </div>
                )}
              </div>

              <div className="cart-promo">
                {appliedCoupon ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      fontSize: "10px",
                    }}
                  >
                    <div>
                      <strong style={{ color: "#16a34a", display: "block" }}>
                        PROMO APPLIED: {appliedCoupon.code}
                      </strong>
                      <span style={{ color: "#666", fontSize: "9px" }}>
                        {appliedCoupon.description}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                      }}
                    >
                      REMOVE
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo}>
                    <label htmlFor="promo">PROMO CODE</label>
                    <div>
                      <input
                        id="promo"
                        type="text"
                        placeholder="TRY 'GREENO10' OR 'FREESHIP'"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      />
                      <button type="submit" disabled={couponLoading}>
                        {couponLoading ? "..." : "APPLY"}
                      </button>
                    </div>
                    {couponFeedback && (
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: "9px",
                          letterSpacing: "0.08em",
                          color: couponFeedback.type === "success" ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {couponFeedback.text}
                      </p>
                    )}
                  </form>
                )}
              </div>

              <div className="cart-summary-total">
                <span>TOTAL</span>
                <strong>₹{total.toLocaleString("en-IN")}</strong>
              </div>

              <Link href="/checkout" className="cart-checkout-button">
                PROCEED TO CHECKOUT <span>→</span>
              </Link>

              <p className="cart-secure-note">
                Secure checkout · Cash on delivery available
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}