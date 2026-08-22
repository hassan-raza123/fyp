import HeroSection from '@/components/landing-page/HeroSection';
import HowItWorksSection from '@/components/landing-page/UniversityStatsBar';
import OBEShowcaseSection from '@/components/landing-page/OBEShowcaseSection';
import RolesSection from '@/components/landing-page/StatsOverview';
import FeaturesSection from '@/components/landing-page/FeaturesSection';
import CTASection from '@/components/landing-page/CTASection';
import Footer from '@/components/landing-page/Footer';
import FloatingChatButton from '@/components/landing-page/FloatingChatButton';
import BackToTopButton from '@/components/landing-page/BackToTopButton';

/**
 * The marketing page.
 *
 * The argument runs: here is the problem (hero) → here is the shape of the
 * fix (how it works) → here is how the fix actually works (showcase) → here
 * is what it means for you specifically (roles) → here is everything in the
 * box (modules) → here is what to do next (CTA).
 *
 * What it used to run was closer to: here is the problem → here are three
 * roles → here is a diagram of OBE as a concept → here are six things
 * students can do → here are six modules → here are the same three roles
 * again. Three of those six sections made substantially the same claim, and
 * two of them made it with the same three cards.
 *
 * A testimonials section lived between the modules and the footer carrying
 * six invented quotes attributed to named students, and a team section naming
 * the project authors and their academic supervisor. Both were fine for a
 * project demo and are not fine on a page that sells the product: the quotes
 * were fabricated customer reviews, and the supervisor had not agreed to
 * endorse anything. Bring testimonials back only with real, sourced quotes
 * from a real customer.
 */
export default function LandingPage() {
  return (
    <div className='min-h-screen'>
      <HeroSection />
      <HowItWorksSection />
      <OBEShowcaseSection />
      <RolesSection />
      <FeaturesSection />
      <CTASection />
      <Footer />

      <FloatingChatButton />
      <BackToTopButton />
    </div>
  );
}
