"use client";

import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <header className="site-header hero-header">
      <nav className="navbar">

        {/* LEFT SPACE */}
        <div className="header-side" />

        {/* LOGO */}
        <Link href="/" className="logo">
          GreenO
        </Link>

        {/* RIGHT */}
        <div className="header-actions">

          {/* ACCOUNT */}
          <div className="account-wrapper">
            <button
              className="header-icon"
              onClick={() => setAccountOpen(!accountOpen)}
              aria-label="Account"
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7" />
              </svg>
            </button>

            {accountOpen && (
              <div className="account-menu">
                <Link href="/account">
                  ACCOUNT DETAILS
                </Link>

                <Link href="/orders">
                  LAST ORDERS
                </Link>

                <button>
                  LOGOUT
                </button>
              </div>
            )}
          </div>

          {/* CART */}
          <Link
            href="/cart"
            className="header-icon"
            aria-label="Shopping bag"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M5 8h14l-1 13H6L5 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
          </Link>

        </div>

      </nav>
    </header>
  );
}