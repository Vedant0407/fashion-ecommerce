"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
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
          setError(
            "An account with this email already exists. You cannot sign up again with the same email. Please log in instead."
          );
        } else {
          setError(signupError.message);
        }
        return;
      }

      // In Supabase, if the user already exists and email confirmations are active,
      // identities will be an empty array []
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError(
          "An account with this email already exists. You cannot sign up again with the same email. Please log in instead."
        );
        return;
      }

      localStorage.setItem("greeno_user_name", name.trim());

      if (!data.session) {
        setError("Account created. Please check your email inbox to verify, or proceed to log in.");
        return;
      }

      router.push("/account");
      router.refresh();
    } catch (err) {
      console.error("SIGNUP ERROR:", err);
      setError("Something went wrong while creating your account.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return null;
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <p className="auth-label">GREENO / ACCOUNT</p>

        <h1>CREATE ACCOUNT</h1>

        <p className="auth-subtitle">
          Create your GreenO account.
        </p>

        <form onSubmit={handleSignup}>
          <div className="auth-field">
            <label>NAME</label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </div>

          <div className="auth-field">
            <label>EMAIL</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label>PASSWORD</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
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

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </button>
        </form>

        <div className="auth-signup">
          <span>ALREADY HAVE AN ACCOUNT?</span>

          <Link href="/login">
            LOGIN
          </Link>
        </div>
      </div>
    </main>
  );
}