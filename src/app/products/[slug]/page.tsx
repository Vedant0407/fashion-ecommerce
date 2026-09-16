"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Heart, ShoppingBag, ArrowLeft, ChevronLeft, ChevronRight, ShieldCheck, Truck, RefreshCw, ZoomIn } from "lucide-react";

import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import AboutSection from "@/components/ui/AboutSection";
import ProductImageLightbox from "@/components/ProductImageLightbox";
import { Product, getProductByIdOrSlug, getAllProducts } from "@/lib/catalog";

function getCategoryGroup(item?: Product | null): string {
  if (!item) return "other";
  const slug = item.category_slug?.toLowerCase().trim() || "";
  const name = item.category_name?.toLowerCase().trim() || "";
  const id = item.id?.toLowerCase().trim() || "";
  const title = item.name?.toLowerCase().trim() || "";
  const text = `${slug} ${name} ${id} ${title}`;

  if (slug === "pants" || text.includes("pant") || text.includes("cargo") || text.includes("trouser")) {
    return "pants";
  }
  if (slug === "tops" || slug === "t-shirts" || text.includes("tee") || text.includes("t-shirt") || text.includes("shirt") || text.includes("turtleneck")) {
    return "tops";
  }
  if (slug === "outerwear" || slug === "hoodies" || text.includes("hoodie") || text.includes("coat") || text.includes("jacket")) {
    return "outerwear";
  }
  if (slug === "bags" || text.includes("bag") || text.includes("tote") || text.includes("crossbody")) {
    return "bags";
  }
  if (slug === "footwear" || text.includes("shoe") || text.includes("derb") || text.includes("foot")) {
    return "footwear";
  }
  if (slug === "accessories" || text.includes("chain") || text.includes("accessory") || text.includes("cap") || text.includes("hat")) {
    return "accessories";
  }

  return slug || name || "atelier";
}

function isSameCategory(a?: Product | null, b?: Product | null): boolean {
  if (!a || !b) return false;
  const groupA = getCategoryGroup(a);
  const groupB = getCategoryGroup(b);
  if (groupA !== "other" && groupB !== "other") {
    return groupA === groupB;
  }
  return (
    (Boolean(a.category_slug) && a.category_slug?.toLowerCase() === b.category_slug?.toLowerCase()) ||
    (Boolean(a.category_name) && a.category_name?.toLowerCase() === b.category_name?.toLowerCase())
  );
}

function getCategoryDisplayName(item?: Product | null): string {
  if (!item) return "ATELIER";
  const group = getCategoryGroup(item);
  switch (group) {
    case "pants":
      return "PANTS & TROUSERS";
    case "tops":
      return "TOPS & KNITWEAR";
    case "outerwear":
      return "OUTERWEAR & COATS";
    case "bags":
      return "BAGS & TOTES";
    case "footwear":
      return "FOOTWEAR & SHOES";
    case "accessories":
      return "ACCESSORIES";
    default:
      return item.category_name?.toUpperCase() || "ATELIER COLLECTION";
  }
}

export default function ProductPage() {
  const { addToCart, openCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const params = useParams();
  const router = useRouter();

  const rawSlug = params?.slug;
  const slug = useMemo(() => {
    try {
      const val = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug ? String(rawSlug) : "");
      return val ? decodeURIComponent(val) : "";
    } catch {
      return Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug ? String(rawSlug) : "");
    }
  }, [rawSlug]);

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState<string>("BLACK");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [openAccordion, setOpenAccordion] = useState<string | null>("details");

  useEffect(() => {
    if (!slug) return;
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
          setActiveImageIndex(0);

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

    const handleUpdate = () => {
      loadProduct();
    };

    window.addEventListener("greeno_products_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("greeno_products_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
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

    const handleUpdate = () => {
      loadOtherProducts();
    };

    window.addEventListener("greeno_products_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("greeno_products_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const complementaryProducts = useMemo(() => {
    if (!product) return [];
    // Prioritize pieces from same category or curated atelier pieces
    const sameCategory = allProducts.filter(
      (item) => item.id !== product.id && isSameCategory(product, item)
    );
    if (sameCategory.length >= 4) {
      return sameCategory.slice(0, 4);
    }
    const otherPieces = allProducts.filter((item) => item.id !== product.id && !sameCategory.some((s) => s.id === item.id));
    return [...sameCategory, ...otherPieces].slice(0, 4);
  }, [allProducts, product]);

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

  if (loading) {
    return (
      <main className="atelier-pdp-page">
        <div className="atelier-pdp-loading">
          <div className="atelier-pdp-spinner" />
          <p>LOADING SILHOUETTE...</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="atelier-pdp-page">
        <div className="atelier-pdp-not-found">
          <h2>PIECE NOT FOUND</h2>
          <p>This silhouette is either archived or no longer available in current runs.</p>
          <Link href="/" className="atelier-pdp-btn-return">
            RETURN TO ATELIER
          </Link>
        </div>
      </main>
    );
  }

  const primaryImage = product.image || "/atelier-bag.jpg";
  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : [primaryImage];

  const currentDisplayImage = productImages[activeImageIndex] || productImages[0] || primaryImage;

  const handleAddToCart = () => {
    if (isSizeOutOfStock) return;
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: currentDisplayImage,
        size: selectedSize,
        color: selectedColor || product.color || "BLACK",
      },
      quantity
    );
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2200);
  };

  const handleWishlistClick = () => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: currentDisplayImage,
      category: product.category_name || "ATELIER",
    });
  };

  return (
    <>
      <main className="atelier-pdp-page">
        <div className="atelier-pdp-container">
          
          {/* Top Breadcrumbs & Back Navigation */}
          <nav className="atelier-pdp-nav" aria-label="Breadcrumb">
            <button
              type="button"
              className="atelier-pdp-back-link"
              onClick={() => router.back()}
            >
              <ArrowLeft size={13} strokeWidth={1.75} />
              <span>BACK</span>
            </button>
            <div className="atelier-pdp-breadcrumb-trail">
              <Link href="/">ATELIER</Link>
              <span className="atelier-breadcrumb-sep">/</span>
              <span className="atelier-breadcrumb-curr">{getCategoryDisplayName(product)}</span>
              <span className="atelier-breadcrumb-sep">/</span>
              <span className="atelier-breadcrumb-piece">{product.name}</span>
            </div>
          </nav>

          {/* Main 2-Column Luxury Layout */}
          <div className="atelier-pdp-layout">
            
            {/* Left: Editorial Imagery Showcase */}
            <div className="atelier-pdp-gallery-col">
              <div className="atelier-pdp-main-image-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentDisplayImage}
                  alt={product.name}
                  className="atelier-pdp-main-image"
                  onClick={() => {
                    if (productImages.length > 1) {
                      setActiveImageIndex((prev) => (prev + 1) % productImages.length);
                    }
                  }}
                  style={{ cursor: productImages.length > 1 ? "pointer" : "default" }}
                />

                {/* Subtle Image Counter & Zoom Indicator */}
                <div className="atelier-pdp-image-meta">
                  <span className="atelier-pdp-slide-counter">
                    {String(activeImageIndex + 1).padStart(2, "0")} &mdash; {String(productImages.length).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    className="atelier-pdp-zoom-trigger"
                    onClick={() => {
                      setLightboxIndex(activeImageIndex);
                      setLightboxOpen(true);
                    }}
                    title="Inspect high-resolution details"
                  >
                    <ZoomIn size={14} strokeWidth={1.75} />
                    <span>ZOOM</span>
                  </button>
                </div>

                {/* Arrow Navigation if multiple images */}
                {productImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="atelier-pdp-nav-arrow prev"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
                      }}
                      aria-label="Previous photo"
                    >
                      <ChevronLeft size={16} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      className="atelier-pdp-nav-arrow next"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
                      }}
                      aria-label="Next photo"
                    >
                      <ChevronRight size={16} strokeWidth={1.5} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails Row */}
              {productImages.length > 1 && (
                <div className="atelier-pdp-thumbs">
                  {productImages.map((thumb, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`atelier-pdp-thumb-btn ${activeImageIndex === idx ? "active" : ""}`}
                      onClick={() => setActiveImageIndex(idx)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb} alt={`${product.name} detail view ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Editorial Information & Checkout Controls */}
            <div className="atelier-pdp-info-col">
              <div className="atelier-pdp-info-sticky">
                
                {/* Header Block */}
                <div className="atelier-pdp-header">
                  <div className="atelier-pdp-edition-kicker">
                    <span>SS&apos;26 &mdash; ATELIER</span>
                    {product.product_no && (
                      <span className="atelier-pdp-sku">NO. {product.product_no}</span>
                    )}
                  </div>

                  <h1 className="atelier-pdp-title">{product.name}</h1>

                  <div className="atelier-pdp-price-wrap">
                    <span className="atelier-pdp-price">
                      ₹{Number(product.price).toLocaleString("en-IN")}
                    </span>
                    <span className="atelier-pdp-price-note">
                      MRP INCL. OF ALL TAXES &bull; COMPLIMENTARY COURIER
                    </span>
                  </div>
                </div>

                {/* Editorial Description */}
                <div className="atelier-pdp-desc">
                  <p>
                    {product.description ||
                      "Architectural silhouette crafted with heavyweight texture, refined proportions, and fluid drape. Designed for quiet timeless elegance."}
                  </p>
                </div>

                {/* Micro Specification Grid */}
                <div className="atelier-pdp-specs-grid">
                  <div className="atelier-pdp-spec-item">
                    <span className="spec-label">COMPOSITION</span>
                    <span className="spec-val">{product.material || "100% Virgin Wool / Calfskin"}</span>
                  </div>
                  <div className="atelier-pdp-spec-item">
                    <span className="spec-label">FABRIC</span>
                    <span className="spec-val">{product.fabric || "Heavyweight Rib / Fine Grain"}</span>
                  </div>
                  <div className="atelier-pdp-spec-item">
                    <span className="spec-label">SILHOUETTE</span>
                    <span className="spec-val">{product.fit || "Relaxed Architectural Drape"}</span>
                  </div>
                </div>

                {/* Divider Rule */}
                <div className="atelier-pdp-rule" />

                {/* Color Selection */}
                <div className="atelier-pdp-option-group">
                  <div className="atelier-pdp-option-label-row">
                    <span className="option-title">COLORWAY</span>
                    <span className="option-selected-val">{selectedColor}</span>
                  </div>
                  <div className="atelier-pdp-color-swatches">
                    {(Array.isArray(product.colors) && product.colors.length > 0
                      ? product.colors
                      : [product.color || "BLACK"]
                    ).map((col) => {
                      const COLOR_MAP: Record<string, string> = {
                        BLACK: "#121212",
                        NOIR: "#121212",
                        WHITE: "#FAF9F6",
                        GREY: "#71717A",
                        GRAY: "#71717A",
                        OLIVE: "#4B5320",
                        BEIGE: "#D7CFBD",
                        CREAM: "#F7F5EE",
                        NAVY: "#1B263B",
                        BROWN: "#4A3525",
                        CHARCOAL: "#242426",
                        OATMEAL: "#E6DEC8",
                        SAGE: "#9FAF90",
                      };
                      const hex = COLOR_MAP[col.toUpperCase()] || "#2D2D2D";
                      const isSelected = selectedColor.toUpperCase() === col.toUpperCase();

                      return (
                        <button
                          key={col}
                          type="button"
                          className={`atelier-color-chip ${isSelected ? "active" : ""}`}
                          onClick={() => setSelectedColor(col)}
                          title={`Select ${col}`}
                        >
                          <span
                            className="swatch-dot"
                            style={{
                              backgroundColor: hex,
                              border: col.toUpperCase() === "WHITE" ? "1px solid #D1CEC7" : undefined,
                            }}
                          />
                          <span className="swatch-text">{col.toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="atelier-pdp-option-group">
                  <div className="atelier-pdp-option-label-row">
                    <span className="option-title">CHOOSE SIZE</span>
                    {isSizeLowStock && (
                      <span className="option-warning">ONLY {currentSizeQty} UNITS REMAINING</span>
                    )}
                    {isSizeOutOfStock && (
                      <span className="option-danger">SIZE {selectedSize} OUT OF STOCK</span>
                    )}
                  </div>
                  <div className="atelier-pdp-size-tiles">
                    {(["S", "M", "L", "XL", "XXL"] as const).map((sz) => {
                      const qty =
                        product.size_stock && typeof product.size_stock === "object"
                          ? product.size_stock[sz] !== undefined
                            ? Number(product.size_stock[sz]) || 0
                            : Number(product.stock) || 0
                          : Number(product.stock ?? 10);
                      const isOut = qty <= 0;
                      const isSelected = selectedSize === sz;

                      return (
                        <button
                          key={sz}
                          type="button"
                          disabled={isOut}
                          className={`atelier-size-tile ${isSelected ? "active" : ""} ${isOut ? "disabled" : ""}`}
                          onClick={() => setSelectedSize(sz)}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="atelier-pdp-option-group">
                  <div className="atelier-pdp-option-label-row">
                    <span className="option-title">QUANTITY</span>
                  </div>
                  <div className="atelier-pdp-qty-stepper">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      &minus;
                    </button>
                    <span>{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      &#43;
                    </button>
                  </div>
                </div>

                {/* Action Buttons: Add to Bag & Wishlist */}
                <div className="atelier-pdp-actions">
                  <button
                    type="button"
                    className="atelier-pdp-add-btn"
                    onClick={handleAddToCart}
                    disabled={isSizeOutOfStock}
                  >
                    <ShoppingBag size={15} strokeWidth={1.75} />
                    <span>
                      {isSizeOutOfStock
                        ? `SIZE ${selectedSize} OUT OF STOCK`
                        : added
                        ? "ADDED TO ATELIER BAG ✓"
                        : "ADD TO SHOPPING BAG"}
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`atelier-pdp-wish-btn ${isInWishlist(product.id) ? "active" : ""}`}
                    onClick={handleWishlistClick}
                    title="Save to Wishlist"
                  >
                    <Heart
                      size={18}
                      strokeWidth={1.75}
                      fill={isInWishlist(product.id) ? "#121212" : "none"}
                    />
                  </button>
                </div>

                {/* Trust & Guarantee Perks */}
                <div className="atelier-pdp-perks">
                  <div className="atelier-perk-row">
                    <Truck size={14} strokeWidth={1.5} className="perk-icon" />
                    <span><strong>Complimentary Express Delivery</strong> &mdash; Dispatched within 24h across India</span>
                  </div>
                  <div className="atelier-perk-row">
                    <RefreshCw size={14} strokeWidth={1.5} className="perk-icon" />
                    <span><strong>3-Day Atelier Exchange Guarantee</strong> &mdash; Effortless reverse pickups from account</span>
                  </div>
                  <div className="atelier-perk-row">
                    <ShieldCheck size={14} strokeWidth={1.5} className="perk-icon" />
                    <span><strong>Heirloom Craftsmanship</strong> &mdash; 100% genuine virgin wool, leather &amp; cotton</span>
                  </div>
                </div>

                {/* Luxury Hairline Accordions */}
                <div className="atelier-pdp-accordions">
                  
                  {/* Accordion 1: Tailoring & Specifications */}
                  <div className="atelier-accordion-item">
                    <button
                      type="button"
                      className="atelier-accordion-header"
                      onClick={() => setOpenAccordion(openAccordion === "details" ? null : "details")}
                    >
                      <span>TAILORING &amp; SPECIFICATIONS</span>
                      <span className="accordion-toggle">{openAccordion === "details" ? "—" : "+"}</span>
                    </button>
                    {openAccordion === "details" && (
                      <div className="atelier-accordion-body">
                        <ul>
                          <li><strong>Silhouette:</strong> {product.fit || "Architectural Tailored Drape"}</li>
                          <li><strong>Composition:</strong> {product.material || "100% Virgin Wool / Calfskin Leather"}</li>
                          <li><strong>Fabric Weave:</strong> {product.fabric || "Italian Textile Mill Weave"}</li>
                          <li><strong>Colorway:</strong> {selectedColor}</li>
                          <li><strong>Reference Code:</strong> {product.product_no || product.id}</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Accordion 2: Care Instructions */}
                  <div className="atelier-accordion-item">
                    <button
                      type="button"
                      className="atelier-accordion-header"
                      onClick={() => setOpenAccordion(openAccordion === "care" ? null : "care")}
                    >
                      <span>COMPOSITION &amp; ATELIER CARE</span>
                      <span className="accordion-toggle">{openAccordion === "care" ? "—" : "+"}</span>
                    </button>
                    {openAccordion === "care" && (
                      <div className="atelier-accordion-body">
                        <p>
                          Specialist dry clean only for virgin wool and tailored outerwear. Leather goods should be conditioned with neutral natural beeswax balm and protected from extended moisture. Store on contoured wooden hangers in a breathable cotton garment cover.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Accordion 3: Shipping & Returns */}
                  <div className="atelier-accordion-item">
                    <button
                      type="button"
                      className="atelier-accordion-header"
                      onClick={() => setOpenAccordion(openAccordion === "shipping" ? null : "shipping")}
                    >
                      <span>COMPLIMENTARY SHIPPING &amp; 3-DAY RETURNS</span>
                      <span className="accordion-toggle">{openAccordion === "shipping" ? "—" : "+"}</span>
                    </button>
                    {openAccordion === "shipping" && (
                      <div className="atelier-accordion-body">
                        <p>
                          Complimentary express courier service across India. Dispatched from New Delhi atelier within 24 hours. Delivered within 2&ndash;4 business days with real-time SMS tracking. Unworn pieces with security tags intact are eligible for seamless 3-day return or size exchange directly via your Client Portal.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>

          </div>

          {/* Bottom Recommendations Section: Complementary Atelier Pieces */}
          {complementaryProducts.length > 0 && (
            <section className="atelier-pdp-recommendations">
              <div className="atelier-recommendations-header">
                <span className="atelier-rec-kicker">CURATED COLLECTION</span>
                <h2 className="atelier-rec-title">COMPLEMENTARY PIECES</h2>
                <p className="atelier-rec-sub">
                  Silhouettes designed to pair seamlessly across the wardrobe.
                </p>
              </div>

              <div className="atelier-grid">
                {complementaryProducts.map((item) => (
                  <div key={item.id} className="atelier-card-wrap">
                    <Link href={`/products/${item.id}`} className="atelier-card">
                      <div className="atelier-image-box">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.name}
                          className="atelier-product-img"
                        />

                        {/* Quick Add CTA */}
                        <div className="atelier-quick-add">
                          <button
                            type="button"
                            className="atelier-quick-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addToCart({
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                image: item.image,
                                size: "M",
                              });
                              openCart();
                            }}
                          >
                            <ShoppingBag size={12} />
                            <span>QUICK ADD &bull; M</span>
                          </button>
                        </div>
                      </div>

                      <div className="atelier-details">
                        <div className="atelier-title-row">
                          <h3 className="atelier-product-name">{item.name}</h3>
                          <span className="atelier-product-price">
                            ₹{Number(item.price).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <p className="atelier-product-sub">
                          {item.material || item.category_name || "Atelier Edition"}
                        </p>
                      </div>
                    </Link>

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      className="atelier-wishlist-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist({
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          image: item.image,
                          category: item.category_name,
                        });
                      }}
                      title="Save to Wishlist"
                    >
                      <Heart
                        size={15}
                        fill={isInWishlist(item.id) ? "#121212" : "none"}
                        stroke="#121212"
                        strokeWidth={1.75}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      <ProductImageLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={productImages}
        initialIndex={lightboxIndex}
        productName={product.name}
      />

      <AboutSection />
    </>
  );
}