"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  PanInfo,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";

interface HeroSlide {
  id: string;
  name: string;
  collection: string;
  category: string;
  silhouette: string;
  price: number;
  image: string;
  detailImage: string;
  link: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "tailored-poplin-shirt",
    name: "TAILORED POPLIN SHIRT",
    collection: "COLLECTION 03 // POPLIN SERIES",
    category: "SHIRTING",
    silhouette: "Architectural drop collar cut from crisp 120s Italian cotton poplin.",
    price: 3499,
    image: "/atelier-shirt.jpg",
    detailImage: "/atelier-shirt-detail.jpg",
    link: "/products/tailored-poplin-shirt",
  },
  {
    id: "oversized-black-tee",
    name: "HEAVYWEIGHT BOXY TEE",
    collection: "COLLECTION 03 // 300GSM JERSEY",
    category: "JERSEY",
    silhouette: "Sculpted drop-shoulder drape in dense combed cotton jersey.",
    price: 2499,
    image: "/atelier-tshirt.jpg",
    detailImage: "/atelier-tshirt-detail.jpg",
    link: "/products/oversized-black-tee",
  },
  {
    id: "charcoal-oxford-overshirt",
    name: "CHARCOAL OXFORD OVERSHIRT",
    collection: "COLLECTION 03 // STRUCTURED WEAVE",
    category: "OVERSHIRTS",
    silhouette: "Heavyweight relaxed collared silhouette in textured Oxford weave.",
    price: 3899,
    image: "/atelier-oxford-shirt.jpg",
    detailImage: "/atelier-oxford-detail.jpg",
    link: "/products/charcoal-oxford-overshirt",
  },
  {
    id: "minimalist-chalk-tee",
    name: "MINIMALIST CHALK TEE",
    collection: "COLLECTION 03 // OPTIC CHALK",
    category: "JERSEY",
    silhouette: "Clean architectural crewneck cut from 320gsm premium combed jersey.",
    price: 2499,
    image: "/atelier-white-tee.jpg",
    detailImage: "/atelier-white-detail.jpg",
    link: "/products/minimalist-chalk-tee",
  },
  {
    id: "architectural-wool-coat",
    name: "DOUBLE-FACED WOOL COAT",
    collection: "COLLECTION 03 // WINTER TAILORING",
    category: "OUTERWEAR",
    silhouette: "Structured shoulder overcoat in virgin wool blend with deep welt pockets.",
    price: 6999,
    image: "/atelier-coat.jpg",
    detailImage: "/atelier-knitwear.jpg",
    link: "/shop",
  },
  {
    id: "pleated-relaxed-trouser",
    name: "PLEATED RELAXED TROUSER",
    collection: "COLLECTION 03 // TAILORED DRAPE",
    category: "TROUSERS",
    silhouette: "Fluid wide-leg drape with deep front pleats and horn hardware.",
    price: 3999,
    image: "/atelier-trousers.jpg",
    detailImage: "/atelier-trousers-detail.jpg",
    link: "/shop",
  },
];

export default function EditorialHero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const currentIndexRef = useRef(0);
  const scrollTrackRef = useRef<HTMLElement>(null);

  const total = HERO_SLIDES.length;

  // Track native scroll progress through this sticky section (0.0 to 1.0)
  const { scrollYProgress } = useScroll({
    target: scrollTrackRef,
    offset: ["start start", "end end"],
  });

  // Map vertical scroll progress smoothly across all available products!
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const segment = 1 / (total - 1);
    const targetIdx = Math.min(
      total - 1,
      Math.max(0, Math.round(progress / segment))
    );

    if (targetIdx !== currentIndexRef.current) {
      setDirection(targetIdx > currentIndexRef.current ? 1 : -1);
      currentIndexRef.current = targetIdx;
      setCurrentIndex(targetIdx);
    }
  });

  // Programmatic scroll helper for buttons, dots, and ghosted cards
  const scrollToSlide = useCallback(
    (idx: number) => {
      if (!scrollTrackRef.current) return;
      const rect = scrollTrackRef.current.getBoundingClientRect();
      const startY = window.scrollY + rect.top;
      const trackHeight = scrollTrackRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const maxScroll = trackHeight - viewportHeight;
      const targetY = startY + (idx / (total - 1)) * maxScroll;
      window.scrollTo({ top: targetY, behavior: "smooth" });
    },
    [total]
  );

  const nextSlide = useCallback(() => {
    if (currentIndexRef.current < total - 1) {
      scrollToSlide(currentIndexRef.current + 1);
    } else {
      // Advance to the next section below
      if (scrollTrackRef.current) {
        const rect = scrollTrackRef.current.getBoundingClientRect();
        const endY = window.scrollY + rect.bottom;
        window.scrollTo({ top: endY, behavior: "smooth" });
      }
    }
  }, [total, scrollToSlide]);

  const prevSlide = useCallback(() => {
    if (currentIndexRef.current > 0) {
      scrollToSlide(currentIndexRef.current - 1);
    } else {
      // Scroll back up to hero
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [scrollToSlide]);

  const goToSlide = (idx: number) => {
    scrollToSlide(idx);
  };

  // Keyboard navigation (Left / Right Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Touch Drag gestures
  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 40;
    if (info.offset.x < -threshold) {
      nextSlide();
    } else if (info.offset.x > threshold) {
      prevSlide();
    }
  };

  const activeSlide = HERO_SLIDES[currentIndex];

  return (
    <section
      id="runway-hero"
      ref={scrollTrackRef}
      className="editorial-runway-scroll-wrapper"
    >
      {/* STICKY VIEWPORT: Locks in view while scrolling through all products */}
      <div className="editorial-runway-sticky-viewport">
        {/* Editorial Section Header Kicker */}
        <div className="editorial-runway-section-kicker">
          <span className="editorial-runway-kicker-dot" />
          <span>02 // RUNWAY SHOWCASE • CONTINUOUS ARCHIVE</span>
        </div>

      {/* Ambient Atmospheric Backdrop of Active Piece */}
      <div className="editorial-runway-backdrop">
        <AnimatePresence mode="sync">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.18 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="editorial-runway-backdrop-img-wrap"
          >
            <img
              src={activeSlide.image}
              alt=""
              className="editorial-runway-backdrop-img"
            />
          </motion.div>
        </AnimatePresence>
        <div className="editorial-runway-backdrop-vignette" />
      </div>

      {/* CONTINUOUS HORIZONTAL RUNWAY STAGE */}
      <motion.div
        className="editorial-runway-stage"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
      >
        <div className="editorial-runway-track">
          {HERO_SLIDES.map((slide, i) => {
            // Compute wrapped continuous horizontal distance from currentIndex
            let diff = i - currentIndex;
            if (diff < -Math.floor(total / 2)) diff += total;
            if (diff > Math.floor((total - 1) / 2)) diff -= total;

            const isCenter = diff === 0;
            const isImmediateRight = diff === 1;
            const isImmediateLeft = diff === -1;
            const isVisible = Math.abs(diff) <= 2;

            // Physical continuous horizontal plane offsets
            let xPos = 0;
            let scale = 1;
            let opacity = 1;
            let zIndex = 1;
            let filter = "brightness(1) contrast(1)";

            if (isCenter) {
              xPos = 0;
              scale = 1.0;
              opacity = 1.0;
              zIndex = 10;
              filter = "brightness(1) contrast(1)";
            } else if (isImmediateRight) {
              xPos = 38; // 38vw offset to the right
              scale = 0.78;
              opacity = 0.42;
              zIndex = 5;
              filter = "brightness(0.65) contrast(0.95)";
            } else if (isImmediateLeft) {
              xPos = -38; // -38vw offset to the left
              scale = 0.78;
              opacity = 0.42;
              zIndex = 5;
              filter = "brightness(0.65) contrast(0.95)";
            } else if (diff === 2) {
              xPos = 74; // Peeking far right
              scale = 0.62;
              opacity = 0.12;
              zIndex = 2;
              filter = "brightness(0.4) contrast(0.9)";
            } else if (diff === -2) {
              xPos = -74; // Peeking far left
              scale = 0.62;
              opacity = 0.12;
              zIndex = 2;
              filter = "brightness(0.4) contrast(0.9)";
            } else {
              // Off-screen
              xPos = diff > 0 ? 110 : -110;
              scale = 0.5;
              opacity = 0;
              zIndex = 1;
            }

            if (!isVisible && Math.abs(diff) > 2) return null;

            return (
              <motion.div
                key={slide.id}
                animate={{
                  x: `${xPos}vw`,
                  scale,
                  opacity,
                  zIndex,
                  filter,
                }}
                transition={{
                  duration: 0.95,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={() => {
                  if (isImmediateRight) nextSlide();
                  if (isImmediateLeft) prevSlide();
                }}
                className={`editorial-runway-card ${
                  isCenter ? "active-center" : "ghosted-side"
                }`}
              >
                <div className="editorial-runway-card-inner">
                  <img
                    src={slide.image}
                    alt={slide.name}
                    className="editorial-runway-card-img"
                    loading={isCenter ? "eager" : "lazy"}
                    draggable={false}
                  />

                  {/* High Fashion Subtle Gloss & Shadow Border */}
                  <div className="editorial-runway-card-overlay" />

                  {/* Secondary Image cross-fade on Center hover */}
                  {isCenter && (
                    <img
                      src={slide.detailImage}
                      alt=""
                      className="editorial-runway-card-detail-img"
                      draggable={false}
                    />
                  )}

                  {/* Center Badge Link Indicator */}
                  {isCenter && (
                    <Link
                      href={slide.link}
                      className="editorial-runway-center-tap"
                      title="Inspect silhouette"
                    >
                      <span className="editorial-runway-center-tap-text">VIEW DETAILS</span>
                      <ArrowUpRight size={14} strokeWidth={2} />
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* SYNCHRONIZED DIRECTIONAL EDITORIAL TEXT OVERLAY */}
      <div className="editorial-runway-text-stage">
        <div className="editorial-runway-text-container">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeSlide.id}
              initial={{
                opacity: 0,
                x: direction > 0 ? 35 : -35,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: direction > 0 ? -35 : 35,
              }}
              transition={{
                duration: 0.75,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="editorial-runway-text-card"
            >
              {/* Collection Eyebrow */}
              <div className="editorial-runway-text-eyebrow">
                <span className="editorial-runway-eyebrow-dot" />
                <span>{activeSlide.collection}</span>
              </div>

              {/* Title in Editorial Serif */}
              <h1 className="editorial-runway-text-title font-serif">
                {activeSlide.name}
              </h1>

              {/* Silhouette Description */}
              <p className="editorial-runway-text-desc">
                {activeSlide.silhouette}
              </p>

              {/* Minimal Luxury CTA */}
              <div className="editorial-runway-text-action">
                <Link
                  href={activeSlide.link}
                  className="editorial-runway-text-cta"
                >
                  <span className="editorial-cta-text">
                    EXPLORE PIECE — ₹{activeSlide.price.toLocaleString("en-IN")}
                  </span>
                  <span className="editorial-cta-arrow">→</span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* MINIMAL SLIDE INDICATOR & CONTROLS */}
      <div className="editorial-runway-controls-bar">
        {/* Navigation Arrows */}
        <div className="editorial-runway-nav-arrows">
          <button
            type="button"
            onClick={prevSlide}
            className="editorial-runway-nav-btn"
            aria-label="Previous silhouette"
            title="Previous piece"
          >
            <ArrowLeft size={16} strokeWidth={1.8} />
            <span className="editorial-nav-btn-label">PREV</span>
          </button>

          <span className="editorial-nav-divider">/</span>

          <button
            type="button"
            onClick={nextSlide}
            className="editorial-runway-nav-btn"
            aria-label="Next silhouette"
            title="Next piece"
          >
            <span className="editorial-nav-btn-label">NEXT</span>
            <ArrowRight size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Minimal Slide Counter (e.g. 01 / 06) with Progress Bar */}
        <div className="editorial-runway-counter-group">
          <div className="editorial-runway-counter">
            <span className="editorial-counter-current">
              {String(currentIndex + 1).padStart(2, "0")}
            </span>
            <span className="editorial-counter-sep">/</span>
            <span className="editorial-counter-total">
              {String(total).padStart(2, "0")}
            </span>
          </div>

          {/* Minimal 48px progress track */}
          <div className="editorial-runway-progress-track">
            <motion.div
              className="editorial-runway-progress-fill"
              initial={false}
              animate={{
                width: `${((currentIndex + 1) / total) * 100}%`,
              }}
              transition={{
                duration: 0.85,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </div>

          {/* Scroll progress status hint */}
          <div className="editorial-runway-scroll-hint">
            <span>
              {currentIndex < total - 1
                ? `SCROLL TO EXPLORE ALL PIECES (0${currentIndex + 1}/0${total}) ↓`
                : "CONTINUE SCROLLING ↓"}
            </span>
          </div>
        </div>

        {/* Minimal Jump Dots */}
        <div className="editorial-runway-dots">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goToSlide(idx)}
              className={`editorial-runway-dot ${
                idx === currentIndex ? "active" : ""
              }`}
              aria-label={`Jump to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}
