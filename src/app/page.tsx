"use client";

import Link from "next/link";
import TrendingProducts from "@/components/ui/TrendingProducts";
import GreenOTshirt3D from "@/components/ui/GreenOTshirt3D";
import ProductsGrid from "@/components/ui/ProductsGrid";
import AboutSection from "@/components/ui/AboutSection";
import SpotlightCursor from "@/components/ui/SpotlightCursor";

export default function HomePage() {
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

        <TrendingProducts />
        <ProductsGrid />
        <AboutSection />
      </main>
    </>
  );
}