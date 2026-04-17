import { HeroSection } from '../../components/landing/HeroSection';
import { ToolShowcaseSection } from '../../components/landing/ToolShowcaseSection';
import { ValuePropsSection } from '../../components/landing/ValuePropsSection';
import { FeatureWishlistSection } from '../../components/landing/FeatureWishlistSection';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <ToolShowcaseSection />
      <ValuePropsSection />
      <FeatureWishlistSection />
    </>
  );
}
