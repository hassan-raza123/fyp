import HeroSection from '@/components/landing-page/HeroSection';
import UniversityStatsBar from '@/components/landing-page/UniversityStatsBar';
import OBEShowcaseSection from '@/components/landing-page/OBEShowcaseSection';
import FeaturesSection from '@/components/landing-page/FeaturesSection';
import StatsOverview from '@/components/landing-page/StatsOverview';
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
      
      {/* Portal Access */}
      <CTASection />

      {/* A testimonials section lived here carrying six invented quotes
          attributed to named students, and a team section naming the project
          authors and their academic supervisor. Both were fine for a project
          demo and are not fine on a page that sells the product: the quotes
          were fabricated customer reviews, and the supervisor had not agreed
          to endorse anything. Bring testimonials back only with real, sourced
          quotes from a real customer. */}

      <Footer />
      
      {/* Floating Chat Button */}
      <FloatingChatButton />
      
      {/* Back to Top Button */}
      <BackToTopButton />
    </div>
  );
}
