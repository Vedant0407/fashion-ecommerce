"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <p className="cart-label">GREENO / ORDER</p>

        <h1>ORDER CONFIRMED</h1>

        <p>
          Thank you for your order.
        </p>

        {orderId && (
          <p>
            Order ID: <strong>{orderId}</strong>
          </p>
        )}

        <Link
          href="/shop"
          className="continue-shopping"
        >
          CONTINUE SHOPPING
        </Link>
      </div>
    </main>
  );
}