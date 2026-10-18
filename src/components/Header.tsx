"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { createClient } from "@/lib/supabase/client";
import CartDrawer from "@/components/CartDrawer";
import StoryViewerModal from "@/components/ui/StoryViewerModal";
import { Heart, ShoppingBag, Sparkles, Menu, X } from "lucide-react";
import { type StoreStory } from "@/lib/story-constants";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const isHomePage = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(() => !isHomePage);
  const [menuOpen, setMenuOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [stories, setStories] = useState<StoreStory[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [announcementText, setAnnouncementText] = useState(
    "COMPLIMENTARY SHIPPING ACROSS INDIA • COD AVAILABLE • NEW DROP IS LIVE"
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const authCheckVersion = useRef(0);

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
        const email = sessionUser.email.trim().toLowerCase();
        localStorage.setItem("greeno_user_email", email);
        if (!localStorage.getItem("greeno_user_name")) {
          const name =
            sessionUser.user_metadata?.full_name ||
            sessionUser.user_metadata?.name ||
            email.split("@")[0].toUpperCase();
          localStorage.setItem("greeno_user_name", name);
        }
      } else {
        localStorage.removeItem("greeno_user_email");
        localStorage.removeItem("greeno_user_name");
      }

      setIsLoggedIn(Boolean(sessionUser?.email));
    }

    async function updateAdminState(version: number) {
      try {
        const response = await fetch("/api/admin/session", { cache: "no-store" });
        const result = await response.json();
        if (version === authCheckVersion.current) {
          setIsAdmin(response.ok && result.admin === true);
        }
      } catch {
        if (version === authCheckVersion.current) setIsAdmin(false);
      }
    }

    async function loadSession() {
      const version = ++authCheckVersion.current;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (version !== authCheckVersion.current) return;
        updateLoginState(user);
        if (user?.email) {
          await updateAdminState(version);
        } else {
          setIsAdmin(false);
        }
      } catch {
        if (version !== authCheckVersion.current) return;
        updateLoginState(undefined);
        setIsAdmin(false);
      }
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const version = ++authCheckVersion.current;
      const user = session?.user;
      updateLoginState(user);
      if (user?.email) {
        void updateAdminState(version);
      } else {
        setIsAdmin(false);
      }
    });

    // A real `storage` event comes from another tab. Auth flows also dispatch
    // one in this tab, so always re-read Supabase instead of treating it as sign-out.
    const handleSessionRefresh = () => { void loadSession(); };
    window.addEventListener("storage", handleSessionRefresh);
    window.addEventListener("greeno_auth_change", handleSessionRefresh);

    return () => {
      authCheckVersion.current += 1;
      subscription.unsubscribe();
      window.removeEventListener("storage", handleSessionRefresh);
      window.removeEventListener("greeno_auth_change", handleSessionRefresh);
    };
  }, []);

  // Close navigation menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close navigation menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!menuOpen) return;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

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
      document.body.style.overflow = previousBodyOverflow;
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
            <div className="nav-menu-wrapper">
              <button
                type="button"
                className="header-icon-action nav-menu-toggle"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                title="Menu"
                aria-expanded={menuOpen}
                aria-haspopup="dialog"
                aria-controls="site-navigation-dashboard"
              >
                {menuOpen ? <X size={20} strokeWidth={1.7} /> : <Menu size={20} strokeWidth={1.7} />}
              </button>
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
      {menuOpen && (
        <button
          type="button"
          className="nav-menu-backdrop"
          aria-label="Close dashboard"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        ref={menuRef}
        id="site-navigation-dashboard"
        className={`nav-menu ${menuOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Account dashboard"
        aria-hidden={!menuOpen}
      >
        <div className="nav-menu-header">
          <div>
            <span className="nav-menu-kicker">GREENO ATELIER</span>
            <h2>DASHBOARD</h2>
          </div>
          <button
            type="button"
            className="nav-menu-close"
            aria-label="Close dashboard"
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} strokeWidth={1.7} />
          </button>
        </div>
        <div className="nav-menu-section">
          <span className="nav-menu-heading">ACCOUNT</span>
          {isLoggedIn ? (
            <>
              <Link href="/account" onClick={() => setMenuOpen(false)}>ACCOUNT DETAILS</Link>
              <Link href="/account?tab=orders" onClick={() => setMenuOpen(false)}>MY ORDERS</Link>
              <button type="button" onClick={handleLogout}>LOG OUT</button>
              {isAdmin && <Link href="/admin" onClick={() => setMenuOpen(false)}>ADMIN CONSOLE →</Link>}
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)}>LOG IN</Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)}>CREATE ACCOUNT</Link>
            </>
          )}
        </div>
      </aside>

      {/* =========================================
          MOBILE CURVY RECTANGLE DOCK (PHONE ONLY)
          Icons: Wishlist, Account, Cart
      ========================================= */}
      <nav className="mobile-bottom-dock" aria-label="Mobile navigation">
        <div className="mobile-dock-inner">
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

      <CartDrawer />

      <StoryViewerModal
        isOpen={storyOpen}
        onClose={() => setStoryOpen(false)}
        stories={stories}
      />
    </>
  );
}
