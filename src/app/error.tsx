"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront error boundary caught:", error);
  }, [error]);

  return (
    <div style={{ minHeight: "75vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#000000", color: "#ffffff", textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "0.25em", marginBottom: "12px" }}>GREENO</div>
      <h2 style={{ fontSize: "15px", letterSpacing: "0.15em", marginBottom: "14px", textTransform: "uppercase" }}>UNABLE TO LOAD THIS PAGE</h2>
      <p style={{ fontSize: "12px", color: "#888888", maxWidth: "420px", marginBottom: "28px", lineHeight: "1.6" }}>
        We encountered a temporary issue. Please try reloading or exploring our catalog.
      </p>
      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={() => reset()} style={{ background: "#ffffff", color: "#000000", border: "none", padding: "12px 26px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", cursor: "pointer" }}>RETRY</button>
        <Link href="/shop" style={{ background: "transparent", color: "#ffffff", border: "1px solid #444444", padding: "12px 26px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textDecoration: "none" }}>EXPLORE</Link>
      </div>
    </div>
  );
}
