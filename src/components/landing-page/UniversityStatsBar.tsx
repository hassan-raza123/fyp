'use client';

import { LogIn, BarChart3, CheckCircle } from 'lucide-react';

export default function UniversityStatsBar() {
  const steps = [
    {
      number: '01',
      icon: LogIn,
      title: 'Login to Portal',
      description: 'Access your role-based dashboard using university credentials',
      color: 'var(--brand-primary)'
    },
    {
      number: '02',
      icon: BarChart3,
      title: 'Track Progress',
      description: 'Monitor CLO/PLO attainment, grades, and learning outcomes in real-time',
      color: 'var(--brand-secondary)'
    },
    {
      number: '03',
      icon: CheckCircle,
      title: 'Achieve Excellence',
      description: 'Generate comprehensive OBE reports and ensure accreditation compliance',
      color: 'var(--brand-primary)'
    }
  ];

  return (
    <section id='how-it-works' className='relative py-20 overflow-hidden bg-white scroll-mt-20'>
      {/* Decorative Background */}
      <div className='absolute inset-0'>
        <div className='absolute top-1/4 left-0 w-96 h-96 rounded-full blur-3xl opacity-5' style={{ background: 'var(--brand-primary)' }}></div>
        <div className='absolute bottom-1/4 right-0 w-96 h-96 rounded-full blur-3xl opacity-5' style={{ background: 'var(--brand-secondary)' }}></div>
      </div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <span className='inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-orange-50 border border-gray-200 text-sm font-bold mb-4' style={{ color: 'var(--brand-primary)' }}>
            HOW IT WORKS
          </span>
          <h2 className='text-3xl sm:text-4xl font-black text-gray-900 mb-4'>
            Simple & Efficient Process
          </h2>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
            EduTrack makes OBE management straightforward in three easy steps
          </p>
        </div>

        {/* Steps Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 relative'>
          {/* Connecting Line (Desktop) */}
          <div className='hidden md:block absolute top-24 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent'></div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className='group relative'
              >
                {/* Card */}
                <div className='relative bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2'>
                  {/* Number Badge */}
                  <div 
                    className='absolute -top-6 left-8 w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg z-10'
                    style={{ 
                      backgroundColor: step.color,
                      boxShadow: `0 4px 20px ${step.color}30`
                    }}
                  >
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div 
                    className='inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 mt-8 transition-transform duration-300 group-hover:scale-110'
                    style={{ 
                      backgroundColor: `${step.color}10`,
                      border: `2px solid ${step.color}30`
                    }}
                  >
                    <Icon 
                      className='w-8 h-8' 
                      style={{ color: step.color }}
                    />
                  </div>

                  {/* Title */}
                  <h3 className='text-xl font-bold text-gray-900 mb-3'>
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className='text-gray-600 leading-relaxed'>
                    {step.description}
                  </p>

                  {/* Decorative Corner */}
                  <div 
                    className='absolute bottom-0 right-0 w-24 h-24 rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                    style={{ 
                      backgroundColor: `${step.color}05`
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

