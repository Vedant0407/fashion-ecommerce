"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();

  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const status = localStorage.getItem("greeno_logged_in");

    if (status !== "true") {
      router.push("/login");
    } else {
      setLoggedIn(true);
    }
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    localStorage.removeItem("greeno_logged_in");

    router.push("/login");
    router.refresh();
  }

  if (loggedIn === null) {
    return null;
  }

  return (
    <main className="account-page">
      <div className="account-container">
        <p className="account-label">
          GREENO / ACCOUNT
        </p>

        <h1>ACCOUNT DETAILS</h1>

        <div className="account-details">
          <div className="account-row">
            <span>NAME</span>
            <strong>GreenO Customer</strong>
          </div>

          <div className="account-row">
            <span>EMAIL</span>
            <strong>customer@greeno.com</strong>
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