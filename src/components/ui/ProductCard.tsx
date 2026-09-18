"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Check, Plus, ShoppingBag } from "lucide-react";
import { Product } from "@/lib/catalog";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

function getProductImages(product: Product): string[] {
  if (Array.isArray(product.images) && product.images.length > 1) {
    return product.images;
  }
  const baseImg = product.image || "/black-tee.jfif";
  const cat = (
    product.category_name ||
    product.category_slug ||
    product.name ||
    ""
  ).toLowerCase();

  let pool: string[];
  if (cat.includes("tee") || cat.includes("t-shirt") || cat.includes("shirt")) {
    pool = [baseImg, "/white-tee.jfif", "/grey-hoodie.jfif", "/hero.jfif"];
  } else if (cat.includes("hoodie") || cat.includes("sweat")) {
    pool = [baseImg, "/black-tee.jfif", "/hero.jfif", "/white-tee.jfif"];
  } else if (cat.includes("pant") || cat.includes("cargo") || cat.includes("trouser")) {
    pool = [baseImg, "/grey-hoodie.jfif", "/black-tee.jfif"];
  } else if (cat.includes("cap") || cat.includes("hat")) {
    pool = [baseImg, "/black-tee.jfif", "/white-tee.jfif"];
  } else if (cat.includes("bag") || cat.includes("crossbody")) {
    pool = [baseImg, "/cargo-pants.jfif", "/black-tee.jfif"];
  } else {
    pool = [baseImg, "/white-tee.jfif", "/black-tee.jfif", "/grey-hoodie.jfif"];
  }

  const unique = pool.filter((img, idx, arr) => arr.indexOf(img) === idx);
  return unique.length > 1 ? unique : [baseImg, "/black-tee.jfif", "/white-tee.jfif"];
}

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

  const images = getProductImages(product);

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
          <div
            className="product-image-track"
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              transform: `translateX(-${photoIndex * 100}%)`,
              transition: "transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${product.name} - Angle ${idx + 1}`}
                className="product-card-img"
                style={{
                  flex: "0 0 100%",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ))}
          </div>
        </Link>

        {/* Photo count indicator on hover */}
        {images.length > 1 && (
          <span className="product-photo-indicator">
            {photoIndex + 1} / {images.length}
          </span>
        )}

        {/* Dots indicator on hover */}
        {images.length > 1 && (
          <div className="product-photo-dots">
            {images.map((_, dotIdx) => (
              <span
                key={dotIdx}
                className={`product-photo-dot ${dotIdx === photoIndex ? "active" : ""}`}
              />
            ))}
          </div>
        )}

        {/* Left Arrow Button */}
        <button
          type="button"
          className="product-card-arrow product-card-arrow-left"
          onClick={handlePrevPhoto}
          aria-label="Previous photo"
          title="Previous photo"
        >
          <ChevronLeft size={20} strokeWidth={2.2} />
        </button>

        {/* Right Arrow Button */}
        <button
          type="button"
          className="product-card-arrow product-card-arrow-right"
          onClick={handleNextPhoto}
          aria-label="Next photo"
          title="Next photo"
        >
          <ChevronRight size={20} strokeWidth={2.2} />
        </button>

        {/* Permanent Desktop Bar / Mobile Squircle ADD TO CART Button on Photo */}
        <button
          type="button"
          className={`product-add-to-cart-btn ${isAdded ? "added" : ""}`}
          onClick={handleAddToCart}
          aria-label={isAdded ? "Added to cart" : `Add ${product.name} to cart`}
          title="Add to cart"
        >
          {isAdded ? (
            <>
              <Check size={16} strokeWidth={2.6} className="product-cart-btn-icon check-icon" />
              <span className="product-cart-btn-text">ADDED TO CART</span>
            </>
          ) : (
            <>
              <ShoppingBag size={15} strokeWidth={2} className="product-cart-btn-icon desktop-icon" />
              <Plus size={18} strokeWidth={2.4} className="product-cart-btn-icon mobile-icon" />
              <span className="product-cart-btn-text">ADD TO CART</span>
            </>
          )}
        </button>
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
    </div>
  );
}
