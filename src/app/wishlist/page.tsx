"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  const handleMoveToBag = (item: any) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      size: "M",
      color: "BLACK",
    });

    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

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
            {wishlist.map((item) => {
              const isAdded = !!addedItems[item.id];
              return (
                <article
                  key={item.id}
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    background: "#ffffff",
                    border: "1px solid #e5e5e5",
                    borderRadius: "0px",
                    overflow: "hidden",
                    transition: "border-color 0.25s ease",
                  }}
                  className="wishlist-card"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    aria-label="Remove item"
                    title="Remove from wishlist"
                    style={{
                      position: "absolute",
                      top: "14px",
                      right: "14px",
                      zIndex: 3,
                      background: "rgba(255, 255, 255, 0.92)",
                      border: "1px solid rgba(0, 0, 0, 0.08)",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "#000000",
                      lineHeight: 1,
                    }}
                  >
                    &times;
                  </button>

                  <Link
                    href={`/products/${item.id}`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        paddingBottom: "125%",
                        background: "#f7f7f7",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.5s ease",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      />
                    </div>

                    <div style={{ padding: "16px 14px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "9px",
                          letterSpacing: "0.18em",
                          color: "#888888",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {item.category || "GREENO"}
                      </span>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          lineHeight: 1.35,
                          color: "#000000",
                          textTransform: "uppercase",
                        }}
                      >
                        {item.name}
                      </h2>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#000000",
                          letterSpacing: "0.02em",
                        }}
                      >
                        ₹{Number(item.price).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </Link>

                  {/* Move to Bag Button */}
                  <div style={{ padding: "0 14px 16px", marginTop: "auto" }}>
                    <button
                      onClick={() => handleMoveToBag(item)}
                      style={{
                        width: "100%",
                        padding: "11px 0",
                        background: isAdded ? "#111111" : "#000000",
                        color: "#ffffff",
                        border: "1px solid #000000",
                        borderRadius: "0px",
                        fontSize: "10px",
                        letterSpacing: "0.16em",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {isAdded ? "ADDED TO BAG ✓" : "MOVE TO BAG &rarr;"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
