"use client";

import { Suspense } from "react";
import AuthSlidingCard from "@/components/AuthSlidingCard";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "#0a0a0a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#888888",
            letterSpacing: "0.12em",
          }}
        >
          LOADING SECURE LOGIN...
        </div>
      }
    >
      <AuthSlidingCard initialMode="login" />
    </Suspense>
  );
}