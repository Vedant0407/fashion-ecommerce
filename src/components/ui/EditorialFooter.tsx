"use client";

import { useState } from "react";
import Link from "next/link";

export default function EditorialFooter() {
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
    <footer className="editorial-footer">
      <div className="editorial-container">
        {/* Top Grid */}
        <div className="editorial-footer-grid">
          {/* Col 1: Customer Care */}
          <div className="editorial-footer-col">
            <h4 className="editorial-footer-col-title">CLIENT SERVICE</h4>
            <ul className="editorial-footer-nav">
              <li><Link href="/account/orders">Track Your Order</Link></li>
              <li><Link href="/account/orders">Returns & Exchanges</Link></li>
              <li><Link href="/shop">Complimentary Shipping</Link></li>
              <li><Link href="/shop">Payment & COD Info</Link></li>
              <li><Link href="/account">Client Concierge</Link></li>
            </ul>
          </div>

          {/* Col 2: Collections */}
          <div className="editorial-footer-col">
            <h4 className="editorial-footer-col-title">COLLECTIONS</h4>
            <ul className="editorial-footer-nav">
              <li><Link href="/category/t-shirts">Oversized T-Shirts</Link></li>
              <li><Link href="/category/shirts">Tailored Poplin Shirts</Link></li>
              <li><Link href="/shop">Structured Overshirts</Link></li>
              <li><Link href="/shop">Outerwear & Coats</Link></li>
              <li><Link href="/shop">View Full Archive</Link></li>
            </ul>
          </div>

          {/* Col 3: Brand */}
          <div className="editorial-footer-col">
            <h4 className="editorial-footer-col-title">
              ABOUT <span className="greeno-gold-text">GREENO</span>
            </h4>
            <ul className="editorial-footer-nav">
              <li><span className="editorial-footer-static-link">Design Philosophy</span></li>
              <li><span className="editorial-footer-static-link">300gsm Heavyweight Craft</span></li>
              <li><span className="editorial-footer-static-link">Italian Fabric Sourcing</span></li>
              <li><span className="editorial-footer-static-link">Sustainability & Zero Waste</span></li>
              <li><span className="editorial-footer-static-link">Private Drop Archive</span></li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div className="editorial-footer-col editorial-footer-newsletter-col">
            <h4 className="editorial-footer-col-title">PRIVATE CLIENT LIST</h4>
            <p className="editorial-footer-newsletter-desc">
              Subscribe to unlock private drops, archive releases, and seasonal editorial lookbooks prior to public release.
            </p>

            {subscribed ? (
              <div className="editorial-footer-newsletter-success">
                ✓ YOU ARE REGISTERED ON THE ATELIER CLIENT LIST.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="editorial-footer-form">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ENTER YOUR EMAIL"
                  className="editorial-footer-input"
                  required
                  aria-label="Email address"
                />
                <button type="submit" className="editorial-footer-submit" aria-label="Subscribe">
                  JOIN →
                </button>
              </form>
            )}

            <div className="editorial-footer-socials">
              <span className="editorial-social-link">INSTAGRAM</span>
              <span className="editorial-social-separator">•</span>
              <span className="editorial-social-link">YOUTUBE</span>
              <span className="editorial-social-separator">•</span>
              <span className="editorial-social-link">X (TWITTER)</span>
            </div>
          </div>
        </div>

        {/* Faint Giant Watermark in Golden */}
        <div className="editorial-footer-watermark">
          <span className="editorial-watermark-text font-serif greeno-gold-watermark">GREENO</span>
        </div>

        {/* Bottom Bar */}
        <div className="editorial-footer-bottom">
          <p className="editorial-footer-copy">
            © 2026 <span className="greeno-gold-text">GREENO</span> ATELIER. ALL RIGHTS RESERVED.
          </p>

          <div className="editorial-footer-legal">
            <span>PRIVACY POLICY</span>
            <span>TERMS OF SERVICE</span>
            <span>REFUND POLICY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
