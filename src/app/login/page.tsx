"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    localStorage.setItem("greeno_logged_in", "true");

    router.push("/account");
  };

  return (
    <main className="auth-page">

      <div className="auth-container">

        <p className="auth-label">GREENO / ACCOUNT</p>

        <h1>LOGIN</h1>

        <p className="auth-subtitle">
          Welcome back to GreenO.
        </p>

        <form onSubmit={handleLogin}>

          <div className="auth-field">
            <label>EMAIL</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div className="auth-field">
            <label>PASSWORD</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="auth-button">
            LOGIN
          </button>

        </form>

        <div className="auth-signup">
          <span>DON'T HAVE AN ACCOUNT?</span>

          <Link href="/signup">
            SIGN UP
          </Link>
        </div>

      </div>

    </main>
  );
}