"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const products = [
  {
    name: "BLUORNG BASICS",
    image: "/products/blue-tee.webp",
  },
  {
    name: "BLUORNG STREET",
    image: "/products/black-tee.jfif",
  },
  {
    name: "BLUORNG ESSENTIALS",
    image: "/products/grey-hoodie.webp",
  },
  {
    name: "BLUORNG CARGO",
    image: "/products/cargo-pants.jfif",
  },
];

export default function TrendingProducts() {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % products.length);
  };

  const previousSlide = () => {
    setCurrent(
      (prev) => (prev - 1 + products.length) % products.length
    );
  };

  return (
    <section className="trending-section">

      <div className="trending-swiper">

        <AnimatePresence mode="wait">

          <motion.div
            key={current}
            className="trending-slide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >

            <img
              src={products[current].image}
              alt={products[current].name}
              className="trending-slide-image"
            />

            <div className="trending-overlay" />

            <div className="trending-content">

              <h2>
                {products[current].name}
              </h2>

              <button>
                SHOP NOW
              </button>

            </div>

            <button
              className="trending-arrow trending-arrow-left"
              onClick={previousSlide}
              aria-label="Previous product"
            >
              ←
            </button>

            <button
              className="trending-arrow trending-arrow-right"
              onClick={nextSlide}
              aria-label="Next product"
            >
              →
            </button>


            <div className="trending-dots">

              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={
                    index === current
                      ? "trending-dot active"
                      : "trending-dot"
                  }
                  aria-label={`Go to product ${index + 1}`}
                />
              ))}

            </div>

          </motion.div>

        </AnimatePresence>

      </div>

    </section>
  );
}