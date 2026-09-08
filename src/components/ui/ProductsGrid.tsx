"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export default function ProductsGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, image")
        .order("name");

      if (error) {
        console.error("Error loading products:", error);
        setLoading(false);
        return;
      }

      console.log("SUPABASE PRODUCTS:", data);

      setProducts(data || []);
      setLoading(false);
    }

    loadProducts();
  }, []);

  if (loading) {
    return (
      <section className="products-section">
        <div className="products-wrapper">
          <div className="products-grid">
            <p>Loading products...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="products-section">
      <div className="products-wrapper">
        <div className="products-heading">
          <Link href="/products" className="discover-more">
            Discover more
          </Link>
        </div>

        <div className="products-grid">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="product-card"
            >
              <div className="product-image">
                <img
                  src={product.image}
                  alt={product.name}
                />
              </div>

              <div className="product-info">
                <p>{product.name}</p>

                <span>
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}