import Image from 'next/image';
import { CheckCircle2, TrendingUp, Users2, Sparkles } from 'lucide-react';

const benefits = [
  {
    icon: TrendingUp,
    title: 'Enhanced Learning Quality',
    description: 'Structured curriculum aligned with industry standards and professional requirements'
  },
  {
    icon: Users2,
    title: 'Better Career Outcomes',
    description: 'Students graduate with practical skills and competencies valued by employers'
  },
  {
    icon: Sparkles,
    title: 'Transparent Evaluation',
    description: 'Clear assessment criteria and measurable learning outcomes for fair grading'
  },
  {
    icon: CheckCircle2,
    title: 'Continuous Improvement',
    description: 'Data-driven insights help improve curriculum and teaching methodologies'
  }
];

export default function BenefitsSection() {
  return (
    <div className='relative py-24 landing-section-gradient overflow-hidden'>
      {/* Background Image with Light Overlay */}
      <div className="absolute inset-0 bg-[url('/bg/cs-prospective-bs.png')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/65 via-blue-50/65 to-slate-50/65" />
      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <div className='inline-block px-4 py-2 rounded-full landing-badge font-semibold text-sm mb-4'>
            WHY OBE?
          </div>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            Benefits of OBE System
          </h2>
          <p className='text-xl landing-text-body max-w-3xl mx-auto'>
            Experience the advantages of modern outcome-based education methodology
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
          {/* Left - Image */}
          <div className='order-2 lg:order-1'>
            <div className='relative group'>
              <div className='absolute -inset-4 landing-decorative-blur-2 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500'></div>
              <div className='relative landing-card rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-all duration-500'>
                <Image
                  src='/info-images/Benefits-of-Outcome-Based-Education-L-650x650.webp'
                  alt='Benefits of Outcome Based Education'
                  width={650}
                  height={650}
                  className='w-full h-auto object-cover'
                />
              </div>
            </div>
          </div>

          {/* Right - Benefits Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 order-1 lg:order-2'>
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div
                  key={index}
                  className='group landing-card rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2'
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className='landing-icon-bg rounded-xl p-3 w-14 h-14 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300'>
                    <IconComponent className='h-6 w-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold landing-text-heading mb-2'>
                    {benefit.title}
                  </h3>
                  <p className='landing-text-body text-sm leading-relaxed'>
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

