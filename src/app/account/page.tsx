"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function loadAccount() {
      try {
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
      } catch (err) {
        console.error("ACCOUNT ERROR:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
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
      <main className="account-page">
        <div className="account-container">
          <p>LOADING ACCOUNT...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">
      <div className="account-container">
        <p className="account-label">GREENO / ACCOUNT</p>

        <h1>ACCOUNT DETAILS</h1>

        <div className="account-details">
          <div className="account-row">
            <span>NAME</span>
            <strong>{userName}</strong>
          </div>

          <div className="account-row">
            <span>EMAIL</span>
            <strong>{userEmail}</strong>
          </div>
        </div>

        <button
          className="account-orders-button"
          onClick={() => router.push("/account/orders")}
        >
          VIEW LAST ORDERS
        </button>

        <button
          className="account-logout-button"
          onClick={handleLogout}
        >
          LOG OUT
        </button>
      </div>
    </main>
  );
}