import TypewriterText from "@/components/ui/TypewriterText";
import TrendingProducts from "@/components/ui/TrendingProducts";
import GreenOFlare from "@/components/ui/GreenOFlare";
import CategoryGallery from "@/components/ui/CategoryGallery";
import ProductsGrid from "@/components/ui/ProductsGrid";
import AboutSection from "@/components/ui/AboutSection";
import Header from "@/components/Header";

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="home-page">

                {/* =========================
            HERO
        ========================= */}

        <section className="hero-section">

          {/* EXISTING VIDEO — DON'T CHANGE */}

          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source
              src="/hero.mp4"
              type="video/mp4"
            />
          </video>

          {/* Subtle dark layer */}

          <div className="hero-dark-overlay" />

          {/* Light rendering */}

          <GreenOFlare />

          {/* Brand */}

          <div className="greeno-logo-wrapper">

            <div className="greeno-logo">
              GreenO
            </div>

            {/* Animated cursor */}

            <div className="greeno-cursor">
              <div className="cursor-arrow" />
            </div>

          </div>

        </section>


        {/* =========================
            NEW IN
        ========================= */}

        <section className="new-in-section">

          <div className="new-in-heading">
  <h2>
  <TypewriterText text="NEW IN" />
</h2>
</div>


          <div className="new-in-marquee">

            <div className="new-in-track">

              {/* CARD 1 */}

              <a
                href="/products/oversized-black-tee"
                className="new-in-card card-one"
              >

                <div className="new-in-image">
                  <img
                    src="/products/black-tee.jfif"
                    alt="Oversized Black Tee"
                  />
                </div>

                <div className="new-in-info">
                  <p>
                    OVERSIZED BLACK TEE
                  </p>

                  <span>
                    ₹2,499
                  </span>
                </div>

              </a>


              {/* CARD 2 */}

              <a
                href="/products/urban-grey-hoodie"
                className="new-in-card card-two"
              >

                <div className="new-in-image">
                  <img
                    src="/products/grey-hoodie.webp"
                    alt="Urban Grey Hoodie"
                  />
                </div>

                <div className="new-in-info">
                  <p>
                    URBAN GREY HOODIE
                  </p>

                  <span>
                    ₹3,999
                  </span>
                </div>

              </a>


              {/* CARD 3 */}

              <a
                href="/products/cargo-street-pants"
                className="new-in-card card-three"
              >

                <div className="new-in-image">
                  <img
                    src="/products/cargo-pants.jfif"
                    alt="Cargo Street Pants"
                  />
                </div>

                <div className="new-in-info">
                  <p>
                    CARGO STREET PANTS
                  </p>

                  <span>
                    ₹3,499
                  </span>
                </div>

              </a>


              {/* CARD 4 */}

              <a
                href="/products/classic-white-tee"
                className="new-in-card card-four"
              >

                <div className="new-in-image">
                  <img
                    src="/products/white-tee.webp"
                    alt="Classic White Tee"
                  />
                </div>

                <div className="new-in-info">
                  <p>
                    CLASSIC WHITE TEE
                  </p>

                  <span>
                    ₹1,999
                  </span>
                </div>

              </a>


              {/* DUPLICATE FOR INFINITE LOOP */}

              <a
                href="/products/oversized-black-tee"
                className="new-in-card card-one"
              >

                <div className="new-in-image">
                  <img
                    src="/products/black-tee.jfif"
                    alt="Oversized Black Tee"
                  />
                </div>

                <div className="new-in-info">
                  <p>
                    OVERSIZED BLACK TEE
                  </p>

                  <span>
                    ₹2,499
                  </span>
                </div>

              </a>


              <a
                href="/products/urban-grey-hoodie"
                className="new-in-card card-two"
              >

                <div className="new-in-image">
                  <img
                    src="/products/grey-hoodie.webp"
                    alt="Urban Grey Hoodie"
                  />
                </div>

                <div className="new-in-info">
                  <p>
                    URBAN GREY HOODIE
                  </p>

                  <span>
                    ₹3,999
                  </span>
                </div>

              </a>


              <a
                href="/products/cargo-street-pants"
                className="new-in-card card-three"
              >

                <div className="new-in-image">
                  <img
                    src="/products/cargo-pants.jfif"
                    alt="Cargo Street Pants"
                  />
                </div>

                <div className="new-in-info">
                  <p>
                    CARGO STREET PANTS
                  </p>

                  <span>
                    ₹3,499
                  </span>
                </div>

              </a>


              <a
                href="/products/classic-white-tee"
                className="new-in-card card-four"
              >

                <div className="new-in-image">
                  <img
                    src="/products/white-tee.webp"
                    alt="Classic White Tee"
                  />
                </div>

                <div className="new-in-info">
                  <p>
                    CLASSIC WHITE TEE
                  </p>

                  <span>
                    ₹1,999
                  </span>
                </div>

              </a>

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