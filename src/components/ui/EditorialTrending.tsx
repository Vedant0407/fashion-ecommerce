"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Plus, Check } from "lucide-react";
import { Product } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

const TRENDING_PIECES: Product[] = [
  {
    id: "tailored-poplin-shirt",
    name: "Tailored Poplin Shirt",
    price: 3499,
    description: "Architectural oversized collared shirt in crisp off-white Italian cotton poplin.",
    category_slug: "shirts",
    category_name: "SHIRTING",
    image: "/atelier-shirt.jpg",
    images: ["/atelier-shirt.jpg", "/atelier-shirt-detail.jpg"],
    color: "Off-White",
  },
  {
    id: "charcoal-oxford-overshirt",
    name: "Charcoal Oxford Overshirt",
    price: 3899,
    description: "Minimalist relaxed collared overshirt crafted from heavyweight Italian structured cotton.",
    category_slug: "shirts",
    category_name: "OVERSHIRTS",
    image: "/atelier-oxford-shirt.jpg",
    images: ["/atelier-oxford-shirt.jpg", "/atelier-oxford-detail.jpg"],
    color: "Charcoal",
  },
  {
    id: "oversized-black-tee",
    name: "Heavyweight Boxy Tee",
    price: 2499,
    description: "Architectural drop-shoulder t-shirt cut from 300gsm dense combed cotton jersey.",
    category_slug: "t-shirts",
    category_name: "JERSEY",
    image: "/atelier-tshirt.jpg",
    images: ["/atelier-tshirt.jpg", "/atelier-tshirt-detail.jpg"],
    color: "Noir",
  },
];

export default function EditorialTrending() {
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addToCart, openCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: "M",
      color: product.color || "Noir",
    });

    setAddedId(product.id);
    openCart();
    setTimeout(() => setAddedId(null), 1800);
  };

  const handleWishlistToggle = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category_name || product.category_slug || "Trending",
    });
  };

  return (
    <section className="editorial-trending-section">
      <div className="editorial-container">
        {/* Section Header */}
        <div className="editorial-section-header">
          <div className="editorial-header-left">
            <span className="editorial-section-num">03 / MOST COVETED</span>
            <h2 className="editorial-section-heading font-serif">TRENDING PIECES</h2>
          </div>

          <div className="editorial-header-right">
            <Link href="/shop" className="editorial-view-all-link">
              <span>VIEW FULL CATALOGUE</span>
              <span className="editorial-link-arrow">→</span>
            </Link>
          </div>
        </div>

        {/* Stacked / Curated 3-Column Editorial Layout */}
        <div className="editorial-trending-grid">
          {TRENDING_PIECES.map((piece, index) => (
            <motion.div
              key={piece.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="editorial-trending-card"
            >
              <Link href={`/products/${piece.id}`} className="editorial-trending-link">
                <div className="editorial-trending-visual">
                  <img
                    src={piece.image}
                    alt={piece.name}
                    className="editorial-trending-primary"
                    loading="lazy"
                  />
                  {piece.images && piece.images[1] && (
                    <img
                      src={piece.images[1]}
                      alt={`${piece.name} detail view`}
                      className="editorial-trending-secondary"
                      loading="lazy"
                    />
                  )}

                  {/* Wishlist Button */}
                  <button
                    type="button"
                    onClick={(e) => handleWishlistToggle(e, piece)}
                    className={`editorial-card-wishlist ${
                      isInWishlist(piece.id) ? "active" : ""
                    }`}
                    aria-label="Add to wishlist"
                  >
                    <Heart
                      size={15}
                      strokeWidth={1.8}
                      fill={isInWishlist(piece.id) ? "currentColor" : "none"}
                    />
                  </button>

                  {/* Quick Add Pill */}
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, piece)}
                    className="editorial-card-quick-add"
                    aria-label="Quick add to bag"
                  >
                    {addedId === piece.id ? (
                      <>
                        <Check size={13} strokeWidth={2.5} />
                        <span>ADDED</span>
                      </>
                    ) : (
                      <>
                        <Plus size={13} strokeWidth={2.2} />
                        <span>ADD TO BAG</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="editorial-trending-meta">
                  <div className="editorial-meta-info">
                    <span className="editorial-meta-category">
                      {piece.category_name || "ATELIER"}
                    </span>
                    <h3 className="editorial-meta-title">{piece.name}</h3>
                  </div>
                  <span className="editorial-meta-price">
                    ₹{piece.price.toLocaleString("en-IN")}
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
