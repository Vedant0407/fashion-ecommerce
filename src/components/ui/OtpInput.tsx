"use client";

import { useEffect, useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  darkMode?: boolean;
}

export default function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  error = false,
  autoFocus = true,
  darkMode = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Array of single digit strings
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      // Empty
      const newDigits = [...digits];
      newDigits[index] = "";
      onChange(newDigits.join(""));
      return;
    }

    // If multiple characters (pasted or typed fast)
    if (rawVal.length > 1) {
      handleMultiDigits(rawVal, index);
      return;
    }

    // Single digit
    const newDigits = [...digits];
    newDigits[index] = rawVal;
    const combined = newDigits.join("");
    onChange(combined);

    // Auto advance to next input
    if (index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleMultiDigits(chars: string, startIndex: number) {
    const clean = chars.replace(/\D/g, "");
    const newDigits = [...digits];

    for (let i = 0; i < clean.length && startIndex + i < length; i++) {
      newDigits[startIndex + i] = clean[i];
    }

    const combined = newDigits.join("");
    onChange(combined);

    const nextFocusIndex = Math.min(startIndex + clean.length, length - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        inputRefs.current[index - 1]?.focus();
        e.preventDefault();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain").replace(/\D/g, "");
    if (!pasted) return;

    handleMultiDigits(pasted, 0);
  }

  const borderColor = error
    ? "#ff4444"
    : darkMode
    ? "#333333"
    : "#d1d5db";

  const focusedBorder = error
    ? "#ff4444"
    : darkMode
    ? "#ffffff"
    : "#000000";

  const bgColor = darkMode ? "#0c0c0c" : "#ffffff";
  const textColor = darkMode ? "#ffffff" : "#000000";

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        justifyContent: "center",
        alignItems: "center",
        margin: "18px 0",
      }}
      onPaste={handlePaste}
    >
      {Array.from({ length }).map((_, idx) => {
        const isFilled = Boolean(digits[idx]);

        return (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            disabled={disabled}
            value={digits[idx]}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            style={{
              width: "48px",
              height: "56px",
              textAlign: "center",
              fontSize: "22px",
              fontWeight: 800,
              fontFamily: "monospace",
              background: bgColor,
              color: textColor,
              border: `1.5px solid ${isFilled ? focusedBorder : borderColor}`,
              borderRadius: "0px",
              outline: "none",
              transition: "border-color 0.15s ease, transform 0.1s ease",
              boxShadow: isFilled
                ? `0 0 0 1px ${focusedBorder}`
                : "none",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = focusedBorder;
              e.target.style.boxShadow = `0 0 0 1px ${focusedBorder}`;
              e.target.select();
            }}
            onBlur={(e) => {
              if (!digits[idx]) {
                e.target.style.borderColor = borderColor;
                e.target.style.boxShadow = "none";
              }
            }}
          />
        );
      })}
    </div>
  );
}
