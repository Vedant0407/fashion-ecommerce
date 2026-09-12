"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

import { useWishlist, WishlistItem } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

function getWishlistImages(item: WishlistItem): string[] {
  const baseImg = item.image || "/black-tee.jfif";
  const cat = (item.category || item.name || "").toLowerCase();

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

function WishlistItemCard({
  item,
  onRemove,
}: {
  item: WishlistItem;
  onRemove: (id: string) => void;
}) {
  const { addToCart, openCart } = useCart();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);

  const images = getWishlistImages(item);
  const currentImage = images[photoIndex] || images[0] || item.image || "/black-tee.jfif";

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
        id: item.id,
        name: item.name,
        price: Number(item.price),
        image: currentImage,
        size: "M",
        color: "BLACK",
      },
      1
    );
    setIsAdded(true);
    openCart();
    setTimeout(() => {
      setIsAdded(false);
    }, 1800);
  };

  return (
    <article className="wishlist-card product-card">
      {/* Wishlist Remove Button */}
      <button
        type="button"
        className="product-wishlist-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(item.id);
        }}
        aria-label="Remove from wishlist"
        title="Remove from wishlist"
      >
        <svg
          viewBox="0 0 24 24"
          fill="#000000"
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

      {/* Image with Left/Right Photo Slide Animation */}
      <div className="product-image-container">
        <Link
          href={`/products/${item.id}?from=wishlist`}
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
                alt={`${item.name} - Angle ${idx + 1}`}
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

        {/* Photo dots indicator on hover */}
        {images.length > 1 && (
          <div className="product-photo-dots">
            {images.map((_, dotIdx) => (
              <span
                key={dotIdx}
                className={`product-photo-dot ${
                  dotIdx === photoIndex ? "active" : ""
                }`}
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

        {/* Hover Pop-Up ADD TO CART Button on Bottom of Photo */}
        <button
          type="button"
          className={`product-add-to-cart-btn ${isAdded ? "added" : ""}`}
          onClick={handleAddToCart}
          aria-label={isAdded ? "Added to cart" : `Add ${item.name} to cart`}
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

      {/* Product Info */}
      <Link
        href={`/products/${item.id}?from=wishlist`}
        className="product-info-link"
      >
        <div className="product-info">
          <span
            style={{
              fontSize: "9px",
              letterSpacing: "0.18em",
              color: "#888888",
              fontWeight: 600,
              textTransform: "uppercase",
              display: "block",
              marginBottom: "4px",
            }}
          >
            {item.category || "GREENO"}
          </span>
          <p className="product-name">{item.name}</p>
          <span className="product-price">
            ₹{Number(item.price).toLocaleString("en-IN")}
          </span>
        </div>
      </Link>
    </article>
  );
}

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist, removeFromWishlist } = useWishlist();

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "135px 5vw 90px",
        background: "#ffffff",
        color: "#000000",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Breadcrumb & Back */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "10px",
              letterSpacing: "0.2em",
              color: "#777777",
              cursor: "pointer",
              padding: 0,
              fontWeight: 600,
            }}
          >
            &larr; BACK
          </button>
          <span
            style={{
              fontSize: "10px",
              letterSpacing: "0.22em",
              color: "#999999",
              fontWeight: 600,
            }}
          >
            GREENO / WISHLIST
          </span>
        </div>

        {/* Heading */}
        <div
          style={{
            borderBottom: "1px solid #e5e5e5",
            paddingBottom: "25px",
            marginBottom: "40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "10px",
                letterSpacing: "0.22em",
                color: "#777777",
                fontWeight: 600,
              }}
            >
              SAVED PIECES
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(44px, 6vw, 76px)",
                letterSpacing: "-0.04em",
                fontWeight: 800,
                lineHeight: 0.92,
                color: "#000000",
              }}
            >
              MY WISHLIST
            </h1>
          </div>

          <span
            style={{
              fontSize: "11px",
              letterSpacing: "0.15em",
              color: "#777777",
              fontWeight: 500,
            }}
          >
            {wishlist.length} {wishlist.length === 1 ? "SAVED PIECE" : "SAVED PIECES"}
          </span>
        </div>

        {wishlist.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "100px 20px",
              background: "#fafafa",
              border: "1px solid #e5e5e5",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                letterSpacing: "0.25em",
                color: "#777777",
                fontWeight: 600,
                marginBottom: "12px",
              }}
            >
              NO SAVED ITEMS
            </p>
            <h2
              style={{
                margin: "0 0 16px",
                fontSize: "clamp(24px, 3.5vw, 36px)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "#000000",
              }}
            >
              Your wishlist is currently empty.
            </h2>
            <p
              style={{
                margin: "0 auto 30px",
                maxWidth: "480px",
                color: "#666666",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              Tap the heart icon on any piece across the catalogue to keep track of your favorite drops.
            </p>
            <Link
              href="/shop"
              style={{
                display: "inline-block",
                padding: "14px 34px",
                background: "#000000",
                color: "#ffffff",
                border: "1px solid #000000",
                borderRadius: "0px",
                fontSize: "11px",
                letterSpacing: "0.18em",
                fontWeight: 700,
                textDecoration: "none",
                transition: "all 0.25s ease",
              }}
            >
              DISCOVER CATALOGUE &rarr;
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "35px 20px",
            }}
          >
            {wishlist.map((item) => (
              <WishlistItemCard
                key={item.id}
                item={item}
                onRemove={removeFromWishlist}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
