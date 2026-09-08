"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string | null;
};

const categoryNames: Record<string, string> = {
  "t-shirts": "T-SHIRTS",
  caps: "CAPS",
  bags: "BAGS",
  pants: "PANTS",
  hoodies: "HOODIES",
  accessories: "ACCESSORIES",
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();

  const category = String(params.category).toLowerCase();
  const categoryName = categoryNames[category];

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryName) {
      setLoading(false);
      return;
    }

    async function loadProducts() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, image, category")
        .ilike("category", categoryName);

      if (error) {
        console.error("Error loading category products:", error);
        setLoading(false);
        return;
      }

      setProducts(data || []);
      setLoading(false);
    }

    loadProducts();
  }, [categoryName]);

  if (!categoryName) {
    return (
      <>
        <Header />

        <main className="category-page">
          <button
            className="category-back-button"
            onClick={() => router.back()}
          >
            ← BACK
          </button>

          <div className="category-wrapper">
            <h1>CATEGORY NOT FOUND</h1>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="category-page">
        <button
          className="category-back-button"
          onClick={() => router.back()}
        >
          ← BACK
        </button>

        <div className="category-wrapper">

          {loading ? (
            <div className="category-empty">
              <p>LOADING PRODUCTS...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="category-product-grid">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="category-product-card"
                >
                  <div className="category-product-image">
                    <img
                      src={product.image}
                      alt={product.name}
                    />
                  </div>

                  <div className="category-product-info">
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