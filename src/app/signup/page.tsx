"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Feedback States
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // If already logged in, redirect away from signup page
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
        // No session
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, [router, redirectUrl]);

  // Handle Direct Google Sign Up / Login without password
  async function handleGoogleLogin() {
    setError("");
    setMessage("");

    try {
      setGoogleLoading(true);
      const supabase = createClient();

      const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectUrl)}`;

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oauthError) {
        console.error("GOOGLE OAUTH SIGNUP ERROR:", oauthError);
        setError(oauthError.message || "Could not connect to Google. Please try again.");
      }
    } catch (err: any) {
      console.error("GOOGLE SIGNUP EXCEPTION:", err);
      setError(err.message || "Failed to initiate Google sign up.");
    } finally {
      setGoogleLoading(false);
    }
  }

  // Handle Email & Password Signup
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!agreeTerms) {
      setError("Please agree to the Terms & Conditions to proceed.");
      return;
    }

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            name: name.trim(),
          },
        },
      });

      if (signupError) {
        const msg = signupError.message.toLowerCase();
        if (
          msg.includes("already registered") ||
          msg.includes("already exists") ||
          msg.includes("already in use") ||
          msg.includes("identity already exists")
        ) {
          setError("An account with this email already exists. Please log in instead.");
        } else {
          setError(signupError.message);
        }
        return;
      }

      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError("An account with this email already exists. Please log in instead.");
        return;
      }

      // Initialize clean cart for new account
      const normalizedEmail = email.trim().toLowerCase();
      const firstLoginKey = `greeno_cart_cleared_for_${normalizedEmail}`;
      localStorage.removeItem("greeno_cart");
      localStorage.removeItem("greeno_coupon");
      localStorage.setItem(firstLoginKey, "true");
      window.dispatchEvent(new CustomEvent("greeno_cart_reset"));

      // Store credentials locally
      localStorage.setItem("greeno_user_name", name.trim());
      localStorage.setItem("greeno_user_email", email.trim());
      document.cookie = `greeno_session=${encodeURIComponent(email.trim())}; path=/; max-age=2592000; SameSite=Lax`;
      window.dispatchEvent(new Event("storage"));

      setMessage("Account created successfully! Welcome to GreenO. Redirecting...");

      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 400);
    } catch (err: any) {
      console.error("SIGNUP ERROR:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
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
              <p className="premium-visual-tag">NEW MEMBER PRIVILEGES</p>
              <h2 className="premium-visual-title">JOIN GREENO CLOTHING</h2>
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
          <h1 className="premium-auth-heading">Create an Account</h1>
          <p className="premium-auth-sub">
            Already have an account? <Link href="/login">Log in</Link>
          </p>

          {/* Error & Success Feedback */}
          {error && <div className="premium-auth-error">{error}</div>}
          {message && <div className="premium-auth-success">{message}</div>}

          {/* Form */}
          <form onSubmit={handleSignup}>
            {/* Full Name */}
            <div className="premium-input-group">
              <label className="premium-input-label">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Martinez"
                className="premium-input-pill"
                autoComplete="name"
                required
              />
            </div>

            {/* Email Address */}
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

            {/* Password */}
            <div className="premium-input-group">
              <label className="premium-input-label">Password</label>
              <div className="premium-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="premium-input-pill"
                  autoComplete="new-password"
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

            {/* Terms Checkbox */}
            <label className="premium-terms-row">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>I agree to the Terms &amp; Condition</span>
            </label>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="premium-submit-pill"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="premium-or-divider">
            <span className="premium-or-text">or</span>
          </div>

          {/* Direct Google Sign Up (Without Password) */}
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
            <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "#888888", letterSpacing: "0.12em" }}>
          LOADING SECURE SIGNUP...
        </div>
      }
    >
      <SignupFormContent />
    </Suspense>
  );
}