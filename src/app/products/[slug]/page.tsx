"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import AboutSection from "@/components/ui/AboutSection";
import { ImageSwiper } from "@/components/ui/image-swiper";
import { Product, getProductByIdOrSlug, getAllProducts } from "@/lib/catalog";

export default function ProductPage() {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const params = useParams();
  const router = useRouter();

  const slug = String(params.slug);

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState<string>("BLACK");

  // Navigation context: 'newin' | 'trending' | 'products'
  const [browseContext, setBrowseContext] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>("details");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const from = sp.get("from") || sp.get("section") || sp.get("ref");
      if (from) {
        setBrowseContext(from.toLowerCase());
      }
    }
  }, [slug]);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const found = await getProductByIdOrSlug(slug);
        setProduct(found);
        if (found) {
          const defaultColor =
            Array.isArray(found.colors) && found.colors.length > 0
              ? found.colors[0]
              : found.color || "BLACK";
          setSelectedColor(defaultColor);

          // If size_stock is present and "M" has 0 units, pick first in-stock size
          if (found.size_stock && typeof found.size_stock === "object") {
            const sizes = ["S", "M", "L", "XL", "XXL"];
            const currentM = Number(found.size_stock["M"] ?? 0);
            if (currentM === 0) {
              const available = sizes.find((s) => Number(found.size_stock?.[s] ?? 0) > 0);
              if (available) {
                setSelectedSize(available);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  useEffect(() => {
    async function loadOtherProducts() {
      try {
        const list = await getAllProducts();
        setAllProducts(list);
      } catch (err) {
        console.error("Error loading products:", err);
      }
    }

    loadOtherProducts();
  }, []);

  // Determine effective context: "newin" | "trending" | "products"
  const activeContext: "newin" | "trending" | "products" = useMemo(() => {
    if (browseContext === "newin" || browseContext === "new") return "newin";
    if (browseContext === "trending") return "trending";
    if (browseContext === "products" || browseContext === "catalogue" || browseContext === "category") return "products";

    // If no explicit query param, determine from product's own tags/flags
    if (product?.is_new) return "newin";
    if (product?.is_trending) return "trending";
    return "products";
  }, [browseContext, product]);

  // Under-the-product items tailored exclusively to the context
  const underProducts = useMemo(() => {
    if (!product) return [];

    if (activeContext === "newin") {
      // ONLY New In products, excluding current product
      const news = allProducts.filter(
        (item) => item.id !== product.id && Boolean(item.is_new)
      );
      return news.length > 0 ? news : allProducts.filter((item) => item.id !== product.id).slice(0, 4);
    }

    if (activeContext === "trending") {
      // ONLY Trending products, excluding current product
      const trends = allProducts.filter(
        (item) => item.id !== product.id && Boolean(item.is_trending)
      );
      return trends.length > 0 ? trends : allProducts.filter((item) => item.id !== product.id).slice(0, 4);
    }

    // Standard product/collection: pieces from same category, excluding current product
    const catSlug = product.category_slug?.toLowerCase();
    const catName = product.category_name?.toLowerCase();

    const sameCat = allProducts.filter((item) => {
      if (item.id === product.id) return false;
      if (catSlug && item.category_slug?.toLowerCase() === catSlug) return true;
      if (catName && item.category_name?.toLowerCase() === catName) return true;
      return false;
    });

    if (sameCat.length >= 4) {
      return sameCat.slice(0, 8);
    }

    // Supplement with other pieces if category has few items
    const remaining = allProducts.filter(
      (item) => item.id !== product.id && !sameCat.some((c) => c.id === item.id)
    );
    return [...sameCat, ...remaining].slice(0, 8);
  }, [allProducts, product, activeContext]);

  // Section header for recommended pieces under the product
  const sectionHeaderInfo = useMemo(() => {
    if (activeContext === "newin") {
      return {
        kicker: "SPRING / SUMMER 2026 // NEW ARRIVALS",
        title: "MORE NEW IN PIECES",
        subtitle: "Explore other recently released streetwear drops.",
      };
    }
    if (activeContext === "trending") {
      return {
        kicker: "SEASON ESSENTIALS // TRENDING NOW",
        title: "MORE TRENDING PIECES",
        subtitle: "Most coveted streetwear styles of the week.",
      };
    }
    return {
      kicker: `GREENO // ${product?.category_name?.toUpperCase() || "CURATED CATALOGUE"}`,
      title: product?.category_name
        ? `MORE ${product.category_name.toUpperCase()}`
        : "MORE FROM THIS COLLECTION",
      subtitle: "Curated streetwear pieces designed to complete the look.",
    };
  }, [activeContext, product]);

  if (loading) {
    return (
      <main className="product-page">
        <div className="product-not-found">
          <h1>LOADING PRODUCT...</h1>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="product-page">
        <div className="product-not-found">
          <h1>PRODUCT NOT FOUND</h1>

          <Link href="/products">
            BACK TO PRODUCTS
          </Link>
        </div>
      </main>
    );
  }

  const image = product.image || "/black-tee.jfif";

  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : [image];

  // Size-wise stock calculation
  const currentSizeQty = useMemo(() => {
    if (!product) return 0;
    if (product.size_stock && typeof product.size_stock === "object") {
      return product.size_stock[selectedSize] !== undefined
        ? Number(product.size_stock[selectedSize]) || 0
        : Number(product.stock) || 0;
    }
    return Number(product.stock) || 0;
  }, [product, selectedSize]);

  const isSizeOutOfStock = currentSizeQty <= 0;
  const isSizeLowStock = currentSizeQty > 0 && currentSizeQty <= 5;

  const handleAddToCart = () => {
    if (isSizeOutOfStock) return;
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: image,
        size: selectedSize,
        color: selectedColor || product.color || "BLACK",
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <main className="product-page">

        {/* BACK BUTTON */}
        <button
          className="product-back-button"
          onClick={() => router.back()}
        >
          ← BACK
        </button>

        <div className="product-detail">

          {/* LEFT - PRODUCT DETAILS (ONLY THE SELECTED PRODUCT) */}
          <div className="product-left">

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
              <p className="product-category" style={{ margin: 0 }}>
                {activeContext === "newin"
                  ? "GREENO // NEW IN"
                  : activeContext === "trending"
                  ? "GREENO // TRENDING"
                  : `GREENO // ${product.category_name || "COLLECTION"}`}
              </p>
              {product.collection_tag && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    background: "#000000",
                    color: "#ffffff",
                    padding: "2px 8px",
                    textTransform: "uppercase",
                  }}
                >
                  COLLECTION: {product.collection_tag}
                </span>
              )}
            </div>

            <h1>{product.name}</h1>

            <p className="product-price">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </p>

            <div className="product-left-section">
              <h3>DESCRIPTION</h3>

              <p style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>
                {product.description ||
                  `Exclusive ${product.name} designed with premium streetwear styling, heavyweight construction, and relaxed silhouette.`}
              </p>
            </div>

            <div className="product-left-section">
              <h3>MATERIAL &amp; FABRIC</h3>
              <p>
                {product.material
                  ? product.fabric
                    ? `${product.material} • ${product.fabric}`
                    : product.material
                  : product.fabric || "Heavyweight Premium Combed Cotton"}
              </p>
            </div>

            <div className="product-left-section">
              <h3>FIT SPECIFICATION</h3>
              <p>
                {product.fit || "Relaxed Boxy Fit"}
              </p>
            </div>

          </div>

          {/* CENTER - PRODUCT IMAGES */}
          <div className="product-center">

            <ImageSwiper
              images={productImages.join(",")}
              cardWidth={420}
              cardHeight={560}
            />

          </div>

          {/* RIGHT - PRODUCT OPTIONS */}
          <div className="product-right">

            {/* QUANTITY */}
            <div className="right-option">

              <h3>QUANTITY</h3>

              <div className="quantity-selector">

                <button
                  onClick={() =>
                    setQuantity(
                      Math.max(1, quantity - 1)
                    )
                  }
                >
                  −
                </button>

                <span>{quantity}</span>

                <button
                  onClick={() =>
                    setQuantity(quantity + 1)
                  }
                >
                  +
                </button>

              </div>

            </div>

            {/* COLOR */}
            <div className="right-option">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h3 style={{ margin: 0 }}>
                  COLOR: <span style={{ color: "#000000", fontWeight: 700 }}>{selectedColor}</span>
                </h3>
              </div>

              <div className="color-options">
                {(Array.isArray(product.colors) && product.colors.length > 0
                  ? product.colors
                  : [product.color || "BLACK"]
                ).map((col) => {
                  const COLOR_MAP: Record<string, string> = {
                    BLACK: "#111111",
                    WHITE: "#f8f9fa",
                    GREY: "#71717a",
                    GRAY: "#71717a",
                    OLIVE: "#556b2f",
                    BEIGE: "#d4c5b9",
                    CREAM: "#fef9e7",
                    NAVY: "#0f172a",
                    BROWN: "#582f0e",
                    RED: "#dc2626",
                    CHARCOAL: "#27272a",
                    SAGE: "#9caf88",
                    KHAKI: "#c3b091",
                  };
                  const hex = COLOR_MAP[col.toUpperCase()] || "#333333";
                  const isSelected = selectedColor.toUpperCase() === col.toUpperCase();

                  return (
                    <button
                      key={col}
                      type="button"
                      className={`color-option ${isSelected ? "active" : ""}`}
                      onClick={() => setSelectedColor(col)}
                    >
                      <span
                        className="color-dot"
                        style={{
                          backgroundColor: hex,
                          border: col.toUpperCase() === "WHITE" ? "1px solid #cccccc" : undefined,
                        }}
                      />
                      {col.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PRODUCT NUMBER */}
            <div className="right-info">
              <h3>PRODUCT NUMBER</h3>
              <p>{product.id}</p>
            </div>

            {/* SIZE */}
            <div className="right-option">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h3 style={{ margin: 0 }}>CHOOSE SIZE</h3>
                {isSizeLowStock && (
                  <span style={{ fontSize: "11px", color: "#dc2626", fontWeight: 700, letterSpacing: "0.05em" }}>
                    🔥 ONLY {currentSizeQty} LEFT!
                  </span>
                )}
                {isSizeOutOfStock && (
                  <span style={{ fontSize: "11px", color: "#b91c1c", fontWeight: 700, letterSpacing: "0.05em" }}>
                    ✕ OUT OF STOCK
                  </span>
                )}
              </div>

              <div className="size-options">
                {(["S", "M", "L", "XL", "XXL"] as const).map((size) => {
                  const sizeQty =
                    product.size_stock && typeof product.size_stock === "object"
                      ? product.size_stock[size] !== undefined
                        ? Number(product.size_stock[size]) || 0
                        : Number(product.stock) || 0
                      : Number(product.stock ?? 10);
                  const isOut = sizeQty <= 0;
                  const isLow = sizeQty > 0 && sizeQty <= 5;
                  const isSelected = selectedSize === size;

                  return (
                    <button
                      key={size}
                      type="button"
                      className={`size-button ${isSelected ? "active" : ""} ${isOut ? "disabled" : ""} ${isLow ? "has-low-stock" : ""}`}
                      onClick={() => setSelectedSize(size)}
                      title={
                        isOut
                          ? `Size ${size}: Out of stock`
                          : isLow
                          ? `Size ${size}: Only ${sizeQty} left!`
                          : `Size ${size}: In stock`
                      }
                    >
                      <span>{size}</span>
                      {isLow && <span className="size-low-indicator" title={`Only ${sizeQty} left`}>•</span>}
                    </button>
                  );
                })}
              </div>

              {/* URGENCY BANNER IF <= 5 UNITS */}
              {isSizeLowStock && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 14px",
                    background: "#fff1f2",
                    border: "1px solid #fecdd3",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>⚠️</span>
                  <div style={{ fontSize: "11px", color: "#be123c", letterSpacing: "0.04em", lineHeight: "1.4" }}>
                    <strong>ONLY {currentSizeQty} LEFT IN SIZE {selectedSize}</strong> &mdash; Order soon before it sells out!
                  </div>
                </div>
              )}

              {/* OUT OF STOCK BANNER */}
              {isSizeOutOfStock && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 14px",
                    background: "#fef2f2",
                    border: "1px solid #f87171",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>✕</span>
                  <div style={{ fontSize: "11px", color: "#b91c1c", letterSpacing: "0.04em", lineHeight: "1.4" }}>
                    <strong>SIZE {selectedSize} IS CURRENTLY OUT OF STOCK.</strong> Please select another size.
                  </div>
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="product-actions">
              <button
                className="add-to-cart-button"
                onClick={handleAddToCart}
                disabled={isSizeOutOfStock}
                style={{
                  background: isSizeOutOfStock
                    ? "#999999"
                    : added
                    ? "#16a34a"
                    : "#111",
                  color: "#fff",
                  cursor: isSizeOutOfStock ? "not-allowed" : "pointer",
                  transition: "background 0.2s ease",
                  opacity: isSizeOutOfStock ? 0.7 : 1,
                }}
              >
                {isSizeOutOfStock
                  ? `OUT OF STOCK IN SIZE ${selectedSize}`
                  : added
                  ? "ADDED TO BAG ✓"
                  : "ADD TO SHOPPING BAG"}
              </button>

              <button
                className="wishlist-button"
                onClick={() =>
                  toggleWishlist({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: image,
                    category: product.category_name,
                  })
                }
                style={{
                  color: isInWishlist(product.id) ? "#e53e3e" : "inherit",
                }}
                aria-label="Toggle wishlist"
              >
                {isInWishlist(product.id) ? "♥" : "♡"}
              </button>

            </div>

            {/* DETAILS ACCORDIONS */}
            <div className="product-accordions">

              {/* 1. PRODUCT DETAILS */}
              <div className="product-accordion">
                <button
                  type="button"
                  onClick={() =>
                    setOpenAccordion(openAccordion === "details" ? null : "details")
                  }
                >
                  <span>PRODUCT DETAILS &amp; SPECIFICATIONS</span>
                  <span>{openAccordion === "details" ? "−" : "+"}</span>
                </button>

                <div
                  className="accordion-content"
                  style={{
                    display: openAccordion === "details" ? "block" : "none",
                    paddingBottom: "18px",
                  }}
                >
                  <p style={{ marginBottom: "10px", lineHeight: "1.6" }}>
                    {product.description ||
                      `Exclusive ${product.name} tailored for everyday luxury streetwear presence.`}
                  </p>

                  <ul
                    style={{
                      margin: "6px 0 0 0",
                      paddingLeft: "18px",
                      fontSize: "12px",
                      color: "#666666",
                      lineHeight: "1.7",
                    }}
                  >
                    <li>
                      <strong>Material / Composition:</strong>{" "}
                      {product.material || "100% Combed Cotton"}
                    </li>
                    <li>
                      <strong>Fabric Construction:</strong>{" "}
                      {product.fabric || "Heavyweight Premium Knit"}
                    </li>
                    <li>
                      <strong>Fit Silhouette:</strong>{" "}
                      {product.fit || "Relaxed Boxy Streetwear Fit"}
                    </li>
                    <li>
                      <strong>Colorway:</strong> {product.color || "Black"}
                    </li>
                    <li>
                      <strong>Product Code / SKU:</strong>{" "}
                      {product.product_no || product.id}
                    </li>
                    {product.is_new && (
                      <li style={{ color: "#000000", fontWeight: 700 }}>
                        ✦ Spring / Summer 2026 New Arrival
                      </li>
                    )}
                    {product.is_trending && (
                      <li style={{ color: "#000000", fontWeight: 700 }}>
                        ★ Trending Season Essential
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* 2. DELIVERY & RETURNS */}
              <div className="product-accordion">
                <button
                  type="button"
                  onClick={() =>
                    setOpenAccordion(openAccordion === "delivery" ? null : "delivery")
                  }
                >
                  <span>DELIVERY &amp; 3-DAY RETURNS</span>
                  <span>{openAccordion === "delivery" ? "−" : "+"}</span>
                </button>

                <div
                  className="accordion-content"
                  style={{
                    display: openAccordion === "delivery" ? "block" : "none",
                    paddingBottom: "18px",
                  }}
                >
                  <p style={{ marginBottom: "8px", lineHeight: "1.5" }}>
                    <strong>Complimentary Express Shipping:</strong> Dispatched within 24 hours. Delivered across India within 2–4 business days with live courier tracking.
                  </p>
                  <p style={{ margin: 0, lineHeight: "1.5" }}>
                    <strong>3-Day Exchange &amp; Return Guarantee:</strong> Items are eligible for complimentary size exchanges or returns within 3 days (72 hours) of delivery directly from your Account Orders dashboard.
                  </p>
                </div>
              </div>

              {/* 3. CARE INSTRUCTIONS */}
              <div className="product-accordion">
                <button
                  type="button"
                  onClick={() =>
                    setOpenAccordion(openAccordion === "care" ? null : "care")
                  }
                >
                  <span>CARE INSTRUCTIONS</span>
                  <span>{openAccordion === "care" ? "−" : "+"}</span>
                </button>

                <div
                  className="accordion-content"
                  style={{
                    display: openAccordion === "care" ? "block" : "none",
                    paddingBottom: "18px",
                  }}
                >
                  <p style={{ lineHeight: "1.6" }}>
                    Machine wash cold (30°C) inside out with similar colors. Use mild detergent. Do not bleach. Tumble dry on low or line dry in the shade to preserve garment shape and longevity. Cool iron inside out.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* ============================================================
            RECOMMENDED PRODUCTS SECTION
            Exclusively filtered:
            - If New In: Only other New In pieces
            - If Trending: Only other Trending pieces
            - If Product/Category: Only pieces from same collection
        ============================================================ */}
        <section className="more-products">

          <div className="more-products-header">
            <p>{sectionHeaderInfo.kicker}</p>
            <h2>{sectionHeaderInfo.title}</h2>
            {sectionHeaderInfo.subtitle && (
              <span
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "#777777",
                  marginTop: "4px",
                  letterSpacing: "0.04em",
                }}
              >
                {sectionHeaderInfo.subtitle}
              </span>
            )}
          </div>

          <div className="more-products-grid">

            {underProducts.length === 0 ? (
              <div style={{ padding: "40px 0", color: "#888888", fontSize: "13px" }}>
                No other pieces available in this section at the moment.
              </div>
            ) : (
              underProducts.map((item) => (
                <Link
                  href={`/products/${item.id}?from=${activeContext}`}
                  key={item.id}
                  className="more-product-card"
                >

                  <div className="more-product-image" style={{ position: "relative" }}>

                    <img
                      src={item.image}
                      alt={item.name}
                    />

                    {item.is_new && activeContext === "newin" && (
                      <span
                        style={{
                          position: "absolute",
                          top: "10px",
                          left: "10px",
                          background: "#000000",
                          color: "#ffffff",
                          fontSize: "9px",
                          fontWeight: 800,
                          padding: "2px 7px",
                          letterSpacing: "0.1em",
                        }}
                      >
                        NEW
                      </span>
                    )}

                    {item.is_trending && activeContext === "trending" && (
                      <span
                        style={{
                          position: "absolute",
                          top: "10px",
                          left: "10px",
                          background: "#000000",
                          color: "#ffffff",
                          fontSize: "9px",
                          fontWeight: 800,
                          padding: "2px 7px",
                          letterSpacing: "0.1em",
                        }}
                      >
                        TRENDING
                      </span>
                    )}

                  </div>

                  <div className="more-product-info">

                    <span
                      style={{
                        fontSize: "9px",
                        letterSpacing: "0.14em",
                        color: "#888888",
                        textTransform: "uppercase",
                        marginBottom: "4px",
                        display: "block",
                      }}
                    >
                      {item.category_name || "GREENO"}
                    </span>

                    <h3>{item.name}</h3>

                    <p>
                      ₹{Number(item.price).toLocaleString("en-IN")}
                    </p>

                  </div>

                </Link>
              ))
            )}

          </div>

        </section>

      </main>

      <AboutSection />
    </>
  );
}