"use client";

import Link from "next/link";
import TypewriterText from "@/components/ui/TypewriterText";
import TrendingProducts from "@/components/ui/TrendingProducts";
import GreenOTshirt3D from "@/components/ui/GreenOTshirt3D";
import CategoryGallery from "@/components/ui/CategoryGallery";
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
                {/* CARD 1 */}
                <Link
                  href="/products/oversized-black-tee"
                  className="new-in-card card-one"
                >
                  <div className="new-in-image">
                    <img
                      src="/black-tee.jfif"
                      alt="Oversized Black Tee"
                    />
                  </div>

                  <div className="new-in-info">
                    <p className="new-in-name">OVERSIZED BLACK TEE</p>
                    <span className="new-in-price">₹2,499</span>
                  </div>
                </Link>

                {/* CARD 2 */}
                <Link
                  href="/products/urban-grey-hoodie"
                  className="new-in-card card-two"
                >
                  <div className="new-in-image">
                    <img
                      src="/grey-hoodie.jfif"
                      alt="Urban Grey Hoodie"
                    />
                  </div>

                  <div className="new-in-info">
                    <p className="new-in-name">URBAN GREY HOODIE</p>
                    <span className="new-in-price">₹3,999</span>
                  </div>
                </Link>

                {/* CARD 3 */}
                <Link
                  href="/products/cargo-street-pants"
                  className="new-in-card card-three"
                >
                  <div className="new-in-image">
                    <img
                      src="/cargo-pants.jfif"
                      alt="Cargo Street Pants"
                    />
                  </div>

                  <div className="new-in-info">
                    <p className="new-in-name">CARGO STREET PANTS</p>
                    <span className="new-in-price">₹3,499</span>
                  </div>
                </Link>

                {/* CARD 4 */}
                <Link
                  href="/products/classic-white-tee"
                  className="new-in-card card-four"
                >
                  <div className="new-in-image">
                    <img
                      src="/white-tee.jfif"
                      alt="Classic White Tee"
                    />
                  </div>

                  <div className="new-in-info">
                    <p className="new-in-name">CLASSIC WHITE TEE</p>
                    <span className="new-in-price">₹1,999</span>
                  </div>
                </Link>

                {/* DUPLICATE FOR INFINITE LOOP */}
                <Link
                  href="/products/oversized-black-tee"
                  className="new-in-card card-one"
                >
                  <div className="new-in-image">
                    <img
                      src="/black-tee.jfif"
                      alt="Oversized Black Tee"
                    />
                  </div>

                  <div className="new-in-info">
                    <p className="new-in-name">OVERSIZED BLACK TEE</p>
                    <span className="new-in-price">₹2,499</span>
                  </div>
                </Link>

                <Link
                  href="/products/urban-grey-hoodie"
                  className="new-in-card card-two"
                >
                  <div className="new-in-image">
                    <img
                      src="/grey-hoodie.jfif"
                      alt="Urban Grey Hoodie"
                    />
                  </div>

                  <div className="new-in-info">
                    <p className="new-in-name">URBAN GREY HOODIE</p>
                    <span className="new-in-price">₹3,999</span>
                  </div>
                </Link>

                <Link
                  href="/products/cargo-street-pants"
                  className="new-in-card card-three"
                >
                  <div className="new-in-image">
                    <img
                      src="/cargo-pants.jfif"
                      alt="Cargo Street Pants"
                    />
                  </div>

                  <div className="new-in-info">
                    <p className="new-in-name">CARGO STREET PANTS</p>
                    <span className="new-in-price">₹3,499</span>
                  </div>
                </Link>

                <Link
                  href="/products/classic-white-tee"
                  className="new-in-card card-four"
                >
                  <div className="new-in-image">
                    <img
                      src="/white-tee.jfif"
                      alt="Classic White Tee"
                    />
                  </div>

                  <div className="new-in-info">
                    <p className="new-in-name">CLASSIC WHITE TEE</p>
                    <span className="new-in-price">₹1,999</span>
                  </div>
                </Link>
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