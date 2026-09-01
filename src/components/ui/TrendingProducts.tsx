"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const products = [
  {
    name: "BLUORNG BASICS",
    image: "/products/black-tee.jfif",
    link: "/products/oversized-black-tee",
  },
  {
    name: "URBAN GREY HOODIE",
    image: "/products/grey-hoodie.webp",
    link: "/products/urban-grey-hoodie",
  },
  {
    name: "CARGO STREET PANTS",
    image: "/products/cargo-pants.jfif",
    link: "/products/cargo-street-pants",
  },
  {
    name: "CLASSIC WHITE TEE",
    image: "/products/white-tee.webp",
    link: "/products/classic-white-tee",
  },
];

export default function TrendingProducts() {
  const [current, setCurrent] = useState(0);

  // AUTO CHANGE EVERY 4 SECONDS
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % products.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  // MANUAL PREVIOUS
  const previousSlide = () => {
    setCurrent((prev) =>
      prev === 0 ? products.length - 1 : prev - 1
    );
  };

  // MANUAL NEXT
  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % products.length);
  };

  // MANUAL DOT CLICK
  const goToSlide = (index: number) => {
    setCurrent(index);
  };

  return (
    <section className="trending-section">
      <div className="trending-container">

        <AnimatePresence mode="wait">
          <motion.a
            key={current}
            href={products[current].link}
            className="trending-slide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <img
              src={products[current].image}
              alt={products[current].name}
            />

            <div className="trending-overlay">
              <h2>{products[current].name}</h2>
              <span>SHOP NOW</span>
            </div>
          </motion.a>
        </AnimatePresence>

        {/* LEFT ARROW */}
        <button
          className="trending-arrow trending-arrow-left"
          onClick={previousSlide}
          aria-label="Previous product"
        >
          <ChevronLeft />
        </button>

        {/* RIGHT ARROW */}
        <button
          className="trending-arrow trending-arrow-right"
          onClick={nextSlide}
          aria-label="Next product"
        >
          <ChevronRight />
        </button>

        {/* DOTS */}
        <div className="trending-dots">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={current === index ? "active" : ""}
              aria-label={`Go to product ${index + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}