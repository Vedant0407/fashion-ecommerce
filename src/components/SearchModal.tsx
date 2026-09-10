"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Product } from "@/lib/catalog";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.products || []);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const quickCategories = [
    { name: "T-SHIRTS", slug: "t-shirts" },
    { name: "HOODIES", slug: "hoodies" },
    { name: "PANTS", slug: "pants" },
    { name: "CAPS", slug: "caps" },
    { name: "BAGS", slug: "bags" },
    { name: "ACCESSORIES", slug: "accessories" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 20px",
        overflowY: "auto",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "840px",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Close */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "35px",
            borderBottom: "1px solid #000000",
            paddingBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
            <button
              onClick={onClose}
              aria-label="Back"
              title="Go back"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "6px 8px 6px 0",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "#000000",
                flexShrink: 0,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ width: "18px", height: "18px" }}
              >
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>BACK</span>
            </button>

            <span style={{ color: "#d0d0cc", fontSize: "18px", lineHeight: "1" }}>|</span>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#000000"
              strokeWidth="1.8"
              style={{ width: "22px", height: "22px", flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH PIECES, HOODIES, TEES, PANTS..."
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "clamp(16px, 2.5vw, 22px)",
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "#000000",
                fontFamily: "inherit",
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "#777777",
                  padding: "4px 8px",
                }}
              >
                &times;
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Close search"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px 10px",
              fontSize: "11px",
              letterSpacing: "0.18em",
              fontWeight: 700,
              color: "#000000",
            }}
          >
            ESC [X]
          </button>
        </div>

        {/* Quick Categories */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "35px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              letterSpacing: "0.18em",
              color: "#888888",
              fontWeight: 600,
              marginRight: "4px",
            }}
          >
            QUICK FILTER:
          </span>
          {quickCategories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setQuery(c.name)}
              style={{
                background: "#ffffff",
                border: "1px solid #e5e5e5",
                color: "#000000",
                fontSize: "10px",
                letterSpacing: "0.12em",
                padding: "6px 14px",
                cursor: "pointer",
                borderRadius: "0px",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#000000";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.borderColor = "#000000";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.color = "#000000";
                e.currentTarget.style.borderColor = "#e5e5e5";
              }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Results Container */}
        <div>
          {loading && (
            <p style={{ color: "#777777", fontSize: "11px", letterSpacing: "0.18em", fontWeight: 600 }}>
              SEARCHING PIECES...
            </p>
          )}

          {!loading && query && results.length === 0 && (
            <div
              style={{
                padding: "60px 0",
                textAlign: "center",
                color: "#777777",
                background: "#fafafa",
                border: "1px solid #e5e5e5",
              }}
            >
              <p style={{ fontSize: "15px", color: "#000000", marginBottom: "8px", fontWeight: 700, letterSpacing: "0.04em" }}>
                NO PIECES FOUND FOR &ldquo;{query.toUpperCase()}&rdquo;
              </p>
              <p style={{ fontSize: "13px" }}>
                Try searching for t-shirts, hoodies, cargo pants, or caps.
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "20px",
              }}
            >
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  onClick={onClose}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "#ffffff",
                    border: "1px solid #e5e5e5",
                    borderRadius: "0px",
                    padding: "0px",
                    textDecoration: "none",
                    overflow: "hidden",
                    transition: "border-color 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#000000";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#e5e5e5";
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "240px",
                      background: "#f7f7f7",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div style={{ padding: "14px 12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span
                      style={{
                        fontSize: "9px",
                        letterSpacing: "0.16em",
                        color: "#888888",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      {product.category_name || "GREENO"}
                    </span>
                    <strong
                      style={{
                        fontSize: "12px",
                        color: "#000000",
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                        lineHeight: 1.35,
                        textTransform: "uppercase",
                      }}
                    >
                      {product.name}
                    </strong>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#000000",
                        fontWeight: 600,
                        marginTop: "2px",
                      }}
                    >
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
