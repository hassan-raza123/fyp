import HeroSection from '@/components/landing-page/HeroSection';
import StatsSection from '@/components/landing-page/StatsSection';
import FeaturesSection from '@/components/landing-page/FeaturesSection';
import UserRolesSection from '@/components/landing-page/UserRolesSection';
import TeamSection from '@/components/landing-page/TeamSection';
import ContactSection from '@/components/landing-page/ContactSection';
import CTASection from '@/components/landing-page/CTASection';
import Footer from '@/components/landing-page/Footer';

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50'>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <UserRolesSection />
      <TeamSection />
      <ContactSection />
      <CTASection />
      <Footer />
    </div>
  );
}
