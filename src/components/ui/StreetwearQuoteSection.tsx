"use client";

import { motion } from "framer-motion";

interface StreetwearQuoteSectionProps {
  quote?: string;
  author?: string;
  image?: string;
}

export default function StreetwearQuoteSection({
  quote = "“WE DO NOT FOLLOW SEASONS. WE BUILD SILHOUETTES THAT OUTLAST THEM.”",
  author = "CRAFTED FOR THOSE WHO KNOW",
  image = "/editorial-quote-banner.jpg",
}: StreetwearQuoteSectionProps) {
  return (
    <section className="streetwear-quote-section">
      {/* Full Screen Background Photograph (Edge-to-Edge 100vw / 100vh) */}
      <div className="streetwear-quote-image-box">
        <img
          src={image}
          alt="Editorial Brand Atmosphere"
          className="streetwear-quote-img"
          loading="lazy"
        />
        <div className="streetwear-quote-scrim" />
      </div>

      {/* Centered Overlay Quote */}
      <div className="streetwear-quote-overlay-content">
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="streetwear-quote-text"
        >
          {quote}
        </motion.blockquote>

        <motion.cite
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="streetwear-quote-author"
        >
          — {author}
        </motion.cite>
      </div>
    </section>
  );
}
