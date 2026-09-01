"use client";
import TypewriterText from "@/components/ui/TypewriterText";

import Link from "next/link";
import { motion } from "framer-motion";

const categories = [
  {
    name: "HOODIES",
    image: "/products/black-tee.jfif",
    link: "/shop?category=T-SHIRTS",
    size: "large",
  },
  {
    name: "CAPS",
    image: "/products/black-tee.jfif",
    link: "/shop?category=CAPS",
    size: "small",
  },
  {
    name: "BAGS",
    image: "/products/black-tee.jfif",
    link: "/shop?category=BAGS",
    size: "small",
  },
  {
    name: "PANTS",
    image: "/products/cargo-pants.jfif",
    link: "/shop?category=PANTS",
    size: "large",
  },
  {
    name: "T-SHIRTS",
    image: "/products/grey-hoodie.webp",
    link: "/shop?category=HOODIES",
    size: "large",
  },
  {
    name: "ACCESSORIES",
    image: "/products/black-tee.jfif",
    link: "/shop?category=ACCESSORIES",
    size: "small",
  },
];

export default function CategoryGallery() {
  return (
    <section className="category-section">

      <div className="category-heading">
  <h2>
    <TypewriterText text="EXPLORE" />
    <br />
    <TypewriterText text="CATEGORIES" />
  </h2>
</div>

      <div className="category-grid">

        {categories.map((category, index) => (
          <motion.div
            key={category.name}
            className={`category-card ${category.size}`}
            initial={{
              opacity: 0,
              y: 35,
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
              duration: 0.7,
              delay: index * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Link href={category.link}>

              <div className="category-image-wrapper">

                <motion.img
                  src={category.image}
                  alt={category.name}
                  whileHover={{
                    scale: 1.035,
                  }}
                  transition={{
                    duration: 0.8,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />

                <div className="category-overlay" />

                <div className="category-content">
                  <span>{category.name}</span>

                  <span className="category-arrow">
                    →
                  </span>
                </div>

              </div>

            </Link>
          </motion.div>
        ))}

      </div>
    </section>
  );
}