"use client";

import AtelierHero from "@/components/ui/AtelierHero";
import AtelierStoryTray from "@/components/ui/AtelierStoryTray";
import AtelierProductGrid from "@/components/ui/AtelierProductGrid";
import ConditionGrid from "@/components/ui/conditiongrid";
import AboutSection from "@/components/ui/AboutSection";

export default function HomePage() {
  return (
    <>
      <main className="home-page atelier-page">
        <AtelierHero />
        <AtelierStoryTray />
        <AtelierProductGrid />
        <ConditionGrid />
        <AboutSection />
      </main>
    </>
  );
}