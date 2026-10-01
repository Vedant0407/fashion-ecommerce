"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { ShoppingBag, ArrowLeft, ArrowRight, Check, Sparkles, ChevronDown } from "lucide-react";
import { useCart } from "@/context/CartContext";

export interface ShowcaseProduct {
  id: string;
  name: string;
  collection: string;
  category: string;
  silhouette: string;
  price: number;
  originalPrice: number;
  modelImage: string;
  productImage: string;
  link: string;
  color: string;
  sizes: string[];
}

export const SHOWCASE_PRODUCTS: ShowcaseProduct[] = [
  {
    id: "tailored-poplin-shirt",
    name: "TAILORED POPLIN SHIRT",
    collection: "COLLECTION 03 // POPLIN SERIES",
    category: "ARCHITECTURAL SHIRTING",
    silhouette: "Architectural drop collar cut from crisp 120s Italian cotton poplin with natural mother-of-pearl buttons.",
    price: 3499,
    originalPrice: 4499,
    modelImage: "/atelier-shirt.jpg",
    productImage: "/atelier-shirt-detail.jpg",
    link: "/products/tailored-poplin-shirt",
    color: "OFF-WHITE",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "oversized-black-tee",
    name: "HEAVYWEIGHT BOXY TEE",
    collection: "COLLECTION 03 // 300GSM JERSEY",
    category: "HEAVYWEIGHT JERSEY",
    silhouette: "Sculpted drop-shoulder drape in dense 300gsm combed cotton jersey.",
    price: 2499,
    originalPrice: 3199,
    modelImage: "/atelier-tshirt.jpg",
    productImage: "/atelier-tshirt-detail.jpg",
    link: "/products/oversized-black-tee",
    color: "OBSIDIAN BLACK",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "charcoal-oxford-overshirt",
    name: "CHARCOAL OXFORD OVERSHIRT",
    collection: "COLLECTION 03 // STRUCTURED WEAVE",
    category: "TEXTURED OVERSHIRTS",
    silhouette: "Heavyweight relaxed collared overshirt crafted from Italian structured cotton oxford weave.",
    price: 3899,
    originalPrice: 4899,
    modelImage: "/atelier-oxford-shirt.jpg",
    productImage: "/atelier-oxford-detail.jpg",
    link: "/products/charcoal-oxford-overshirt",
    color: "CHARCOAL",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "minimalist-chalk-tee",
    name: "MINIMALIST CHALK TEE",
    collection: "COLLECTION 03 // OPTIC CHALK",
    category: "HEAVYWEIGHT JERSEY",
    silhouette: "Clean architectural crewneck cut from 320gsm premium combed jersey with reinforced collar ribbing.",
    price: 2499,
    originalPrice: 3199,
    modelImage: "/atelier-white-tee.jpg",
    productImage: "/atelier-white-detail.jpg",
    link: "/products/minimalist-chalk-tee",
    color: "OPTIC CHALK",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "architectural-wool-coat",
    name: "DOUBLE-FACED WOOL COAT",
    collection: "COLLECTION 03 // TAILORED OUTERWEAR",
    category: "VIRGIN WOOL OUTERWEAR",
    silhouette: "Structured shoulder overcoat in virgin wool blend with deep welt pockets and architectural back vent.",
    price: 6999,
    originalPrice: 8999,
    modelImage: "/atelier-coat.jpg",
    productImage: "/atelier-knitwear.jpg",
    link: "/shop",
    color: "CAMEL OAT",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "pleated-relaxed-trouser",
    name: "PLEATED RELAXED TROUSER",
    collection: "COLLECTION 03 // TAILORED DRAPE",
    category: "ARCHITECTURAL TROUSERS",
    silhouette: "Fluid wide-leg drape with deep front pleats, hidden coin pocket, and genuine horn hardware.",
    price: 3999,
    originalPrice: 4999,
    modelImage: "/atelier-trousers.jpg",
    productImage: "/atelier-trousers-detail.jpg",
    link: "/shop",
    color: "SLATE CHARCOAL",
    sizes: ["S", "M", "L", "XL"],
  },
];

export default function DualPaneShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [isAdded, setIsAdded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const trackRef = useRef<HTMLElement>(null);
  const lastWheelTimeRef = useRef(0);
  const touchStartYRef = useRef(0);

  const { addToCart, openCart } = useCart();
  const total = SHOWCASE_PRODUCTS.length;
  const activeProduct = SHOWCASE_PRODUCTS[activeIndex];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sticky Scroll Track: pins for 420vh so scrolling drives product changes
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const rawIndex = Math.min(total - 1, Math.floor(latest * total));
    if (rawIndex !== activeIndex) {
      setDirection(rawIndex > activeIndex ? 1 : -1);
      setActiveIndex(rawIndex);
    }
  });

  // Smooth slide jump syncing both state and page scroll
  const goToSlide = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= total || targetIndex === activeIndex) return;
    setDirection(targetIndex > activeIndex ? 1 : -1);
    setActiveIndex(targetIndex);

    if (trackRef.current && typeof window !== "undefined") {
      const rect = trackRef.current.getBoundingClientRect();
      const trackTop = window.scrollY + rect.top;
      const trackHeight = trackRef.current.offsetHeight - window.innerHeight;
      const targetScrollY = trackTop + (targetIndex / total) * trackHeight + 15;
      window.scrollTo({ top: targetScrollY, behavior: "smooth" });
    }
  };

  const nextSlide = () => {
    goToSlide((activeIndex + 1) % total);
  };

  const prevSlide = () => {
    goToSlide((activeIndex - 1 + total) % total);
  };

  // Wheel event listener specifically on the right product box
  const handleBoxWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 18) return;
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 420) return;
    lastWheelTimeRef.current = now;

    if (e.deltaY > 0) {
      if (activeIndex < total - 1) {
        goToSlide(activeIndex + 1);
      }
    } else {
      if (activeIndex > 0) {
        goToSlide(activeIndex - 1);
      }
    }
  };

  // Touch swipe support on right box for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) > 40) {
      if (deltaY > 0 && activeIndex < total - 1) {
        goToSlide(activeIndex + 1);
      } else if (deltaY < 0 && activeIndex > 0) {
        goToSlide(activeIndex - 1);
      }
    }
  };

  // Handle Add to Cart action
  const handleAddToCart = () => {
    addToCart({
      id: activeProduct.id,
      name: activeProduct.name,
      price: activeProduct.price,
      image: activeProduct.productImage || activeProduct.modelImage,
      size: selectedSize,
      color: activeProduct.color,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      openCart();
    }, 850);
  };

  return (
    <section
      ref={trackRef}
      id="runway-hero"
      className="dual-pane-scroll-track"
      aria-label="GreenO Collection Split Showcase"
    >
      {/* Sticky Fullscreen Stage */}
      <div className="dual-pane-sticky-viewport">
        {/* Background Atmospheric Glow */}
        <div className="dual-pane-backdrop">
          <div className="dual-pane-backdrop-glow" />
          <div className="dual-pane-backdrop-vignette" />
        </div>

        {/* Top Kicker Header */}
        <div className="dual-pane-top-bar">
          <div className="dual-pane-kicker">
            <span className="dual-pane-kicker-dot" />
            <span>02 // RUNWAY SHOWCASE • SPLIT VIEW</span>
          </div>
          <div className="dual-pane-counter-badge">
            <span>PIECE {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
          </div>
        </div>

        {/* Main Dual-Pane Layout Container */}
        <div className="dual-pane-container">
          {/* LEFT SIDE AREA: Model Photo of the active product */}
          <div className="dual-pane-left-area">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeProduct.id}
                initial={{ opacity: 0, scale: 1.04, y: direction > 0 ? 25 : -25 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: direction > 0 ? -25 : 25 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="dual-pane-model-card"
              >
                <img
                  src={activeProduct.modelImage}
                  alt={`${activeProduct.name} - Model Look`}
                  className="dual-pane-model-image"
                />

                {/* Left Floating Editorial Labels */}
                <div className="dual-pane-model-overlay">
                  <div className="dual-pane-model-tag-top">
                    <Sparkles size={11} strokeWidth={2} />
                    <span>LOOK {String(activeIndex + 1).padStart(2, "0")} // ON MODEL</span>
                  </div>

                  <div className="dual-pane-model-tag-bottom">
                    <span className="dual-pane-model-title">{activeProduct.name}</span>
                    <span className="dual-pane-model-color">{activeProduct.color}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT BOX: Product photo, details, price & Add to Cart button */}
          <div
            className="dual-pane-right-box"
            onWheel={handleBoxWheel}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Box Header Controls */}
            <div className="dual-pane-box-header">
              <span className="dual-pane-box-collection">{activeProduct.collection}</span>

              {/* Prev / Next Jump Buttons */}
              <div className="dual-pane-box-nav">
                <button
                  type="button"
                  onClick={prevSlide}
                  disabled={activeIndex === 0}
                  className="dual-pane-nav-arrow"
                  aria-label="Previous piece"
                  title="Previous piece"
                >
                  <ArrowLeft size={14} strokeWidth={2} />
                </button>
                <span className="dual-pane-nav-slash">/</span>
                <button
                  type="button"
                  onClick={nextSlide}
                  disabled={activeIndex === total - 1}
                  className="dual-pane-nav-arrow"
                  aria-label="Next piece"
                  title="Next piece"
                >
                  <ArrowRight size={14} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Product Photo Window (inside right box) */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`prod-${activeProduct.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.03 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="dual-pane-product-window"
              >
                <img
                  src={activeProduct.productImage}
                  alt={activeProduct.name}
                  className="dual-pane-product-image"
                />
                <div className="dual-pane-product-badge">
                  <span>STILL LIFE // DETAIL</span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Product Meta & Pricing */}
            <div className="dual-pane-box-details">
              <div className="dual-pane-title-row">
                <h3 className="dual-pane-product-title">{activeProduct.name}</h3>
                <div className="dual-pane-price-group">
                  <span className="dual-pane-price">₹{activeProduct.price.toLocaleString("en-IN")}</span>
                  {activeProduct.originalPrice > activeProduct.price && (
                    <span className="dual-pane-original-price">
                      ₹{activeProduct.originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              <p className="dual-pane-silhouette-desc">{activeProduct.silhouette}</p>

              {/* Size Selector */}
              <div className="dual-pane-size-row">
                <span className="dual-pane-size-label">SIZE:</span>
                <div className="dual-pane-sizes-list">
                  {activeProduct.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`dual-pane-size-btn ${selectedSize === size ? "active" : ""}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="dual-pane-action-row">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`dual-pane-add-btn ${isAdded ? "added" : ""}`}
                >
                  {isAdded ? (
                    <>
                      <Check size={16} strokeWidth={2.2} />
                      <span>ADDED TO BAG</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} strokeWidth={2} />
                      <span>ADD TO BAG • ₹{activeProduct.price.toLocaleString("en-IN")}</span>
                    </>
                  )}
                </button>

                <Link
                  href={activeProduct.link}
                  className="dual-pane-detail-link"
                >
                  DETAILS →
                </Link>
              </div>
            </div>

            {/* Bottom Scroll Indicator inside Right Box */}
            <div className="dual-pane-scroll-hint">
              <ChevronDown size={13} className="dual-pane-hint-arrow" />
              <span>
                {activeIndex < total - 1
                  ? `SCROLL IN BOX OR PAGE TO SWITCH PIECE (0${activeIndex + 1}/0${total})`
                  : "ALL PIECES EXPLORED • SCROLL TO CONTINUE"}
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Progress Dots at bottom */}
        <div className="dual-pane-dots-bar">
          {SHOWCASE_PRODUCTS.map((prod, idx) => (
            <button
              key={prod.id}
              type="button"
              onClick={() => goToSlide(idx)}
              className={`dual-pane-dot ${idx === activeIndex ? "active" : ""}`}
              aria-label={`Jump to piece ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
