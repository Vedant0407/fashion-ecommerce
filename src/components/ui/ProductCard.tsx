"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Product } from "@/lib/catalog";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

export default function ProductCard({
  product,
  source = "products",
}: {
  product: Product;
  source?: string;
}) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart, openCart } = useCart();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);

  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image || "/black-tee.jfif"];

  const currentImage = images[photoIndex] || images[0] || "/black-tee.jfif";
  const inWishlist = isInWishlist(product.id);

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: currentImage,
        size: "M",
        color: product.color || "BLACK",
      },
      1
    );
    setIsAdded(true);
    openCart();
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <div className="product-card">
      {/* Red Save Badge */}
      <span className="product-save-badge">SAVE 14%</span>

      {/* Wishlist Button */}
      <button
        type="button"
        className="product-wishlist-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist({
            id: product.id,
            name: product.name,
            price: product.price,
            image: currentImage,
            category: product.category_name,
          });
        }}
        aria-label="Save to wishlist"
        title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        <svg
          viewBox="0 0 24 24"
          fill={inWishlist ? "#000000" : "none"}
          stroke="#000000"
          strokeWidth="1.6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      </button>

      {/* Image with hover arrows */}
      <div className="product-image-container">
        <Link
          href={`/products/${product.id}?from=${source}`}
          className="product-image-link"
        >
          <img
            src={currentImage}
            alt={product.name}
            className="product-card-img"
          />
        </Link>

        {images.length > 1 && (
          <>
            <button
              type="button"
              className="product-card-arrow product-card-arrow-left"
              onClick={handlePrevPhoto}
              aria-label="Previous photo"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="product-card-arrow product-card-arrow-right"
              onClick={handleNextPhoto}
              aria-label="Next photo"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Product Info */}
      <Link
        href={`/products/${product.id}?from=${source}`}
        className="product-info-link"
      >
        <div className="product-info">
          <p className="product-name">{product.name}</p>
          <span className="product-price">
            ₹{Number(product.price).toLocaleString("en-IN")}
          </span>
        </div>
      </Link>

      {/* Full width ADD TO CART Button */}
      <button
        type="button"
        className={`product-add-to-cart-btn ${isAdded ? "added" : ""}`}
        onClick={handleAddToCart}
      >
        {isAdded ? (
          <>
            <Check size={14} /> ADDED TO CART
          </>
        ) : (
          "ADD TO CART"
        )}
      </button>
    </div>
  );
}
