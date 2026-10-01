"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function EditorialStorySection() {
  return (
    <section className="editorial-story-section">
      <div className="editorial-container">
        <div className="editorial-story-wrapper">
          {/* Left Column: Atmospheric Campaign Photography */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="editorial-story-media"
          >
            <div className="editorial-story-img-wrap">
              <img
                src="/editorial-forest-road.jpg"
                alt="GreenO Brand Atmosphere"
                className="editorial-story-img"
                loading="lazy"
              />
              <div className="editorial-story-img-badge">
                <span>VOL. 2026 // LOOKBOOK</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Editorial Manifesto & Craft Specifications */}
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.0, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="editorial-story-text-column"
          >
            <span className="editorial-section-num">03 / THE PHILOSOPHY</span>

            <h2 className="editorial-story-heading font-serif">
              CRAFTED FOR
              <br />
              THOSE WHO KNOW
            </h2>

            <p className="editorial-story-lead">
              GreenO exists at the intersection of architectural drape and heavyweight
              European craftsmanship. We reject disposable seasonal hype in pursuit of
              garments defined by tactile substance, restrained proportions, and enduring presence.
            </p>

            {/* Editorial Craft Specs */}
            <div className="editorial-story-specs">
              <div className="editorial-spec-item">
                <span className="editorial-spec-num">01</span>
                <div>
                  <h3 className="editorial-spec-title">HEAVYWEIGHT DRAPE</h3>
                  <p className="editorial-spec-desc">
                    300gsm dense combed cotton custom-knitted for an intentional boxy silhouette.
                  </p>
                </div>
              </div>

              <div className="editorial-spec-item">
                <span className="editorial-spec-num">02</span>
                <div>
                  <h3 className="editorial-spec-title">ARCHITECTURAL TAILORING</h3>
                  <p className="editorial-spec-desc">
                    Italian cotton poplins with reinforced drop collars and natural mother-of-pearl buttons.
                  </p>
                </div>
              </div>

              <div className="editorial-spec-item">
                <span className="editorial-spec-num">03</span>
                <div>
                  <h3 className="editorial-spec-title">LIMITED EDITION RELEASES</h3>
                  <p className="editorial-spec-desc">
                    Crafted in disciplined quantities to preserve artisanal integrity and zero waste.
                  </p>
                </div>
              </div>
            </div>

            <div className="editorial-story-action">
              <Link href="/shop" className="editorial-story-btn">
                <span>EXPLORE THE ARCHIVE</span>
                <span className="editorial-btn-arrow">→</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
