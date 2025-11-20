'use client';

import { features } from '@/constants/landing-page';

export default function FeaturesSection() {
  return (
    <div id="modules" className='relative py-24 overflow-hidden scroll-mt-20'>
      {/* Background Image - Fixed */}
      <div 
        className='absolute inset-0 bg-cover bg-center bg-fixed'
        style={{ 
          backgroundImage: "url('/bg/Newroom-Summer-Graduation-2023.webp')"
        }}
      ></div>
      
      {/* White Overlay */}
      <div 
        className='absolute inset-0'
        style={{ 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.70))'
        }}
      ></div>

      {/* Decorative Background Elements */}
      <div className='absolute top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-5' style={{ background: 'var(--brand-primary)' }}></div>
      <div className='absolute bottom-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-5' style={{ background: 'var(--brand-secondary)' }}></div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <div className='inline-block px-4 py-2 rounded-full font-semibold text-sm mb-4'
            style={{ 
              backgroundColor: 'transparent',
              border: '3px solid var(--brand-primary)',
              color: 'var(--brand-primary)'
            }}
          >
            FEATURES
          </div>
          <h2 className='text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-sm' style={{ color: 'var(--text-heading)' }}>
            System Features
          </h2>
          <p className='text-xl max-w-2xl mx-auto font-semibold drop-shadow-sm' style={{ color: 'var(--text-heading)' }}>
            Comprehensive tools for managing Outcome-Based Education at MNS UET
          </p>
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className='group rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300'
                style={{ 
                  backgroundColor: 'transparent',
                  border: '3px solid var(--brand-primary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(38, 40, 149, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                {/* Icon */}
                <div 
                  className='w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300'
                  style={{ 
                    backgroundColor: 'transparent',
                    border: '3px solid var(--brand-primary)'
                  }}
                >
                  <IconComponent className='h-7 w-7' style={{ color: 'var(--brand-primary)' }} />
                </div>
                
                <h3 className='text-xl font-bold mb-3 drop-shadow-sm transition-colors' style={{ color: '#000000' }}>
                  {feature.title}
                </h3>
                <p className='leading-relaxed font-semibold drop-shadow-sm' style={{ color: '#000000' }}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
