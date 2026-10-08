"use client";

import { useState } from "react";
import Link from "next/link";

export default function AboutSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="about-section">
      <div className="about-top">
        <div className="about-column">
          <h3>CUSTOMER CARE</h3>
          <Link href="/account/orders">Track Your Order</Link>
          <Link href="/account/orders">Returns & Exchange</Link>
          <Link href="/shop">Shipping & Delivery</Link>
          <Link href="/shop">Payment & COD Info</Link>
          <Link href="/shop">FAQ & Help Desk</Link>
        </div>

        <div className="about-column">
          <h3>COLLECTIONS</h3>
          <Link href="/category/t-shirts">Oversized T-Shirts</Link>
          <Link href="/category/shirts">Tailored Shirts</Link>
          <Link href="/shop">All Silhouettes</Link>
        </div>

        <div className="about-column">
          <h3>ABOUT <span className="greeno-gold-text">GREENO</span></h3>
          <p>The Brand Philosophy</p>
          <p>Heavyweight Craft</p>
          <p>Flagship Experiences</p>
          <p>Collaborations</p>
          <p>Sustainability Vision</p>
        </div>

        <div className="about-column about-newsletter">
          <h3>NEWSLETTER</h3>
          <p className="newsletter-desc">
            Subscribe to unlock private drops, archive releases, and editorial lookbooks before the public.
          </p>

          {subscribed ? (
            <p className="newsletter-success">✓ YOU ARE NOW ON THE DROP LIST.</p>
          ) : (
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input
                type="email"
                placeholder="ENTER YOUR EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email address"
              />
              <button type="submit">JOIN</button>
            </form>
          )}

          <div className="about-socials">
            <span>INSTAGRAM</span>
            <span>YOUTUBE</span>
            <span>TWITTER / X</span>
          </div>
        </div>
      </div>

      <div className="about-watermark">
        <h2 className="greeno-gold-watermark">GREENO</h2>
      </div>

      <div className="about-bottom">
        <div className="about-copyright">
          © 2026 <span className="greeno-gold-text">GREENO</span> LUXURY STREETWEAR. ALL RIGHTS RESERVED.
        </div>
        <div className="about-legal-links">
          <span>PRIVACY POLICY</span>
          <span>TERMS OF SERVICE</span>
          <span>REFUND POLICY</span>
        </div>
      </div>
    </footer>
  );
}