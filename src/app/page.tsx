import ThreeDHero from "@/components/ui/ThreeDHero";
import DualPaneShowcase from "@/components/ui/DualPaneShowcase";
import EditorialStorySection from "@/components/ui/EditorialStorySection";
import EditorialFooter from "@/components/ui/EditorialFooter";

export default function HomePage() {
  return (
    <main className="editorial-home-page">
      {/* 1. 3D T-Shirt Hero (Scroll-driven zoom in middle with back design turn) */}
      <ThreeDHero />

      {/* 2. Dual-Pane Showcase (Left Model Photo, Right Scrollable Product Card) */}
      <DualPaneShowcase />

      {/* 3. Editorial / Campaign Storytelling Section */}
      <EditorialStorySection />

      {/* 4. Footer */}
      <EditorialFooter />
    </main>
  );
}