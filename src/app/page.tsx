import TypewriterText from "@/components/ui/TypewriterText";
import TrendingProducts from "@/components/ui/TrendingProducts";
import GreenOTshirt3D from "@/components/ui/GreenOTshirt3D";
import CategoryGallery from "@/components/ui/CategoryGallery";
import ProductsGrid from "@/components/ui/ProductsGrid";
import AboutSection from "@/components/ui/AboutSection";
import SpotlightCursor from "@/components/ui/SpotlightCursor";
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

  <img
    src="/hero.jfif"
    alt="GreenO"
    className="hero-video"
  />

  <GreenOTshirt3D />

  {/* Subtle dark layer */}
  <div className="hero-dark-overlay" />
  <SpotlightCursor />

</section>




        {/* =========================
            NEW IN
        ========================= */}

        <section className="new-in-section">

  <div className="new-in-wrapper">

    <div className="new-in-heading">
  <h2>
    <TypewriterText text="NEW IN" />
  </h2>
  <a href="/shop" className="discover-more">
    Discover more
  </a>
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