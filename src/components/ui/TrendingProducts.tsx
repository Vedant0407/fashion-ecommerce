"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const products = [
  {
    name: "OVERSIZED BLACK TEE",
    category: "SIGNATURE TEES",
    image: "/black-tee.jfif",
    link: "/products/oversized-black-tee",
  },
  {
    name: "URBAN GREY HOODIE",
    category: "HEAVY FLEECE",
    image: "/grey-hoodie.jfif",
    link: "/products/urban-grey-hoodie",
  },
  {
    name: "CARGO STREET PANTS",
    category: "UTILITY TAILORING",
    image: "/cargo-pants.jfif",
    link: "/products/cargo-street-pants",
  },
  {
    name: "CLASSIC WHITE TEE",
    category: "ESSENTIAL SERIES",
    image: "/white-tee.jfif",
    link: "/products/classic-white-tee",
  },
];

export default function TrendingProducts() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % products.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const previousSlide = () => {
    setCurrent((prev) =>
      prev === 0 ? products.length - 1 : prev - 1
    );
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % products.length);
  };

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
            transition={{ duration: 0.6 }}
          >
            <img
              src={products[current].image}
              alt={products[current].name}
            />

            <div className="trending-overlay">
              <span className="trending-kicker">{products[current].category}</span>
              <h2>{products[current].name}</h2>
              <span className="trending-cta">SHOP NOW &rarr;</span>
            </div>
          </motion.a>
        </AnimatePresence>

        {/* LEFT ARROW */}
        <button
          className="trending-arrow trending-arrow-left"
          onClick={previousSlide}
          aria-label="Previous product"
        >
          <ChevronLeft size={20} />
        </button>

        {/* RIGHT ARROW */}
        <button
          className="trending-arrow trending-arrow-right"
          onClick={nextSlide}
          aria-label="Next product"
        >
          <ChevronRight size={20} />
        </button>

        {/* DOTS */}
        <div className="trending-dots">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={current === index ? "active" : ""}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}