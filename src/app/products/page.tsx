"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { products } from "@/components/ui/ProductsGrid";

export default function ProductsPage() {
  const router = useRouter();

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

          <div className="all-products-grid">
            {products.map((product) => (
              <Link
                key={product.name}
                href={product.link}
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
                  <span>{product.price}</span>
                </div>
              </Link>
            ))}
          </div>

        </div>

      </main>
    </>
  );
}