"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { createClient } from "@/lib/supabase/client";
import SearchModal from "@/components/SearchModal";
import CartDrawer from "@/components/CartDrawer";
import StoryViewerModal from "@/components/ui/StoryViewerModal";
import { Search, Heart, ShoppingBag, Sparkles, Menu, X } from "lucide-react";
import { type StoreStory } from "@/lib/story-constants";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const isHomePage = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(() => !isHomePage);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [stories, setStories] = useState<StoreStory[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [announcementText, setAnnouncementText] = useState(
    "COMPLIMENTARY SHIPPING ACROSS INDIA • COD AVAILABLE • NEW DROP IS LIVE"
  );
  const menuRef = useRef<HTMLDivElement>(null);

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

    async function loadStories() {
      try {
        const res = await fetch(`/api/stories?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.stories && Array.isArray(data.stories)) {
            setStories(data.stories);
          }
        }
      } catch (err) {
        // Fallback
      }
    }

    loadSettings();
    loadStories();

    const handleStoriesUpdated = () => loadStories();
    window.addEventListener("greeno_stories_updated", handleStoriesUpdated);
    window.addEventListener("focus", handleStoriesUpdated);
    return () => {
      window.removeEventListener("greeno_stories_updated", handleStoriesUpdated);
      window.removeEventListener("focus", handleStoriesUpdated);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(!isHomePage || window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage, pathname]);

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

  // Close navigation menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close navigation menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
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
  }, [menuOpen]);

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
      localStorage.removeItem("greeno_customer_orders");
      localStorage.removeItem("greeno_last_order");
      localStorage.removeItem("greeno_all_orders");
      document.cookie = "greeno_session=; path=/; max-age=0";
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("greeno_auth_change"));
    }
    setIsLoggedIn(false);
    setMenuOpen(false);
    router.push("/login");
    router.refresh();
  }

  // Do not render the storefront GreenO navbar on the admin dashboard
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleOpenStories = () => {
    // Instantly refresh live stories so any new story uploaded in admin is available immediately
    fetch(`/api/stories?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.stories && Array.isArray(data.stories)) {
          setStories(data.stories);
        }
      })
      .catch(() => {});
    setStoryOpen(true);
  };

  return (
    <>
      <header className={`site-header ${isScrolled ? "scrolled" : "transparent-hero"}`}>
        {/* Top Announcement Bar - Only displayed when scrolled or on internal pages */}
        {(!isHomePage || isScrolled) && (
          <div className="announcement-bar">
            <div className="announcement-content">
              <span>{announcementText}</span>
            </div>
          </div>
        )}

        <nav className="navbar atelier-navbar editorial-nav">
          <div className="header-side nav-links-left">
            <div className="nav-menu-wrapper" ref={menuRef}>
              <button
                type="button"
                className="header-icon-action nav-menu-toggle"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                title="Menu"
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={20} strokeWidth={1.7} /> : <Menu size={20} strokeWidth={1.7} />}
              </button>
              {menuOpen && (
                <div className="nav-menu">
                  <div className="nav-menu-section">
                    <span className="nav-menu-heading">SHOP</span>
                    <Link href="/shop" onClick={() => setMenuOpen(false)}>SHOP ALL</Link>
                    <Link href="/shop?section=newin" onClick={() => setMenuOpen(false)}>NEW ARRIVALS</Link>
                    <Link href="/category/t-shirts" onClick={() => setMenuOpen(false)}>T-SHIRTS</Link>
                    <Link href="/category/shirts" onClick={() => setMenuOpen(false)}>SHIRTS</Link>
                    <Link href="/wishlist" onClick={() => setMenuOpen(false)}>WISHLIST</Link>
                  </div>
                  <div className="nav-menu-divider" />
                  <div className="nav-menu-section">
                    <span className="nav-menu-heading">ACCOUNT</span>
                    {isLoggedIn ? (
                      <>
                        <Link href="/account" onClick={() => setMenuOpen(false)}>ACCOUNT DETAILS</Link>
                        <Link href="/account?tab=orders" onClick={() => setMenuOpen(false)}>MY ORDERS</Link>
                        <button type="button" onClick={handleLogout}>LOG OUT</button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" onClick={() => setMenuOpen(false)}>LOG IN</Link>
                        <Link href="/signup" onClick={() => setMenuOpen(false)}>CREATE ACCOUNT</Link>
                      </>
                    )}
                    <Link href="/admin" onClick={() => setMenuOpen(false)}>ADMIN CONSOLE →</Link>
                  </div>
                </div>
              )}
            </div>
            <div className="story-launcher-wrapper">
              <button
                type="button"
                className="story-launcher-btn"
                onClick={handleOpenStories}
                aria-label="View Atelier Stories"
                title="Atelier Stories"
              >
                <div className={`story-launcher-ring ${stories.length > 0 ? "has-stories" : ""}`}>
                  <div className="story-launcher-inner">
                    <Sparkles className="story-launcher-icon" />
                  </div>
                </div>
                {stories.length > 0 && <span className="story-launcher-badge" />}
              </button>
              <span className="story-launcher-tooltip">ATELIER STORIES</span>
            </div>
          </div>
          <Link href="/" className="logo atelier-logo font-serif">
            GREENO
          </Link>

          <div className="header-actions atelier-header-actions">
            <button
              type="button"
              className="header-icon-action"
              aria-label="Search"
              title="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={17} strokeWidth={1.7} />
            </button>

            <Link
              href="/wishlist"
              className="header-icon-action"
              aria-label="Wishlist"
              title="Saved pieces"
            >
              <Heart size={17} strokeWidth={1.7} />
              {wishlistCount > 0 && (
                <span className="header-icon-badge">{wishlistCount}</span>
              )}
            </Link>

            <button
              type="button"
              onClick={openCart}
              className="header-icon-action bag-action"
              aria-label="Shopping bag"
              title="Shopping bag"
            >
              <ShoppingBag size={17} strokeWidth={1.7} />
              {cartCount > 0 && (
                <span className="header-icon-badge">{cartCount}</span>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* =========================================
          MOBILE CURVY RECTANGLE DOCK (PHONE ONLY)
          Icons: Search, Wishlist, Account, Cart
      ========================================= */}
      <nav className="mobile-bottom-dock" aria-label="Mobile navigation">
        <div className="mobile-dock-inner">
          {/* SEARCH */}
          <button
            type="button"
            className="mobile-dock-item"
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

          {/* WISHLIST */}
          <Link
            href="/wishlist"
            className={`mobile-dock-item ${pathname === "/wishlist" ? "active" : ""}`}
            aria-label="Wishlist"
            title="Wishlist"
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
              <span className="mobile-dock-badge">{wishlistCount}</span>
            )}
          </Link>

          {/* ACCOUNT (Direct Link to Account Details Page) */}
          <Link
            href="/account"
            className={`mobile-dock-item ${
              pathname.startsWith("/account") || pathname === "/login" || pathname === "/signup"
                ? "active"
                : ""
            }`}
            aria-label="Account details"
            title="Account details"
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
          </Link>

          {/* CART */}
          <button
            type="button"
            onClick={openCart}
            className="mobile-dock-item"
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
              <span className="mobile-dock-badge">{cartCount}</span>
            )}
          </button>
        </div>
      </nav>

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <CartDrawer />

      <StoryViewerModal
        isOpen={storyOpen}
        onClose={() => setStoryOpen(false)}
        stories={stories}
      />
    </>
  );
}