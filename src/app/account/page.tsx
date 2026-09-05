"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
          onClick={() => router.push("/orders")}
        >
          VIEW LAST ORDERS
        </button>

      </div>

    </main>
  );
}