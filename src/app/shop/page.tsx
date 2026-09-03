"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

const products = [
  {
    name: "OVERSIZED BLACK TEE",
    price: "₹2,499",
    image: "/black-tee.jfif",
    link: "/oversized-black-tee",
  },
  {
    name: "URBAN GREY HOODIE",
    price: "₹3,999",
    image: "/grey-hoodie.jfif",
    link: "/urban-grey-hoodie",
  },
  {
    name: "CARGO STREET PANTS",
    price: "₹3,499",
    image: "/cargo-pants.jfif",
    link: "/cargo-street-pants",
  },
  {
    name: "CLASSIC WHITE TEE",
    price: "₹1,999",
    image: "/white-tee.jfif",
    link: "/classic-white-tee",
  },

  // Add your remaining products here
];

export default function ShopPage() {
    const router = useRouter();
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

          

          <div className="shop-grid">
            {products.map((product) => (
              <Link
                key={product.name}
                href={product.link}
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