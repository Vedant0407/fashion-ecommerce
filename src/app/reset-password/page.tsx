"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleResendCode() {
    if (!email.trim() || resending) return;
    setError("");
    setMessage("");
    try {
      setResending(true);
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to resend verification code.");
        return;
      }
      setMessage("A new 6-digit verification code has been dispatched to your email!");
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!code || code.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword: password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to reset password. Please check the code.");
        return;
      }

      // Session setup
      localStorage.setItem("greeno_user_email", email.trim());
      if (data.user?.name) {
        localStorage.setItem("greeno_user_name", data.user.name);
      }
      document.cookie = `greeno_session=${encodeURIComponent(
        email.trim()
      )}; path=/; max-age=2592000; SameSite=Lax`;
      window.dispatchEvent(new Event("storage"));

      setMessage("Password updated successfully! Redirecting to your account...");

      setTimeout(() => {
        router.push("/account");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error("UPDATE PASSWORD ERROR:", err);
      setError(err.message || "Something went wrong while updating your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <p className="auth-label">GREENO / ACCOUNT</p>

        <h1>RESET PASSWORD</h1>

        <p className="auth-subtitle">
          Enter the 6-digit code sent to your email along with your new password.
        </p>

        <form onSubmit={handleUpdatePassword}>
          <div className="auth-field">
            <label>EMAIL ADDRESS</label>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label>6-DIGIT VERIFICATION CODE</label>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending || !email.trim()}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "11px",
                  cursor: "pointer",
                  textDecoration: "underline",
                  opacity: 0.8,
                }}
              >
                {resending ? "Sending..." : "Resend code"}
              </button>
            </div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              autoComplete="one-time-code"
              required
              style={{ letterSpacing: "0.2em", fontWeight: 700 }}
            />
          </div>

          <div className="auth-field">
            <label>NEW PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="auth-field">
            <label>CONFIRM PASSWORD</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "UPDATING PASSWORD..." : "UPDATE PASSWORD & LOG IN"}
          </button>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <Link
              href="/login"
              style={{
                fontSize: "12px",
                color: "#888888",
                textDecoration: "none",
              }}
            >
              ← Back to Log in
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", color: "#888888" }}>
          LOADING...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}