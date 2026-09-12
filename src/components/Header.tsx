"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { createClient } from "@/lib/supabase/client";
import SearchModal from "@/components/SearchModal";
import CartDrawer from "@/components/CartDrawer";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();

  const [isScrolled, setIsScrolled] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [announcementText, setAnnouncementText] = useState(
    "COMPLIMENTARY SHIPPING ACROSS INDIA • COD AVAILABLE • NEW DROP IS LIVE"
  );
  const accountRef = useRef<HTMLDivElement>(null);

  const isHomePage = pathname === "/";

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.announcementText) {
            setAnnouncementText(data.announcementText);
          }
        }
      } catch (err) {
        // Fallback already set
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(!isHomePage || window.scrollY > 40);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  useEffect(() => {
    const supabase = createClient();

    function updateLoginState(sessionUser?: any) {
      if (sessionUser?.email) {
        localStorage.setItem("greeno_user_email", sessionUser.email);
        if (!localStorage.getItem("greeno_user_name")) {
          const name =
            sessionUser.user_metadata?.full_name ||
            sessionUser.user_metadata?.name ||
            sessionUser.email.split("@")[0].toUpperCase();
          localStorage.setItem("greeno_user_name", name);
        }
      }
      const storedEmail = typeof window !== "undefined" ? localStorage.getItem("greeno_user_email") : null;
      setIsLoggedIn(!!sessionUser || !!storedEmail);
    }

    async function loadSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        updateLoginState(session?.user);
      } catch (err) {
        updateLoginState();
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateLoginState(session?.user);
    });

    const handleStorageChange = () => updateLoginState();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Close account menu on route change
  useEffect(() => {
    setAccountOpen(false);
  }, [pathname]);

  // Close account menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!accountOpen) return;

    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountOpen]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("greeno_user_name");
      localStorage.removeItem("greeno_user_email");
      localStorage.removeItem("greeno_cart");
      localStorage.removeItem("greeno_coupon");
      localStorage.removeItem("greeno_customer_orders");
      localStorage.removeItem("greeno_last_order");
      localStorage.removeItem("greeno_all_orders");
      document.cookie = "greeno_session=; path=/; max-age=0";
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("greeno_cart_reset"));
    }
    setIsLoggedIn(false);
    setAccountOpen(false);
    router.push("/login");
    router.refresh();
  }

  // Do not render the storefront GreenO navbar on the admin dashboard
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <header className={`site-header ${isScrolled ? "scrolled" : ""}`}>
        {/* Top Announcement Bar */}
        <div className="announcement-bar">
          <div className="announcement-content">
            <span>{announcementText}</span>
          </div>
        </div>

        <nav className="navbar">
          <div className="header-side nav-links-left">
            <Link href="/shop" className="nav-link">
              SHOP ALL
            </Link>
          </div>

          <Link href="/" className="logo">
            GREENO
          </Link>

          <div className="header-actions">
            <button
              className="header-icon"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              title="Search catalogue"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </button>

            <Link
              href="/wishlist"
              className="header-icon"
              aria-label="Wishlist"
              style={{ position: "relative" }}
              title="Saved items"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
              {wishlistCount > 0 && (
                <span className="cart-count">{wishlistCount}</span>
              )}
            </Link>

            <div className="account-wrapper" ref={accountRef}>
              <button
                className="header-icon"
                onClick={() => setAccountOpen((open) => !open)}
                aria-label="Account"
                aria-expanded={accountOpen}
                title="Account"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path
                    d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {accountOpen && (
                <div className="account-menu">
                  {isLoggedIn ? (
                    <>
                      <Link href="/account" onClick={() => setAccountOpen(false)}>ACCOUNT DETAILS</Link>
                      <Link href="/account/orders" onClick={() => setAccountOpen(false)}>MY ORDERS</Link>
                      <Link href="/wishlist" onClick={() => setAccountOpen(false)}>MY WISHLIST</Link>
                      <button
                        type="button"
                        onClick={() => {
                          setAccountOpen(false);
                          openCart();
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          textAlign: "left",
                          padding: "8px 12px",
                          font: "inherit",
                          fontSize: "11px",
                          fontWeight: 600,
                          letterSpacing: "0.12em",
                          cursor: "pointer",
                          color: "inherit",
                          width: "100%",
                          display: "block",
                        }}
                      >
                        SHOPPING BAG
                      </button>
                      <button onClick={handleLogout}>LOG OUT</button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setAccountOpen(false)}>LOG IN</Link>
                      <Link href="/signup" onClick={() => setAccountOpen(false)}>CREATE ACCOUNT</Link>
                      <Link href="/wishlist" onClick={() => setAccountOpen(false)}>MY WISHLIST</Link>
                    </>
                  )}
                  <div style={{ height: "1px", background: "rgba(0, 0, 0, 0.08)", margin: "6px 0" }} />
                  <Link
                    href="/admin"
                    onClick={() => setAccountOpen(false)}
                    style={{ color: "#000000", fontWeight: 700, letterSpacing: "0.08em" }}
                  >
                    ADMIN CONSOLE &#8594;
                  </Link>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={openCart}
              className="header-icon cart-icon"
              aria-label="Shopping bag"
              title="Shopping bag"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M6 7h12l1 14H5L6 7Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
              </svg>

              {cartCount > 0 && (
                <span className="cart-count">{cartCount}</span>
              )}
            </button>
          </div>
        </nav>
      </header>

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <CartDrawer />
    </>
  );
}