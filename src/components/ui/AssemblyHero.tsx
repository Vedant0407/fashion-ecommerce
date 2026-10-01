"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowDown, RotateCcw } from "lucide-react";

const HERO_IMAGE = "/atelier-hero.jpg";

interface PieceConfig {
  id: string;
  name: string;
  topPct: number;
  leftPct: number;
  widthPct: number;
  heightPct: number;
  fromX: string;
  fromY: string;
  delay: number;
}

// 5 exact divisions matching user's layout diagram:
// 1. Upper Part: spans left to upper-right (top: 0%, left: 0%, width: 60%, height: 32%)
// 2. Left Part: tall block on left (top: 32%, left: 0%, width: 35%, height: 68%)
// 3. Top-Right Part: tall block on right (top: 0%, left: 60%, width: 40%, height: 65%)
// 4. Center Part: nestled in the center (top: 32%, left: 35%, width: 25%, height: 33%)
// 5. Bottom-Right Part: wide block across bottom (top: 65%, left: 35%, width: 65%, height: 35%)
const PIECES: PieceConfig[] = [
  {
    id: "upper-part",
    name: "Upper Part",
    topPct: 0,
    leftPct: 0,
    widthPct: 60,
    heightPct: 32,
    fromX: "0vw",
    fromY: "-105vh", // Upper part comes from upper
    delay: 0.05,
  },
  {
    id: "left-part",
    name: "Left Part",
    topPct: 32,
    leftPct: 0,
    widthPct: 35,
    heightPct: 68,
    fromX: "-105vw", // Left part comes from left
    fromY: "0vh",
    delay: 0.08,
  },
  {
    id: "top-right-part",
    name: "Top Right Part",
    topPct: 0,
    leftPct: 60,
    widthPct: 40,
    heightPct: 65,
    fromX: "105vw", // Right part comes from right
    fromY: "-15vh",
    delay: 0.12,
  },
  {
    id: "center-part",
    name: "Center Part",
    topPct: 32,
    leftPct: 35,
    widthPct: 25,
    heightPct: 33,
    fromX: "0vw",
    fromY: "-65vh", // Center part drops from upper and locks into place
    delay: 0.22,
  },
  {
    id: "bottom-right-part",
    name: "Bottom Right Part",
    topPct: 65,
    leftPct: 35,
    widthPct: 65,
    heightPct: 35,
    fromX: "0vw",
    fromY: "105vh", // Bottom part comes from bottom
    delay: 0.16,
  },
];

export default function AssemblyHero() {
  const [assemblyKey, setAssemblyKey] = useState(0);
  const [isAssembled, setIsAssembled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsAssembled(false);
    // Locks seamlessly right as pieces converge
    const timer = setTimeout(() => {
      setIsAssembled(true);
    }, 1250);

    return () => clearTimeout(timer);
  }, [assemblyKey]);

  useEffect(() => {
    let wheelLocked = false;
    const handleWheel = (e: WheelEvent) => {
      if (wheelLocked) return;
      if (window.scrollY < 40 && e.deltaY > 25) {
        const runway = document.getElementById("runway-hero");
        if (runway) {
          wheelLocked = true;
          runway.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => {
            wheelLocked = false;
          }, 900);
        }
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  const handleReplay = () => {
    setIsAssembled(false);
    setAssemblyKey((prev) => prev + 1);
  };

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
      className="assemble-fullscreen-hero"
      aria-label="GreenO Fullscreen Hero"
    >
      {/* Background Ambience */}
      <div className="assemble-fullscreen-bg" />

      {/* Discreet Replay Button (Top Right) */}
      <button
        type="button"
        onClick={handleReplay}
        className="assemble-fullscreen-replay"
        title="Replay assembly animation"
        aria-label="Replay animation"
      >
        <RotateCcw size={14} strokeWidth={2} />
      </button>

      {/* Fullscreen Stage with 5 Divided Slices */}
      <div className="assemble-fullscreen-stage" key={`stage-${assemblyKey}`}>
        {PIECES.map((piece) => (
          <motion.div
            key={piece.id}
            className="assemble-fullscreen-piece"
            style={{
              top: `${piece.topPct}%`,
              left: `${piece.leftPct}%`,
              width: `${piece.widthPct}%`,
              height: `${piece.heightPct}%`,
            }}
            initial={{
              x: piece.fromX,
              y: piece.fromY,
              opacity: 0.35,
            }}
            animate={{
              x: 0,
              y: 0,
              opacity: 1,
            }}
            transition={{
              duration: 1.15,
              delay: piece.delay,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div
              className={`assemble-fullscreen-crop ${
                isAssembled ? "assembled" : ""
              }`}
            >
              {/* Fullscreen Image inversely offset so every piece matches up to 100vw x 100vh */}
              <img
                src={HERO_IMAGE}
                alt=""
                draggable={false}
                className="assemble-fullscreen-slice-img"
                style={{
                  top: `-${piece.topPct}vh`,
                  left: `-${piece.leftPct}vw`,
                }}
              />
              <div className="assemble-fullscreen-slice-overlay" />
            </div>
          </motion.div>
        ))}

        {/* Unified Single Master Photo Overlay (Fades in seamlessly when pieces converge) */}
        <motion.div
          className="assemble-fullscreen-master"
          initial={{ opacity: 0 }}
          animate={{ opacity: isAssembled ? 1 : 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <img
            src={HERO_IMAGE}
            alt="GreenO Atelier"
            className="assemble-fullscreen-master-img"
            draggable={false}
          />
          <div className="assemble-fullscreen-master-overlay" />

          {/* Unification Glint Sweep */}
          <div
            className={`assemble-fullscreen-glint ${
              isAssembled ? "pulse" : ""
            }`}
          />
        </motion.div>
      </div>

      {/* Discreet Minimal Scroll Indicator (Bottom Center) */}
      <a
        href="#runway-hero"
        onClick={scrollToRunway}
        className="assemble-fullscreen-scroll"
        aria-label="Scroll down to runway showcase"
        title="Scroll down"
      >
        <span className="assemble-fullscreen-scroll-text">SCROLL</span>
        <ArrowDown
          size={13}
          strokeWidth={2}
          className="assemble-fullscreen-scroll-arrow"
        />
      </a>
    </section>
  );
}
