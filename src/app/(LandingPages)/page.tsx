import HeroSection from '@/components/landing-page/HeroSection';
import UniversityStatsBar from '@/components/landing-page/UniversityStatsBar';
import OBEShowcaseSection from '@/components/landing-page/OBEShowcaseSection';
import FeaturesSection from '@/components/landing-page/FeaturesSection';
import StatsOverview from '@/components/landing-page/StatsOverview';
import TestimonialsSection from '@/components/landing-page/TestimonialsSection';
import TeamSection from '@/components/landing-page/TeamSection';
import CTASection from '@/components/landing-page/CTASection';
import Footer from '@/components/landing-page/Footer';
import FloatingChatButton from '@/components/landing-page/FloatingChatButton';
import BackToTopButton from '@/components/landing-page/BackToTopButton';

export default function LandingPage() {
  return (
    <div className='min-h-screen landing-section-gradient'>
      {/* Hero */}
      <HeroSection />
      
      {/* University Stats Bar */}
      <UniversityStatsBar />
      
      {/* OBE Showcase - Combined */}
      <OBEShowcaseSection />
      
      {/* Student Benefits & System Features */}
      <StatsOverview />
      <FeaturesSection />
      
      {/* Team & Portal Access */}
      <TeamSection />
      <CTASection />
      
      {/* Testimonials */}
      <TestimonialsSection />
      
      <Footer />
      
      {/* Floating Chat Button */}
      <FloatingChatButton />
      
      {/* Back to Top Button */}
      <BackToTopButton />
    </div>
  );
}
