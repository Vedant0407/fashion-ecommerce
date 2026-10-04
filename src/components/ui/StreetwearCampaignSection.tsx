"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export default function StreetwearCampaignSection() {
  return (
    <section className="streetwear-campaign-section">
      <div className="streetwear-campaign-grid">
        {/* Left Column (Desktop) / Primary Card (Mobile): Model in Blue Graphic Tee under Concrete Pavilion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="campaign-card campaign-card-primary"
        >
          <div className="campaign-image-wrap">
            <img
              src="/campaign-blue-tee.jpg"
              alt="Heavyweight Graphic Tees in Brutalist Pavilion"
              className="campaign-img"
              loading="lazy"
            />
            {/* Dark gradient overlay for text readability */}
            <div className="campaign-overlay-gradient" />
          </div>

          {/* Editorial Text Overlay (Matches Reference Mockup) */}
          <div className="campaign-content-overlay">
            <div className="campaign-tag-row">
              <span className="campaign-category-tag">SHIRTS / HOMBRE</span>
              <span className="campaign-edition-tag">ARCHIVE // 04</span>
            </div>

            <h3 className="campaign-headline">
              HEAVYWEIGHT OVERSIZED TEES
            </h3>

            <p className="campaign-description">
              Heavyweight oversized tees with washed finishes and bold architectural graphics.
            </p>

            <Link href="/shop" className="campaign-action-btn">
              <span>EXPLORE COLLECTION</span>
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </motion.div>

        {/* Right Column (Desktop Companion): Editorial Model against Brutalist Concrete Wall */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="campaign-card campaign-card-companion"
        >
          <div className="campaign-image-wrap">
            <img
              src="/campaign-companion.jpg"
              alt="Architectural Tailoring & Silhouettes"
              className="campaign-img"
              loading="lazy"
            />
            <div className="campaign-overlay-gradient" />
          </div>

          <div className="campaign-content-overlay">
            <div className="campaign-tag-row">
              <span className="campaign-category-tag">TAILORING / STRUCTURE</span>
              <span className="campaign-edition-tag">DROP // 2026</span>
            </div>

            <h3 className="campaign-headline">
              CONTEMPORARY PROPORTIONS
            </h3>

            <p className="campaign-description">
              Engineered drop collars and dense structured wool-blend overshirts cut with disciplined lines.
            </p>

            <Link href="/shop" className="campaign-action-btn">
              <span>VIEW TAILORING</span>
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
