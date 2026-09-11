"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Product, getAllProducts } from "@/lib/catalog";

import ProductCard from "@/components/ui/ProductCard";

export default function ProductsGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

    const handleUpdate = () => {
      loadProducts();
    };

    window.addEventListener("greeno_products_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("greeno_products_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
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
          {products.map((product) => (
            <ProductCard key={product.id} product={product} source="products" />
          ))}
        </div>
      </div>
    </section>
  );
}