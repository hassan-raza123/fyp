'use client';

import Image from 'next/image';
import Link from 'next/link';
import { GitBranch, Target, Award, BarChart3, Zap, ArrowRight } from 'lucide-react';

const mappingFeatures = [
  {
    icon: Target,
    title: 'CLO Tracking',
    description: 'Course Learning Outcomes mapping',
    stats: 'Automated',
  },
  {
    icon: GitBranch,
    title: 'PLO Alignment',
    description: 'Program Learning Outcomes linking',
    stats: 'Real-time',
  },
  {
    icon: Award,
    title: 'Attainment %',
    description: 'Calculate achievement levels',
    stats: 'Instant',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Visual reports & insights',
    stats: 'Dynamic',
  }
];

export default function MappingProcessSection() {
  return (
    <div className='py-24 bg-white'>
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
            OUTCOME MAPPING
          </span>
          <h2 className='text-4xl md:text-5xl font-extrabold mb-4' style={{ color: 'var(--text-heading)' }}>
            Intelligent CLO-PLO Mapping
          </h2>
          <div 
            className='w-24 h-1.5 mx-auto rounded-full mb-6'
            style={{ 
              background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))'
            }}
          ></div>
          <p className='text-xl max-w-2xl mx-auto' style={{ color: 'var(--text-body)' }}>
            Seamlessly connect course outcomes to program objectives
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16'>
          {/* Left - Image */}
          <div className='relative'>
            <div 
              className='absolute -inset-4 rounded-3xl blur-2xl opacity-20'
              style={{ 
                background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))'
              }}
            ></div>
            <div className='relative bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-100 transform hover:scale-105 transition-all duration-500'>
              <Image
                src='/info-images/CO-PO-Mapping-Process.jpg'
                alt='CLO-PLO Mapping'
                width={800}
                height={600}
                className='w-full h-auto'
              />
            </div>
          </div>

          {/* Right - Features */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {mappingFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className='group bg-white rounded-2xl p-6 border-2 border-slate-100 hover:shadow-xl transition-all duration-300'
                  style={{ borderColor: 'var(--gray-200)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brand-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gray-200)';
                  }}
                >
                  <div
                    className='w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform'
                    style={{ 
                      background: index % 2 === 0 
                        ? 'var(--brand-primary)' 
                        : 'var(--brand-secondary)'
                    }}
                  >
                    <IconComponent className='w-6 h-6 text-white' />
                  </div>
                  <div 
                    className='text-sm font-bold mb-1'
                    style={{ color: 'var(--brand-primary)' }}
                  >
                    {feature.stats}
                  </div>
                  <h3 className='text-lg font-bold mb-2' style={{ color: 'var(--text-heading)' }}>
                    {feature.title}
                  </h3>
                  <p className='text-sm' style={{ color: 'var(--text-body)' }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA Card */}
        <div 
          className='relative overflow-hidden rounded-3xl p-12 shadow-2xl'
          style={{ 
            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))'
          }}
        >
          <div className='absolute inset-0 bg-[url("/grid.svg")] opacity-10'></div>
          <div className='relative max-w-3xl mx-auto text-center'>
            <Zap className='w-16 h-16 text-white mx-auto mb-6' />
            <h3 className='text-3xl font-bold text-white mb-4'>
              Automated Outcome Tracking
            </h3>
            <p className='text-white/90 text-lg mb-8'>
              Focus on teaching while EduTrack handles the complexity
            </p>
            <Link
              href='/#portal'
              className='inline-flex items-center px-8 py-4 rounded-xl bg-white font-bold hover:shadow-2xl transition-all duration-300 shadow-xl'
              style={{ color: 'var(--brand-primary)' }}
            >
              Access Portal
              <ArrowRight className='ml-2 w-5 h-5' />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
