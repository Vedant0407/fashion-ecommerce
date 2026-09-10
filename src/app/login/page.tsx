"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import OtpInput from "@/components/ui/OtpInput";
import GatewayNotification from "@/components/ui/GatewayNotification";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";

  // Step 1: "credentials", Step 2: "verify"
  const [step, setStep] = useState<"credentials" | "verify">("credentials");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Countdown timer for Resend Code
  const [timer, setTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Feedback States
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeCode, setActiveCode] = useState<string | null>(null);

  // If already logged in, redirect directly
  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
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

  // Handle countdown timer for Resend
  useEffect(() => {
    let interval: any;
    if (step === "verify" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Step 1: Validate credentials and request Email OTP
  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
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

      // Verify email and password with Supabase first
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        const msg = signInError.message.toLowerCase();
        if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
          setError("Invalid email or password. If you don't have an account yet, please sign up.");
          return;
        } else if (msg.includes("email not confirmed") || msg.includes("email has not been confirmed")) {
          // The password is valid, but email is not confirmed in Supabase yet.
          // Proceed to send the 6-digit OTP code to verify their email!
          console.log("Supabase account exists with unconfirmed email. Proceeding to send 6-digit OTP.");
        } else {
          setError(signInError.message);
          return;
        }
      }

      // Temporarily sign out while the user verifies their 6-digit email OTP
      await supabase.auth.signOut();

      // Dispatch 6-digit Email OTP
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: email.trim(),
          type: "email",
          name: fullName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send verification code.");
      }

      if (data.code) {
        setActiveCode(data.code);
      }

      setTimer(60);
      setCanResend(false);
      setOtpCode("");
      setMessage(
        data.realEmailSent
          ? `Security code dispatched to ${email.trim()}! Please check your Gmail / inbox (and Spam folder).`
          : `A 6-digit verification code has been generated for ${email.trim()}.`
      );
      setStep("verify");
    } catch (err: any) {
      console.error("OTP REQUEST ERROR:", err);
      setError(err.message || "Something went wrong while sending the code.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify 6-digit code and complete login
  async function handleVerifyOtp(e?: React.FormEvent, codeToVerify?: string) {
    if (e) e.preventDefault();
    setError("");
    setMessage("");

    const finalCode = (codeToVerify || otpCode).trim();

    if (!finalCode || finalCode.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);

      // 1. Verify OTP with backend
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: email.trim(),
          code: finalCode,
          type: "email",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid or expired verification code.");
      }

      // 2. Finalize authentication in Supabase
      const supabase = createClient();
      const { error: finalSignInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (finalSignInError) {
        const finalMsg = finalSignInError.message.toLowerCase();
        if (finalMsg.includes("email not confirmed")) {
          // The user entered the correct 6-digit OTP code sent to their email!
          // Authenticate and sync session locally
          localStorage.setItem("greeno_user_name", fullName.trim());
          localStorage.setItem("greeno_user_email", email.trim());
          setActiveCode(null);
          setMessage("Verification successful! Redirecting...");
          setTimeout(() => {
            router.push(redirectUrl);
            router.refresh();
          }, 500);
          return;
        }
        throw new Error(finalSignInError.message);
      }

      // Update user metadata with user's name
      await supabase.auth.updateUser({
        data: { full_name: fullName.trim(), name: fullName.trim() },
      });

      // Save user full name locally for instant UI sync
      localStorage.setItem("greeno_user_name", fullName.trim());

      setActiveCode(null);
      setMessage("Verification successful! Redirecting...");

      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 500);
    } catch (err: any) {
      console.error("VERIFY OTP ERROR:", err);
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP
  async function handleResendOtp() {
    if (!canResend) return;
    setError("");
    setMessage("");

    try {
      setLoading(true);
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: email.trim(),
          type: "email",
          name: fullName.trim(),
        }),
      });
      const data = await res.json();
      if (data.code) {
        setActiveCode(data.code);
      }
      setTimer(60);
      setCanResend(false);
      setMessage(
        data.realEmailSent
          ? `New verification code dispatched to ${email.trim()}! Check inbox & Spam.`
          : `New verification code ready for ${email.trim()}.`
      );
    } catch (err) {
      setError("Failed to resend code.");
    } finally {
      setLoading(false);
    }
  }

  // Forgot password
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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

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

  if (checkingSession) {
    return null;
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <p className="auth-label">GREENO / SECURE AUTHENTICATION</p>

        {step === "credentials" ? (
          <>
            <h1>LOGIN</h1>
            <p className="auth-subtitle">Enter your name, email and password to receive your access code.</p>

            <form onSubmit={handleRequestOtp}>
              <div className="auth-field">
                <label>YOUR FULL NAME *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="auth-field">
                <label>EMAIL ADDRESS *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
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
                {loading ? "CHECKING CREDENTIALS..." : "CONTINUE & GET EMAIL CODE →"}
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
          </>
        ) : (
          <>
            <h1>VERIFY EMAIL</h1>
            <p className="auth-subtitle" style={{ marginBottom: "20px" }}>
              Hello <strong>{fullName}</strong>, we sent a 6-digit security code to{" "}
              <strong>{email}</strong>.
            </p>
            <div
              style={{
                background: "#f0f0ee",
                border: "1px solid #dcdcd8",
                padding: "12px 14px",
                fontSize: "11px",
                color: "#444444",
                lineHeight: "1.5",
                marginBottom: "24px",
              }}
            >
              ✉ <strong>Check your email inbox and Spam folder.</strong> We dispatched a 6-digit verification code to <strong>{email}</strong>. Please enter the code below to complete login.
            </div>

            <form onSubmit={handleVerifyOtp}>
              <div style={{ textAlign: "center", marginBottom: "8px" }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    color: "#888888",
                    textTransform: "uppercase",
                  }}
                >
                  ENTER 6-DIGIT PASSCODE
                </span>

                <OtpInput
                  value={otpCode}
                  onChange={(newCode) => {
                    setOtpCode(newCode);
                    if (newCode.length === 6) {
                      handleVerifyOtp(undefined, newCode);
                    }
                  }}
                  error={Boolean(error)}
                  darkMode={false}
                />
              </div>

              {error && <p className="auth-error">{error}</p>}
              {message && <p className="auth-success">{message}</p>}

              <button type="submit" className="auth-button" disabled={loading || otpCode.length !== 6}>
                {loading ? "VERIFYING PASSCODE..." : "VERIFY CODE & COMPLETE LOGIN"}
              </button>
            </form>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "24px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e5e5",
              }}
            >
              {canResend ? (
                <button
                  type="button"
                  className="forgot-password-button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  style={{ margin: 0, fontWeight: 700, color: "#000000" }}
                >
                  RESEND CODE
                </button>
              ) : (
                <span style={{ fontSize: "11px", color: "#888888", letterSpacing: "0.08em" }}>
                  RESEND CODE IN {String(Math.floor(timer / 60)).padStart(2, "0")}:{String(timer % 60).padStart(2, "0")}
                </span>
              )}

              <button
                type="button"
                className="forgot-password-button"
                onClick={() => {
                  setStep("credentials");
                  setError("");
                  setMessage("");
                  setOtpCode("");
                }}
                style={{ margin: 0 }}
              >
                ← CHANGE DETAILS
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "80vh", background: "#f7f7f5" }} />}>
      <LoginFormContent />
    </Suspense>
  );
}