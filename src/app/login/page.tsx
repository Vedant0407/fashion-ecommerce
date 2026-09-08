"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const supabase = createClient();

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError("Invalid email or password.");
        return;
      }

      router.push("/account");
      router.refresh();
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError("Something went wrong while logging in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    if (!email) {
      setError("Enter your email address first.");
      return;
    }

    try {
      setResetting(true);

      const supabase = createClient();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage("Password reset link sent. Check your email.");
    } catch (err) {
      console.error("PASSWORD RESET ERROR:", err);
      setError("Something went wrong while sending the reset link.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <p className="auth-label">GREENO / ACCOUNT</p>

        <h1>LOGIN</h1>

        <p className="auth-subtitle">Welcome back to GreenO.</p>

        <form onSubmit={handleLogin}>
          <div className="auth-field">
            <label>EMAIL</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label>PASSWORD</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "LOGGING IN..." : "LOGIN"}
          </button>
        </form>

        <button
          type="button"
          className="forgot-password-button"
          onClick={handleForgotPassword}
          disabled={resetting}
        >
          {resetting ? "SENDING..." : "FORGOT PASSWORD?"}
        </button>

        <div className="auth-signup">
          <span>DON'T HAVE AN ACCOUNT?</span>

          <Link href="/signup">SIGN UP</Link>
        </div>
      </div>
    </main>
  );
}