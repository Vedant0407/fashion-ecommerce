"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

interface CategoryPill {
  id: string;
  name: string;
  count: string;
  slug: string;
  image: string;
  aspect: string;
}

const CATEGORIES: CategoryPill[] = [
  {
    id: "t-shirts",
    name: "T-SHIRTS",
    count: "12 SILHOUETTES",
    slug: "/category/t-shirts",
    image: "/atelier-tshirt.jpg",
    aspect: "organic-tall",
  },
  {
    id: "shirts",
    name: "TAILORED SHIRTS",
    count: "08 SILHOUETTES",
    slug: "/category/shirts",
    image: "/atelier-shirt.jpg",
    aspect: "organic-circle",
  },
  {
    id: "outerwear",
    name: "OUTERWEAR",
    count: "06 PIECES",
    slug: "/shop",
    image: "/atelier-coat.jpg",
    aspect: "organic-tall",
  },
  {
    id: "accessories",
    name: "ATELIER ACCESSORIES",
    count: "05 PIECES",
    slug: "/shop",
    image: "/atelier-bag.jpg",
    aspect: "organic-circle",
  },
];

export default function OrganicCategorySection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Subtle opposing floats for organic, fluid movement without jitter
  const floatUp = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const floatDown = useTransform(scrollYProgress, [0, 1], [-25, 25]);

  return (
    <section ref={containerRef} className="organic-categories-section">
      <div className="editorial-container">
        {/* Section Header */}
        <div className="editorial-section-header">
          <div className="editorial-header-left">
            <span className="editorial-section-num">02 / SILHOUETTES</span>
            <h2 className="editorial-section-heading font-serif">CURATED ARCHIVES</h2>
          </div>

          <div className="editorial-header-right">
            <p className="editorial-header-note">
              Precision tailored proportions cut from bespoke European textiles.
            </p>
          </div>
        </div>

        {/* Fluid Organic Visuals Grid */}
        <div className="organic-categories-grid">
          {CATEGORIES.map((cat, idx) => {
            const isOdd = idx % 2 === 1;
            const floatStyle = isOdd ? floatDown : floatUp;

            return (
              <motion.div
                key={cat.id}
                style={{ y: floatStyle }}
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.9, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className={`organic-category-card ${cat.aspect}`}
              >
                <Link href={cat.slug} className="organic-category-link">
                  <div className="organic-visual-wrapper">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="organic-category-img"
                      loading="lazy"
                    />
                    <div className="organic-category-overlay" />

                    {/* Content Center */}
                    <div className="organic-category-content">
                      <span className="organic-category-count">{cat.count}</span>
                      <h3 className="organic-category-title font-serif">{cat.name}</h3>
                      <span className="organic-category-action">
                        <span>EXPLORE SILHOUETTE</span>
                        <span className="organic-action-arrow">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
