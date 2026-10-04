"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";

export interface TrainProduct {
  id: string;
  name: string;
  color: string;
  price: number;
  originalPrice: number;
  tag: string;
  image: string;
  link: string;
}

export const TRAIN_PRODUCTS: TrainProduct[] = [
  {
    id: "oversized-black-tee",
    name: "Heavyweight Boxy Tee",
    color: "OBSIDIAN BLACK",
    price: 2499,
    originalPrice: 3199,
    tag: "300GSM JERSEY",
    image: "/train-black-tee.jpg",
    link: "/products/oversized-black-tee",
  },
  {
    id: "vintage-slate-tee",
    name: "Vintage Washed Tee",
    color: "SLATE BLUE",
    price: 2699,
    originalPrice: 3499,
    tag: "PIGMENT DYED",
    image: "/train-blue-tee.jpg",
    link: "/products/oversized-black-tee",
  },
  {
    id: "earthy-olive-tee",
    name: "Earthy Olive Boxy Tee",
    color: "MOSS OLIVE",
    price: 2499,
    originalPrice: 3199,
    tag: "HEAVYWEIGHT JERSEY",
    image: "/train-olive-tee.jpg",
    link: "/products/minimalist-chalk-tee",
  },
  {
    id: "tailored-poplin-shirt",
    name: "Tailored Poplin Shirt",
    color: "OPTIC CHALK",
    price: 3499,
    originalPrice: 4499,
    tag: "120s ITALIAN POPLIN",
    image: "/atelier-shirt.jpg",
    link: "/products/tailored-poplin-shirt",
  },
  {
    id: "charcoal-oxford-overshirt",
    name: "Charcoal Oxford Overshirt",
    color: "CHARCOAL",
    price: 3899,
    originalPrice: 4899,
    tag: "STRUCTURED WEAVE",
    image: "/atelier-oxford-shirt.jpg",
    link: "/products/charcoal-oxford-overshirt",
  },
  {
    id: "minimalist-chalk-tee",
    name: "Minimalist Chalk Tee",
    color: "OFF-WHITE",
    price: 2499,
    originalPrice: 3199,
    tag: "320GSM JERSEY",
    image: "/atelier-white-tee.jpg",
    link: "/products/minimalist-chalk-tee",
  },
];

export default function ProductTrainSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const { addToCart, openCart } = useCart();
  const [addedItem, setAddedItem] = useState<string | null>(null);

  // Triple items for seamless continuous looping train
  const items = [...TRAIN_PRODUCTS, ...TRAIN_PRODUCTS, ...TRAIN_PRODUCTS];

  // Manual scroll buttons
  const scrollByAmount = (offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Mouse Drag to Scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: TrainProduct) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        color: product.color,
        size: "M",
      },
      1
    );

    setAddedItem(product.id);
    openCart();
    setTimeout(() => setAddedItem(null), 2000);
  };

  return (
    <section id="product-train-section" className="product-train-section">
      <div className="product-train-header-row">
        {/* Header matching the reference: "See Our Products:" */}
        <div className="product-train-title-wrap">
          <h2 className="product-train-heading">See Our Products:</h2>
          <span className="product-train-subheading">
            Heavyweight architectural silhouettes • Designed in-house
          </span>
        </div>

        {/* Navigation arrows for manual train browsing */}
        <div className="product-train-nav-controls">
          <button
            type="button"
            className="train-nav-btn prev"
            onClick={() => scrollByAmount(-340)}
            aria-label="Previous products"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            className="train-nav-btn next"
            onClick={() => scrollByAmount(340)}
            aria-label="Next products"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* The Train Track: Continuous horizontal scrolling train */}
      <div
        className="product-train-viewport"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          handleMouseUpOrLeave();
        }}
      >
        <div
          ref={scrollContainerRef}
          className={`product-train-track ${isPaused ? "train-paused" : ""}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {items.map((prod, idx) => (
            <div
              key={`${prod.id}-${idx}`}
              className="product-train-card"
            >
              <Link href={prod.link} className="product-train-card-link">
                {/* Product Model Photo on White Background */}
                <div className="product-train-image-box">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="product-train-model-img"
                    loading="lazy"
                    draggable={false}
                  />

                  {/* Micro tag badge */}
                  <span className="product-train-tag">{prod.tag}</span>

                  {/* Quick Add Overlay on Hover */}
                  <div className="product-train-hover-actions">
                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, prod)}
                      className="product-train-quick-add"
                      title="Quick add to bag"
                    >
                      <ShoppingBag size={14} />
                      <span>{addedItem === prod.id ? "ADDED" : "ADD TO BAG"}</span>
                    </button>
                  </div>
                </div>

                {/* Minimalist Product Label */}
                <div className="product-train-info">
                  <div className="product-train-meta">
                    <h3 className="product-train-name">{prod.name}</h3>
                    <span className="product-train-color">{prod.color}</span>
                  </div>
                  <div className="product-train-pricing">
                    <span className="product-train-price">₹{prod.price.toLocaleString("en-IN")}</span>
                    {prod.originalPrice > prod.price && (
                      <span className="product-train-original-price">
                        ₹{prod.originalPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
