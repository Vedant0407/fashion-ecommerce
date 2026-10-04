import StreetwearHero from "@/components/ui/StreetwearHero";
import ProductTrainSection from "@/components/ui/ProductTrainSection";
import StreetwearCampaignSection from "@/components/ui/StreetwearCampaignSection";
import EditorialStorySection from "@/components/ui/EditorialStorySection";
import EditorialFooter from "@/components/ui/EditorialFooter";

export default function HomePage() {
  return (
    <main className="streetwear-home-page">
      {/* 1. Cinematic Streetwear Hero (Concrete Brutalist Architecture with Fade to White) */}
      <StreetwearHero />

      {/* 2. "See Our Products:" Horizontal Continuous Product Train */}
      <ProductTrainSection />

      {/* 3. Brutalist Campaign Lookbook Section (Split Grid / Mobile Overlay) */}
      <StreetwearCampaignSection />

      {/* 4. Editorial / Brand Manifesto & Craft Specifications */}
      <EditorialStorySection />

      {/* 5. Storefront Footer */}
      <EditorialFooter />
    </main>
  );
}