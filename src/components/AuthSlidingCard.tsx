"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import GoogleSignInModal from "@/components/GoogleSignInModal";
import OtpInput from "@/components/ui/OtpInput";

interface AuthSlidingCardProps {
  initialMode?: "login" | "signup";
}

export default function AuthSlidingCard({
  initialMode = "login",
}: AuthSlidingCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";

  // Active state: true = Sign-Up mode, false = Sign-In mode
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");

  // Keep state in sync if initialMode changes
  useEffect(() => {
    setIsSignUp(initialMode === "signup");
  }, [initialMode]);

  // Session verification
  const [checkingSession, setCheckingSession] = useState(true);

  // Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // ---------------------------------------------
  // LOGIN FORM STATES
  // ---------------------------------------------
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginAgreeTerms, setLoginAgreeTerms] = useState(true);

  const [loginError, setLoginError] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  // ---------------------------------------------
  // SIGNUP FORM STATES
  // ---------------------------------------------
  const [signupStep, setSignupStep] = useState<"credentials" | "verify">(
    "credentials"
  );
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupAgreeTerms, setSignupAgreeTerms] = useState(true);

  const [otpCode, setOtpCode] = useState("");
  const [timer, setTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  const [signupError, setSignupError] = useState("");
  const [signupMessage, setSignupMessage] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  // Check existing session
  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.email) {
          router.push(redirectUrl);
          return;
        }
      } catch {
        // No active session
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, [router, redirectUrl]);

  // Countdown timer for 6-digit code resend
  useEffect(() => {
    let interval: any;
    if (signupStep === "verify" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [signupStep, timer]);

  // Switch modes smoothly with URL update
  function handleToggleMode(mode: "login" | "signup") {
    const toSignUp = mode === "signup";
    setIsSignUp(toSignUp);
    setLoginError("");
    setLoginMessage("");
    setSignupError("");
    setSignupMessage("");

    // Update browser history URL smoothly without page reload
    if (typeof window !== "undefined") {
      const targetPath = toSignUp ? "/signup" : "/login";
      const targetUrl =
        redirectUrl !== "/account"
          ? `${targetPath}?redirect=${encodeURIComponent(redirectUrl)}`
          : targetPath;
      window.history.pushState(null, "", targetUrl);
    }
  }

  // Google Login modal trigger
  function handleGoogleLogin() {
    setLoginError("");
    setLoginMessage("");
    setSignupError("");
    setSignupMessage("");
    setShowGoogleModal(true);
  }

  // ---------------------------------------------
  // LOGIN SUBMISSION HANDLER
  // ---------------------------------------------
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginMessage("");

    if (!loginAgreeTerms) {
      setLoginError("Please agree to the Terms & Conditions to continue.");
      return;
    }

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter your email and password.");
      return;
    }

    try {
      setLoginLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });

      if (error || !data.user?.email) {
        setLoginError(
          error?.status && error.status >= 500
            ? "Authentication is temporarily unavailable. Please try again."
            : "Invalid email or password."
        );
        return;
      }

      const normalizedEmail = data.user.email.trim().toLowerCase();
      const userName =
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        normalizedEmail.split("@")[0];

      const prevEmail = localStorage.getItem("greeno_user_email");
      if (prevEmail && prevEmail.trim().toLowerCase() !== normalizedEmail) {
        localStorage.removeItem("greeno_customer_orders");
        localStorage.removeItem("greeno_last_order");
        localStorage.removeItem("greeno_all_orders");
      }

      localStorage.setItem("greeno_user_name", userName);
      localStorage.setItem("greeno_user_email", normalizedEmail);
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("greeno_auth_change"));

      setLoginMessage("Login successful! Redirecting...");
      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 300);
    } catch (err: any) {
      console.error("LOGIN ERROR:", err);
      setLoginError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }
  // Forgot password
  async function handleForgotPassword() {
    setLoginError("");
    setLoginMessage("");

    if (!loginEmail.trim()) {
      setLoginError("Please enter your email address first.");
      return;
    }

    try {
      setResetting(true);
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.message || "Failed to process password reset.");
        return;
      }

      setLoginMessage(
        "A 6-digit verification code has been sent to your email! Redirecting..."
      );
      setTimeout(() => {
        router.push(
          `/reset-password?email=${encodeURIComponent(loginEmail.trim())}`
        );
      }, 1000);
    } catch (err: any) {
      console.error("PASSWORD RESET ERROR:", err);
      setLoginError("Something went wrong while sending the reset code.");
    } finally {
      setResetting(false);
    }
  }

  // ---------------------------------------------
  // SIGNUP STEP 1: REQUEST OTP
  // ---------------------------------------------
  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setSignupError("");
    setSignupMessage("");

    if (!signupAgreeTerms) {
      setSignupError("Please agree to the Terms & Conditions to proceed.");
      return;
    }

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword) {
      setSignupError("Please fill in all fields.");
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail.trim())) {
      setSignupError("Please enter a valid email address.");
      return;
    }

    try {
      setSignupLoading(true);

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: signupEmail.trim(),
          type: "email",
          name: signupName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to dispatch verification code.");
      }

      setTimer(60);
      setCanResend(false);
      setOtpCode("");
      setSignupMessage(
        data.realEmailSent
          ? `6-digit code sent to ${signupEmail.trim()}! Please check your inbox and Spam.`
          : `A 6-digit verification code has been dispatched to ${signupEmail.trim()}.`
      );
      setSignupStep("verify");
    } catch (err: any) {
      console.error("SIGNUP OTP REQUEST ERROR:", err);
      setSignupError(
        err.message ||
          "Failed to send verification code. Please check your email and try again."
      );
    } finally {
      setSignupLoading(false);
    }
  }

  // ---------------------------------------------
  // SIGNUP STEP 2: VERIFY OTP & COMPLETE SIGNUP
  // ---------------------------------------------
  async function handleVerifyAndSignup(
    e?: React.FormEvent,
    codeToVerify?: string
  ) {
    if (e) e.preventDefault();
    setSignupError("");
    setSignupMessage("");

    const finalCode = (codeToVerify || otpCode).trim();

    if (!finalCode || finalCode.length !== 6) {
      setSignupError("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      setSignupLoading(true);

      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
          code: finalCode,
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok || !registerData.success) {
        setSignupError(
          registerData.message ||
            "Registration failed. Please check the code and try again."
        );
        return;
      }

      const normalizedEmail = signupEmail.trim().toLowerCase();
      localStorage.removeItem("greeno_customer_orders");
      localStorage.removeItem("greeno_last_order");
      localStorage.removeItem("greeno_all_orders");

      const savedName = registerData.user?.name || signupName.trim();
      localStorage.setItem("greeno_user_name", savedName);
      localStorage.setItem("greeno_user_email", signupEmail.trim());
      document.cookie = `greeno_session=${encodeURIComponent(
        signupEmail.trim()
      )}; path=/; max-age=2592000; SameSite=Lax`;
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("greeno_auth_change"));

      setSignupMessage(
        "Email verified successfully! Welcome to GreenO. Redirecting..."
      );

      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 500);
    } catch (err: any) {
      console.error("SIGNUP VERIFY ERROR:", err);
      setSignupError(
        err.message ||
          "Verification failed. Please check the code and try again."
      );
    } finally {
      setSignupLoading(false);
    }
  }

  // Resend OTP
  async function handleResendCode() {
    if (!canResend || signupLoading) return;
    setSignupError("");
    setSignupMessage("");

    try {
      setSignupLoading(true);
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: signupEmail.trim(),
          type: "email",
          name: signupName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to resend code.");
      }
      setTimer(60);
      setCanResend(false);
      setSignupMessage(
        `New 6-digit verification code dispatched to ${signupEmail.trim()}!`
      );
    } catch (err: any) {
      setSignupError(err.message || "Failed to resend code.");
    } finally {
      setSignupLoading(false);
    }
  }

  if (checkingSession) {
    return null;
  }

  return (
    <main className="premium-auth-wrapper">
      <div className={`auth-sliding-card ${isSignUp ? "active" : ""}`}>
        {/* ========================================================= */}
        {/* 1. SIGN IN FORM PANE (Left side default, slides right)   */}
        {/* ========================================================= */}
        <div className="auth-sliding-form auth-form-signin">
          {/* Back Arrow */}
          <Link href="/" className="premium-auth-back-btn" title="Back to home">
            <svg
              width="18"
              height="18"
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
          </Link>

          {/* Heading */}
          <h1 className="premium-auth-heading">Log in</h1>
          <p className="premium-auth-sub">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              onClick={(e) => {
                e.preventDefault();
                handleToggleMode("signup");
              }}
            >
              Create an Account
            </a>
          </p>

          {/* Error & Success Feedback */}
          {loginError && <div className="premium-auth-error">{loginError}</div>}
          {loginMessage && (
            <div className="premium-auth-success">{loginMessage}</div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="premium-input-group">
              <label className="premium-input-label">Email Address</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
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
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password"
                  className="premium-input-pill"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="premium-password-toggle"
                  aria-label={
                    showLoginPassword ? "Hide password" : "Show password"
                  }
                >
                  {showLoginPassword ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
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
              disabled={loginLoading}
              className="premium-submit-pill"
            >
              {loginLoading ? "Authenticating..." : "Log in"}
            </button>

            {/* Terms Checkbox */}
            <label className="premium-terms-row">
              <input
                type="checkbox"
                checked={loginAgreeTerms}
                onChange={(e) => setLoginAgreeTerms(e.target.checked)}
              />
              <span>I agree to the Terms &amp; Condition</span>
            </label>
          </form>

          {/* Divider */}
          <div className="premium-or-divider">
            <span className="premium-or-text">or</span>
          </div>

          {/* Direct Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
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

        {/* ========================================================= */}
        {/* 2. SIGN UP FORM PANE (Starts behind, slides into view)   */}
        {/* ========================================================= */}
        <div className="auth-sliding-form auth-form-signup">
          {signupStep === "credentials" ? (
            <>
              {/* Back Arrow */}
              <Link
                href="/"
                className="premium-auth-back-btn"
                title="Back to home"
              >
                <svg
                  width="18"
                  height="18"
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
              </Link>

              {/* Heading */}
              <h1 className="premium-auth-heading">Create an Account</h1>
              <p className="premium-auth-sub">
                Already have an account?{" "}
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggleMode("login");
                  }}
                >
                  Log in
                </a>
              </p>

              {/* Error & Success Feedback */}
              {signupError && (
                <div className="premium-auth-error">{signupError}</div>
              )}
              {signupMessage && (
                <div className="premium-auth-success">{signupMessage}</div>
              )}

              {/* Form */}
              <form onSubmit={handleRequestCode}>
                {/* Full Name */}
                <div className="premium-input-group">
                  <label className="premium-input-label">Full Name</label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
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
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
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
                      type={showSignupPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="premium-input-pill"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowSignupPassword(!showSignupPassword)
                      }
                      className="premium-password-toggle"
                      aria-label={
                        showSignupPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showSignupPassword ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
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
                    checked={signupAgreeTerms}
                    onChange={(e) => setSignupAgreeTerms(e.target.checked)}
                  />
                  <span>I agree to the Terms &amp; Conditions</span>
                </label>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={signupLoading}
                  className="premium-submit-pill"
                >
                  {signupLoading
                    ? "Dispatching Code..."
                    : "Continue & Get Verification Code →"}
                </button>
              </form>

              {/* Divider */}
              <div className="premium-or-divider">
                <span className="premium-or-text">or</span>
              </div>

              {/* Direct Google Sign Up */}
              <button
                type="button"
                onClick={handleGoogleLogin}
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
            </>
          ) : (
            <>
              {/* Back button to credentials */}
              <button
                type="button"
                onClick={() => {
                  setSignupStep("credentials");
                  setSignupError("");
                  setSignupMessage("");
                }}
                className="premium-auth-back-btn"
                title="Back to registration details"
              >
                <svg
                  width="18"
                  height="18"
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

              {/* Heading */}
              <h1 className="premium-auth-heading">Verify Email</h1>
              <p className="premium-auth-sub">
                Enter the 6-digit code sent to <strong>{signupEmail}</strong>
              </p>

              {/* Informative notice box */}
              <div
                style={{
                  background: "#f8f9fa",
                  border: "1px solid #e9ecef",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  fontSize: "11px",
                  color: "#495057",
                  lineHeight: "1.4",
                  marginBottom: "12px",
                }}
              >
                ✉ <strong>Check inbox &amp; Spam.</strong> Verification code sent
                to <strong>{signupEmail}</strong>.
              </div>

              {/* Error & Success Feedback */}
              {signupError && (
                <div className="premium-auth-error">{signupError}</div>
              )}
              {signupMessage && (
                <div className="premium-auth-success">{signupMessage}</div>
              )}

              {/* 6-Digit Code Input Form */}
              <form onSubmit={handleVerifyAndSignup}>
                <div style={{ textAlign: "center", marginBottom: "12px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      color: "#666666",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    ENTER 6-DIGIT SECURITY CODE
                  </span>

                  <OtpInput
                    value={otpCode}
                    onChange={(newCode) => {
                      setOtpCode(newCode);
                      if (newCode.length === 6) {
                        handleVerifyAndSignup(undefined, newCode);
                      }
                    }}
                    error={Boolean(signupError)}
                    darkMode={false}
                  />
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={signupLoading || otpCode.length !== 6}
                  className="premium-submit-pill"
                >
                  {signupLoading
                    ? "Verifying Code..."
                    : "Verify Code & Complete Registration"}
                </button>
              </form>

              {/* Bottom Resend Row */}
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "11px",
                  color: "#666",
                }}
              >
                <span>
                  {timer > 0 ? (
                    `Resend code in ${timer}s`
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={!canResend || signupLoading}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#000",
                        fontWeight: 700,
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
                      }}
                    >
                      Resend Code
                    </button>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSignupStep("credentials");
                    setSignupError("");
                    setSignupMessage("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#666",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  Change Email
                </button>
              </div>
            </>
          )}
        </div>

        {/* ========================================================= */}
        {/* 3. SLIDING OVERLAY CONTAINER                              */}
        {/* ========================================================= */}
        <div className="auth-sliding-toggle-container">
          <div className="auth-sliding-toggle">
            {/* Left Panel (Visible when user is on Sign Up) */}
            <div className="auth-toggle-panel auth-toggle-left">
              <div
                className="premium-auth-emblem"
                style={{ position: "static", marginBottom: "20px" }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m4.93 4.93 4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M4.93 19.07l4.24-4.24" />
                </svg>
              </div>
              <p className="auth-toggle-tag">SPRING / SUMMER 2026</p>
              <h2 className="auth-toggle-title">Welcome Back!</h2>
              <p className="auth-toggle-desc">
                To access your account, track orders, and view your saved items,
                please sign in.
              </p>
              <button
                type="button"
                className="auth-ghost-btn"
                onClick={() => handleToggleMode("login")}
              >
                Sign In
              </button>
            </div>

            {/* Right Panel (Visible when user is on Sign In) */}
            <div className="auth-toggle-panel auth-toggle-right">
              <div
                className="premium-auth-emblem"
                style={{ position: "static", marginBottom: "20px" }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m4.93 4.93 4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M4.93 19.07l4.24-4.24" />
                </svg>
              </div>
              <p className="auth-toggle-tag">NEW MEMBER PRIVILEGES</p>
              <h2 className="auth-toggle-title">Hello, Friend!</h2>
              <p className="auth-toggle-desc">
                Register with your details and start your journey with exclusive
                member drops &amp; rewards.
              </p>
              <button
                type="button"
                className="auth-ghost-btn"
                onClick={() => handleToggleMode("signup")}
              >
                Sign Up
              </button>
            </div>
          </div>
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
