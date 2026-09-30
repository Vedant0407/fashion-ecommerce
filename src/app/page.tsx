"use client";

import EditorialHero from "@/components/ui/EditorialHero";
import EditorialNewIn from "@/components/ui/EditorialNewIn";
import OrganicCategorySection from "@/components/ui/OrganicCategorySection";
import EditorialTrending from "@/components/ui/EditorialTrending";
import EditorialStorySection from "@/components/ui/EditorialStorySection";
import EditorialFooter from "@/components/ui/EditorialFooter";

export default function HomePage() {
  return (
    <main className="editorial-home-page">
      {/* 2. Full-screen Hero */}
      <EditorialHero />

      {/* 3. New In / Latest Collection (Asymmetric Magazine Grid) */}
      <EditorialNewIn />

      {/* 4. Category Section (Large Circular / Organic Visuals) */}
      <OrganicCategorySection />

      {/* 5. Trending Products (Stacked Editorial Composition) */}
      <EditorialTrending />

      {/* 6. Editorial / Campaign Storytelling Section */}
      <EditorialStorySection />

      {/* 7. Footer */}
      <EditorialFooter />
    </main>
  );
}