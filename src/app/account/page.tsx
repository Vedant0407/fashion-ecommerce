"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import styles from "./account.module.css";

export default function AccountPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function loadAccount() {
      const supabase = createClient();

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
        return;
      }

      setUserName(
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "GreenO Customer"
      );
      setUserEmail(user.email || "");
      setLoading(false);
    }

    loadAccount();
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
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
            <Link href="/cart" className={styles.sideLink}>
              SHOPPING BAG
            </Link>
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

              <Link href="/cart" className={styles.card}>
                <span className={styles.cardLabel}>SHOPPING</span>
                <h2 className={styles.cardTitle}>SHOPPING BAG</h2>
                <p className={styles.cardText}>
                  Review your selected pieces before checkout.
                </p>
              </Link>

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