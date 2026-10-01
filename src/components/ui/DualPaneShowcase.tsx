"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Check, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
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
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({
    "tailored-poplin-shirt": "M",
    "oversized-black-tee": "M",
    "charcoal-oxford-overshirt": "M",
    "minimalist-chalk-tee": "M",
    "architectural-wool-coat": "M",
    "pleated-relaxed-trouser": "M",
  });
  const [addedItem, setAddedItem] = useState<string | null>(null);

  const rightBoxRef = useRef<HTMLDivElement>(null);
  const scrollbarTrackRef = useRef<HTMLDivElement>(null);
  const isWheelingRef = useRef(false);
  const touchStartYRef = useRef(0);

  const { addToCart, openCart } = useCart();
  const total = SHOWCASE_PRODUCTS.length;
  const activeProduct = SHOWCASE_PRODUCTS[activeIndex];

  // Dedicated wheel listener on the right box:
  // When cursor is inside the right box, scrolling wheels through pieces while keeping the box firmly at rest in one position.
  // When cursor is on the left side (or outside), the browser naturally scrolls the website down!
  useEffect(() => {
    const box = rightBoxRef.current;
    if (!box) return;

    const onWheel = (e: WheelEvent) => {
      // 1. Immediately and unconditionally prevent any page scrolling when cursor is in the right box.
      // This guarantees the box stays completely at rest on one position and never shifts or jerks the page!
      e.preventDefault();
      e.stopPropagation();

      // 2. Ignore micro-movements
      if (Math.abs(e.deltaY) < 10) return;

      // 3. Debounce rapid wheel/trackpad ticks so each flick steps one piece cleanly
      if (isWheelingRef.current) return;

      if (e.deltaY > 0) {
        // Scroll down in right box -> advance to next piece
        setActiveIndex((prev) => {
          if (prev < total - 1) {
            isWheelingRef.current = true;
            setTimeout(() => {
              isWheelingRef.current = false;
            }, 320);
            return prev + 1;
          }
          return prev;
        });
      } else if (e.deltaY < 0) {
        // Scroll up in right box -> go to prev piece
        setActiveIndex((prev) => {
          if (prev > 0) {
            isWheelingRef.current = true;
            setTimeout(() => {
              isWheelingRef.current = false;
            }, 320);
            return prev - 1;
          }
          return prev;
        });
      }
    };

    box.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      box.removeEventListener("wheel", onWheel);
    };
  }, [total]);

  // Touch swipe support for mobile inside the right box
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    if (Math.abs(deltaY) > 35) {
      if (deltaY < 0 && activeIndex < total - 1) {
        setActiveIndex((prev) => prev + 1);
      } else if (deltaY > 0 && activeIndex > 0) {
        setActiveIndex((prev) => prev - 1);
      }
    }
  };

  // Up/down stepper buttons
  const handleNext = () => {
    if (activeIndex < total - 1) {
      setActiveIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  // Clicking on the visible pill scrollbar track jumps directly to that piece
  const handleScrollbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollbarTrackRef.current) return;
    const rect = scrollbarTrackRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const clickRatio = Math.min(1, Math.max(0, clickY / rect.height));
    const targetIdx = Math.min(total - 1, Math.round(clickRatio * (total - 1)));
    setActiveIndex(targetIdx);
  };

  const handleSelectSize = (productId: string, size: string) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const handleAddToCart = (product: ShowcaseProduct) => {
    const size = selectedSizes[product.id] || "M";
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.productImage || product.modelImage,
      size,
      color: product.color,
    });

    setAddedItem(product.id);
    setTimeout(() => {
      setAddedItem(null);
      openCart();
    }, 850);
  };

  // Calculate smooth translation positions
  const currentReelY = `-${(activeIndex / total) * 100}%`;
  const thumbHeightPercent = 25; // 25% height pill
  const thumbMaxTop = 100 - thumbHeightPercent; // 75%
  const currentThumbTop = `${(activeIndex / (total - 1)) * thumbMaxTop}%`;

  return (
    <section
      id="runway-hero"
      className="dual-pane-section"
      aria-label="GreenO Collection Split Showcase"
    >
      {/* Background Atmospheric Glow */}
      <div className="dual-pane-backdrop">
        <div className="dual-pane-backdrop-glow" />
        <div className="dual-pane-backdrop-vignette" />
      </div>

      {/* Top Header Bar */}
      <div className="dual-pane-top-bar">
        <div className="dual-pane-kicker">
          <span className="dual-pane-kicker-dot" />
          <span>02 // RUNWAY SHOWCASE • COLLECTION 03</span>
        </div>
        <div className="dual-pane-counter-badge">
          <span>PIECE {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Main Dual-Pane Layout Container */}
      <div className="dual-pane-container">
        {/* LEFT SIDE AREA: Model Photo (Scrolling on this side scrolls the website down!) */}
        <div className="dual-pane-left-area">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeProduct.id}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="dual-pane-model-card"
            >
              <img
                src={activeProduct.modelImage}
                alt={`${activeProduct.name} - Model Look`}
                className="dual-pane-model-image"
              />

              {/* Floating Editorial Badges */}
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

        {/* RIGHT BOX: PRESERVED EXACTLY AS IT IS WITH VISIBLE PILL SCROLLBAR */}
        <div
          ref={rightBoxRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="dual-pane-right-box"
        >
          {/* Header Bar with Counter & Up/Down Steppers */}
          <div className="dual-pane-box-header">
            <span className="dual-pane-box-collection">{activeProduct.collection}</span>

            <div className="dual-pane-box-nav">
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeIndex === 0}
                className="dual-pane-nav-arrow"
                aria-label="Previous product"
                title="Previous product"
              >
                <ChevronUp size={16} strokeWidth={2.2} />
              </button>
              <span className="dual-pane-slide-num">
                {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={activeIndex === total - 1}
                className="dual-pane-nav-arrow"
                aria-label="Next product"
                title="Next product"
              >
                <ChevronDown size={16} strokeWidth={2.2} />
              </button>
            </div>
          </div>

          {/* Continuous Vertical Reel Viewport */}
          <div className="dual-pane-reel-viewport">
            <motion.div
              animate={{ y: currentReelY }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="dual-pane-reel-track"
            >
              {SHOWCASE_PRODUCTS.map((product) => {
                const currentSize = selectedSizes[product.id] || "M";
                const isItemAdded = addedItem === product.id;

                return (
                  <div key={product.id} className="dual-pane-product-card-snap">
                    {/* Product Photo Window */}
                    <div className="dual-pane-product-window">
                      <img
                        src={product.productImage}
                        alt={product.name}
                        className="dual-pane-product-image"
                      />
                      <div className="dual-pane-product-badge">
                        <span>STILL LIFE // DETAIL</span>
                      </div>
                    </div>

                    {/* Product Details & Price */}
                    <div className="dual-pane-box-details">
                      <div className="dual-pane-title-row">
                        <h3 className="dual-pane-product-title">{product.name}</h3>
                        <div className="dual-pane-price-group">
                          <span className="dual-pane-price">₹{product.price.toLocaleString("en-IN")}</span>
                          {product.originalPrice > product.price && (
                            <span className="dual-pane-original-price">
                              ₹{product.originalPrice.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="dual-pane-silhouette-desc">{product.silhouette}</p>

                      {/* Size Selector */}
                      <div className="dual-pane-size-row">
                        <span className="dual-pane-size-label">SIZE:</span>
                        <div className="dual-pane-sizes-list">
                          {product.sizes.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => handleSelectSize(product.id, size)}
                              className={`dual-pane-size-btn ${currentSize === size ? "active" : ""}`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Add to Cart Action */}
                      <div className="dual-pane-action-row">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className={`dual-pane-add-btn ${isItemAdded ? "added" : ""}`}
                        >
                          {isItemAdded ? (
                            <>
                              <Check size={16} strokeWidth={2.2} />
                              <span>ADDED TO BAG</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag size={16} strokeWidth={2} />
                              <span>ADD TO BAG • ₹{product.price.toLocaleString("en-IN")}</span>
                            </>
                          )}
                        </button>

                        <Link
                          href={product.link}
                          className="dual-pane-detail-link"
                        >
                          DETAILS →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* VISIBLE PILL SCROLLBAR (Matching User Screenshot media_1790870571556.png) */}
            <div
              ref={scrollbarTrackRef}
              onClick={handleScrollbarClick}
              className="dual-pane-scrollbar-track"
              title="Click to jump to piece"
            >
              <motion.div
                animate={{ top: currentThumbTop }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="dual-pane-scrollbar-thumb"
              />
            </div>
          </div>

          {/* Footer Bar with Jump Dots and Scroll Hint */}
          <div className="dual-pane-slider-footer">
            <div className="dual-pane-slider-dots">
              {SHOWCASE_PRODUCTS.map((prod, idx) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`dual-pane-slider-dot ${idx === activeIndex ? "active" : ""}`}
                  aria-label={`Jump to piece ${idx + 1}`}
                />
              ))}
            </div>
            <span className="dual-pane-slider-hint">
              SCROLL BOX TO BROWSE PIECES ↓
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
