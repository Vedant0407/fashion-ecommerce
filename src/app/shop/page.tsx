"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Product, getAllProducts, FALLBACK_CATEGORIES } from "@/lib/catalog";
import ProductCard from "@/components/ui/ProductCard";

export default function ShopPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"featured" | "newest" | "price-asc" | "price-desc">("featured");

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const data = await getAllProducts();
        setProducts(data);
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();

    const handleUpdate = () => {
      loadProducts();
    };

    window.addEventListener("greeno_products_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("greeno_products_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      const cat = search.get("category");
      const section = search.get("section") || search.get("filter");
      if (section === "newin" || section === "new") {
        setSelectedCategory("NEW IN");
      } else if (section === "trending") {
        setSelectedCategory("TRENDING");
      } else if (cat) {
        const match = FALLBACK_CATEGORIES.find(
          (c) =>
            c.slug.toLowerCase() === cat.toLowerCase() ||
            c.name.toLowerCase() === cat.toLowerCase()
        );
        if (match) {
          setSelectedCategory(match.name);
        }
      }
    }
  }, []);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory === "NEW IN") {
      list = list.filter((p) => p.is_new);
    } else if (selectedCategory === "TRENDING") {
      list = list.filter((p) => p.is_trending);
    } else if (selectedCategory !== "ALL") {
      const catSlug = selectedCategory.toLowerCase();
      list = list.filter((p) => {
        if (p.collection_tag?.toLowerCase() === catSlug) return true;
        if (p.collection_tag?.toUpperCase() === selectedCategory) return true;
        if (p.category_slug?.toLowerCase() === catSlug) return true;
        if (p.category_name?.toUpperCase() === selectedCategory) return true;
        if (catSlug === "t-shirts" && (p.id.includes("tee") || p.name.toLowerCase().includes("tee"))) return true;
        if (catSlug === "hoodies" && (p.id.includes("hoodie") || p.name.toLowerCase().includes("hoodie"))) return true;
        if (catSlug === "pants" && (p.id.includes("pants") || p.name.toLowerCase().includes("pants") || p.id.includes("cargo"))) return true;
        if (catSlug === "caps" && (p.id.includes("cap") || p.name.toLowerCase().includes("cap"))) return true;
        if (catSlug === "bags" && (p.id.includes("bag") || p.name.toLowerCase().includes("bag"))) return true;
        if (catSlug === "accessories" && (p.id.includes("chain") || p.name.toLowerCase().includes("chain"))) return true;
        return false;
      });
    }

    if (sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      list.sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0));
    }

    return list;
  }, [products, selectedCategory, sortBy]);

  const dynamicCollections = useMemo(() => {
    const tags = new Set<string>();
    for (const p of products) {
      if (p?.collection_tag?.trim()) {
        tags.add(p.collection_tag.trim().toUpperCase());
      }
    }
    return Array.from(tags);
  }, [products]);

  const categories = [
    "ALL",
    "NEW IN",
    "TRENDING",
    ...FALLBACK_CATEGORIES.map((c) => c.name),
    ...dynamicCollections,
  ];

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
        {/* Breadcrumb & Navigation */}
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
            GREENO / ALL COLLECTIONS
          </span>
        </div>

        {/* Title Banner */}
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
            CATALOGUE
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
            Everyday luxury streetwear crafted with heavyweight fabrics, drop silhouettes, and utilitarian detailing.
          </p>

          {/* Category Filter Pills & Sort Dropdown */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "18px",
              paddingTop: "20px",
              borderTop: "1px solid #f0f0f0",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "0px",
                      background: isActive ? "#000000" : "#ffffff",
                      color: isActive ? "#ffffff" : "#000000",
                      border: isActive ? "1px solid #000000" : "1px solid #e5e5e5",
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <span style={{ fontSize: "11px", letterSpacing: "0.14em", color: "#777777", fontWeight: 500 }}>
                {filteredProducts.length} {filteredProducts.length === 1 ? "PIECE" : "PIECES"}
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
                <option value="newest">NEWEST</option>
                <option value="price-asc">PRICE: LOW TO HIGH</option>
                <option value="price-desc">PRICE: HIGH TO LOW</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "#888888" }}>
            <p style={{ letterSpacing: "0.18em", fontSize: "11px", fontWeight: 600 }}>LOADING PIECES...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "35px 20px",
            }}
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                source={
                  selectedCategory === "NEW IN"
                    ? "newin"
                    : selectedCategory === "TRENDING"
                    ? "trending"
                    : product.is_new
                    ? "newin"
                    : product.is_trending
                    ? "trending"
                    : "shop"
                }
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
              NO PIECES IN THIS CATEGORY
            </p>
            <button
              onClick={() => setSelectedCategory("ALL")}
              style={{
                marginTop: "12px",
                padding: "10px 24px",
                border: "1px solid #000000",
                background: "#000000",
                color: "#ffffff",
                fontSize: "11px",
                letterSpacing: "0.15em",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              VIEW ALL PIECES
            </button>
          </div>
        )}
      </div>
    </main>
  );
}