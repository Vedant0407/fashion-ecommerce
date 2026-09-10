"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useWishlist } from "@/context/WishlistContext";
import { Product, getProductsByCategory, FALLBACK_CATEGORIES } from "@/lib/catalog";

const categoryMeta: Record<
  string,
  { name: string; description: string }
> = {
  "t-shirts": {
    name: "T-SHIRTS",
    description: "Signature heavyweight oversized and relaxed fit tees crafted from luxury combed cotton.",
  },
  hoodies: {
    name: "HOODIES",
    description: "Structured heavyweight fleece pullover hoodies with dropped shoulders.",
  },
  pants: {
    name: "PANTS",
    description: "Tactical cargo pants and streetwear utility trousers with articulated tailoring.",
  },
  caps: {
    name: "CAPS",
    description: "Unstructured 6-panel caps and washed vintage headwear.",
  },
  bags: {
    name: "BAGS",
    description: "Weatherproof Cordura utility bags and modular crossbody carriers.",
  },
  accessories: {
    name: "ACCESSORIES",
    description: "Refined stainless steel chains and everyday streetwear accessories.",
  },
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const rawSlug = String(params.category || "").toLowerCase().trim();
  const meta = categoryMeta[rawSlug] || {
    name: rawSlug.toUpperCase(),
    description: "Explore the latest GreenO collection.",
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");

  useEffect(() => {
    async function loadCategoryProducts() {
      setLoading(true);
      try {
        const data = await getProductsByCategory(rawSlug);
        setProducts(data);
      } catch (err) {
        console.error("Failed to load category products:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCategoryProducts();
  }, [rawSlug]);

  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, sortBy]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "135px 5vw 90px",
        background: "#ffffff",
        color: "#000000",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Breadcrumb & Back */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "10px",
              letterSpacing: "0.2em",
              color: "#777777",
              cursor: "pointer",
              padding: 0,
              fontWeight: 600,
            }}
          >
            &larr; BACK
          </button>
          <span
            style={{
              fontSize: "10px",
              letterSpacing: "0.22em",
              color: "#999999",
              fontWeight: 600,
            }}
          >
            GREENO / {meta.name}
          </span>
        </div>

        {/* Title & Description */}
        <div
          style={{
            borderBottom: "1px solid #e5e5e5",
            paddingBottom: "25px",
            marginBottom: "35px",
          }}
        >
          <h1
            style={{
              margin: "0 0 12px",
              fontSize: "clamp(44px, 6vw, 76px)",
              letterSpacing: "-0.04em",
              fontWeight: 800,
              lineHeight: 0.92,
              color: "#000000",
            }}
          >
            {meta.name}
          </h1>
          <p
            style={{
              margin: "0 0 25px",
              color: "#666666",
              fontSize: "13px",
              letterSpacing: "0.02em",
              maxWidth: "600px",
              lineHeight: 1.6,
            }}
          >
            {meta.description}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px",
              paddingTop: "20px",
              borderTop: "1px solid #f0f0f0",
            }}
          >
            {/* Other Categories Links */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Link
                href="/shop"
                style={{
                  padding: "8px 16px",
                  borderRadius: "0px",
                  background: "#ffffff",
                  color: "#000000",
                  border: "1px solid #e5e5e5",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textDecoration: "none",
                }}
              >
                ALL
              </Link>
              {FALLBACK_CATEGORIES.map((cat) => {
                const isCurrent = cat.slug === rawSlug;
                return (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "0px",
                      background: isCurrent ? "#000000" : "#ffffff",
                      color: isCurrent ? "#ffffff" : "#000000",
                      border: isCurrent ? "1px solid #000000" : "1px solid #e5e5e5",
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      textDecoration: "none",
                    }}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontSize: "11px", letterSpacing: "0.14em", color: "#777777", fontWeight: 500 }}>
                {sortedProducts.length} {sortedProducts.length === 1 ? "PIECE" : "PIECES"}
              </span>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "0px",
                  color: "#000000",
                  padding: "8px 14px",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="featured">FEATURED</option>
                <option value="price-asc">PRICE: LOW TO HIGH</option>
                <option value="price-desc">PRICE: HIGH TO LOW</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "#888888" }}>
            <p style={{ letterSpacing: "0.18em", fontSize: "11px", fontWeight: 600 }}>LOADING PIECES...</p>
          </div>
        ) : sortedProducts.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "35px 20px",
            }}
          >
            {sortedProducts.map((product) => {
              const inWishlist = isInWishlist(product.id);
              return (
                <article
                  key={product.id}
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    background: "#ffffff",
                    border: "1px solid #e5e5e5",
                    borderRadius: "0px",
                    overflow: "hidden",
                    transition: "border-color 0.25s ease",
                  }}
                  className="category-product-card"
                >
                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        category: product.category_name,
                      });
                    }}
                    aria-label="Toggle wishlist"
                    title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    style={{
                      position: "absolute",
                      top: "14px",
                      right: "14px",
                      zIndex: 3,
                      background: "rgba(255, 255, 255, 0.92)",
                      border: "1px solid rgba(0, 0, 0, 0.08)",
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill={inWishlist ? "#000000" : "none"}
                      stroke="#000000"
                      strokeWidth="1.6"
                      style={{ width: "16px", height: "16px" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                      />
                    </svg>
                  </button>

                  <Link
                    href={`/products/${product.id}?from=products`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        paddingBottom: "125%",
                        background: "#f7f7f7",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.5s ease",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      />
                    </div>

                    <div style={{ padding: "16px 14px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "9px",
                          letterSpacing: "0.18em",
                          color: "#888888",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {meta.name}
                      </span>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          lineHeight: 1.35,
                          color: "#000000",
                          textTransform: "uppercase",
                        }}
                      >
                        {product.name}
                      </h2>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#000000",
                          letterSpacing: "0.02em",
                          marginTop: "2px",
                        }}
                      >
                        ₹{Number(product.price).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              padding: "100px 0",
              textAlign: "center",
              background: "#fafafa",
              border: "1px solid #e5e5e5",
            }}
          >
            <p style={{ fontSize: "14px", letterSpacing: "0.15em", color: "#000000", fontWeight: 600, marginBottom: "8px" }}>
              NO PIECES CURRENTLY FOUND IN {meta.name}
            </p>
            <p style={{ color: "#777777", fontSize: "13px", marginBottom: "20px" }}>
              Check back soon for the next drop or explore our full collection.
            </p>
            <Link
              href="/shop"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                border: "1px solid #000000",
                background: "#000000",
                color: "#ffffff",
                fontSize: "11px",
                letterSpacing: "0.15em",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              EXPLORE ALL PIECES
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}