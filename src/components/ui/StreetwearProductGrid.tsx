"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export interface GridProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  link: string;
  color?: string;
}

export const SHIRTS_PRODUCTS: GridProduct[] = [
  {
    id: "washed-tee-green",
    name: "WASHED TEE GREEN",
    price: 2499,
    image: "/train-olive-tee-cutout.png",
    link: "/products/minimalist-chalk-tee",
    color: "Olive",
  },
  {
    id: "washed-tee-gray-blue",
    name: "WASHED TEE GRAY BLUE",
    price: 2699,
    image: "/train-blue-tee-cutout.png",
    link: "/products/oversized-black-tee",
    color: "Gray Blue",
  },
  {
    id: "oversized-tee-black",
    name: "OVERSIZED TEE BLACK",
    price: 2499,
    image: "/train-black-tee-cutout.png",
    link: "/products/oversized-black-tee",
    color: "Black",
  },
  {
    id: "tailored-poplin-shirt",
    name: "TAILORED POPLIN SHIRT",
    price: 3499,
    image: "/train-poplin-shirt-cutout.png",
    link: "/products/tailored-poplin-shirt",
    color: "White",
  },
  {
    id: "charcoal-oxford-overshirt",
    name: "CHARCOAL OXFORD OVERSHIRT",
    price: 3899,
    image: "/train-oxford-shirt-cutout.png",
    link: "/products/charcoal-oxford-overshirt",
    color: "Charcoal",
  },
  {
    id: "minimalist-chalk-tee",
    name: "MINIMALIST CHALK TEE",
    price: 2499,
    image: "/train-white-tee-cutout.png",
    link: "/products/minimalist-chalk-tee",
    color: "Chalk",
  },
];

export default function StreetwearProductGrid() {
  const { addToCart, openCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  function handleAddToCart(e: React.MouseEvent, product: GridProduct) {
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
    setAddedIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1800);
    openCart();
  }

  function handleWishlist(e: React.MouseEvent, product: GridProduct) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  }

  return (
    <section className="streetwear-grid-section">
      <div className="streetwear-grid-container">
        {/* Section Heading */}
        <div className="streetwear-grid-header">
          <h2 className="streetwear-grid-title">SEE OUR PRODUCTS</h2>
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
                  {/* Wishlist Heart — top-right overlay */}
                  <button
                    className={`streetwear-product-heart-btn${isInWishlist(product.id) ? " active" : ""}`}
                    onClick={(e) => handleWishlist(e, product)}
                    aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                    type="button"
                  >
                    <Heart
                      size={18}
                      strokeWidth={2}
                      fill={isInWishlist(product.id) ? "currentColor" : "none"}
                    />
                  </button>
                </div>

                <div className="streetwear-product-caption">
                  <h3 className="streetwear-product-name">{product.name}</h3>
                  <span className="streetwear-product-price">
                    ₹{product.price.toLocaleString("en-IN")}
                  </span>
                </div>
              </Link>

              {/* Add to Cart — below caption, outside the Link */}
              <button
                className={`streetwear-product-cart-btn${addedIds.has(product.id) ? " added" : ""}`}
                onClick={(e) => handleAddToCart(e, product)}
                type="button"
              >
                {addedIds.has(product.id) ? (
                  <>
                    <Check size={14} strokeWidth={2.5} />
                    ADDED
                  </>
                ) : (
                  <>
                    <ShoppingBag size={14} strokeWidth={2} />
                    ADD TO CART
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
