"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";
import AboutSection from "@/components/ui/AboutSection";
import { ImageSwiper } from "@/components/ui/image-swiper";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string | null;
  category_id?: string | null;
  color?: string | null;
  stock?: number | null;
  is_featured?: boolean;
  is_new?: boolean;
  is_trending?: boolean;
};

export default function ProductPage() {
  const { addToCart } = useCart();
  const params = useParams();
  const router = useRouter();

  const slug = String(params.slug);

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");

  useEffect(() => {
  async function loadProduct() {
    const supabase = createClient();

    let { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", slug)
      .maybeSingle();

    // Homepage cards use readable slugs, while Supabase uses UUIDs.
    if (!data && !error) {
      const readableName = slug.replace(/-/g, " ");
      const result = await supabase
        .from("products")
        .select("*")
        .ilike("name", readableName)
        .maybeSingle();

      data = result.data;
      error = result.error;
    }

    if (error || !data) {
      console.error("Error loading product:", error);
      setProduct(null);
      setLoading(false);
      return;
    }

    setProduct(data);
    setLoading(false);
  }

  loadProduct();
}, [slug]);

  useEffect(() => {
    async function loadOtherProducts() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error loading products:", error);
        return;
      }

      setAllProducts(data || []);
    }

    loadOtherProducts();
  }, []);

  if (loading) {
    return (
      <>
        <Header />

        <main className="product-page">
          <div className="product-not-found">
            <h1>LOADING PRODUCT...</h1>
          </div>
        </main>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />

        <main className="product-page">
          <div className="product-not-found">
            <h1>PRODUCT NOT FOUND</h1>

            <Link href="/products">
              BACK TO PRODUCTS
            </Link>
          </div>
        </main>
      </>
    );
  }

  const image = product.image || "/black-tee.jfif";

  const productImages = [
    image,
    image,
    image,
  ];

  const handleAddToCart = () => {
  addToCart(
    {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: image,
      size: selectedSize,
      color: product.color || "BLACK",
    },
    quantity
  );
};

  const otherProducts = allProducts.filter(
    (item) => item.id !== product.id
  );

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

          {/* LEFT - PRODUCT DETAILS */}
          <div className="product-left">

            <p className="product-category">
              GREENO COLLECTION
            </p>

            <h1>{product.name}</h1>

            <p className="product-price">
              ₹{Number(product.price).toLocaleString("en-IN")}
            </p>

            <div className="product-left-section">
              <h3>DESCRIPTION</h3>

              <p>
                {product.description ||
                  "A premium GreenO product designed for everyday comfort and modern streetwear styling."}
              </p>
            </div>

            <div className="product-left-section">
  <h3>MATERIAL</h3>
  <p>Premium quality material</p>
</div>

            <div className="product-left-section">
              <h3>FIT</h3>

              <p>
                Relaxed Fit
              </p>
            </div>

          </div>

          {/* CENTER - PRODUCT IMAGES */}
          <div className="product-center">

            <ImageSwiper
              images={productImages.join(",")}
              cardWidth={420}
              cardHeight={560}
            />

          </div>

          {/* RIGHT - PRODUCT OPTIONS */}
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

                <span>{quantity}</span>

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

                {product.color || "BLACK"}

              </button>

            </div>

            {/* PRODUCT NUMBER */}
            <div className="right-info">

              <h3>PRODUCT NUMBER</h3>

              <p>
                {product.id}
              </p>

            </div>

            {/* SIZE */}
            <div className="right-option">

              <h3>CHOOSE SIZE</h3>

              <div className="size-options">

                {["S", "M", "L", "XL"].map((size) => (
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
                ))}

              </div>

            </div>

            {/* ACTIONS */}
            <div className="product-actions">

              <button
                className="add-to-cart-button"
                onClick={handleAddToCart}
              >
                ADD TO SHOPPING BAG
              </button>

              <button className="wishlist-button">
                ♡
              </button>

            </div>

            {/* DETAILS */}
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

        {/* YOU MAY ALSO LIKE */}
        <section className="more-products">

          <div className="more-products-header">
            <p>GREENO / COLLECTION</p>
            <h2>YOU MAY ALSO LIKE</h2>
          </div>

          <div className="more-products-grid">

            {otherProducts.map((item) => (
              <Link
                href={`/products/${item.id}`}
                key={item.id}
                className="more-product-card"
              >

                <div className="more-product-image">

                  <img
                    src={item.image}
                    alt={item.name}
                  />

                </div>

                <div className="more-product-info">

                  <h3>{item.name}</h3>

                  <p>
                    ₹{Number(item.price).toLocaleString("en-IN")}
                  </p>

                </div>

              </Link>
            ))}

          </div>

        </section>

      </main>

      <AboutSection />
    </>
  );
}