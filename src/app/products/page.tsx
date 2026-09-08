"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export default function ProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      const supabase = createClient();

      const { data, error } = await supabase
  .from("products")
  .select("id, name, price, image")
  .order("name");

console.log("SUPABASE PRODUCTS:", data);
console.log("SUPABASE ERROR:", error);

if (error) {
  console.error("Error loading products:", error);
  setLoading(false);
  return;
}

setProducts(data || []);
setLoading(false);
    }

    loadProducts();
  }, []);

  return (
    <>
      <Header />

      <main className="all-products-page">
        <button
          className="all-products-back-button"
          onClick={() => router.back()}
        >
          ← BACK
        </button>

        <div className="all-products-wrapper">
          {loading ? (
            <div className="category-empty">
              <p>LOADING PRODUCTS...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="all-products-grid">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="all-product-card"
                >
                  <div className="all-product-image">
                    <img
                      src={product.image}
                      alt={product.name}
                    />
                  </div>

                  <div className="all-product-info">
                    <p>{product.name}</p>

                    <span>
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="category-empty">
              <p>NO PRODUCTS AVAILABLE</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}