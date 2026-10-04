"use client";

import { motion } from "framer-motion";

export default function StreetwearHero() {
  return (
    <section className="streetwear-hero-section">
      {/* Background Media with Concrete Texture & Model in Oversized Hoodie */}
      <div className="streetwear-hero-bg-wrapper">
        <img
          src="/hero-streetwear-hoodie.jpg"
          alt="Streetwear Lookbook - Brutalist Architecture"
          className="streetwear-hero-image"
          loading="eager"
        />

        {/* Ambient Vignette & Smooth Bottom Gradient Fade into Pure White */}
        <div className="hero-top-vignette" />
        <div className="hero-bottom-fade-to-white" />
      </div>

      {/* Hero Foreground Content */}
      <div className="streetwear-hero-content">
        {/* Mobile Header Brand Display (Matching Dropstudios Reference) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="streetwear-hero-mobile-brand"
        >
          <span className="streetwear-brand-eyebrow">DROP // 04</span>
          <h1 className="streetwear-brand-title">GREENO</h1>
        </motion.div>
      </div>
    </section>
  );
}
