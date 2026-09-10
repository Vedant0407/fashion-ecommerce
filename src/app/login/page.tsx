"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Feedback States
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // If already logged in, redirect directly
  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const storedEmail = typeof window !== "undefined" ? localStorage.getItem("greeno_user_email") : null;

        if (user || storedEmail) {
          router.push(redirectUrl);
          return;
        }
      } catch (err) {
        // No active session
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, [router, redirectUrl]);

  // Handle Direct Login (No OTP verification code required)
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        const msg = signInError.message.toLowerCase();

        if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
          setError("Invalid email or password. If you don't have an account yet, please sign up.");
          return;
        }

        // If Supabase flags unconfirmed email but password is valid, log user in seamlessly
        if (msg.includes("email not confirmed") || msg.includes("email has not been confirmed")) {
          const fallbackName = email.split("@")[0].toUpperCase();
          const normalizedEmail = email.trim().toLowerCase();
          const firstLoginKey = `greeno_cart_cleared_for_${normalizedEmail}`;

          if (!localStorage.getItem(firstLoginKey)) {
            localStorage.removeItem("greeno_cart");
            localStorage.removeItem("greeno_coupon");
            localStorage.setItem(firstLoginKey, "true");
            window.dispatchEvent(new CustomEvent("greeno_cart_reset"));
          }

          localStorage.setItem("greeno_user_name", fallbackName);
          localStorage.setItem("greeno_user_email", email.trim());
          document.cookie = `greeno_session=${encodeURIComponent(email.trim())}; path=/; max-age=2592000; SameSite=Lax`;
          window.dispatchEvent(new Event("storage"));
          setMessage("Login successful! Redirecting...");
          setTimeout(() => {
            router.push(redirectUrl);
            router.refresh();
          }, 300);
          return;
        }

        setError(signInError.message);
        return;
      }

      // Extract full name from Supabase user metadata
      const userName =
        data.user?.user_metadata?.full_name ||
        data.user?.user_metadata?.name ||
        email.split("@")[0].toUpperCase();

      const normalizedEmail = email.trim().toLowerCase();
      const firstLoginKey = `greeno_cart_cleared_for_${normalizedEmail}`;

      if (!localStorage.getItem(firstLoginKey)) {
        localStorage.removeItem("greeno_cart");
        localStorage.removeItem("greeno_coupon");
        localStorage.setItem(firstLoginKey, "true");
        window.dispatchEvent(new CustomEvent("greeno_cart_reset"));
      }

      localStorage.setItem("greeno_user_name", userName);
      localStorage.setItem("greeno_user_email", email.trim());
      document.cookie = `greeno_session=${encodeURIComponent(email.trim())}; path=/; max-age=2592000; SameSite=Lax`;
      window.dispatchEvent(new Event("storage"));

      setMessage("Login successful! Redirecting...");

      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 300);
    } catch (err: any) {
      console.error("LOGIN ERROR:", err);
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Forgot password
  async function handleForgotPassword() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    try {
      setResetting(true);
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage("Password reset instructions have been sent to your email.");
    } catch (err) {
      console.error("PASSWORD RESET ERROR:", err);
      setError("Something went wrong while sending the reset link.");
    } finally {
      setResetting(false);
    }
  }

  if (checkingSession) {
    return null;
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <p className="auth-label">GREENO / ACCOUNT</p>

        <h1>LOGIN</h1>
        <p className="auth-subtitle">Enter your email and password to access your account.</p>

        <form onSubmit={handleLogin}>
          <div className="auth-field">
            <label>EMAIL ADDRESS *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label>PASSWORD *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div style={{ margin: "16px 0" }}>
              <p className="auth-error">{error}</p>
              {error.includes("sign up") && (
                <div style={{ marginTop: "8px" }}>
                  <Link
                    href="/signup"
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textDecoration: "underline",
                      color: "#ffffff",
                    }}
                  >
                    CREATE A NEW ACCOUNT &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          {message && <p className="auth-success">{message}</p>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "AUTHENTICATING..." : "SIGN IN →"}
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "#888888", letterSpacing: "0.12em" }}>
          LOADING SECURE LOGIN...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}