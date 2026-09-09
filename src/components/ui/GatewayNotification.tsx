"use client";

import { useEffect, useState } from "react";

interface GatewayNotificationProps {
  type: "email" | "phone";
  target: string;
  code: string;
  onAutoFill: (code: string) => void;
  onDismiss: () => void;
}

export default function GatewayNotification({
  type,
  target,
  code,
  onAutoFill,
  onDismiss,
}: GatewayNotificationProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Auto dismiss after 15 seconds
      onDismiss();
    }, 15000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  function handleCopy() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isEmail = type === "email";

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        left: "20px",
        maxWidth: "460px",
        margin: "0 auto",
        background: "#080808",
        border: "1px solid #333333",
        color: "#ffffff",
        padding: "16px 18px",
        zIndex: 99999,
        boxShadow: "0 16px 36px rgba(0,0,0,0.8)",
        borderRadius: "0px",
        animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "22px",
              height: "22px",
              background: "#ffffff",
              color: "#000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 800,
            }}
          >
            {isEmail ? "✉" : "✆"}
          </div>
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", color: "#aaaaaa", textTransform: "uppercase" }}>
            {isEmail ? "GREENO MAIL GATEWAY" : "GREENO SMS CARRIER"} &bull; JUST NOW
          </span>
        </div>

        <button
          onClick={onDismiss}
          style={{
            background: "transparent",
            border: "none",
            color: "#666666",
            fontSize: "16px",
            cursor: "pointer",
            lineHeight: 1,
            padding: "2px 4px",
          }}
          aria-label="Dismiss notification"
        >
          &times;
        </button>
      </div>

      <div style={{ fontSize: "12px", color: "#cccccc", lineHeight: "1.45", marginBottom: "12px" }}>
        {isEmail ? (
          <>
            Security passcode for <strong>{target}</strong> is:
          </>
        ) : (
          <>
            SMS verification code for <strong>+91 {target.replace(/\D/g, "").slice(-10)}</strong> is:
          </>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#141414",
          border: "1px solid #282828",
          padding: "10px 14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <span
            style={{
              fontSize: "24px",
              fontWeight: 800,
              letterSpacing: "0.22em",
              color: "#ffffff",
              fontFamily: "monospace",
            }}
          >
            {code}
          </span>
          <span style={{ fontSize: "9px", color: "#888888", letterSpacing: "0.08em" }}>
            VALID 10M
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: "transparent",
              color: "#aaaaaa",
              border: "1px solid #333333",
              padding: "6px 10px",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            {copied ? "COPIED" : "COPY"}
          </button>

          <button
            type="button"
            onClick={() => {
              onAutoFill(code);
              onDismiss();
            }}
            style={{
              background: "#ffffff",
              color: "#000000",
              border: "1px solid #ffffff",
              padding: "6px 12px",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.1em",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            AUTO-FILL
          </button>
        </div>
      </div>
    </div>
  );
}
