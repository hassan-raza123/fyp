import Image from 'next/image';
import { CheckCircle2, TrendingUp, Users2, Sparkles } from 'lucide-react';

const benefits = [
  { icon: TrendingUp, title: 'Enhanced Learning', desc: 'Structured curriculum aligned with industry standards' },
  { icon: Users2, title: 'Career Ready', desc: 'Practical skills valued by employers' },
  { icon: Sparkles, title: 'Transparent', desc: 'Clear assessment criteria and outcomes' },
  { icon: CheckCircle2, title: 'Data-Driven', desc: 'Insights for continuous improvement' }
];

export default function BenefitsSection() {
  return (
    <div className='py-24 bg-linear-to-b from-slate-50 to-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <span className='inline-block px-4 py-2 rounded-full landing-badge font-semibold text-sm mb-4'>
            BENEFITS
          </span>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            Why Choose OBE?
          </h2>
          <p className='text-xl landing-text-body max-w-2xl mx-auto'>
            Experience the advantages of modern education
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
          {/* Left - Image */}
          <div className='order-2 lg:order-1'>
            <div className='relative'>
              <div className='absolute inset-0 bg-linear-to-br from-cyan-100 to-blue-100 rounded-3xl transform -rotate-3'></div>
              <div className='relative bg-white rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-100'>
                <Image
                  src='/info-images/Benefits-of-Outcome-Based-Education-L-650x650.webp'
                  alt='Benefits of OBE'
                  width={650}
                  height={650}
                  className='w-full h-auto'
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
                  className='bg-white rounded-xl p-6 border border-slate-200 hover:border-brand-primary hover:shadow-lg transition-all duration-300'
                >
                  <div className='w-12 h-12 rounded-lg brand-gradient flex items-center justify-center mb-4 shadow-md'>
                    <IconComponent className='h-6 w-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold landing-text-heading mb-2'>
                    {benefit.title}
                  </h3>
                  <p className='landing-text-body text-sm'>
                    {benefit.desc}
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
