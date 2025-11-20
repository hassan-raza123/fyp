import HeroSection from '@/components/landing-page/HeroSection';
import ParallaxShowcaseSection from '@/components/landing-page/ParallaxShowcaseSection';
import StatsSection from '@/components/landing-page/StatsSection';
import OBEOverviewSection from '@/components/landing-page/OBEOverviewSection';
import BenefitsSection from '@/components/landing-page/BenefitsSection';
import OBEFrameworkSection from '@/components/landing-page/OBEFrameworkSection';
import MappingProcessSection from '@/components/landing-page/MappingProcessSection';
import FeaturesSection from '@/components/landing-page/FeaturesSection';
import ChallengesSection from '@/components/landing-page/ChallengesSection';
import TeamSection from '@/components/landing-page/TeamSection';
import CTASection from '@/components/landing-page/CTASection';
import Footer from '@/components/landing-page/Footer';
import FloatingChatButton from '@/components/landing-page/FloatingChatButton';
import BackToTopButton from '@/components/landing-page/BackToTopButton';

export default function LandingPage() {
  return (
    <div className='min-h-screen landing-section-gradient'>
      {/* Hero & Stats */}
      <HeroSection />
      <ParallaxShowcaseSection />
      <StatsSection />
      
      {/* OBE Educational Content */}
      <OBEOverviewSection />
      <BenefitsSection />
      <OBEFrameworkSection />
      <MappingProcessSection />
      
      {/* System Features */}
      <FeaturesSection />
      <ChallengesSection />
      
      {/* Team & Portal Access */}
      <TeamSection />
      <CTASection />
      
      <Footer />
      
      {/* Floating Chat Button */}
      <FloatingChatButton />
      
      {/* Back to Top Button */}
      <BackToTopButton />
    </div>
  );
}
