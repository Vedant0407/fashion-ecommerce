"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      alert("Please fill all fields.");
      return;
    }

    localStorage.setItem("greeno_logged_in", "true");

    router.push("/account");
  };

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
            />
          </div>

          <div className="auth-field">
            <label>EMAIL</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
            />
          </div>

          <div className="auth-field">
            <label>PASSWORD</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
            />
          </div>

          <button type="submit" className="auth-button">
            CREATE ACCOUNT
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