"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import Header from "@/components/Header";

const products = {
  "oversized-black-tee": {
    name: "OVERSIZED BLACK TEE",
    price: "₹2,499",
    image: "/black-tee.jfif",
    category: "T-SHIRTS",
    productNo: "GRO-001",
    color: "BLACK",
    description:
      "A premium oversized tee designed for a relaxed streetwear fit. Made for everyday comfort with a clean GreenO aesthetic.",
    material: "100% Premium Cotton",
    fabric: "240 GSM Fabric",
    fit: "Oversized Fit with dropped shoulders",
  },

  "urban-grey-hoodie": {
    name: "URBAN GREY HOODIE",
    price: "₹3,999",
    image: "/grey-hoodie.webp",
    category: "HOODIES",
    productNo: "GRO-002",
    color: "GREY",
    description:
      "A relaxed-fit grey hoodie with a minimal streetwear design and premium everyday comfort.",
    material: "100% Premium Cotton",
    fabric: "350 GSM Fabric",
    fit: "Relaxed Fit",
  },

  "cargo-street-pants": {
    name: "CARGO STREET PANTS",
    price: "₹3,499",
    image: "/cargo-pants.jfif",
    category: "PANTS",
    productNo: "GRO-003",
    color: "BLACK",
    description:
      "Utility-inspired cargo pants with a relaxed streetwear silhouette and functional pocket detailing.",
    material: "Cotton Blend",
    fabric: "Heavyweight Fabric",
    fit: "Relaxed Fit",
  },

  "classic-white-tee": {
    name: "CLASSIC WHITE TEE",
    price: "₹1,999",
    image: "/white-tee.webp",
    category: "T-SHIRTS",
    productNo: "GRO-004",
    color: "WHITE",
    description:
      "A clean classic white tee designed with a timeless silhouette and everyday versatility.",
    material: "100% Premium Cotton",
    fabric: "240 GSM Fabric",
    fit: "Regular Fit",
  },

  "black-street-tee": {
    name: "BLACK STREET TEE",
    price: "₹2,299",
    image: "/black-tee.jfif",
    category: "T-SHIRTS",
    productNo: "GRO-005",
    color: "BLACK",
    description:
      "A modern black streetwear tee with a relaxed silhouette.",
    material: "100% Premium Cotton",
    fabric: "240 GSM Fabric",
    fit: "Relaxed Fit",
  },

  "grey-oversized-hoodie": {
    name: "GREY OVERSIZED HOODIE",
    price: "₹3,799",
    image: "/grey-hoodie.webp",
    category: "HOODIES",
    productNo: "GRO-006",
    color: "GREY",
    description:
      "An oversized hoodie designed for a comfortable streetwear look.",
    material: "100% Premium Cotton",
    fabric: "350 GSM Fabric",
    fit: "Oversized Fit",
  },

  "utility-cargo": {
    name: "UTILITY CARGO",
    price: "₹3,699",
    image: "/cargo-pants.jfif",
    category: "PANTS",
    productNo: "GRO-007",
    color: "BLACK",
    description:
      "Utility cargo pants with functional detailing and a modern silhouette.",
    material: "Cotton Blend",
    fabric: "Heavyweight Fabric",
    fit: "Relaxed Fit",
  },

  "white-essential-tee": {
    name: "WHITE ESSENTIAL TEE",
    price: "₹2,199",
    image: "/white-tee.webp",
    category: "T-SHIRTS",
    productNo: "GRO-008",
    color: "WHITE",
    description:
      "A clean essential tee made for everyday styling.",
    material: "100% Premium Cotton",
    fabric: "240 GSM Fabric",
    fit: "Regular Fit",
  },

  "signature-black-tee": {
    name: "SIGNATURE BLACK TEE",
    price: "₹2,599",
    image: "/black-tee.jfif",
    category: "T-SHIRTS",
    productNo: "GRO-009",
    color: "BLACK",
    description:
      "A signature GreenO black tee with a refined streetwear aesthetic.",
    material: "100% Premium Cotton",
    fabric: "240 GSM Fabric",
    fit: "Relaxed Fit",
  },

  "urban-hoodie": {
    name: "URBAN HOODIE",
    price: "₹3,899",
    image: "/grey-hoodie.webp",
    category: "HOODIES",
    productNo: "GRO-010",
    color: "GREY",
    description:
      "A premium urban hoodie with a minimal everyday design.",
    material: "100% Premium Cotton",
    fabric: "350 GSM Fabric",
    fit: "Relaxed Fit",
  },

  "street-cargo": {
    name: "STREET CARGO",
    price: "₹3,599",
    image: "/cargo-pants.jfif",
    category: "PANTS",
    productNo: "GRO-011",
    color: "BLACK",
    description:
      "Streetwear cargo pants designed for comfort and utility.",
    material: "Cotton Blend",
    fabric: "Heavyweight Fabric",
    fit: "Relaxed Fit",
  },

  "minimal-white-tee": {
    name: "MINIMAL WHITE TEE",
    price: "₹2,099",
    image: "/white-tee.webp",
    category: "T-SHIRTS",
    productNo: "GRO-012",
    color: "WHITE",
    description:
      "A minimal white tee with a clean and versatile design.",
    material: "100% Premium Cotton",
    fabric: "240 GSM Fabric",
    fit: "Regular Fit",
  },

  "core-black-tee": {
    name: "CORE BLACK TEE",
    price: "₹2,399",
    image: "/black-tee.jfif",
    category: "T-SHIRTS",
    productNo: "GRO-013",
    color: "BLACK",
    description:
      "A core GreenO essential designed for everyday streetwear.",
    material: "100% Premium Cotton",
    fabric: "240 GSM Fabric",
    fit: "Relaxed Fit",
  },

  "grey-core-hoodie": {
    name: "GREY CORE HOODIE",
    price: "₹3,999",
    image: "/grey-hoodie.webp",
    category: "HOODIES",
    productNo: "GRO-014",
    color: "GREY",
    description:
      "A premium grey hoodie with a clean core streetwear aesthetic.",
    material: "100% Premium Cotton",
    fabric: "350 GSM Fabric",
    fit: "Relaxed Fit",
  },

  "relaxed-cargo": {
    name: "RELAXED CARGO",
    price: "₹3,499",
    image: "/cargo-pants.jfif",
    category: "PANTS",
    productNo: "GRO-015",
    color: "BLACK",
    description:
      "Relaxed cargo pants designed for everyday streetwear styling.",
    material: "Cotton Blend",
    fabric: "Heavyweight Fabric",
    fit: "Relaxed Fit",
  },

  "everyday-white-tee": {
    name: "EVERYDAY WHITE TEE",
    price: "₹1,999",
    image: "/white-tee.webp",
    category: "T-SHIRTS",
    productNo: "GRO-016",
    color: "WHITE",
    description:
      "An everyday white tee designed for simple and versatile styling.",
    material: "100% Premium Cotton",
    fabric: "240 GSM Fabric",
    fit: "Regular Fit",
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
  const [selectedImage, setSelectedImage] = useState(0);

  if (!product) {
    return (
      <>
        <Header />

        <main className="product-page">
          <div className="product-not-found">
            <h1>PRODUCT NOT FOUND</h1>

            <Link href="/">
              BACK TO HOME
            </Link>
          </div>
        </main>
      </>
    );
  }

  const images = [
    product.image,
    product.image,
    product.image,
  ];

  return (
    <>
      <Header />

      <main className="product-page">

        {/* BACK BUTTON */}
        <button
          className="product-back-button"
          onClick={() => router.back()}
        >
          ← BACK
        </button>

        <div className="product-detail">

          {/* LEFT - PRODUCT INFORMATION */}
          <div className="product-left">

            <p className="product-category">
              {product.category}
            </p>

            <h1>
              {product.name}
            </h1>

            <p className="product-price">
              {product.price}
            </p>

            <div className="product-left-section">

              <h3>DESCRIPTION</h3>

              <p>
                {product.description}
              </p>

            </div>

            <div className="product-left-section">

              <h3>MATERIAL</h3>

              <p>
                {product.material}
              </p>

              <p>
                {product.fabric}
              </p>

            </div>

            <div className="product-left-section">

              <h3>FIT</h3>

              <p>
                {product.fit}
              </p>

            </div>

          </div>


          {/* CENTER - PRODUCT IMAGE */}
          <div className="product-center">

            <div className="product-main-image">

              <img
                src={images[selectedImage]}
                alt={product.name}
              />

            </div>

            <div className="product-thumbnails">

              {images.map((image, index) => (

                <button
                  key={index}
                  className={
                    selectedImage === index
                      ? "product-thumbnail active"
                      : "product-thumbnail"
                  }
                  onClick={() => setSelectedImage(index)}
                >

                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                  />

                </button>

              ))}

            </div>

          </div>


          {/* RIGHT - OPTIONS */}
          <div className="product-right">

            {/* QUANTITY */}
            <div className="right-option">

              <h3>QUANTITY</h3>

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


            {/* COLOR */}
            <div className="right-option">

              <h3>COLOR</h3>

              <button className="color-option active">

                <span className="color-dot" />

                {product.color}

              </button>

            </div>


            {/* PRODUCT NUMBER */}
            <div className="right-info">

              <h3>PRODUCT NUMBER</h3>

              <p>
                {product.productNo}
              </p>

            </div>


            {/* SIZE */}
            <div className="right-option">

              <h3>CHOOSE SIZE</h3>

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


            {/* ACTIONS */}
            <div className="product-actions">

              <button className="add-to-cart-button">
                ADD TO SHOPPING BAG
              </button>

              <button className="wishlist-button">
                ♡
              </button>

            </div>


            {/* ACCORDIONS */}
            <div className="product-accordions">

              <div className="product-accordion">

                <button>
                  <span>PRODUCT DETAILS</span>
                  <span>+</span>
                </button>

                <div className="accordion-content">

                  <p>
                    Premium GreenO streetwear designed
                    with a modern relaxed silhouette.
                  </p>

                </div>

              </div>


              <div className="product-accordion">

                <button>
                  <span>DELIVERY & RETURNS</span>
                  <span>+</span>
                </button>

                <div className="accordion-content">

                  <p>
                    Delivery information and return
                    policy will be available here.
                  </p>

                </div>

              </div>


              <div className="product-accordion">

                <button>
                  <span>CARE INSTRUCTIONS</span>
                  <span>+</span>
                </button>

                <div className="accordion-content">

                  <p>
                    Follow the care instructions provided
                    with the product.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </main>
    </>
  );
}