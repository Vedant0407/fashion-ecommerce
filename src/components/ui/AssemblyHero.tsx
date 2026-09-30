"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, RotateCcw, ArrowUpRight, Sparkles, Layers } from "lucide-react";

interface SilhouetteLook {
  id: string;
  name: string;
  subname: string;
  edition: string;
  image: string;
  category: string;
  price: number;
  link: string;
  description: string;
}

const SILHOUETTES: SilhouetteLook[] = [
  {
    id: "look-01",
    name: "THE ASSEMBLED SILHOUETTE",
    subname: "ARCHITECTURAL POPLIN & OVERSIZED DRAPE",
    edition: "EDITION 01 // AUTUMN 2026",
    image: "/atelier-hero.jpg",
    category: "SIGNATURE LOOKBOOK",
    price: 3499,
    link: "/products/tailored-poplin-shirt",
    description: "Four deconstructed fragments converge from the perimeter into one singular architectural statement.",
  },
  {
    id: "look-02",
    name: "STRUCTURED WOOL OVERCOAT",
    subname: "SCULPTED SHOULDER & DOUBLE-WEAVE CLOTH",
    edition: "EDITION 02 // WINTER 2026",
    image: "/atelier-coat.jpg",
    category: "OUTERWEAR ATELIER",
    price: 6899,
    link: "/shop",
    description: "Heavyweight architectural drape crafted from double-faced Italian wool melton.",
  },
  {
    id: "look-03",
    name: "CASHMERE ARCHIVE KNITWEAR",
    subname: "RELAXED GUAGE & CHALK OFF-WHITE TONE",
    edition: "EDITION 03 // LIMITED ARCHIVE",
    image: "/atelier-knitwear.jpg",
    category: "KNITWEAR ATELIER",
    price: 4999,
    link: "/shop",
    description: "Dense 7-gauge combed knitwear with relaxed drop shoulders and tactile rib detailing.",
  },
];

export default function AssemblyHero() {
  const [selectedLookIdx, setSelectedLookIdx] = useState(0);
  const [assemblyKey, setAssemblyKey] = useState(0);
  const [isAssembled, setIsAssembled] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLook = SILHOUETTES[selectedLookIdx];

  // Trigger assembly on mount or look change or manual replay
  useEffect(() => {
    setIsAssembled(false);
    const timer = setTimeout(() => {
      setIsAssembled(true);
    }, 1450); // locks precisely when fragments meet in center

    return () => clearTimeout(timer);
  }, [assemblyKey, selectedLookIdx]);

  // Replay handler: scatters pieces and brings them back together
  const handleReplay = () => {
    setIsAssembled(false);
    setAssemblyKey((prev) => prev + 1);
  };

  // Switch silhouette
  const handleSelectLook = (idx: number) => {
    if (idx === selectedLookIdx) return;
    setIsAssembled(false);
    setSelectedLookIdx(idx);
    setAssemblyKey((prev) => prev + 1);
  };

  // Subtle 3D mouse parallax once assembled
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isAssembled) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x: x * 12, y: y * -12 });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  // Smooth scroll to the Runway Hero directly below
  const scrollToRunway = (e: React.MouseEvent) => {
    e.preventDefault();
    const runway = document.getElementById("runway-hero");
    if (runway) {
      runway.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="assemble-hero-section"
      aria-label="GreenO Atelier Assembly Hero"
    >
      {/* Background Ambience */}
      <div className="assemble-hero-bg">
        <div className="assemble-hero-grain" />
        <div className="assemble-hero-glow" />
      </div>

      {/* Top Editorial Bar */}
      <div className="assemble-top-bar">
        <div className="assemble-top-eyebrow">
          <span className="assemble-pulse-dot" />
          <span>AUTUMN / WINTER 2026 • CAMPAIGN 01</span>
        </div>

        <div className="assemble-top-status">
          <span className="assemble-status-pill">
            <Sparkles size={11} strokeWidth={2} />
            <span>{isAssembled ? "FRAGMENT LOCK: 100% UNIFIED" : "CONVERGING FRAGMENTS..."}</span>
          </span>
        </div>
      </div>

      {/* Main Assembly Stage */}
      <div className="assemble-main-stage">
        {/* Left Editorial Text Column */}
        <div className="assemble-text-column">
          <motion.div
            key={`text-${assemblyKey}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="assemble-text-content"
          >
            <div className="assemble-kicker">
              <span>{currentLook.category}</span>
              <span className="assemble-kicker-sep">/</span>
              <span>{currentLook.edition}</span>
            </div>

            <h1 className="assemble-title font-serif">{currentLook.name}</h1>

            <p className="assemble-subname">{currentLook.subname}</p>

            <p className="assemble-desc">{currentLook.description}</p>

            {/* CTAs */}
            <div className="assemble-actions">
              <a
                href="#runway-hero"
                onClick={scrollToRunway}
                className="assemble-btn-primary"
              >
                <span>EXPLORE RUNWAY SHOWCASE</span>
                <ArrowDown size={14} strokeWidth={2} />
              </a>

              <Link href={currentLook.link} className="assemble-btn-secondary">
                <span>INSPECT SILHOUETTE — ₹{currentLook.price.toLocaleString("en-IN")}</span>
                <ArrowUpRight size={14} strokeWidth={2} />
              </Link>
            </div>
          </motion.div>

          {/* Look Selection Switcher */}
          <div className="assemble-look-selector">
            <span className="assemble-selector-label">
              <Layers size={12} strokeWidth={2} />
              <span>SELECT SILHOUETTE:</span>
            </span>

            <div className="assemble-look-buttons">
              {SILHOUETTES.map((look, i) => (
                <button
                  key={look.id}
                  type="button"
                  onClick={() => handleSelectLook(i)}
                  className={`assemble-look-btn ${i === selectedLookIdx ? "active" : ""}`}
                >
                  <span className="assemble-look-btn-num">0{i + 1}</span>
                  <span className="assemble-look-btn-title">{look.name.split(" ")[1] || look.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center / Right Photo Assembly Frame */}
        <div className="assemble-photo-wrapper">
          <motion.div
            className="assemble-photo-frame"
            animate={{
              rotateX: mouseOffset.y,
              rotateY: mouseOffset.x,
            }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          >
            {/* The 4 Corner Quadrants Flying in from Viewport Corners */}
            <div className="assemble-quadrants-container" key={`quadrants-${assemblyKey}`}>
              {/* 1. TOP-LEFT QUADRANT (NW) */}
              <motion.div
                className="assemble-quadrant assemble-quadrant-tl"
                initial={{
                  x: "-38vw",
                  y: "-34vh",
                  rotate: -12,
                  scale: 0.8,
                  opacity: 0,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  rotate: 0,
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  duration: 1.35,
                  delay: 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="assemble-quadrant-crop">
                  <img
                    src={currentLook.image}
                    alt=""
                    className="assemble-img-slice assemble-img-slice-tl"
                    draggable={false}
                  />
                  <div className="assemble-quadrant-overlay" />
                  <span className="assemble-corner-tag assemble-tag-tl">NW // 01</span>
                </div>
              </motion.div>

              {/* 2. TOP-RIGHT QUADRANT (NE) */}
              <motion.div
                className="assemble-quadrant assemble-quadrant-tr"
                initial={{
                  x: "38vw",
                  y: "-34vh",
                  rotate: 12,
                  scale: 0.8,
                  opacity: 0,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  rotate: 0,
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  duration: 1.35,
                  delay: 0.18,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="assemble-quadrant-crop">
                  <img
                    src={currentLook.image}
                    alt=""
                    className="assemble-img-slice assemble-img-slice-tr"
                    draggable={false}
                  />
                  <div className="assemble-quadrant-overlay" />
                  <span className="assemble-corner-tag assemble-tag-tr">NE // 02</span>
                </div>
              </motion.div>

              {/* 3. BOTTOM-LEFT QUADRANT (SW) */}
              <motion.div
                className="assemble-quadrant assemble-quadrant-bl"
                initial={{
                  x: "-38vw",
                  y: "34vh",
                  rotate: 10,
                  scale: 0.8,
                  opacity: 0,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  rotate: 0,
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  duration: 1.35,
                  delay: 0.14,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="assemble-quadrant-crop">
                  <img
                    src={currentLook.image}
                    alt=""
                    className="assemble-img-slice assemble-img-slice-bl"
                    draggable={false}
                  />
                  <div className="assemble-quadrant-overlay" />
                  <span className="assemble-corner-tag assemble-tag-bl">SW // 03</span>
                </div>
              </motion.div>

              {/* 4. BOTTOM-RIGHT QUADRANT (SE) */}
              <motion.div
                className="assemble-quadrant assemble-quadrant-br"
                initial={{
                  x: "38vw",
                  y: "34vh",
                  rotate: -10,
                  scale: 0.8,
                  opacity: 0,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  rotate: 0,
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  duration: 1.35,
                  delay: 0.22,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="assemble-quadrant-crop">
                  <img
                    src={currentLook.image}
                    alt=""
                    className="assemble-img-slice assemble-img-slice-br"
                    draggable={false}
                  />
                  <div className="assemble-quadrant-overlay" />
                  <span className="assemble-corner-tag assemble-tag-br">SE // 04</span>
                </div>
              </motion.div>
            </div>

            {/* UNIFIED SINGLE MASTER PHOTO OVERLAY (Locks in seamlessly when corners converge) */}
            <motion.div
              className="assemble-master-unified-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: isAssembled ? 1 : 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <img
                src={currentLook.image}
                alt={currentLook.name}
                className="assemble-master-img"
                draggable={false}
              />
              <div className="assemble-master-overlay" />

              {/* Seamless Unification Glow Line Animation */}
              <div className={`assemble-seam-flash ${isAssembled ? "pulse" : ""}`} />

              {/* Floating Center Badge */}
              <Link href={currentLook.link} className="assemble-view-pill">
                <span>VIEW PIECE</span>
                <ArrowUpRight size={13} strokeWidth={2.2} />
              </Link>
            </motion.div>

            {/* Minimal Editorial Corner Crop Marks on the Outer Frame */}
            <div className="assemble-frame-crosshairs">
              <span className="crosshair-tl">+</span>
              <span className="crosshair-tr">+</span>
              <span className="crosshair-bl">+</span>
              <span className="crosshair-br">+</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="assemble-bottom-bar">
        {/* Replay Assembly Button */}
        <button
          type="button"
          onClick={handleReplay}
          className="assemble-replay-btn"
          title="Replay corner assembly animation"
        >
          <RotateCcw size={13} strokeWidth={2} />
          <span>REPLAY ASSEMBLY</span>
        </button>

        {/* Technical Coordinates Footnote */}
        <div className="assemble-bottom-footnote">
          <span>GREENO // ARCHITECTURAL CONVERGENCE</span>
          <span className="assemble-footnote-sep">•</span>
          <span>4-QUADRANT EDITORIAL MATRIX</span>
        </div>

        {/* Scroll prompt down to Runway Hero */}
        <a
          href="#runway-hero"
          onClick={scrollToRunway}
          className="assemble-scroll-btn"
          aria-label="Scroll down to runway showcase"
        >
          <span>RUNWAY SHOWCASE</span>
          <ArrowDown size={13} strokeWidth={2} />
        </a>
      </div>
    </section>
  );
}
