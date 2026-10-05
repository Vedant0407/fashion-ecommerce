"use client";

import { motion } from "framer-motion";

interface StreetwearQuoteSectionProps {
  quote?: string;
  author?: string;
  tag?: string;
  image?: string;
}

export default function StreetwearQuoteSection({
  quote = "“WE DO NOT FOLLOW SEASONS. WE BUILD SILHOUETTES THAT OUTLAST THEM.”",
  author = "CRAFTED FOR THOSE WHO KNOW",
  tag = "THE PHILOSOPHY // 04",
  image = "/editorial-quote-banner.jpg",
}: StreetwearQuoteSectionProps) {
  return (
    <section className="streetwear-quote-section">
      <div className="streetwear-quote-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="streetwear-quote-frame"
        >
          {/* Background Photograph */}
          <div className="streetwear-quote-image-box">
            <img
              src={image}
              alt="Editorial Brand Atmosphere"
              className="streetwear-quote-img"
              loading="lazy"
            />
            <div className="streetwear-quote-scrim" />
          </div>

          {/* Quote & Typography Overlay */}
          <div className="streetwear-quote-overlay-content">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="streetwear-quote-tag"
            >
              {tag}
            </motion.span>

            <motion.blockquote
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="streetwear-quote-text"
            >
              {quote}
            </motion.blockquote>

            <motion.cite
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="streetwear-quote-author"
            >
              — {author}
            </motion.cite>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
