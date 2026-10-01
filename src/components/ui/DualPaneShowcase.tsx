"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowLeft, ArrowRight, Check, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
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

  const lastWheelTimeRef = useRef(0);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  const { addToCart, openCart } = useCart();
  const total = SHOWCASE_PRODUCTS.length;
  const activeProduct = SHOWCASE_PRODUCTS[activeIndex];

  const goToSlide = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= total || targetIndex === activeIndex) return;
    setDirection(targetIndex > activeIndex ? 1 : -1);
    setActiveIndex(targetIndex);
  };

  const nextSlide = () => {
    if (activeIndex < total - 1) {
      goToSlide(activeIndex + 1);
    } else {
      goToSlide(0); // loop
    }
  };

  const prevSlide = () => {
    if (activeIndex > 0) {
      goToSlide(activeIndex - 1);
    } else {
      goToSlide(total - 1); // loop
    }
  };

  // Dedicated wheel listener on the right box ONLY
  const handleBoxWheel = (e: React.WheelEvent) => {
    const isVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);
    const delta = isVertical ? e.deltaY : e.deltaX;

    if (Math.abs(delta) < 18) return;

    const now = Date.now();
    if (now - lastWheelTimeRef.current < 400) return;

    if (delta > 0) {
      // scroll down/right -> next product
      if (activeIndex < total - 1) {
        e.stopPropagation();
        lastWheelTimeRef.current = now;
        goToSlide(activeIndex + 1);
      }
    } else if (delta < 0) {
      // scroll up/left -> prev product
      if (activeIndex > 0) {
        e.stopPropagation();
        lastWheelTimeRef.current = now;
        goToSlide(activeIndex - 1);
      }
    }
  };

  // Touch swipe support on right box
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = touchStartXRef.current - e.changedTouches[0].clientX;
    const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;

    // Detect horizontal swipe or vertical swipe inside right box
    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    } else if (Math.abs(deltaY) > 40 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY > 0 && activeIndex < total - 1) {
        nextSlide();
      } else if (deltaY < 0 && activeIndex > 0) {
        prevSlide();
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

  // Slide transition variants for Framer Motion inside the right box
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
    }),
  };

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
          <span>02 // RUNWAY SHOWCASE • ATELIER ATELIER</span>
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

        {/* RIGHT BOX: DEDICATED SLIDER BOX (Product photo, details, price & Add to Cart) */}
        <div
          className="dual-pane-right-box"
          onWheel={handleBoxWheel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slider Header Bar */}
          <div className="dual-pane-box-header">
            <span className="dual-pane-box-collection">{activeProduct.collection}</span>

            {/* Slider Navigation Arrows */}
            <div className="dual-pane-box-nav">
              <button
                type="button"
                onClick={prevSlide}
                className="dual-pane-nav-arrow"
                aria-label="Previous piece"
                title="Previous piece"
              >
                <ChevronLeft size={16} strokeWidth={2.2} />
              </button>
              <span className="dual-pane-slide-num">
                {String(activeIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={nextSlide}
                className="dual-pane-nav-arrow"
                aria-label="Next piece"
                title="Next piece"
              >
                <ChevronRight size={16} strokeWidth={2.2} />
              </button>
            </div>
          </div>

          {/* SLIDER BODY (Animated slide on change) */}
          <div className="dual-pane-slider-content-wrap">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={activeProduct.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -40) {
                    nextSlide();
                  } else if (info.offset.x > 40) {
                    prevSlide();
                  }
                }}
                className="dual-pane-slide-panel"
              >
                {/* Product Photo Window */}
                <div className="dual-pane-product-window">
                  <img
                    src={activeProduct.productImage}
                    alt={activeProduct.name}
                    className="dual-pane-product-image"
                  />
                  <div className="dual-pane-product-badge">
                    <span>DETAIL // STILL LIFE</span>
                  </div>
                </div>

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
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Slider Footer: Progress Bar & Direct Jump Dots */}
          <div className="dual-pane-slider-footer">
            <div className="dual-pane-slider-dots">
              {SHOWCASE_PRODUCTS.map((prod, idx) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  className={`dual-pane-slider-dot ${idx === activeIndex ? "active" : ""}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
            <span className="dual-pane-slider-hint">
              SWIPE / SCROLL INSIDE BOX TO SLIDE
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
