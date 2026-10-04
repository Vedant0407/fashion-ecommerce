import StreetwearHero from "@/components/ui/StreetwearHero";
import ProductTrainSection from "@/components/ui/ProductTrainSection";
import StreetwearProductGrid from "@/components/ui/StreetwearProductGrid";
import EditorialStorySection from "@/components/ui/EditorialStorySection";
import EditorialFooter from "@/components/ui/EditorialFooter";

export default function HomePage() {
  return (
    <main className="streetwear-home-page">
      {/* 1. Cinematic Streetwear Hero (Concrete Brutalist Architecture with Fade to White) */}
      <StreetwearHero />

      {/* 2. Visual Lookbook Continuous Product Train */}
      <ProductTrainSection />

      {/* 3. Streetwear "SHIRTS" Product Catalog Grid (Desktop 3-col / Mobile 2-col) */}
      <StreetwearProductGrid />

      {/* 4. Editorial / Brand Manifesto & Craft Specifications */}
      <EditorialStorySection />

      {/* 5. Storefront Footer */}
      <EditorialFooter />
    </main>
  );
}