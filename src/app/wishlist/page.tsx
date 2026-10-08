"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Check, ShoppingBag } from "lucide-react";

import { useWishlist, WishlistItem } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

function WishlistItemCard({
  item,
  onRemove,
}: {
  item: WishlistItem;
  onRemove: (id: string) => void;
}) {
  const { addToCart, openCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    addToCart(
      {
        id: item.id,
        name: item.name,
        price: Number(item.price),
        image: item.image || "/black-tee.jfif",
        size: "M",
        color: "BLACK",
      },
      1
    );
    setIsAdded(true);
    openCart();
    setTimeout(() => setIsAdded(false), 1800);
  };

  return (
    <article className="streetwear-product-card">
      <div className="streetwear-product-img-box">
        <Link href={`/products/${item.id}?from=wishlist`} className="streetwear-product-img-link">
          <img
            src={item.image || "/black-tee.jfif"}
            alt={item.name}
            className="streetwear-product-cutout"
            loading="lazy"
          />
        </Link>
        <button
          type="button"
          className="streetwear-product-heart-btn active"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove(item.id);
          }}
          aria-label="Remove from wishlist"
          title="Remove from wishlist"
        >
          <Heart size={18} strokeWidth={2} fill="#121212" color="#121212" />
        </button>
      </div>

      <Link href={`/products/${item.id}?from=wishlist`} className="streetwear-product-caption-link">
        <div className="streetwear-product-caption">
          <h3 className="streetwear-product-name">{item.name}</h3>
          <span className="streetwear-product-price">
            ₹{Number(item.price).toLocaleString("en-IN")}
          </span>
        </div>
      </Link>

      <button
        type="button"
        className={`streetwear-product-cart-btn ${isAdded ? "added" : ""}`}
        onClick={handleAddToCart}
        aria-label={`Add ${item.name} to cart`}
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
        background: "#FFFFFF",
        color: "#121212",
        boxSizing: "border-box",
      }}
    >
      <div className="streetwear-grid-container">
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
                fontFamily: "var(--font-geist-sans), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: "28px",
                letterSpacing: "0.04em",
                fontWeight: 700,
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
                fontFamily: "var(--font-geist-sans), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: "20px",
                fontWeight: 600,
                letterSpacing: "0.04em",
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
          <div className="streetwear-product-grid">
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
