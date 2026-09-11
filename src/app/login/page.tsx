"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import GoogleSignInModal from "@/components/GoogleSignInModal";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Feedback States
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  // Open Direct Passwordless Google Sign In Modal
  function handleGoogleLogin() {
    setError("");
    setMessage("");
    setShowGoogleModal(true);
  }

  // Handle Direct Email/Password Login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!agreeTerms) {
      setError("Please agree to the Terms & Conditions to continue.");
      return;
    }

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

      // 1. Authenticate with secure permanent database endpoint
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(
          data.message ||
            "Invalid email or password. If you don't have an account yet, please sign up."
        );
        return;
      }

      // 2. Client-side Supabase sync (non-blocking)
      try {
        const supabase = createClient();
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      } catch (sbErr) {
        console.warn("Client-side Supabase signin notice:", sbErr);
      }

      // 3. User session setup
      const userName = data.user?.name || email.split("@")[0].toUpperCase();
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
      document.cookie = `greeno_session=${encodeURIComponent(
        email.trim()
      )}; path=/; max-age=2592000; SameSite=Lax`;
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
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to process password reset.");
        return;
      }

      setMessage("A 6-digit verification code has been sent to your email! Redirecting...");
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
      }, 1000);
    } catch (err: any) {
      console.error("PASSWORD RESET ERROR:", err);
      setError("Something went wrong while sending the reset code.");
    } finally {
      setResetting(false);
    }
  }

  if (checkingSession) {
    return null;
  }

  return (
    <main className="premium-auth-wrapper">
      <div className="premium-auth-card">
        {/* Left Column: Visual Showcase */}
        <div className="premium-auth-visual">
          <div className="premium-auth-visual-inner">
            <img
              src="/hero.jfif"
              alt="GreenO Luxury Streetwear"
              className="premium-auth-visual-img"
            />
            <div className="premium-auth-visual-overlay" />

            {/* Emblem at Top Center */}
            <div className="premium-auth-emblem">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m4.93 4.93 4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M4.93 19.07l4.24-4.24" />
              </svg>
            </div>

            {/* Footer on Visual */}
            <div className="premium-auth-visual-footer">
              <p className="premium-visual-tag">SPRING / SUMMER 2026</p>
              <h2 className="premium-visual-title">GREENO STREETWEAR</h2>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="premium-auth-form-side">
          {/* Back Arrow */}
          <Link href="/" className="premium-auth-back-btn" title="Back to home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>

          {/* Heading */}
          <h1 className="premium-auth-heading">Log in</h1>
          <p className="premium-auth-sub">
            Don&apos;t have an account? <Link href="/signup">Create an Account</Link>
          </p>

          {/* Error & Success Feedback */}
          {error && <div className="premium-auth-error">{error}</div>}
          {message && <div className="premium-auth-success">{message}</div>}

          {/* Form */}
          <form onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="premium-input-group">
              <label className="premium-input-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="premium-input-pill"
                autoComplete="email"
                required
              />
            </div>

            {/* Password Field */}
            <div className="premium-input-group">
              <label className="premium-input-label">Password</label>
              <div className="premium-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="premium-input-pill"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="premium-password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="premium-forgot-row">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetting}
                className="premium-forgot-btn"
              >
                {resetting ? "Sending..." : "Forgot Password?"}
              </button>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="premium-submit-pill"
            >
              {loading ? "Authenticating..." : "Log in"}
            </button>

            {/* Terms Checkbox */}
            <label className="premium-terms-row">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>I agree to the Terms &amp; Condition</span>
            </label>
          </form>

          {/* Divider */}
          <div className="premium-or-divider">
            <span className="premium-or-text">or</span>
          </div>

          {/* Direct Google Login (Without Password) */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="premium-google-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </div>

      <GoogleSignInModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        redirectUrl={redirectUrl}
      />
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