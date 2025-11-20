'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Target, Zap, BarChart3, Users } from 'lucide-react';

const solutions = [
  {
    icon: Zap,
    title: 'Automated Calculations',
    description: 'Automatic CLO, PLO, and LLO attainment calculations with real-time updates for accurate OBE tracking.',
    color: 'var(--brand-secondary)'
  },
  {
    icon: Target,
    title: 'Centralized Management',
    description: 'All departments, programs, and courses managed in one unified system for the entire university.',
    color: 'var(--brand-primary)'
  },
  {
    icon: BarChart3,
    title: 'Comprehensive Reports',
    description: 'Generate detailed OBE reports, assessment analytics, and performance insights with a single click.',
    color: 'var(--brand-secondary)'
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    description: 'Faculty, students, and administrators each have tailored dashboards for efficient workflow.',
    color: 'var(--brand-primary)'
  }
];

export default function ChallengesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <div className='relative py-24 overflow-hidden'>
      {/* Background Image */}
      <div 
        className='absolute inset-0 bg-cover bg-center bg-no-repeat'
        style={{ 
          backgroundImage: "url('/bg/cs-prospective-bs.png')"
        }}
      ></div>
      
      {/* White Overlay */}
      <div 
        className='absolute inset-0'
        style={{ 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.70))'
        }}
      ></div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.6s ease-out forwards;
        }
      `}</style>

      {/* Decorative Background Elements */}
      <div className='absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-5' style={{ background: 'var(--brand-secondary)' }}></div>
      <div className='absolute bottom-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-5' style={{ background: 'var(--brand-primary)' }}></div>

      <div ref={sectionRef} className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className={`text-center mb-20 ${isVisible ? 'animate-fade-up' : 'opacity-0'}`}>
          <div className='inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6' 
            style={{ 
              backgroundColor: 'var(--brand-secondary-opacity-10)',
              border: '1px solid var(--brand-secondary-opacity-20)'
            }}
          >
            <Sparkles className='w-4 h-4' style={{ color: 'var(--brand-secondary)' }} />
            <span className='text-sm font-bold uppercase tracking-wider' style={{ color: 'var(--brand-secondary)' }}>
              Why Choose Us
            </span>
          </div>
          <h2 className='text-5xl md:text-6xl font-extrabold mb-6' style={{ color: 'var(--text-heading)' }}>
            Streamlined OBE
            <span className='block mt-2' style={{ color: 'var(--brand-secondary)' }}>For MNS UET</span>
          </h2>
          <p className='text-xl max-w-3xl mx-auto leading-relaxed' style={{ color: 'var(--text-body)' }}>
            A complete system designed to simplify outcome-based education management across all departments and programs.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {solutions.map((solution, index) => {
            const IconComponent = solution.icon;
            return (
              <div
                key={index}
                className={`group relative rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 ${isVisible ? 'animate-fade-up' : 'opacity-0'}`}
                style={{ 
                  backgroundColor: 'transparent',
                  border: `3px solid ${solution.color}`,
                  animationDelay: `${index * 0.1}s`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = `0 20px 40px ${solution.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                
                <div className='relative'>
                  {/* Icon */}
                  <div 
                    className='w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300'
                    style={{ 
                      backgroundColor: 'transparent',
                      border: `3px solid ${solution.color}`
                    }}
                  >
                    <IconComponent className='w-8 h-8' style={{ color: solution.color }} />
                  </div>
                  
                  {/* Content */}
                  <h3 className='text-2xl font-bold mb-3 group-hover:translate-x-1 transition-transform drop-shadow-lg' style={{ color: '#000000' }}>
                    {solution.title}
                  </h3>
                  <p className='text-base leading-relaxed font-semibold drop-shadow-md' style={{ color: '#000000' }}>
                    {solution.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
