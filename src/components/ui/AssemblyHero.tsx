"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowDown, RotateCcw } from "lucide-react";

const HERO_IMAGE = "/atelier-hero.jpg";
const GRID_COLS = 4;
const GRID_ROWS = 4;

interface TileConfig {
  id: number;
  row: number;
  col: number;
  initialX: string;
  initialY: string;
  initialRotate: number;
  initialScale: number;
  delay: number;
}

export default function AssemblyHero() {
  const [assemblyKey, setAssemblyKey] = useState(0);
  const [isAssembled, setIsAssembled] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute 16 deterministic corner trajectories for 4x4 grid
  const tiles: TileConfig[] = useMemo(() => {
    const list: TileConfig[] = [];
    let id = 0;

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const isTop = r < 2;
        const isLeft = c < 2;

        // Distance factor: 0 for inner tiles, 1 for outer perimeter tiles
        const distCornerX = isLeft ? 1 - c : c - 2;
        const distCornerY = isTop ? 1 - r : r - 2;

        const xDir = isLeft ? -1 : 1;
        const yDir = isTop ? -1 : 1;

        // Pieces fly in from their respective corner vectors
        const xOffset = xDir * (34 + distCornerX * 18 + (c % 2) * 5);
        const yOffset = yDir * (30 + distCornerY * 16 + (r % 2) * 5);

        // Rotation variation based on position
        const rot = xDir * yDir * (8 + distCornerX * 10 + distCornerY * 8);

        // Natural staggered cadence from outer corners inward
        const delay = 0.05 + (distCornerX + distCornerY) * 0.08 + ((r + c) % 3) * 0.04;

        list.push({
          id: id++,
          row: r,
          col: c,
          initialX: `${xOffset}vw`,
          initialY: `${yOffset}vh`,
          initialRotate: rot,
          initialScale: 0.72 + (1 - (distCornerX + distCornerY) * 0.15) * 0.2,
          delay,
        });
      }
    }
    return list;
  }, []);

  // Trigger assembly on mount or replay
  useEffect(() => {
    setIsAssembled(false);
    const timer = setTimeout(() => {
      setIsAssembled(true);
    }, 1450); // locks precisely when fragments converge

    return () => clearTimeout(timer);
  }, [assemblyKey]);

  // Replay handler
  const handleReplay = () => {
    setIsAssembled(false);
    setAssemblyKey((prev) => prev + 1);
  };

  // Subtle 3D mouse parallax once assembled
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isAssembled) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x: x * 10, y: y * -10 });
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
      className="assemble-hero-pure"
      aria-label="GreenO Hero"
    >
      {/* Subtle Atmospheric Backdrop */}
      <div className="assemble-pure-bg">
        <div className="assemble-pure-glow" />
        <div className="assemble-pure-grain" />
      </div>

      {/* Discreet Replay Button (Top Right) */}
      <button
        type="button"
        onClick={handleReplay}
        className="assemble-pure-replay"
        title="Replay assembly animation"
        aria-label="Replay animation"
      >
        <RotateCcw size={14} strokeWidth={2} />
      </button>

      {/* Main Assembly Stage (Pure Image Centered) */}
      <div className="assemble-pure-center">
        <motion.div
          className="assemble-pure-frame"
          animate={{
            rotateX: mouseOffset.y,
            rotateY: mouseOffset.x,
          }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          {/* 16 Mathematical Fragments Flying in from Viewport Corners */}
          <div className="assemble-pure-grid" key={`grid-${assemblyKey}`}>
            {tiles.map((tile) => {
              const tileWidthPct = 100 / GRID_COLS;
              const tileHeightPct = 100 / GRID_ROWS;
              const leftPct = tile.col * tileWidthPct;
              const topPct = tile.row * tileHeightPct;

              // Image inside must be scaled up to 400% (100 / 0.25) and shifted inversely
              const imgScalePct = GRID_COLS * 100;
              const imgShiftX = -(tile.col * 100);
              const imgShiftY = -(tile.row * 100);

              return (
                <motion.div
                  key={tile.id}
                  className="assemble-pure-tile"
                  style={{
                    top: `${topPct}%`,
                    left: `${leftPct}%`,
                    width: `${tileWidthPct}%`,
                    height: `${tileHeightPct}%`,
                  }}
                  initial={{
                    x: tile.initialX,
                    y: tile.initialY,
                    rotate: tile.initialRotate,
                    scale: tile.initialScale,
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
                    delay: tile.delay,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <div className="assemble-pure-tile-crop">
                    <img
                      src={HERO_IMAGE}
                      alt=""
                      draggable={false}
                      className="assemble-pure-tile-img"
                      style={{
                        width: `${imgScalePct}%`,
                        height: `${imgScalePct}%`,
                        top: `${imgShiftY}%`,
                        left: `${imgShiftX}%`,
                      }}
                    />
                    <div className="assemble-pure-tile-overlay" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* UNIFIED SINGLE MASTER PHOTO OVERLAY (Locks in seamlessly when corners converge) */}
          <motion.div
            className="assemble-pure-master"
            initial={{ opacity: 0 }}
            animate={{ opacity: isAssembled ? 1 : 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <img
              src={HERO_IMAGE}
              alt="GreenO Atelier"
              className="assemble-pure-master-img"
              draggable={false}
            />
            <div className="assemble-pure-master-overlay" />

            {/* Subtle Unification Seam Flash */}
            <div className={`assemble-pure-glint ${isAssembled ? "pulse" : ""}`} />
          </motion.div>
        </motion.div>
      </div>

      {/* Discreet Minimal Scroll Indicator (Bottom Center) */}
      <a
        href="#runway-hero"
        onClick={scrollToRunway}
        className="assemble-pure-scroll"
        aria-label="Scroll down to runway showcase"
        title="Scroll down"
      >
        <span className="assemble-pure-scroll-text">SCROLL</span>
        <ArrowDown size={13} strokeWidth={2} className="assemble-pure-scroll-arrow" />
      </a>
    </section>
  );
}
