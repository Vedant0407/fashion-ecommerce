"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export interface GridProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  link: string;
}

export const SHIRTS_PRODUCTS: GridProduct[] = [
  {
    id: "washed-tee-green",
    name: "WASHED TEE GREEN",
    price: 2499,
    image: "/train-olive-tee-cutout.png",
    link: "/products/minimalist-chalk-tee",
  },
  {
    id: "washed-tee-gray-blue",
    name: "WASHED TEE GRAY BLUE",
    price: 2699,
    image: "/train-blue-tee-cutout.png",
    link: "/products/oversized-black-tee",
  },
  {
    id: "oversized-tee-black",
    name: "OVERSIZED TEE BLACK",
    price: 2499,
    image: "/train-black-tee-cutout.png",
    link: "/products/oversized-black-tee",
  },
  {
    id: "tailored-poplin-shirt",
    name: "TAILORED POPLIN SHIRT",
    price: 3499,
    image: "/train-poplin-shirt-cutout.png",
    link: "/products/tailored-poplin-shirt",
  },
  {
    id: "charcoal-oxford-overshirt",
    name: "CHARCOAL OXFORD OVERSHIRT",
    price: 3899,
    image: "/train-oxford-shirt-cutout.png",
    link: "/products/charcoal-oxford-overshirt",
  },
  {
    id: "minimalist-chalk-tee",
    name: "MINIMALIST CHALK TEE",
    price: 2499,
    image: "/train-white-tee-cutout.png",
    link: "/products/minimalist-chalk-tee",
  },
];

export default function StreetwearProductGrid() {
  return (
    <section className="streetwear-grid-section">
      <div className="streetwear-grid-container">
        {/* Category Heading Matching Reference Mockup */}
        <div className="streetwear-grid-header">
          <h2 className="streetwear-grid-title">SHIRTS</h2>
        </div>

        {/* Product Cards Grid: 3 columns on Desktop, 2 columns on Mobile */}
        <div className="streetwear-product-grid">
          {SHIRTS_PRODUCTS.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="streetwear-product-card"
            >
              <Link href={product.link} className="streetwear-product-card-link">
                <div className="streetwear-product-img-box">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="streetwear-product-cutout"
                    loading="lazy"
                  />
                </div>

                <div className="streetwear-product-caption">
                  <h3 className="streetwear-product-name">{product.name}</h3>
                  <span className="streetwear-product-price">
                    ₹{product.price.toLocaleString("en-IN")}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
