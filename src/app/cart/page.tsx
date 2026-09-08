"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main className="cart-page">
      <div className="cart-container">
        <p className="cart-label">GREENO / CART</p>

        <h1>YOUR CART</h1>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty.</p>

            <Link href="/shop" className="continue-shopping">
              CONTINUE SHOPPING
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-image">
                    <img src={item.image} alt={item.name} />
                  </div>

                  <div className="cart-details">
                    <h2>{item.name}</h2>

                    <p>₹{item.price.toLocaleString("en-IN")}</p>

                    <div className="quantity-control">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="remove-item"
                      onClick={() => removeFromCart(item.id)}
                    >
                      REMOVE
                    </button>
                  </div>

                  <div className="cart-item-total">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div>
                <span>SUBTOTAL</span>
                <strong>
                  ₹{total.toLocaleString("en-IN")}
                </strong>
              </div>

              <Link href="/checkout" className="checkout-button">
                CHECKOUT
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}