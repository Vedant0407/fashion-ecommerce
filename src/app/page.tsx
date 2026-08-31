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

          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>

          <div className="hero-overlay" />

          <div className="hero-content">

            <p className="hero-label">
              GREENO / 2026
            </p>

            <h1>
              WEAR
              <br />
              YOUR
              <br />
              ATTITUDE
            </h1>

            <p className="hero-subtitle">
              PREMIUM STREETWEAR
            </p>

            <a
              href="/shop"
              className="hero-button"
            >
              SHOP NOW
            </a>

          </div>

          <div className="hero-scroll">
            <span>SCROLL</span>
            <span className="hero-arrow">↓</span>
          </div>

        </section>


        {/* =========================
            NEW IN
        ========================= */}

        <section className="new-in-section">

          <div className="new-in-heading">

            <p>
              GREENO / NEW IN
            </p>

            <h2>
              NEW IN
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

      </main>
    </>
  );
}