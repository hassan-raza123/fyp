'use client';

import Image from 'next/image';
import { Target, Award, BarChart3, Zap, Workflow, RefreshCw, GitBranch } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const showcaseItems = [
  {
    id: 'benefits',
    title: 'Why EduTrack?',
    subtitle: 'Smart OBE Management',
    image: '/info-images/obe-benefits.webp',
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
    image: '/info-images/pdca-framework.png',
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
    image: '/info-images/clo-plo-mapping.jpg',
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
  const [isVisible, setIsVisible] = useState(false);
  const [triggerAnimation, setTriggerAnimation] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  const activeItem = showcaseItems.find(item => item.id === activeTab) || showcaseItems[0];
  const IconComponent = activeItem.icon;

  // Intersection Observer for scroll detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setTriggerAnimation(prev => prev + 1);
        }
      },
      { threshold: 0.3 }
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

  // Re-trigger animation on tab change
  useEffect(() => {
    if (isVisible) {
      setTriggerAnimation(prev => prev + 1);
    }
  }, [activeTab, isVisible]);

  return (
    <div 
      id='obe-showcase'
      className='relative bg-fixed bg-center bg-cover py-24 overflow-hidden scroll-mt-20'
      style={{ backgroundImage: "url('/bg/obe-showcase-bg.webp')" }}
    >
      {/* Dark Overlay */}
      <div 
        className='absolute inset-0'
        style={{ 
          background: `linear-gradient(135deg, var(--overlay-slate-85), var(--overlay-dark-75))`
        }}
      ></div>

      <div className='relative'>
      <style jsx global>{`
        @keyframes slideInFromLeft {
          0% {
            opacity: 0;
            transform: translateX(-100px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInFromRight {
          0% {
            opacity: 0;
            transform: translateX(100px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slide-left {
          animation: slideInFromLeft 1s ease-out forwards;
        }
        
        .animate-slide-right {
          animation: slideInFromRight 1s ease-out 0.2s forwards;
          opacity: 0;
        }
      `}</style>


      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <span className='inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur text-sm font-semibold mb-4 text-white'>
            OBE ECOSYSTEM
          </span>
          <h2 className='text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight'>
            Complete OBE Solution
          </h2>
          <p className='text-xl max-w-2xl mx-auto' style={{ color: 'var(--white-opacity-90)' }}>
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
                className={`group flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 ${
                  activeTab === item.id 
                    ? 'bg-brand-secondary text-white scale-105 shadow-xl' 
                    : 'bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/15'
                }`}
              >
                <TabIcon className='w-5 h-5' />
                <span className='font-bold text-base hidden sm:inline'>{item.title}</span>
              </button>
            );
          })}
        </div>

         {/* Content Area */}
         <div ref={sectionRef} className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
           {/* Left - Image */}
           <div className='order-2 lg:order-1'>
             <div 
               key={`image-${triggerAnimation}`}
               className={`relative group ${isVisible ? 'animate-slide-left' : 'opacity-0'}`}
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

           {/* Right - Content */}
           <div className='order-1 lg:order-2'>
             <div 
               key={`content-${triggerAnimation}`}
               className={`space-y-8 ${isVisible ? 'animate-slide-right' : 'opacity-0'}`}
             >
            {/* Title with Icon */}
            <div>
              <div 
                className='inline-flex items-center gap-3 px-4 py-2 rounded-xl mb-4 bg-white/10 backdrop-blur border border-white/20'
              >
                <IconComponent className='w-6 h-6 text-brand-secondary' />
                <span className='text-sm font-bold uppercase tracking-wide text-brand-secondary'>
                  {activeItem.subtitle}
                </span>
              </div>
              <h3 className='text-4xl font-bold mb-4 text-white'>
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
                    className='group flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur border border-white/20 transition-all duration-300 hover:bg-white/15'
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
                      <p className='text-sm font-semibold leading-relaxed text-white'>
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
    </div>
  );
}

