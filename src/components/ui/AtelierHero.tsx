"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function AtelierHero() {
  return (
    <section className="atelier-hero-section">
      <div className="atelier-hero-frame">
        {/* Editorial Photo */}
        <div className="atelier-hero-image-wrap">
          <img
            src="/atelier-hero.jpg"
            alt="GreenO Atelier — SS26 Campaign"
            className="atelier-hero-img"
            loading="eager"
          />
          <div className="atelier-hero-overlay" />

          {/* Bottom-Left Editorial Text Overlay */}
          <div className="atelier-hero-meta">
            <span className="atelier-hero-season">SS'26 — II</span>
            <p className="atelier-hero-desc">
              Every silhouette has been crafted with heavyweight texture, architectural proportion, and timeless drape.
            </p>
            <Link href="#catalog" className="atelier-hero-link">
              <span>VIEW THE COLLECTION</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Bottom-Right Minimalist Indicator */}
          <div className="atelier-hero-indicator">
            <span className="atelier-hero-index">01 &mdash; 04</span>
            <span className="atelier-hero-scroll">SCROLL &#8595;</span>
          </div>
        </div>

        {/* Under-Hero Atelier Brandmark Banner */}
        <div className="atelier-brand-banner">
          <div className="atelier-brand-main">
            <h1 className="atelier-brand-title font-serif">GREENO ATELIER</h1>
            <p className="atelier-brand-subtitle">Crafted for those who know.</p>
          </div>
          <div className="atelier-brand-purity">
            <span>PARIS / NEW DELHI</span>
            <span>&bull;</span>
            <span>LIMITED PRODUCTION RUNS</span>
          </div>
        </div>
      </div>
    </section>
  );
}
