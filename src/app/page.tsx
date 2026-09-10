"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TypewriterText from "@/components/ui/TypewriterText";
import TrendingProducts from "@/components/ui/TrendingProducts";
import GreenOTshirt3D from "@/components/ui/GreenOTshirt3D";
import CategoryGallery from "@/components/ui/CategoryGallery";
import ProductsGrid from "@/components/ui/ProductsGrid";
import AboutSection from "@/components/ui/AboutSection";
import SpotlightCursor from "@/components/ui/SpotlightCursor";
import { Product, getAllProducts } from "@/lib/catalog";

export default function HomePage() {
  const [newInProducts, setNewInProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadNewIn() {
      try {
        const all = await getAllProducts();
        const filtered = all.filter((p) => p.is_new);
        setNewInProducts(filtered.length > 0 ? filtered : all.slice(0, 6));
      } catch (err) {
        console.error("Error loading new-in products:", err);
      }
    }
    loadNewIn();
  }, []);

  // Duplicate list to ensure seamless infinite looping marquee
  const marqueeItems =
    newInProducts.length > 0
      ? [...newInProducts, ...newInProducts, ...newInProducts]
      : [];

  return (
    <>
      <main className="home-page">
        {/* =========================
            HERO
        ========================= */}
        <section className="hero-section">
          <img
            src="/hero.jfif"
            alt="GreenO Luxury Streetwear"
            className="hero-video"
          />

          <GreenOTshirt3D />

          <div className="hero-dark-overlay" />

          <SpotlightCursor />

          <div className="hero-bottom-cta">
            <p className="hero-subtext">HEAVYWEIGHT STREETWEAR &bull; LIMITED DROP</p>
            <Link href="/shop" className="hero-button">
              EXPLORE COLLECTION &rarr;
            </Link>
          </div>
        </section>

        {/* =========================
            NEW IN
        ========================= */}
        <section className="new-in-section">
          <div className="new-in-wrapper">
            <div className="new-in-heading">
              <div>
                <p className="new-in-kicker">SPRING / SUMMER 2026</p>
                <h2>
                  <TypewriterText text="NEW ARRIVALS" />
                </h2>
              </div>
              <Link href="/shop" className="discover-more">
                DISCOVER MORE &rarr;
              </Link>
            </div>

            <div className="new-in-marquee">
              <div className="new-in-track">
                {marqueeItems.map((prod, idx) => {
                  const cardClass = idx % 2 === 0 ? "card-one" : "card-two";
                  return (
                    <Link
                      key={`${prod.id}-${idx}`}
                      href={`/products/${prod.id}?from=newin`}
                      className={`new-in-card ${cardClass}`}
                    >
                      <div className="new-in-image">
                        <img
                          src={prod.image || "/black-tee.jfif"}
                          alt={prod.name}
                        />
                      </div>

                      <div className="new-in-info">
                        <p className="new-in-name">{prod.name}</p>
                        <span className="new-in-price">
                          ₹{Number(prod.price).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <CategoryGallery />
        <TrendingProducts />
        <ProductsGrid />
        <AboutSection />
      </main>
    </>
  );
}