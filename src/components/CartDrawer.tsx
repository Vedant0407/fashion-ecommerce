"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    isCartOpen,
    closeCart,
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

  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("cart-open");
    } else {
      document.body.style.overflow = "";
      document.body.classList.remove("cart-open");
    }
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("cart-open");
    };
  }, [isCartOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoMessage(null);

    const res = await applyCoupon(promoCode.trim());
    if (res.success) {
      setPromoMessage({ type: "success", text: res.message });
      setPromoCode("");
    } else {
      setPromoMessage({ type: "error", text: res.message });
    }
    setPromoLoading(false);
  };

  const handleProceedToCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  const handleContinueShopping = () => {
    closeCart();
    router.push("/shop");
  };

  if (!isCartOpen) return null;

  return (
    <div className="cart-drawer-backdrop" onClick={closeCart}>
      <aside
        className="cart-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        aria-label="Shopping Cart Drawer"
      >
        {/* Top Header */}
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">
            Your cart {cart.length > 0 && `(${cart.reduce((a, b) => a + b.quantity, 0)})`}
          </h2>
          <button
            type="button"
            className="cart-drawer-close"
            onClick={closeCart}
            aria-label="Close cart"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Main Inner Card Container */}
        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            /* ================= EMPTY STATE ================= */
            <div className="cart-drawer-empty">
              <div className="cart-empty-icon-wrap">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 7h12l1 14H5L6 7Z" />
                  <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                </svg>
              </div>
              <h3 className="cart-empty-heading">YOUR CART IS EMPTY</h3>
              <p className="cart-empty-subtext">
                Explore our heavyweight collection and find your next statement piece.
              </p>
              <button
                type="button"
                className="cart-empty-cta"
                onClick={handleContinueShopping}
              >
                START EXPLORING &rarr;
              </button>
            </div>
          ) : (
            /* ================= ITEMS LIST ================= */
            <>
              <div className="cart-drawer-items">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="cart-item-row">
                    {/* Thumbnail */}
                    <div className="cart-item-image-box">
                      <img
                        src={item.image || "/black-tee.jfif"}
                        alt={item.name}
                        className="cart-item-img"
                      />
                    </div>

                    {/* Details & Controls */}
                    <div className="cart-item-details">
                      {/* Title & Price */}
                      <div className="cart-item-top">
                        <span className="cart-item-name">{item.name}</span>
                        <span className="cart-item-price">
                          RS. {(Number(item.price) * item.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>

                      {/* Variant (Size / Color) */}
                      <div className="cart-item-variant">
                        {item.size && <span className="cart-variant-tag">{item.size}</span>}
                        {item.color && (
                          <span className="cart-variant-tag">&bull; {item.color}</span>
                        )}
                      </div>

                      {/* Stepper + Remove */}
                      <div className="cart-item-actions">
                        <div className="cart-stepper">
                          <button
                            type="button"
                            className="cart-stepper-btn"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            &minus;
                          </button>
                          <span className="cart-stepper-val">{item.quantity}</span>
                          <button
                            type="button"
                            className="cart-stepper-btn"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            &#43;
                          </button>
                        </div>

                        <button
                          type="button"
                          className="cart-item-remove"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Promo Code Accordion */}
                <div className="cart-drawer-promo">
                  <button
                    type="button"
                    className="cart-promo-toggle"
                    onClick={() => setPromoOpen(!promoOpen)}
                  >
                    <span>{appliedCoupon ? `COUPON APPLIED (${appliedCoupon.code})` : "HAVE A DISCOUNT CODE?"}</span>
                    <span>{promoOpen ? "−" : "+"}</span>
                  </button>

                  {promoOpen && (
                    <div className="cart-promo-box">
                      {appliedCoupon ? (
                        <div className="cart-promo-applied">
                          <div>
                            <strong>{appliedCoupon.code}</strong>
                            <p>{appliedCoupon.description}</p>
                          </div>
                          <button
                            type="button"
                            className="cart-promo-remove"
                            onClick={removeCoupon}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyPromo} className="cart-promo-form">
                          <input
                            type="text"
                            placeholder="PROMO CODE"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            className="cart-promo-input"
                          />
                          <button
                            type="submit"
                            disabled={promoLoading}
                            className="cart-promo-btn"
                          >
                            {promoLoading ? "..." : "APPLY"}
                          </button>
                        </form>
                      )}

                      {promoMessage && (
                        <p className={`cart-promo-msg ${promoMessage.type}`}>
                          {promoMessage.text}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Sticky Checkout Bar */}
              <div className="cart-drawer-footer">
                {appliedCoupon && discount > 0 && (
                  <div className="cart-drawer-discount-row">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-RS. {discount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <button
                  type="button"
                  className="cart-drawer-checkout-pill"
                  onClick={handleProceedToCheckout}
                >
                  <span className="cart-pill-label">Check out</span>
                  <span className="cart-pill-total">
                    RS. {total.toLocaleString("en-IN")}
                  </span>
                </button>

                <p className="cart-drawer-footer-note">
                  Shipping and taxes calculated at checkout
                </p>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
