import StreetwearHero from "@/components/ui/StreetwearHero";
import ProductTrainSection from "@/components/ui/ProductTrainSection";
import StreetwearProductGrid from "@/components/ui/StreetwearProductGrid";
import StreetwearQuoteSection from "@/components/ui/StreetwearQuoteSection";
import StreetwearTestimonialsSection from "@/components/ui/StreetwearTestimonialsSection";
import EditorialFooter from "@/components/ui/EditorialFooter";

export default function HomePage() {
  return (
    <main className="streetwear-home-page">
      {/* 1. Cinematic Streetwear Hero (Concrete Brutalist Architecture with Fade to White) */}
      <StreetwearHero />

      {/* 2. Visual Lookbook Continuous Product Train */}
      <ProductTrainSection />

      {/* 3. Streetwear "SEE OUR PRODUCTS" Product Catalog Grid (Desktop 3-col / Mobile 2-col) */}
      <StreetwearProductGrid />

      {/* 4. Atmospheric Full-Screen Editorial Photo & Brand Manifesto Quote */}
      <StreetwearQuoteSection />

      {/* 5. Verified Community Testimonials */}
      <StreetwearTestimonialsSection />

      {/* 6. Storefront Footer */}
      <EditorialFooter />
    </main>
  );
}