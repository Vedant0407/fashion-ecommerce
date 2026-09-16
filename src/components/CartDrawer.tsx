"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
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
    router.push("/");
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
          <div className="cart-drawer-title-wrap">
            <span className="cart-drawer-kicker">GREENO ATELIER</span>
            <h2 className="cart-drawer-title">
              SHOPPING BAG {cart.length > 0 && `(${cart.reduce((a, b) => a + b.quantity, 0)})`}
            </h2>
          </div>
          <button
            type="button"
            className="cart-drawer-close"
            onClick={closeCart}
            aria-label="Close bag"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Main Inner Card Container */}
        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            /* ================= EMPTY STATE ================= */
            <div className="cart-drawer-empty">
              <div className="cart-empty-icon-wrap">
                <ShoppingBag size={32} strokeWidth={1.25} />
              </div>
              <h3 className="cart-empty-heading">YOUR ATELIER BAG IS EMPTY</h3>
              <p className="cart-empty-subtext">
                Explore our collection of timeless silhouettes crafted from virgin and heirloom fabrics.
              </p>
              <button
                type="button"
                className="cart-empty-cta"
                onClick={handleContinueShopping}
              >
                <span>EXPLORE COLLECTION</span>
                <ArrowRight size={13} />
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image || "/atelier-bag.jpg"}
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
                          ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>

                      {/* Variant (Size / Color) */}
                      <div className="cart-item-variant">
                        {item.color && <span className="cart-variant-tag">{item.color}</span>}
                        {item.color && item.size && <span className="cart-variant-dot">&bull;</span>}
                        {item.size && <span className="cart-variant-tag">SIZE {item.size}</span>}
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
                          title="Remove item"
                        >
                          REMOVE
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
                    <span>{appliedCoupon ? `COUPON APPLIED: ${appliedCoupon.code}` : "HAVE AN EXCLUSIVE ATELIER CODE?"}</span>
                    <span>{promoOpen ? "—" : "+"}</span>
                  </button>

                  {promoOpen && (
                    <div className="cart-promo-box">
                      {appliedCoupon ? (
                        <div className="cart-applied-promo">
                          <div>
                            <strong>{appliedCoupon.code}</strong> &mdash;{" "}
                            {appliedCoupon.type === "percentage"
                              ? `${appliedCoupon.value}% OFF`
                              : appliedCoupon.type === "free_shipping"
                              ? "COMPLIMENTARY SHIPPING"
                              : `₹${appliedCoupon.value} OFF`}
                          </div>
                          <button
                            type="button"
                            className="cart-remove-promo"
                            onClick={removeCoupon}
                          >
                            REMOVE
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyPromo} className="cart-promo-form">
                          <input
                            type="text"
                            placeholder="Enter promo code e.g. GREENO10"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="cart-promo-input"
                          />
                          <button
                            type="submit"
                            disabled={promoLoading}
                            className="cart-promo-submit"
                          >
                            {promoLoading ? "APPLYING..." : "APPLY"}
                          </button>
                        </form>
                      )}

                      {promoMessage && (
                        <div className={`cart-promo-msg ${promoMessage.type}`}>
                          {promoMessage.text}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ================= FIXED BOTTOM SUMMARY ================= */}
              <div className="cart-drawer-footer">
                <div className="cart-summary-line">
                  <span>SUBTOTAL</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                <div className="cart-summary-line">
                  <span>EXPRESS COURIER</span>
                  <span className="cart-free-shipping">
                    {shipping === 0 ? "COMPLIMENTARY" : `₹${shipping}`}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="cart-summary-line cart-discount-line">
                    <span>ATELIER COURTESY</span>
                    <span>&minus; ₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="cart-total-line">
                  <span>ESTIMATED TOTAL</span>
                  <span className="cart-total-val">₹{total.toLocaleString("en-IN")}</span>
                </div>

                <button
                  type="button"
                  className="cart-checkout-cta"
                  onClick={handleProceedToCheckout}
                >
                  <span>PROCEED TO CONCIERGE CHECKOUT</span>
                  <ArrowRight size={14} />
                </button>

                <p className="cart-footer-note">
                  Complimentary express courier across India &bull; 3-day guarantee
                </p>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
