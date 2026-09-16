"use client";

import AtelierHero from "@/components/ui/AtelierHero";
import AtelierProductGrid from "@/components/ui/AtelierProductGrid";
import AboutSection from "@/components/ui/AboutSection";

export default function HomePage() {
  return (
    <>
      <main className="home-page atelier-page">
        <AtelierHero />
        <AtelierProductGrid />
        <AboutSection />
      </main>
    </>
  );
}