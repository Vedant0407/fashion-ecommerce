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

export default function ShopPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, image");

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

      <main className="shop-page">
        <button
          className="shop-back-button"
          onClick={() => router.back()}
        >
          ← BACK
        </button>

        <div className="shop-wrapper">
          {loading ? (
            <p>Loading products...</p>
          ) : (
            <div className="shop-grid">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="shop-product-card"
                >
                  <div className="shop-product-image">
                    <img
                      src={product.image}
                      alt={product.name}
                    />
                  </div>

                  <div className="shop-product-info">
                    <p>{product.name}</p>
                    <span>
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}