import HeroSection from '@/components/landing-page/HeroSection';
import ParallaxShowcaseSection from '@/components/landing-page/ParallaxShowcaseSection';
import StatsSection from '@/components/landing-page/StatsSection';
import OBEOverviewSection from '@/components/landing-page/OBEOverviewSection';
import BenefitsSection from '@/components/landing-page/BenefitsSection';
import OBEFrameworkSection from '@/components/landing-page/OBEFrameworkSection';
import MappingProcessSection from '@/components/landing-page/MappingProcessSection';
import FeaturesSection from '@/components/landing-page/FeaturesSection';
import UserRolesSection from '@/components/landing-page/UserRolesSection';
import ChallengesSection from '@/components/landing-page/ChallengesSection';
import TeamSection from '@/components/landing-page/TeamSection';
import ContactSection from '@/components/landing-page/ContactSection';
import CTASection from '@/components/landing-page/CTASection';
import Footer from '@/components/landing-page/Footer';

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
      <UserRolesSection />
      <ChallengesSection />
      
      {/* Team & Contact */}
      <TeamSection />
      <ContactSection />
      <CTASection />
      
      <Footer />
    </div>
  );
}
