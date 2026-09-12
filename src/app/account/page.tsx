"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/context/CartContext";
import styles from "./account.module.css";

export default function AccountPage() {
  const router = useRouter();
  const { openCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function loadAccount() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const localName = typeof window !== "undefined" ? localStorage.getItem("greeno_user_name") : null;
          setUserName(
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            localName ||
            "GreenO Customer"
          );
          setUserEmail(user.email || "");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Supabase auth check error:", err);
      }

      // Check for local verified session
      const storedEmail = typeof window !== "undefined" ? localStorage.getItem("greeno_user_email") : null;
      const storedName = typeof window !== "undefined" ? localStorage.getItem("greeno_user_name") : null;

      if (storedEmail) {
        setUserName(storedName || storedEmail.split("@")[0].toUpperCase());
        setUserEmail(storedEmail);
        setLoading(false);
        return;
      }

      // No active session found, redirect to login
      router.push("/login");
    }

    loadAccount();
  }, [router]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore signOut errors
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
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p className={styles.message}>LOADING ACCOUNT...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <p className={styles.eyebrow}>GREENO / MY ACCOUNT</p>
        <h1 className={styles.title}>MY ACCOUNT</h1>

        <div className={styles.dashboard}>
          <aside className={styles.sidebar}>
            <Link href="/account" className={styles.sideLink}>
              PERSONAL INFORMATION
            </Link>
            <Link href="/account/orders" className={styles.sideLink}>
              MY ORDERS
            </Link>
            <Link href="/account/orders" className={styles.sideLink}>
              ORDER HISTORY
            </Link>
            <button type="button" onClick={openCart} className={styles.sideLink} style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer", width: "100%", font: "inherit" }}>
              SHOPPING BAG
            </button>
            <button className={styles.sideButton} onClick={handleLogout}>
              LOG OUT
            </button>
          </aside>

          <section className={styles.content}>
            <p className={styles.sectionLabel}>PERSONAL INFORMATION</p>

            <div className={styles.details}>
              <div className={styles.row}>
                <span>NAME</span>
                <strong>{userName}</strong>
              </div>
              <div className={styles.row}>
                <span>EMAIL</span>
                <strong>{userEmail}</strong>
              </div>
            </div>

            <div className={styles.cards}>
              <Link href="/account/orders" className={styles.card}>
                <span className={styles.cardLabel}>ORDERS</span>
                <h2 className={styles.cardTitle}>MY ORDERS</h2>
                <p className={styles.cardText}>
                  View your purchases, status and order details.
                </p>
              </Link>

              <div role="button" tabIndex={0} onClick={openCart} className={styles.card} style={{ cursor: "pointer" }}>
                <span className={styles.cardLabel}>SHOPPING</span>
                <h2 className={styles.cardTitle}>SHOPPING BAG</h2>
                <p className={styles.cardText}>
                  Review your selected pieces before checkout.
                </p>
              </div>

              <div className={styles.card}>
                <span className={styles.cardLabel}>PAYMENT</span>
                <h2 className={styles.cardTitle}>CASH ON DELIVERY</h2>
                <p className={styles.cardText}>
                  Your current checkout payment method. Online payment can be
                  added later.
                </p>
              </div>

              <div className={styles.card}>
                <span className={styles.cardLabel}>SUPPORT</span>
                <h2 className={styles.cardTitle}>GREENO SERVICE</h2>
                <p className={styles.cardText}>
                  Need help with an order? Keep your order ID ready when
                  contacting support.
                </p>
              </div>
            </div>

            <button className={styles.logout} onClick={handleLogout}>
              LOG OUT
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}