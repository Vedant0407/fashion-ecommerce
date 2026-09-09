"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { Product, getAllProducts } from "@/lib/catalog";

export default function ProductsGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    async function loadProducts() {
      try {
        const all = await getAllProducts();
        const featured = all.filter((p) => p.is_featured);
        // Show featured products if selected, otherwise all catalog products
        setProducts(featured.length > 0 ? featured : all);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  if (loading) {
    return (
      <section className="products-section">
        <div className="products-wrapper">
          <div className="products-loading">
            <p>LOADING COLLECTION...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="products-section">
      <div className="products-wrapper">
        <div className="products-header-row">
          <div>
            <p className="products-kicker">ESSENTIALS</p>
            <h2 className="products-title">CURATED CATALOGUE</h2>
          </div>
          <Link href="/shop" className="discover-more">
            VIEW ALL PIECES &rarr;
          </Link>
        </div>

        <div className="products-grid">
          {products.map((product) => {
            const inWishlist = isInWishlist(product.id);
            return (
              <div key={product.id} className="product-card">
                <button
                  className="product-wishlist-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWishlist({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image,
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

                <Link href={`/products/${product.id}`} className="product-card-link">
                  <div className="product-image">
                    <img
                      src={product.image}
                      alt={product.name}
                    />
                  </div>

                  <div className="product-info">
                    <p className="product-name">{product.name}</p>
                    <span className="product-price">
                      ₹{Number(product.price).toLocaleString("en-IN")}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}