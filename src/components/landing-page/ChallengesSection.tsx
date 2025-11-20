import Image from 'next/image';
import { Shield, Zap, CheckCircle2 } from 'lucide-react';

const solutions = [
  {
    icon: Shield,
    title: 'Simplified Management',
    description: 'Our system automates complex OBE processes, making implementation straightforward and efficient'
  },
  {
    icon: Zap,
    title: 'Quick Adaptation',
    description: 'User-friendly interface ensures faculty and students can adapt quickly without extensive training'
  },
  {
    icon: CheckCircle2,
    title: 'Comprehensive Support',
    description: 'Built-in guidance and automated reports help overcome traditional OBE challenges'
  }
];

export default function ChallengesSection() {
  return (
    <div className='relative py-24 bg-white overflow-hidden'>
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('/info-images/photo1.png')] bg-cover bg-center opacity-4 blur-sm" />
      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <div className='inline-block px-4 py-2 rounded-full landing-badge font-semibold text-sm mb-4'>
            OUR SOLUTION
          </div>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            Overcoming OBE Challenges
          </h2>
          <p className='text-xl landing-text-body max-w-3xl mx-auto'>
            Smart Campus makes OBE implementation seamless and effective
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
          {/* Left - Image */}
          <div className='order-2 lg:order-1'>
            <div className='relative group'>
              <div className='absolute -inset-4 landing-decorative-blur-1 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500'></div>
              <div className='relative landing-card rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-all duration-500'>
                <Image
                  src='/info-images/Challenges-of-Outcome-Based-Education-L-650x650.webp'
                  alt='Challenges of Outcome Based Education'
                  width={650}
                  height={650}
                  className='w-full h-auto object-cover'
                />
              </div>
            </div>
          </div>

          {/* Right - Solutions */}
          <div className='space-y-6 order-1 lg:order-2'>
            {solutions.map((solution, index) => {
              const IconComponent = solution.icon;
              return (
                <div
                  key={index}
                  className='group landing-card rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1'
                >
                  <div className='flex items-start space-x-4'>
                    <div className='landing-icon-bg rounded-xl p-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-300'>
                      <IconComponent className='h-8 w-8 text-white' />
                    </div>
                    <div>
                      <h3 className='text-2xl font-bold landing-text-heading mb-3'>
                        {solution.title}
                      </h3>
                      <p className='landing-text-body text-lg leading-relaxed'>
                        {solution.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* CTA */}
            <div className='landing-card-gradient rounded-2xl shadow-xl p-8 border-2 border-blue-200'>
              <p className='text-lg landing-text-heading font-semibold mb-4'>
                Ready to transform your institution's OBE implementation?
              </p>
              <p className='landing-text-body mb-6'>
                Join hundreds of educators already using Smart Campus to streamline their outcome-based education processes.
              </p>
              <a
                href='/#contact'
                className='inline-block landing-cta-btn px-8 py-3 rounded-xl font-bold shadow-lg'
              >
                Get Started Today
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

