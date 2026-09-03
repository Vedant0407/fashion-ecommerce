"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { products } from "@/components/ui/ProductsGrid";

const categoryNames: Record<string, string> = {
  "t-shirts": "T-SHIRTS",
  caps: "CAPS",
  bags: "BAGS",
  pants: "PANTS",
  hoodies: "HOODIES",
  accessories: "ACCESSORIES",
};

const categoryProducts: Record<string, string> = {
  "t-shirts": "TEE",
  caps: "CAP",
  bags: "BAG",
  pants: "CARGO",
  hoodies: "HOODIE",
  accessories: "ACCESSORY",
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();

  const category = String(params.category).toLowerCase();

  const categoryName = categoryNames[category];

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

  const keyword = categoryProducts[category];

  const filteredProducts = products.filter((product) =>
    product.name.includes(keyword)
  );

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

        

          {filteredProducts.length > 0 ? (
            <div className="category-product-grid">

              {filteredProducts.map((product) => (
                <Link
                  key={product.name}
                  href={product.link}
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
                    <span>{product.price}</span>
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