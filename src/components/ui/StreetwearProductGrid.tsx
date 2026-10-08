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
    name: "CHARCOAL OXFORD",
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

  const handleAddToCart = (e: React.MouseEvent, product: GridProduct) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        color: product.color || "Black",
        size: "M",
      },
      1
    );
    setAddedIds((prev) => new Set(prev).add(product.id));
    openCart();
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1800);
  };

  const handleWishlist = (e: React.MouseEvent, product: GridProduct) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  };

  return (
    <section className="streetwear-grid-section">
      <div className="streetwear-grid-container">
        {/* Category Heading Changed to SEE OUR PRODUCTS */}
        <div className="streetwear-grid-header">
          <h2 className="streetwear-grid-title">SEE OUR PRODUCTS</h2>
        </div>

        {/* Product Cards Grid: 3 columns on Desktop, 2 columns on Mobile */}
        <div className="streetwear-product-grid">
          {SHIRTS_PRODUCTS.map((product, idx) => {
            const isWishlisted = isInWishlist(product.id);
            const isAdded = addedIds.has(product.id);

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="streetwear-product-card"
              >
                {/* Image Box with Wishlist Button */}
                <div className="streetwear-product-img-box">
                  <Link href={product.link} className="streetwear-product-img-link">
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`streetwear-product-cutout ${
                        product.id === "minimalist-chalk-tee" ? "streetwear-product-cutout--chalk-tee" : ""
                      }`}
                      loading="lazy"
                    />
                  </Link>

                  {/* Wishlist Heart Button */}
                  <button
                    type="button"
                    className={`streetwear-product-heart-btn ${isWishlisted ? "active" : ""}`}
                    onClick={(e) => handleWishlist(e, product)}
                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart
                      size={18}
                      strokeWidth={2}
                      fill={isWishlisted ? "#e11d48" : "none"}
                      color={isWishlisted ? "#e11d48" : "#111111"}
                    />
                  </button>
                </div>

                {/* Product Name & Price Link */}
                <Link href={product.link} className="streetwear-product-caption-link">
                  <div className="streetwear-product-caption">
                    <h3 className="streetwear-product-name">{product.name}</h3>
                    <span className="streetwear-product-price">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                </Link>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  className={`streetwear-product-cart-btn ${isAdded ? "added" : ""}`}
                  onClick={(e) => handleAddToCart(e, product)}
                  aria-label={`Add ${product.name} to cart`}
                >
                  {isAdded ? (
                    <>
                      <Check size={15} strokeWidth={2.4} />
                      <span>ADDED TO CART</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={14} strokeWidth={2} />
                      <span>ADD TO CART</span>
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
