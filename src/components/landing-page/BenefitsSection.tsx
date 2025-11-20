'use client';

import Image from 'next/image';
import { Target, Award, BarChart3, Zap } from 'lucide-react';

const benefits = [
  { 
    icon: Target, 
    title: 'Outcome Tracking', 
    desc: 'Automated CLO & PLO attainment monitoring' 
  },
  { 
    icon: BarChart3, 
    title: 'Real-time Analytics', 
    desc: 'Instant performance insights and reports' 
  },
  { 
    icon: Award, 
    title: 'Automated Mapping', 
    desc: 'Smart course-program outcome alignment' 
  },
  { 
    icon: Zap, 
    title: 'Paperless System', 
    desc: 'Digital assessment and record management' 
  }
];

export default function BenefitsSection() {
  return (
    <div className='py-24 bg-linear-to-b from-slate-50 to-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <span 
            className='inline-block px-4 py-2 rounded-full font-semibold text-sm mb-4'
            style={{ 
              backgroundColor: 'var(--brand-secondary-opacity-10)',
              color: 'var(--brand-secondary)'
            }}
          >
            WHY EDUTRACK
          </span>
          <h2 className='text-4xl md:text-5xl font-extrabold mb-4' style={{ color: 'var(--text-heading)' }}>
            Smart OBE Management
          </h2>
          <p className='text-xl max-w-2xl mx-auto' style={{ color: 'var(--text-body)' }}>
            Streamline your institution's outcome-based education with automation
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
          {/* Left - Image */}
          <div className='order-2 lg:order-1'>
            <div className='relative'>
              <div 
                className='absolute inset-0 rounded-3xl transform -rotate-3'
                style={{ backgroundColor: 'var(--brand-primary-opacity-10)' }}
              ></div>
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
                  className='bg-white rounded-xl p-6 border-2 border-slate-100 hover:shadow-xl transition-all duration-300 group'
                  style={{
                    borderColor: 'var(--gray-200)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brand-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gray-200)';
                  }}
                >
                  <div 
                    className='w-12 h-12 rounded-lg flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform'
                    style={{ 
                      background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))'
                    }}
                  >
                    <IconComponent className='h-6 w-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold mb-2' style={{ color: 'var(--text-heading)' }}>
                    {benefit.title}
                  </h3>
                  <p className='text-sm' style={{ color: 'var(--text-body)' }}>
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
