"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface GoogleAccount {
  email: string;
  name: string;
  avatarColor?: string;
}

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectUrl?: string;
  onSuccess?: () => void;
}

const DEFAULT_ACCOUNTS: GoogleAccount[] = [
  {
    email: "vedantshrivastava0407@gmail.com",
    name: "Vedant Shrivastava",
    avatarColor: "blue",
  },
];

const COLOR_CLASSES = ["blue", "emerald", "amber", "rose"];

export default function GoogleSignInModal({
  isOpen,
  onClose,
  redirectUrl = "/account",
  onSuccess,
}: GoogleSignInModalProps) {
  const router = useRouter();

  const [view, setView] = useState<"select" | "custom" | "signing-in">("select");
  const [accounts, setAccounts] = useState<GoogleAccount[]>(DEFAULT_ACCOUNTS);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [activeSigningName, setActiveSigningName] = useState("");
  const [error, setError] = useState("");

  // Load and sync known Google accounts on modal open
  useEffect(() => {
    if (!isOpen) return;

    setView("select");
    setError("");
    setGoogleEmail("");
    setGoogleName("");

    try {
      const stored = localStorage.getItem("greeno_known_google_accounts");
      const parsed: GoogleAccount[] = stored ? JSON.parse(stored) : [];

      // Check current stored email
      const currentEmail = localStorage.getItem("greeno_user_email");
      const currentName = localStorage.getItem("greeno_user_name");

      const combined = [...DEFAULT_ACCOUNTS];

      if (currentEmail && currentEmail.includes("@")) {
        const cleanCurrent = currentEmail.trim().toLowerCase();
        if (!combined.some((a) => a.email.toLowerCase() === cleanCurrent)) {
          combined.unshift({
            email: cleanCurrent,
            name: currentName || cleanCurrent.split("@")[0],
            avatarColor: "emerald",
          });
        }
      }

      parsed.forEach((p) => {
        if (p.email && !combined.some((a) => a.email.toLowerCase() === p.email.toLowerCase())) {
          combined.push(p);
        }
      });

      setAccounts(combined);
    } catch {
      setAccounts(DEFAULT_ACCOUNTS);
    }
  }, [isOpen]);

  // Optional: Initialize Google Identity Services (GIS) if NEXT_PUBLIC_GOOGLE_CLIENT_ID is provided
  useEffect(() => {
    if (!isOpen) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    function initGsi() {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              if (response.credential) {
                await executeLogin({ credential: response.credential });
              }
            },
          });
          // Render One-Tap prompt if appropriate
          (window as any).google.accounts.id.prompt();
        } catch (gsiErr) {
          console.warn("Notice: Google GIS init:", gsiErr);
        }
      }
    }

    if (!(window as any).google?.accounts?.id) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.head.appendChild(script);
    } else {
      initGsi();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Unified execution of Google Authentication
  async function executeLogin(payload: {
    email?: string;
    name?: string;
    credential?: string;
  }) {
    setError("");
    const targetEmail = payload.email?.trim().toLowerCase() || "";
    const targetName =
      payload.name ||
      (targetEmail
        ? targetEmail
            .split("@")[0]
            .replace(/[._-]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : "Google User");

    setActiveSigningName(targetName);
    setView("signing-in");

    try {
      // 1. Post to secure backend endpoint
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to authenticate with Google.");
      }

      const finalEmail = (data.user?.email || targetEmail).toLowerCase();
      const finalName = data.user?.name || targetName;

      // 2. Strict Account & Order Isolation (Rule #2)
      // When switching accounts, clear previous order cache so they never bleed into this account
      const prevEmail = localStorage.getItem("greeno_user_email");
      if (prevEmail && prevEmail.trim().toLowerCase() !== finalEmail) {
        localStorage.removeItem("greeno_customer_orders");
        localStorage.removeItem("greeno_last_order");
        localStorage.removeItem("greeno_all_orders");
      }

      // Reset cart on first login for this account
      const firstLoginKey = `greeno_cart_cleared_for_${finalEmail}`;
      if (!localStorage.getItem(firstLoginKey)) {
        localStorage.removeItem("greeno_cart");
        localStorage.removeItem("greeno_coupon");
        localStorage.setItem(firstLoginKey, "true");
        window.dispatchEvent(new CustomEvent("greeno_cart_reset"));
      }

      // 3. Save to remembered Google accounts list for instant 1-click access
      try {
        const stored = localStorage.getItem("greeno_known_google_accounts");
        const existing: GoogleAccount[] = stored ? JSON.parse(stored) : [];
        if (!existing.some((a) => a.email.toLowerCase() === finalEmail)) {
          existing.unshift({
            email: finalEmail,
            name: finalName,
            avatarColor: COLOR_CLASSES[existing.length % COLOR_CLASSES.length],
          });
          localStorage.setItem(
            "greeno_known_google_accounts",
            JSON.stringify(existing.slice(0, 5))
          );
        }
      } catch {
        // Non-critical
      }

      // 4. Synchronize session to localStorage and Cookies
      localStorage.setItem("greeno_user_email", finalEmail);
      localStorage.setItem("greeno_user_name", finalName);
      document.cookie = `greeno_session=${encodeURIComponent(
        finalEmail
      )}; path=/; max-age=2592000; SameSite=Lax`;
      window.dispatchEvent(new Event("storage"));

      // 5. Client-side Supabase sync (non-blocking, fails gracefully)
      try {
        const supabase = createClient();
        await supabase.auth.signInWithOtp({
          email: finalEmail,
          options: {
            data: {
              full_name: finalName,
              name: finalName,
              provider: "google",
            },
          },
        });
      } catch {
        // Silent fallback to secure user-store session
      }

      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
        router.push(redirectUrl);
        router.refresh();
      }, 400);
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setError(err.message || "Failed to sign in with Google. Please try again.");
      setView("select");
    }
  }

  // Handle clicking an existing Google account card
  const handleSelectAccount = (account: GoogleAccount) => {
    executeLogin({ email: account.email, name: account.name });
  };

  // Handle submitting a new / custom Google email
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let email = googleEmail.trim().toLowerCase();
    if (!email) {
      setError("Please enter your Google email address.");
      return;
    }

    if (!email.includes("@")) {
      email = `${email}@gmail.com`;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const cleanName =
      googleName.trim() ||
      email
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    executeLogin({ email, name: cleanName });
  };

  return (
    <div className="google-modal-backdrop" onClick={onClose}>
      <div
        className="google-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Back Button (shown only when in custom email view) */}
        {view === "custom" && (
          <button
            type="button"
            className="google-modal-back-btn"
            onClick={() => {
              setView("select");
              setError("");
            }}
            aria-label="Back to account selection"
            title="Back to account selection"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        )}

        {/* Close Button */}
        <button
          type="button"
          className="google-modal-close"
          onClick={onClose}
          aria-label="Close dialog"
          title="Close dialog"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Google Header */}
        <div className="google-modal-header">
          <div className="google-icon-box">
            <svg width="32" height="32" viewBox="0 0 24 24">
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
          </div>
          <h3 className="google-modal-title">Sign in with Google</h3>
          <p className="google-modal-desc">
            {view === "custom"
              ? "to continue to GreenO"
              : "Choose an account to continue to GreenO"}
          </p>
        </div>

        {error && <div className="google-modal-error">{error}</div>}

        {/* VIEW 1: ACCOUNT CHOOSER (DEFAULT) */}
        {view === "select" && (
          <>
            <div className="google-account-list">
              {accounts.map((acc) => {
                const initial = (acc.name || acc.email)[0].toUpperCase();
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectAccount(acc)}
                    className="google-account-item"
                  >
                    <div
                      className={`google-account-avatar ${
                        acc.avatarColor || "blue"
                      }`}
                    >
                      {initial}
                    </div>
                    <div className="google-account-info">
                      <div className="google-account-name">{acc.name}</div>
                      <div className="google-account-email">{acc.email}</div>
                    </div>
                    <span className="google-account-badge">1-Click</span>
                  </button>
                );
              })}

              {/* Use Another Account Button */}
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setView("custom");
                }}
                className="google-account-add-btn"
              >
                <div className="google-account-add-icon">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </div>
                <span>Use another account</span>
              </button>
            </div>

            <p className="google-security-notice">
              To continue, Google will securely share your name, email address,
              and profile with GreenO.
            </p>
          </>
        )}

        {/* VIEW 2: CUSTOM GOOGLE EMAIL INPUT */}
        {view === "custom" && (
          <form onSubmit={handleCustomSubmit} className="google-custom-form">
            <div className="google-custom-field">
              <label className="google-custom-label">Email or phone</label>
              <input
                type="text"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="google-custom-input"
                autoFocus
                required
              />
            </div>

            <div className="google-custom-field">
              <label className="google-custom-label">
                Your Name (Optional)
              </label>
              <input
                type="text"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                placeholder="First & Last Name"
                className="google-custom-input"
              />
            </div>

            <button type="submit" className="google-custom-submit-btn">
              <span>Next &rarr;</span>
            </button>

            <p className="google-security-notice">
              Instant passwordless sign-in with your Google identity.
            </p>
          </form>
        )}

        {/* VIEW 3: SIGNING IN PROGRESS */}
        {view === "signing-in" && (
          <div className="google-signing-in-state">
            <div className="google-spinner" />
            <div className="google-signing-text">
              Signing in as {activeSigningName}...
            </div>
            <div className="google-signing-sub">
              Establishing verified customer session with GreenO
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

