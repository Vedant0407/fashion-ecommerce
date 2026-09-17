"use client";

import { LuminaInteractiveList } from "@/components/ui/lumina-interactive-list";

export default function AtelierHero() {
  return (
    <section className="atelier-hero-section">
      <div className="atelier-hero-frame">
        <div className="atelier-hero-image-wrap">
          {/* Interactive WebGL Liquid Glass Slider */}
          <LuminaInteractiveList />
        </div>
      </div>
    </section>
  );
}

