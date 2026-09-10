"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import OtpInput from "@/components/ui/OtpInput";
import GatewayNotification from "@/components/ui/GatewayNotification";

export default function SignupPage() {
  const router = useRouter();

  // Step 1: "credentials", Step 2: "verify"
  const [step, setStep] = useState<"credentials" | "verify">("credentials");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [activeCode, setActiveCode] = useState<string | null>(null);

  const [timer, setTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // If already logged in, redirect away from signup page
  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          router.push("/account");
          return;
        }
      } catch (err) {
        // No session
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, [router]);

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

  // Step 1: Request 6-digit Email Verification Code
  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill all fields.");
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

      // Dispatch 6-digit verification code to user email
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: email.trim(),
          type: "email",
          name: name.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to dispatch verification code.");
      }

      if (data.code) {
        setActiveCode(data.code);
      }

      setTimer(60);
      setCanResend(false);
      setOtpCode("");
      setMessage(
        data.realEmailSent
          ? `6-digit verification code dispatched to ${email.trim()}! Please check your inbox and Spam folder.`
          : `A 6-digit verification code has been generated for ${email.trim()}.`
      );
      setStep("verify");
    } catch (err: any) {
      console.error("SIGNUP OTP REQUEST ERROR:", err);
      setError(err.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify 6-digit code and finalize account creation
  async function handleVerifyAndSignup(e?: React.FormEvent, codeToVerify?: string) {
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

      // 1. Verify 6-digit OTP
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: email.trim(),
          code: finalCode,
          type: "email",
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || "Invalid or expired verification code.");
      }

      // 2. Finalize account creation in Supabase
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
          setError(
            "An account with this email already exists. Please log in instead."
          );
        } else {
          setError(signupError.message);
        }
        return;
      }

      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError(
          "An account with this email already exists. Please log in instead."
        );
        return;
      }

      localStorage.setItem("greeno_user_name", name.trim());

      setActiveCode(null);
      setMessage("Verification successful! Account created. Redirecting...");

      setTimeout(() => {
        router.push("/account");
        router.refresh();
      }, 500);
    } catch (err: any) {
      console.error("SIGNUP VERIFY ERROR:", err);
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Resend 6-digit code
  async function handleResendCode() {
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
          name: name.trim(),
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
          ? `New 6-digit code dispatched to ${email.trim()}! Check inbox & Spam.`
          : `New 6-digit verification code ready for ${email.trim()}.`
      );
    } catch (err) {
      setError("Failed to resend code.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return null;
  }

  return (
    <main className="auth-page">
      {/* On-screen Notification Card */}
      {activeCode && (
        <GatewayNotification
          type="email"
          target={email}
          code={activeCode}
          onAutoFill={(code) => {
            setOtpCode(code);
            handleVerifyAndSignup(undefined, code);
          }}
          onDismiss={() => setActiveCode(null)}
        />
      )}

      <div className="auth-container">
        <p className="auth-label">GREENO / ACCOUNT</p>

        {step === "credentials" ? (
          <>
            <h1>CREATE ACCOUNT</h1>
            <p className="auth-subtitle">
              Join GreenO. We will dispatch a 6-digit security code to verify your email.
            </p>

            <form onSubmit={handleRequestCode}>
              <div className="auth-field">
                <label>NAME *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="auth-field">
                <label>EMAIL *</label>
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
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  required
                />
              </div>

              {error && (
                <div style={{ margin: "16px 0" }}>
                  <p className="auth-error">{error}</p>
                  {error.includes("already exists") && (
                    <div style={{ marginTop: "8px" }}>
                      <Link
                        href="/login"
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textDecoration: "underline",
                          color: "#ffffff",
                        }}
                      >
                        GO TO LOGIN PAGE &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {message && <p className="auth-success">{message}</p>}

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? "DISPATCHING CODE..." : "CONTINUE & GET 6-DIGIT CODE →"}
              </button>
            </form>

            <div className="auth-signup">
              <span>ALREADY HAVE AN ACCOUNT?</span>
              <Link href="/login">LOGIN</Link>
            </div>
          </>
        ) : (
          <>
            <h1>VERIFY EMAIL</h1>
            <p className="auth-subtitle" style={{ marginBottom: "20px" }}>
              Hello <strong>{name}</strong>, enter the 6-digit security code sent to{" "}
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
              <div>
                ✉ <strong>Check your email inbox and Spam/Promotions folder.</strong> Look for your 6-digit security code.
              </div>
              {activeCode && (
                <div
                  style={{
                    marginTop: "10px",
                    paddingTop: "10px",
                    borderTop: "1px dashed #cccccc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "10px", color: "#666666" }}>
                    Provider delayed? Emergency passkey: <strong>{activeCode}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpCode(activeCode);
                      handleVerifyAndSignup(undefined, activeCode);
                    }}
                    style={{
                      background: "#000000",
                      color: "#ffffff",
                      border: "none",
                      padding: "4px 8px",
                      fontSize: "9px",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      cursor: "pointer",
                      textTransform: "uppercase",
                    }}
                  >
                    Auto-Fill Code ({activeCode})
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleVerifyAndSignup}>
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
                      handleVerifyAndSignup(undefined, newCode);
                    }
                  }}
                  error={Boolean(error)}
                  darkMode={false}
                />
              </div>

              {error && <p className="auth-error">{error}</p>}
              {message && <p className="auth-success">{message}</p>}

              <button
                type="submit"
                className="auth-button"
                disabled={loading || otpCode.length !== 6}
              >
                {loading ? "VERIFYING CODE..." : "VERIFY CODE & COMPLETE SIGNUP"}
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
              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setError("");
                  setMessage("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#666666",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                }}
              >
                &larr; CHANGE DETAILS
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend || loading}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: canResend ? "#000000" : "#999999",
                  cursor: canResend ? "pointer" : "not-allowed",
                  letterSpacing: "0.08em",
                  textDecoration: canResend ? "underline" : "none",
                }}
              >
                {canResend ? "RESEND 6-DIGIT CODE" : `RESEND IN ${timer}S`}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}