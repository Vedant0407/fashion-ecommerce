"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product, getAllProducts } from "@/lib/catalog";

const DEFAULT_FALLBACK_TRENDING: Partial<Product>[] = [
  {
    id: "oversized-black-tee",
    name: "OVERSIZED BLACK TEE",
    category_name: "SIGNATURE TEES",
    image: "/black-tee.jfif",
    price: 2499,
  },
  {
    id: "urban-grey-hoodie",
    name: "URBAN GREY HOODIE",
    category_name: "HEAVY FLEECE",
    image: "/grey-hoodie.jfif",
    price: 3999,
  },
  {
    id: "cargo-street-pants",
    name: "CARGO STREET PANTS",
    category_name: "UTILITY TAILORING",
    image: "/cargo-pants.jfif",
    price: 3499,
  },
  {
    id: "classic-white-tee",
    name: "CLASSIC WHITE TEE",
    category_name: "ESSENTIAL SERIES",
    image: "/white-tee.jfif",
    price: 1999,
  },
];

export default function TrendingProducts() {
  const [trendingList, setTrendingList] = useState<Partial<Product>[]>(DEFAULT_FALLBACK_TRENDING);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    async function loadTrending() {
      try {
        const all = await getAllProducts();
        const filtered = all.filter((p) => p.is_trending);
        if (filtered.length > 0) {
          setTrendingList(filtered);
        } else if (all.length > 0) {
          setTrendingList(all.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load trending products:", err);
      }
    }
    loadTrending();
  }, []);

  const total = trendingList.length;

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 4500);

    return () => clearInterval(timer);
  }, [total]);

  if (total === 0) return null;

  const activeIndex = current % total;
  const activeItem = trendingList[activeIndex];
  const itemLink = `/products/${activeItem.id}?from=trending`;

  const previousSlide = () => {
    setCurrent((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % total);
  };

  const goToSlide = (index: number) => {
    setCurrent(index);
  };

  return (
    <section className="trending-section">
      <div className="trending-container">
        <AnimatePresence mode="wait">
          <motion.a
            key={activeItem.id || activeIndex}
            href={itemLink}
            className="trending-slide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img
              src={activeItem.image || "/black-tee.jfif"}
              alt={activeItem.name || "Trending piece"}
            />

            <div className="trending-overlay">
              <span className="trending-kicker">
                {activeItem.category_name || "EXCLUSIVE DROP"}
              </span>
              <h2>{activeItem.name}</h2>
              <span className="trending-cta">SHOP NOW &rarr;</span>
            </div>
          </motion.a>
        </AnimatePresence>

        {/* LEFT ARROW */}
        {total > 1 && (
          <button
            className="trending-arrow trending-arrow-left"
            onClick={previousSlide}
            aria-label="Previous product"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* RIGHT ARROW */}
        {total > 1 && (
          <button
            className="trending-arrow trending-arrow-right"
            onClick={nextSlide}
            aria-label="Next product"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* DOTS */}
        {total > 1 && (
          <div className="trending-dots">
            {trendingList.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={activeIndex === index ? "active" : ""}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}