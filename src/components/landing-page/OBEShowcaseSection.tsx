'use client';

import Image from 'next/image';
import { Target, Award, BarChart3, Zap, Workflow, RefreshCw, GitBranch } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const showcaseItems = [
  {
    id: 'benefits',
    title: 'Why EduTrack?',
    subtitle: 'Smart OBE Management',
    image: '/info-images/Benefits-of-Outcome-Based-Education-L-650x650.webp',
    icon: Zap,
    features: [
      { icon: Target, text: 'Automated CLO & PLO Tracking' },
      { icon: BarChart3, text: 'Real-time Analytics & Reports' },
      { icon: Award, text: 'Smart Outcome Mapping' },
      { icon: Zap, text: 'Paperless Assessment System' }
    ]
  },
  {
    id: 'framework',
    title: 'PDCA Framework',
    subtitle: 'How EduTrack Works',
    image: '/info-images/Outcome-based-education-OBE-framework-consistency-with-PDCAPlan-Do-Check-Act-principle.png',
    icon: Workflow,
    features: [
      { icon: Workflow, text: 'Plan: Define CLOs & PLOs' },
      { icon: Target, text: 'Do: Conduct Assessments' },
      { icon: BarChart3, text: 'Check: Analyze Performance' },
      { icon: RefreshCw, text: 'Act: Improve Curriculum' }
    ]
  },
  {
    id: 'mapping',
    title: 'CLO-PLO Mapping',
    subtitle: 'Intelligent Outcome Alignment',
    image: '/info-images/CO-PO-Mapping-Process.jpg',
    icon: GitBranch,
    features: [
      { icon: Target, text: 'Automated CLO Tracking' },
      { icon: GitBranch, text: 'Real-time PLO Alignment' },
      { icon: Award, text: 'Instant Attainment %' },
      { icon: BarChart3, text: 'Dynamic Analytics' }
    ]
  }
];

export default function OBEShowcaseSection() {
  const [activeTab, setActiveTab] = useState('benefits');
  const [isInView, setIsInView] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const activeItem = showcaseItems.find(item => item.id === activeTab) || showcaseItems[0];
  const IconComponent = activeItem.icon;

  // Intersection Observer for scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '0px'
      }
    );

    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => {
      if (contentRef.current) {
        observer.unobserve(contentRef.current);
      }
    };
  }, []);

  // Reset animation when tab changes
  useEffect(() => {
    setIsInView(false);
    const timer = setTimeout(() => setIsInView(true), 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  return (
    <div className='py-24 bg-white relative overflow-hidden'>
      {/* Decorative Background */}
      <div className='absolute inset-0 opacity-[0.03]' suppressHydrationWarning>
        <div className='absolute top-20 left-0 w-96 h-96 bg-brand-primary rounded-full blur-3xl' suppressHydrationWarning></div>
        <div className='absolute bottom-20 right-0 w-96 h-96 bg-brand-secondary rounded-full blur-3xl' suppressHydrationWarning></div>
      </div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <span 
            className='inline-block px-5 py-2.5 rounded-full font-semibold text-sm mb-6'
            style={{ 
              backgroundColor: 'var(--brand-primary-opacity-10)',
              color: 'var(--brand-primary)',
              border: '1px solid var(--brand-primary-opacity-20)'
            }}
          >
            OBE ECOSYSTEM
          </span>
          <h2 className='text-5xl md:text-6xl font-extrabold mb-4' style={{ color: 'var(--text-heading)' }}>
            Complete OBE Solution
          </h2>
          <p className='text-xl max-w-3xl mx-auto' style={{ color: 'var(--text-body)' }}>
            Everything you need for outcome-based education in one intelligent platform
          </p>
        </div>

        {/* Tab Navigation */}
        <div className='flex justify-center gap-4 mb-12 flex-wrap'>
          {showcaseItems.map((item) => {
            const TabIcon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className='group flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300'
                style={{
                  backgroundColor: activeTab === item.id ? 'var(--brand-primary)' : 'rgba(0, 0, 0, 0.03)',
                  color: activeTab === item.id ? 'white' : 'var(--text-body)',
                  border: activeTab === item.id ? 'none' : '2px solid rgba(0, 0, 0, 0.08)',
                  transform: activeTab === item.id ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: activeTab === item.id ? '0 8px 24px rgba(38, 40, 149, 0.25)' : 'none'
                }}
              >
                <TabIcon className='w-5 h-5' />
                <span className='font-bold text-base hidden sm:inline'>{item.title}</span>
              </button>
            );
          })}
        </div>

         {/* Content Area */}
         <div ref={contentRef} className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
           {/* Left - Image with Scroll Animation */}
           <div className='order-2 lg:order-1'>
             <div 
               className='relative group transition-all duration-1200 ease-out'
               style={{
                 opacity: isInView ? 1 : 0,
                 transform: isInView ? 'translateX(0)' : 'translateX(-100px)',
                 transitionDelay: '0.2s'
               }}
             >
              <div 
                className='absolute -inset-4 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity'
                style={{ 
                  background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))'
                }}
              ></div>
              <div className='relative bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-100 transform hover:scale-[1.02] transition-all duration-500'>
                <Image
                  src={activeItem.image}
                  alt={activeItem.title}
                  width={800}
                  height={600}
                  className='w-full h-auto'
                  priority
                />
               </div>
             </div>
           </div>

           {/* Right - Content with Scroll Animation */}
           <div className='order-1 lg:order-2'>
             <div 
               className='space-y-8 transition-all duration-1200 ease-out'
               style={{
                 opacity: isInView ? 1 : 0,
                 transform: isInView ? 'translateX(0)' : 'translateX(100px)',
                 transitionDelay: '0.4s'
               }}
             >
            {/* Title with Icon */}
            <div>
              <div 
                className='inline-flex items-center gap-3 px-4 py-2 rounded-xl mb-4'
                style={{ backgroundColor: 'var(--brand-secondary-opacity-10)' }}
              >
                <IconComponent className='w-6 h-6' style={{ color: 'var(--brand-secondary)' }} />
                <span className='text-sm font-bold uppercase tracking-wide' style={{ color: 'var(--brand-secondary)' }}>
                  {activeItem.subtitle}
                </span>
              </div>
              <h3 className='text-4xl font-bold mb-4' style={{ color: 'var(--text-heading)' }}>
                {activeItem.title}
              </h3>
            </div>

            {/* Features Grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {activeItem.features.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <div
                    key={index}
                    className='group flex items-start gap-3 p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg'
                    style={{ 
                      borderColor: 'var(--gray-200)',
                      backgroundColor: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--brand-primary)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--gray-200)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div 
                      className='w-10 h-10 rounded-lg flex items-center justify-center shrink-0'
                      style={{ 
                        background: index % 2 === 0 
                          ? 'var(--brand-primary)' 
                          : 'var(--brand-secondary)'
                      }}
                    >
                      <FeatureIcon className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <p className='text-sm font-semibold leading-relaxed' style={{ color: 'var(--text-heading)' }}>
                        {feature.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
           </div>
          </div>
        </div>
      </div>
    </div>
  );
}

