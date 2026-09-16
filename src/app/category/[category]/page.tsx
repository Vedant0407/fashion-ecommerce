"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Product, getProductsByCategory, FALLBACK_CATEGORIES } from "@/lib/catalog";
import ProductCard from "@/components/ui/ProductCard";

const categoryMeta: Record<
  string,
  { name: string; description: string }
> = {
  "t-shirts": {
    name: "T-SHIRTS",
    description: "Signature heavyweight oversized and relaxed fit tees crafted from luxury combed cotton.",
  },
  shirts: {
    name: "SHIRTS",
    description: "Architectural tailored shirting and relaxed collared overshirts in luxury poplin and oxford weaves.",
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
  newin: {
    name: "NEW ARRIVALS",
    description: "The freshest drops, limited runs, and newest releases from the GreenO atelier.",
  },
  "new-in": {
    name: "NEW ARRIVALS",
    description: "The freshest drops, limited runs, and newest releases from the GreenO atelier.",
  },
  new: {
    name: "NEW ARRIVALS",
    description: "The freshest drops, limited runs, and newest releases from the GreenO atelier.",
  },
  trending: {
    name: "TRENDING NOW",
    description: "Most coveted streetwear silhouettes and best-selling pieces of the season.",
  },
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();

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

    const handleUpdate = () => {
      loadCategoryProducts();
    };

    window.addEventListener("greeno_products_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("greeno_products_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
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
          className="category-header-nav"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <button
            onClick={() => router.back()}
            className="category-back-button page-back-button"
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
          <h1 className="page-heading-title">
            {meta.name}
          </h1>
          <p className="page-heading-desc">
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
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                source="category"
              />
            ))}
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