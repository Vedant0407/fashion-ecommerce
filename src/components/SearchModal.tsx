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
    <>
      <style>{`
        @keyframes searchBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes searchCardPop {
          from {
            opacity: 0;
            transform: translateY(-16px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .search-modal-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .search-modal-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .search-modal-scroll::-webkit-scrollbar-thumb {
          background: #cccccc;
        }
        .search-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: #888888;
        }
      `}</style>

      {/* Blurred Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0, 0, 0, 0.58)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "clamp(24px, 6vh, 60px) 16px",
          overflowY: "auto",
          animation: "searchBackdropFade 0.2s ease-out",
        }}
        onClick={onClose}
      >
        {/* Floating White Modal Card */}
        <div
          style={{
            width: "100%",
            maxWidth: "880px",
            background: "#ffffff",
            borderRadius: "2px",
            border: "1px solid rgba(0, 0, 0, 0.12)",
            boxShadow:
              "0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15)",
            padding: "clamp(20px, 3.5vw, 32px)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "88vh",
            animation: "searchCardPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            boxSizing: "border-box",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header & Close */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "22px",
              borderBottom: "1px solid #111111",
              paddingBottom: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
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

              <span style={{ color: "#d0d0cc", fontSize: "18px", lineHeight: "1", flexShrink: 0 }}>|</span>

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
                  fontSize: "clamp(15px, 2.2vw, 21px)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: "#000000",
                  fontFamily: "inherit",
                  minWidth: 0,
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
                    flexShrink: 0,
                  }}
                  title="Clear input"
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
                padding: "4px 0 4px 10px",
                fontSize: "11px",
                letterSpacing: "0.18em",
                fontWeight: 700,
                color: "#000000",
                flexShrink: 0,
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
              marginBottom: query.trim() ? "18px" : "10px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "0.18em",
                color: "#888888",
                fontWeight: 700,
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
                  background: query.toUpperCase() === c.name ? "#000000" : "#ffffff",
                  border: query.toUpperCase() === c.name ? "1px solid #000000" : "1px solid #e5e5e5",
                  color: query.toUpperCase() === c.name ? "#ffffff" : "#000000",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  padding: "6px 14px",
                  cursor: "pointer",
                  borderRadius: "0px",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  if (query.toUpperCase() !== c.name) {
                    e.currentTarget.style.background = "#f4f4f4";
                    e.currentTarget.style.borderColor = "#000000";
                  }
                }}
                onMouseOut={(e) => {
                  if (query.toUpperCase() !== c.name) {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.borderColor = "#e5e5e5";
                  }
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Prompt when no query entered */}
          {!query.trim() && (
            <div
              style={{
                paddingTop: "14px",
                borderTop: "1px solid #f0f0f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
                color: "#888888",
                fontSize: "11px",
                letterSpacing: "0.08em",
              }}
            >
              <span>
                Press <strong style={{ color: "#000000" }}>ESC</strong> or click outside to close
              </span>
              <span style={{ fontWeight: 600, color: "#555555" }}>
                TYPE TO EXPLORE ALL PIECES
              </span>
            </div>
          )}

          {/* Results Container */}
          {query.trim() && (
            <div
              className="search-modal-scroll"
              style={{
                overflowY: "auto",
                maxHeight: "calc(88vh - 190px)",
                paddingRight: "6px",
                marginRight: "-6px",
              }}
            >
              {loading && (
                <div style={{ padding: "35px 0", textAlign: "center", color: "#666666", fontSize: "11px", letterSpacing: "0.2em", fontWeight: 700 }}>
                  SEARCHING PIECES...
                </div>
              )}

              {!loading && results.length === 0 && (
                <div
                  style={{
                    padding: "45px 20px",
                    textAlign: "center",
                    color: "#666666",
                    background: "#fafafa",
                    border: "1px solid #eeeeee",
                  }}
                >
                  <p style={{ fontSize: "14px", color: "#000000", marginBottom: "6px", fontWeight: 700, letterSpacing: "0.04em" }}>
                    NO PIECES FOUND FOR &ldquo;{query.toUpperCase()}&rdquo;
                  </p>
                  <p style={{ fontSize: "12px", color: "#777777", margin: 0 }}>
                    Try searching by t-shirt, hoodie, cargo pants, caps, or colorway.
                  </p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      color: "#777777",
                      marginBottom: "14px",
                      textTransform: "uppercase",
                    }}
                  >
                    FOUND {results.length} PIECE{results.length > 1 ? "S" : ""}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.id}?from=${
                          product.is_new ? "newin" : product.is_trending ? "trending" : "products"
                        }`}
                        onClick={onClose}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          background: "#ffffff",
                          border: "1px solid #e8e8e8",
                          borderRadius: "0px",
                          padding: "0px",
                          textDecoration: "none",
                          overflow: "hidden",
                          transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = "#000000";
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = "#e8e8e8";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "220px",
                            background: "#f7f7f7",
                            overflow: "hidden",
                          }}
                        >
                          <img
                            src={product.image || "/black-tee.jfif"}
                            alt={product.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                        <div style={{ padding: "12px 12px 14px", display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span
                            style={{
                              fontSize: "9px",
                              letterSpacing: "0.16em",
                              color: "#888888",
                              fontWeight: 600,
                              textTransform: "uppercase",
                            }}
                          >
                            {product.category_name || "STREETWEAR"}
                          </span>
                          <strong
                            style={{
                              fontSize: "12px",
                              color: "#000000",
                              fontWeight: 700,
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
                            ₹{Number(product.price).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
