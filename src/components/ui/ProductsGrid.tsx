"use client";

import Link from "next/link";

const products = [
  {
    name: "OVERSIZED BLACK TEE",
    price: "₹2,499",
    image: "/products/black-tee.jfif",
    link: "/products/oversized-black-tee",
  },
  {
    name: "URBAN GREY HOODIE",
    price: "₹3,999",
    image: "/products/grey-hoodie.webp",
    link: "/products/urban-grey-hoodie",
  },
  {
    name: "CARGO STREET PANTS",
    price: "₹3,499",
    image: "/products/cargo-pants.jfif",
    link: "/products/cargo-street-pants",
  },
  {
    name: "CLASSIC WHITE TEE",
    price: "₹1,999",
    image: "/products/white-tee.webp",
    link: "/products/classic-white-tee",
  },

  {
    name: "BLACK STREET TEE",
    price: "₹2,299",
    image: "/products/black-tee.jfif",
    link: "/products/black-street-tee",
  },
  {
    name: "GREY OVERSIZED HOODIE",
    price: "₹3,799",
    image: "/products/grey-hoodie.webp",
    link: "/products/grey-oversized-hoodie",
  },
  {
    name: "UTILITY CARGO",
    price: "₹3,699",
    image: "/products/cargo-pants.jfif",
    link: "/products/utility-cargo",
  },
  {
    name: "WHITE ESSENTIAL TEE",
    price: "₹2,199",
    image: "/products/white-tee.webp",
    link: "/products/white-essential-tee",
  },

  {
    name: "SIGNATURE BLACK TEE",
    price: "₹2,599",
    image: "/products/black-tee.jfif",
    link: "/products/signature-black-tee",
  },
  {
    name: "URBAN HOODIE",
    price: "₹3,899",
    image: "/products/grey-hoodie.webp",
    link: "/products/urban-hoodie",
  },
  {
    name: "STREET CARGO",
    price: "₹3,599",
    image: "/products/cargo-pants.jfif",
    link: "/products/street-cargo",
  },
  {
    name: "MINIMAL WHITE TEE",
    price: "₹2,099",
    image: "/products/white-tee.webp",
    link: "/products/minimal-white-tee",
  },

  {
    name: "CORE BLACK TEE",
    price: "₹2,399",
    image: "/products/black-tee.jfif",
    link: "/products/core-black-tee",
  },
  {
    name: "GREY CORE HOODIE",
    price: "₹3,999",
    image: "/products/grey-hoodie.webp",
    link: "/products/grey-core-hoodie",
  },
  {
    name: "RELAXED CARGO",
    price: "₹3,499",
    image: "/products/cargo-pants.jfif",
    link: "/products/relaxed-cargo",
  },
  {
    name: "EVERYDAY WHITE TEE",
    price: "₹1,999",
    image: "/products/white-tee.webp",
    link: "/products/everyday-white-tee",
  },
];

export default function ProductsGrid() {
  return (
    <section className="products-section">

      

      <div className="products-grid">

        {products.map((product) => (
          <Link
            key={product.name}
            href={product.link}
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
              <span>{product.price}</span>
            </div>
          </Link>
        ))}

      </div>

    </section>
  );
}