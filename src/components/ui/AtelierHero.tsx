"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LuminaInteractiveList } from "@/components/ui/lumina-interactive-list";

export default function AtelierHero() {
  return (
    <section className="atelier-hero-section">
      <div className="atelier-hero-frame">
        <div className="atelier-hero-image-wrap">
          {/* Interactive WebGL Liquid Glass Slider */}
          <LuminaInteractiveList />

          {/* Top-Right Quick Explore Action */}
          <div className="atelier-hero-cta-banner">
            <Link href="#catalog" className="atelier-hero-link">
              <span>EXPLORE PIECES</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

