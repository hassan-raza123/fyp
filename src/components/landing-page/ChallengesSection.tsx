'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Shield, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

const solutions = [
  {
    icon: Shield,
    title: 'Simplified Management',
    description: 'Automate complex OBE calculations and reporting'
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'Real-time attainment calculation and analytics'
  },
  {
    icon: CheckCircle2,
    title: 'Complete Automation',
    description: 'From assessment to final OBE reports'
  }
];

export default function ChallengesSection() {
  return (
    <div className='py-24 bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <span 
            className='inline-block px-4 py-2 rounded-full font-semibold text-sm mb-4'
            style={{ 
              backgroundColor: 'var(--brand-primary-opacity-10)',
              color: 'var(--brand-primary)'
            }}
          >
            SMART SOLUTIONS
          </span>
          <h2 className='text-4xl md:text-5xl font-extrabold mb-4' style={{ color: 'var(--text-heading)' }}>
            Effortless OBE Implementation
          </h2>
          <div 
            className='w-24 h-1.5 mx-auto rounded-full mb-6'
            style={{ 
              background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))'
            }}
          ></div>
          <p className='text-xl max-w-2xl mx-auto' style={{ color: 'var(--text-body)' }}>
            Eliminate manual work with intelligent automation
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
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
                src='/info-images/Challenges-of-Outcome-Based-Education-L-650x650.webp'
                alt='OBE Solutions'
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
                  className='group bg-white rounded-2xl p-6 border-2 transition-all duration-300'
                  style={{ borderColor: 'var(--gray-200)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brand-primary)';
                    e.currentTarget.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gray-200)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className='flex items-start gap-4'>
                    <div 
                      className='w-14 h-14 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0'
                      style={{ 
                        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))'
                      }}
                    >
                      <IconComponent className='w-7 h-7 text-white' />
                    </div>
                    <div className='flex-1'>
                      <h3 
                        className='text-xl font-bold mb-2 transition-colors'
                        style={{ color: 'var(--text-heading)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--brand-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-heading)';
                        }}
                      >
                        {solution.title}
                      </h3>
                      <p className='leading-relaxed' style={{ color: 'var(--text-body)' }}>
                        {solution.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* CTA Card */}
            <div 
              className='relative overflow-hidden rounded-2xl p-8 shadow-xl'
              style={{ 
                background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))'
              }}
            >
              <div className='absolute inset-0 bg-[url("/grid.svg")] opacity-10'></div>
              <div className='relative'>
                <h4 className='text-xl font-bold text-white mb-3'>
                  Ready to Get Started?
                </h4>
                <p className='text-white/90 mb-6'>
                  Join institutions using EduTrack for seamless OBE management
                </p>
                <Link
                  href='/#portal'
                  className='inline-flex items-center px-6 py-3 rounded-xl bg-white font-bold transition-all duration-300 shadow-lg hover:shadow-2xl'
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Access Portal
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
