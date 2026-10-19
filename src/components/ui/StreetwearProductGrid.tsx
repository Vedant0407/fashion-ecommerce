"use client";

import { useEffect, useState } from "react";
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

export default function StreetwearProductGrid() {
  const { addToCart, openCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState<GridProduct[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/products", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load products");
        return response.json();
      })
      .then((data) => {
        const items: Array<{ id: string; name: string; price: number; image: string; color?: string | null }> =
          Array.isArray(data.products) ? data.products : [];
        setProducts(items.filter((item) => item?.id && item?.name && item?.image).map((item) => ({
          id: String(item.id),
          name: String(item.name),
          price: Number(item.price) || 0,
          image: String(item.image),
          link: `/products/${encodeURIComponent(String(item.id))}`,
          color: typeof item.color === "string" ? item.color : undefined,
        })));
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error("Unable to load storefront products.", error);
      });
    return () => controller.abort();
  }, []);

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

  if (products.length === 0) return null;

  return (
    <section className="streetwear-grid-section">
      <div className="streetwear-grid-container">
        {/* Category Heading Changed to SEE OUR PRODUCTS */}
        <div className="streetwear-grid-header">
          <h2 className="streetwear-grid-title">SEE OUR PRODUCTS</h2>
        </div>

        {/* Product Cards Grid: 3 columns on Desktop, 2 columns on Mobile */}
        <div className="streetwear-product-grid">
          {products.map((product, idx) => {
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
                      className="streetwear-product-cutout"
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
