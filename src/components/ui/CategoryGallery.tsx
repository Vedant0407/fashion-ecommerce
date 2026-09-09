"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const categories = [
  {
    name: "HOODIES",
    sub: "HEAVYWEIGHT FLEECE",
    image: "/grey-hoodie.jfif",
    link: "/category/hoodies",
    size: "large",
  },
  {
    name: "CAPS & HEADWEAR",
    sub: "SIGNATURE 6-PANEL",
    image: "/hero.jfif",
    link: "/category/caps",
    size: "small",
  },
  {
    name: "UTILITY BAGS",
    sub: "CORDURA CARRIERS",
    image: "/cargo-pants.jfif",
    link: "/category/bags",
    size: "small",
  },
  {
    name: "CARGOS & PANTS",
    sub: "TACTICAL TAILORING",
    image: "/cargo-pants.jfif",
    link: "/category/pants",
    size: "large",
  },
  {
    name: "OVERSIZED TEES",
    sub: "COMBED LUXURY COTTON",
    image: "/black-tee.jfif",
    link: "/category/t-shirts",
    size: "large",
  },
  {
    name: "ACCESSORIES",
    sub: "STEEL & CHAINS",
    image: "/white-tee.jfif",
    link: "/category/accessories",
    size: "small",
  },
];

export default function CategoryGallery() {
  return (
    <section className="category-section" id="categories">
      <div className="category-wrapper">
        <div className="category-heading">
          <p className="category-kicker">CURATED DROPS</p>
          <h2>SHOP BY COLLECTION</h2>
        </div>

        <div className="category-grid">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              className={`category-card ${category.size}`}
              initial={{
                opacity: 0,
                y: 20,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                amount: 0.2,
              }}
              transition={{
                duration: 0.5,
                delay: index * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Link href={category.link} className="category-link">
                <div className="category-image-wrapper">
                  <img
                    src={category.image}
                    alt={category.name}
                  />

                  {/* Dark editorial contrast overlay */}
                  <div className="category-overlay" />

                  <div className="category-content">
                    <div>
                      <span className="category-sub">{category.sub}</span>
                      <h3 className="category-title">{category.name}</h3>
                    </div>
                    <span className="category-arrow">
                      VIEW →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}