"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Volume2, VolumeX, ArrowDown } from "lucide-react";

export default function EditorialHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const toggleSound = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const scrollToNewIn = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("new-in");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section ref={containerRef} className="editorial-hero">
      {/* Background Media with Parallax */}
      <motion.div
        className="editorial-hero-media-wrap"
        style={{ y: backgroundY }}
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <video
          ref={videoRef}
          src="/hero.mp4"
          poster="/atelier-hero.jpg"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className="editorial-hero-video"
        />

        {/* Fallback image layer for instant paint before video decodes */}
        {!videoLoaded && (
          <img
            src="/atelier-hero.jpg"
            alt="GreenO Atelier Campaign"
            className="editorial-hero-fallback-img"
          />
        )}

        {/* Luxury Vignette & Grain Overlay */}
        <div className="editorial-hero-overlay" />
      </motion.div>

      {/* Hero Foreground Content */}
      <motion.div
        className="editorial-hero-content"
        style={{ y: textY, opacity: textOpacity }}
      >
        <div className="editorial-hero-container">
          {/* Eyebrow Label */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="editorial-hero-eyebrow"
          >
            <span className="editorial-hero-dot" />
            <span>AUTUMN / WINTER 2026 • DROP 03</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="editorial-hero-title font-serif"
          >
            THE NEW
            <br />
            COLLECTION
          </motion.h1>

          {/* Minimal Elegant CTA */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="editorial-hero-cta-wrap"
          >
            <a
              href="#new-in"
              onClick={scrollToNewIn}
              className="editorial-hero-cta"
            >
              <span className="editorial-hero-cta-text">EXPLORE COLLECTION</span>
              <span className="editorial-hero-cta-arrow">→</span>
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom Controls: Sound Toggle + Scroll Indicator */}
      <div className="editorial-hero-bottom-bar">
        <button
          type="button"
          onClick={toggleSound}
          className="editorial-hero-sound-btn"
          aria-label={isMuted ? "Unmute campaign video" : "Mute campaign video"}
          title={isMuted ? "Sound on" : "Sound off"}
        >
          {isMuted ? (
            <>
              <VolumeX size={14} strokeWidth={1.8} />
              <span>SOUND OFF</span>
            </>
          ) : (
            <>
              <Volume2 size={14} strokeWidth={1.8} />
              <span>SOUND ON</span>
            </>
          )}
        </button>

        <a
          href="#new-in"
          onClick={scrollToNewIn}
          className="editorial-hero-scroll-indicator"
          aria-label="Scroll to new collection"
        >
          <span>SCROLL</span>
          <div className="editorial-hero-scroll-line" />
        </a>
      </div>
    </section>
  );
}
