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
    images: ["/black-tee.jfif", "/white-tee.jfif", "/grey-hoodie.jfif"],
    price: 2499,
  },
  {
    id: "urban-grey-hoodie",
    name: "URBAN GREY HOODIE",
    category_name: "HEAVY FLEECE",
    image: "/grey-hoodie.jfif",
    images: ["/grey-hoodie.jfif", "/black-tee.jfif", "/hero.jfif"],
    price: 3999,
  },
  {
    id: "cargo-street-pants",
    name: "CARGO STREET PANTS",
    category_name: "UTILITY TAILORING",
    image: "/cargo-pants.jfif",
    images: ["/cargo-pants.jfif", "/grey-hoodie.jfif", "/black-tee.jfif"],
    price: 3499,
  },
  {
    id: "classic-white-tee",
    name: "CLASSIC WHITE TEE",
    category_name: "ESSENTIAL SERIES",
    image: "/white-tee.jfif",
    images: ["/white-tee.jfif", "/black-tee.jfif", "/hero.jfif"],
    price: 1999,
  },
];

export default function TrendingProducts() {
  const [trendingList, setTrendingList] = useState<Partial<Product>[]>(DEFAULT_FALLBACK_TRENDING);
  const [current, setCurrent] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);

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

    const handleUpdate = () => {
      loadTrending();
    };

    window.addEventListener("greeno_products_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("greeno_products_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const total = trendingList.length;

  useEffect(() => {
    if (total <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
      setPhotoIndex(0);
    }, 8000);
    return () => clearInterval(interval);
  }, [total]);

  if (total === 0) return null;

  const activeIndex = current % total;
  const activeItem = trendingList[activeIndex];
  const itemLink = `/products/${activeItem.id}?from=trending`;

  const photos =
    Array.isArray(activeItem.images) && activeItem.images.length > 0
      ? activeItem.images
      : [activeItem.image || "/black-tee.jfif"];

  const currentPhoto = photos[photoIndex] || photos[0] || "/black-tee.jfif";

  const previousSlide = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (photos.length > 1 && photoIndex > 0) {
      setPhotoIndex((prev) => prev - 1);
    } else {
      setCurrent((prev) => (prev === 0 ? total - 1 : prev - 1));
      setPhotoIndex(0);
    }
  };

  const nextSlide = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (photos.length > 1 && photoIndex < photos.length - 1) {
      setPhotoIndex((prev) => prev + 1);
    } else {
      setCurrent((prev) => (prev + 1) % total);
      setPhotoIndex(0);
    }
  };

  return (
    <section className="trending-section" id="trending">
      <div className="trending-container">
        <AnimatePresence mode="wait">
          <motion.a
            key={`${activeItem.id || activeIndex}-${photoIndex}`}
            href={itemLink}
            className="trending-slide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={currentPhoto}
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

        {/* LEFT ARROW (Appears on hover) */}
        <button
          type="button"
          className="trending-arrow trending-arrow-left"
          onClick={previousSlide}
          aria-label="Previous photo or piece"
        >
          <ChevronLeft size={22} />
        </button>

        {/* RIGHT ARROW (Appears on hover) */}
        <button
          type="button"
          className="trending-arrow trending-arrow-right"
          onClick={nextSlide}
          aria-label="Next photo or piece"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </section>
  );
}