"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Check, ShoppingBag } from "lucide-react";

import { useWishlist, WishlistItem } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

function getWishlistImages(item: WishlistItem): string[] {
  const baseImg = item.image || "/black-tee.jfif";
  const cat = (item.category || item.name || "").toLowerCase();

  let pool: string[];
  if (cat.includes("pant") || cat.includes("trouser")) {
    pool = [baseImg, "/atelier-trousers-detail.jpg", "/atelier-trousers.jpg"];
  } else if (cat.includes("bag") || cat.includes("tote")) {
    pool = [baseImg, "/atelier-bag-detail.jpg", "/atelier-tote-bag.jpg"];
  } else if (cat.includes("tee") || cat.includes("t-shirt") || cat.includes("shirt")) {
    pool = [baseImg, "/white-tee.jfif", "/grey-hoodie.jfif"];
  } else if (cat.includes("hoodie") || cat.includes("knit") || cat.includes("sweater")) {
    pool = [baseImg, "/atelier-knitwear.jpg", "/grey-hoodie.jfif"];
  } else {
    pool = [baseImg, "/atelier-hero-model.jpg", "/atelier-coat.jpg"];
  }

  const unique = pool.filter((img, idx, arr) => arr.indexOf(img) === idx);
  return unique.length > 1 ? unique : [baseImg];
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
  const currentImage = images[photoIndex] || images[0] || item.image || "/atelier-trousers.jpg";

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
    <article className="atelier-card" style={{ position: "relative" }}>
      {/* Remove from Wishlist Button */}
      <button
        type="button"
        className="atelier-wishlist-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(item.id);
        }}
        aria-label="Remove from wishlist"
        title="Remove piece from wishlist"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="#121212"
          stroke="#121212"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      </button>

      {/* 3:4 Editorial Image Container */}
      <div className="atelier-image-box">
        <Link
          href={`/products/${item.id}?from=wishlist`}
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage}
            alt={item.name}
            className="atelier-product-img"
          />
        </Link>

        {/* Multi-angle slide controls if available */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevPhoto}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(6px)",
                border: "none",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 4,
                color: "#121212",
              }}
              aria-label="Previous image"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={handleNextPhoto}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(6px)",
                border: "none",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 4,
                color: "#121212",
              }}
              aria-label="Next image"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </>
        )}

        {/* Hover Quick Add to Bag */}
        <div className="atelier-quick-add">
          <button
            type="button"
            className="atelier-quick-btn"
            onClick={handleAddToCart}
          >
            {isAdded ? (
              <>
                <Check size={13} strokeWidth={2.5} /> ADDED TO BAG
              </>
            ) : (
              <>
                <ShoppingBag size={13} strokeWidth={2} /> ADD TO SHOPPING BAG
              </>
            )}
          </button>
        </div>
      </div>

      {/* Piece Information */}
      <div className="atelier-details">
        <span
          style={{
            fontSize: "9.5px",
            letterSpacing: "0.2em",
            color: "#777777",
            fontWeight: 600,
            textTransform: "uppercase",
            display: "block",
            marginBottom: "2px",
          }}
        >
          {item.category || "ATELIER EDITION"}
        </span>

        <div className="atelier-title-row">
          <Link
            href={`/products/${item.id}?from=wishlist`}
            style={{ textDecoration: "none", color: "inherit", flex: 1 }}
          >
            <h3 className="atelier-product-name">{item.name}</h3>
          </Link>
          <span className="atelier-product-price">
            ₹{Number(item.price).toLocaleString("en-IN")}
          </span>
        </div>
      </div>
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
        padding: "130px 5vw 90px",
        background: "#F7F6F2",
        color: "#121212",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1360px", margin: "0 auto" }}>
        {/* Navigation & Breadcrumb */}
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
              fontSize: "10.5px",
              letterSpacing: "0.18em",
              color: "#777777",
              cursor: "pointer",
              padding: 0,
              fontWeight: 600,
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.2s ease",
            }}
          >
            ← BACK
          </button>
          <span
            style={{
              fontSize: "10px",
              letterSpacing: "0.22em",
              color: "#777777",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            GREENO ATELIER // WISHLIST
          </span>
        </div>

        {/* Heading & Counter */}
        <div
          style={{
            borderBottom: "1px solid #E7E5DF",
            paddingBottom: "22px",
            marginBottom: "44px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "16px",
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
                textTransform: "uppercase",
              }}
            >
              SAVED PIECES
            </p>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
                fontSize: "36px",
                letterSpacing: "0.02em",
                fontWeight: 400,
                lineHeight: 1.15,
                textTransform: "uppercase",
                color: "#121212",
              }}
            >
              CURATED WISHLIST
            </h1>
          </div>

          <span
            style={{
              fontSize: "10.5px",
              letterSpacing: "0.18em",
              color: "#555555",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {wishlist.length} {wishlist.length === 1 ? "PIECE" : "PIECES"}
          </span>
        </div>

        {wishlist.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "100px 30px",
              background: "#FFFFFF",
              border: "1px solid #E7E5DF",
              borderRadius: "2px",
              maxWidth: "680px",
              margin: "0 auto",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                letterSpacing: "0.22em",
                color: "#777777",
                fontWeight: 600,
                marginBottom: "12px",
                textTransform: "uppercase",
              }}
            >
              CURATION VACANT
            </p>
            <h2
              style={{
                margin: "0 0 16px",
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
                fontSize: "26px",
                fontWeight: 400,
                letterSpacing: "0.02em",
                color: "#121212",
                textTransform: "uppercase",
              }}
            >
              Your wishlist is currently unpopulated
            </h2>
            <p
              style={{
                margin: "0 auto 32px",
                maxWidth: "460px",
                color: "#666666",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              Preserve your favorite silhouettes, tailoring, and leather goods from the Atelier collection for future acquisition.
            </p>
            <Link
              href="/shop"
              style={{
                display: "inline-block",
                padding: "14px 36px",
                background: "#121212",
                color: "#FFFFFF",
                border: "1px solid #121212",
                borderRadius: "2px",
                fontSize: "11px",
                letterSpacing: "0.2em",
                fontWeight: 600,
                textDecoration: "none",
                textTransform: "uppercase",
                transition: "all 0.25s ease",
              }}
            >
              DISCOVER ATELIER COLLECTION &rarr;
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "48px 24px",
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
