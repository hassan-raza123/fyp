import Image from 'next/image';
import Link from 'next/link';
import { Shield, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

const solutions = [
  {
    icon: Shield,
    title: 'Simplified Management',
    description: 'Automates complex OBE processes for efficient implementation'
  },
  {
    icon: Zap,
    title: 'Quick Adaptation',
    description: 'Intuitive interface ensures rapid onboarding and adoption'
  },
  {
    icon: CheckCircle2,
    title: 'Complete Support',
    description: 'Built-in guidance and automated reporting system'
  }
];

export default function ChallengesSection() {
  return (
    <div className='py-24 bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <span className='inline-block px-4 py-2 rounded-full landing-badge font-semibold text-sm mb-4'>
            SOLUTIONS
          </span>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            Overcoming Challenges
          </h2>
          <div className='w-24 h-1.5 brand-gradient mx-auto rounded-full mb-6'></div>
          <p className='text-xl landing-text-body max-w-2xl mx-auto'>
            Making OBE implementation seamless and effective
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
          {/* Left - Image */}
          <div className='relative'>
            <div className='absolute -inset-4 brand-gradient rounded-3xl blur-2xl opacity-20'></div>
            <div className='relative bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-100 transform hover:scale-105 transition-all duration-500'>
              <Image
                src='/info-images/Challenges-of-Outcome-Based-Education-L-650x650.webp'
                alt='OBE Challenges'
                width={650}
                height={650}
                className='w-full h-auto'
              />
            </div>
          </div>

          {/* Right - Solutions */}
          <div className='space-y-6'>
            {solutions.map((solution, index) => {
              const IconComponent = solution.icon;
              return (
                <div
                  key={index}
                  className='group bg-white rounded-2xl p-6 border-2 border-slate-100 hover:border-brand-primary hover:shadow-xl transition-all duration-300'
                >
                  <div className='flex items-start gap-4'>
                    <div className='w-14 h-14 rounded-xl brand-gradient flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0'>
                      <IconComponent className='w-7 h-7 text-white' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='text-xl font-bold landing-text-heading mb-2 group-hover:text-brand-primary transition-colors'>
                        {solution.title}
                      </h3>
                      <p className='landing-text-body leading-relaxed'>
                        {solution.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* CTA Card */}
            <div className='relative overflow-hidden bg-linear-to-br from-brand-primary-dark to-brand-secondary rounded-2xl p-8 shadow-xl'>
              <div className='absolute inset-0 bg-[url("/grid.svg")] opacity-10'></div>
              <div className='relative'>
                <h4 className='text-xl font-bold text-white mb-3'>
                  Ready to Transform Your Institution?
                </h4>
                <p className='text-brand-secondary-light mb-6'>
                  Join educators already using EduTrack for seamless OBE management.
                </p>
                <Link
                  href='/#contact'
                  className='inline-flex items-center px-6 py-3 rounded-xl bg-white text-brand-primary font-bold hover:bg-[#f4f1ff] transition-all duration-300 shadow-lg'
                >
                  Get Started
                  <ArrowRight className='ml-2 w-5 h-5' />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
