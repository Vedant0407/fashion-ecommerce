"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  

  const isHomePage = pathname === "/";

  useEffect(() => {
    
    const handleScroll = () => {
      if (!isHomePage) {
        setIsScrolled(true);
        return;
      }

      setIsScrolled(window.scrollY > window.innerHeight - 100);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isHomePage]);

    useEffect(() => {
    const loggedIn = localStorage.getItem("greeno_logged_in");
    setIsLoggedIn(loggedIn === "true");
  }, []);

  return (
    <header className={`site-header ${isScrolled ? "scrolled" : ""}`}>
      <nav className="navbar">

        <div className="header-side" />

        <Link href="/" className="logo">
          GreenO
        </Link>

        <div className="header-actions">

          {/* SEARCH */}
          <button
            className="header-icon"
            aria-label="Search"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            >
              <circle cx="10.5" cy="10.5" r="7" />
              <path d="M16 16l5 5" />
            </svg>
          </button>

          {/* ACCOUNT */}
          <div className="account-wrapper">

            <button
              className="header-icon"
              onClick={() => setAccountOpen(!accountOpen)}
              aria-label="Account"
            >
              <svg
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
  className="header-icon cart-icon"
  aria-label="Shopping bag"
>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M5 8h14l-1 13H6L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>

  {cartCount > 0 && (
    <span className="cart-count">
      {cartCount}
    </span>
  )}
</Link>

        </div>

      </nav>
    </header>
  );
}