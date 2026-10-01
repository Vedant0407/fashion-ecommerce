import ThreeDHero from "@/components/ui/ThreeDHero";
import EditorialHero from "@/components/ui/EditorialHero";
import EditorialStorySection from "@/components/ui/EditorialStorySection";
import EditorialFooter from "@/components/ui/EditorialFooter";

export default function HomePage() {
  return (
    <main className="editorial-home-page">
      {/* 1. 3D T-Shirt Hero (Scroll-driven zoom in middle with back design turn) */}
      <ThreeDHero />

      {/* 2. Runway Carousel Hero (Continuous physical track with ghosted side looks) */}
      <EditorialHero />

      {/* 3. Editorial / Campaign Storytelling Section */}
      <EditorialStorySection />

      {/* 4. Footer */}
      <EditorialFooter />
    </main>
  );
}