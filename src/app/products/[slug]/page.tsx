"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";import Link from "next/link";
import Header from "@/components/Header";

const products = {
  "oversized-black-tee": {
    name: "OVERSIZED BLACK TEE",
    price: "₹2,499",
    image: "/products/black-tee.jfif",
    description:
      "A premium oversized tee designed for a relaxed streetwear fit. Made for everyday comfort with a clean GreenO aesthetic.",
  },

  "urban-grey-hoodie": {
    name: "URBAN GREY HOODIE",
    price: "₹3,999",
    image: "/products/grey-hoodie.webp",
    description:
      "A relaxed-fit grey hoodie with a minimal streetwear design and premium everyday comfort.",
  },

  "cargo-street-pants": {
    name: "CARGO STREET PANTS",
    price: "₹3,499",
    image: "/products/cargo-pants.jfif",
    description:
      "Utility-inspired cargo pants with a relaxed streetwear silhouette and functional pocket detailing.",
  },

  "classic-white-tee": {
    name: "CLASSIC WHITE TEE",
    price: "₹1,999",
    image: "/products/white-tee.webp",
    description:
      "A clean classic white tee designed with a timeless silhouette and everyday versatility.",
  },
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();

  const slug = params.slug as string;

  const product =
    products[slug as keyof typeof products];

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");

  if (!product) {
    return (
      <>
        <Header />

        <main className="product-not-found">
          <h1>PRODUCT NOT FOUND</h1>

          <Link href="/">
            BACK TO HOME
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="product-page">
        <button
  className="product-back-button"
  onClick={() => router.back()}
>
  ← BACK
</button>

        <div className="product-detail">

          {/* LEFT - PRODUCT IMAGE */}

          <div className="product-detail-image">
            <img
              src={product.image}
              alt={product.name}
            />
          </div>


          {/* RIGHT - PRODUCT INFORMATION */}

          <div className="product-detail-info">

            <p className="product-detail-label">
              GREENO / PRODUCT
            </p>

            <h1>
              {product.name}
            </h1>

            <p className="product-detail-price">
              {product.price}
            </p>


            {/* DESCRIPTION */}

            <div className="product-description">

              <h3>DESCRIPTION</h3>

              <p>
                {product.description}
              </p>

            </div>


            {/* SIZE */}

            <div className="product-size">

              <div className="product-option-title">
                <span>SIZE</span>
                <span>SIZE GUIDE</span>
              </div>

              <div className="size-options">

                {["S", "M", "L", "XL"].map(
                  (size) => (

                    <button
                      key={size}
                      className={
                        selectedSize === size
                          ? "size-button active"
                          : "size-button"
                      }
                      onClick={() =>
                        setSelectedSize(size)
                      }
                    >
                      {size}
                    </button>

                  )
                )}

              </div>

            </div>


            {/* QUANTITY */}

            <div className="product-quantity">

              <span>QUANTITY</span>

              <div className="quantity-selector">

                <button
                  onClick={() =>
                    setQuantity(
                      Math.max(1, quantity - 1)
                    )
                  }
                >
                  −
                </button>

                <span>
                  {quantity}
                </span>

                <button
                  onClick={() =>
                    setQuantity(quantity + 1)
                  }
                >
                  +
                </button>

              </div>

            </div>


            {/* ADD TO CART */}

            <button className="add-to-cart-button">
              ADD TO CART
            </button>


            {/* DETAILS */}

            <div className="product-accordions">

              <details>

                <summary>
                  PRODUCT DETAILS
                </summary>

                <p>
                  Premium GreenO streetwear designed
                  with a modern relaxed silhouette.
                </p>

              </details>


              <details>

                <summary>
                  DELIVERY & RETURNS
                </summary>

                <p>
                  Delivery information and return
                  policy will be available here.
                </p>

              </details>


              <details>

                <summary>
                  CARE INSTRUCTIONS
                </summary>

                <p>
                  Follow the care instructions provided
                  with the product.
                </p>

              </details>

            </div>

          </div>

        </div>

      </main>
    </>
  );
}