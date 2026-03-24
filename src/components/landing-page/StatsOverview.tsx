'use client';

import { Eye, FileText, TrendingUp, Award, BarChart3, Calendar, Sparkles } from 'lucide-react';

const studentFeatures = [
  {
    icon: Eye,
    number: '01',
    title: 'View Your Progress',
    description: 'Track your performance in each course and see your CLO/PLO attainment levels in real-time.',
    color: 'var(--brand-secondary)',
    size: 'large'
  },
  {
    icon: FileText,
    number: '02',
    title: 'Access Assessments',
    description: 'Check quiz, assignment, and exam results with detailed breakdowns.',
    color: 'var(--brand-primary)',
    size: 'normal'
  },
  {
    icon: TrendingUp,
    number: '03',
    title: 'Monitor Outcomes',
    description: 'See which learning outcomes you achieved and areas to improve.',
    color: 'var(--brand-secondary)',
    size: 'normal'
  },
  {
    icon: Award,
    number: '04',
    title: 'Grades & Transcripts',
    description: 'Access your complete academic record and official transcripts.',
    color: 'var(--brand-primary)',
    size: 'normal'
  },
  {
    icon: BarChart3,
    number: '05',
    title: 'Visual Analytics',
    description: 'Get beautiful charts showing your performance trends.',
    color: 'var(--brand-secondary)',
    size: 'normal'
  },
  {
    icon: Calendar,
    number: '06',
    title: 'Stay Notified',
    description: 'Never miss deadlines with smart notifications.',
    color: 'var(--brand-primary)',
    size: 'large'
  }
];

export default function StatsOverview() {
  return (
    <div className='relative py-20 overflow-hidden'>
      {/* Gradient Background with Blur Circles - Same as Testimonials */}
      <div 
        className='absolute inset-0'
        style={{
          background: 'linear-gradient(to bottom right, var(--gray-50), var(--white), var(--gray-50))'
        }}
        suppressHydrationWarning
      >
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: 'var(--brand-primary)' }}></div>
        <div className="absolute top-40 right-20 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: 'var(--brand-secondary)' }}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full blur-3xl opacity-15" style={{ background: 'var(--brand-primary)' }}></div>
      </div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-16'>
          <div className='inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6'
            style={{ 
              backgroundColor: 'var(--brand-secondary-opacity-10)',
              border: '1px solid var(--brand-secondary-opacity-20)'
            }}
          >
            <Sparkles className='w-4 h-4' style={{ color: 'var(--brand-secondary)' }} />
            <span className='text-sm font-bold uppercase tracking-wider' style={{ color: 'var(--brand-secondary)' }}>
              For Students
            </span>
          </div>
          <h3 className='text-5xl md:text-6xl font-extrabold mb-6' style={{ color: 'var(--text-heading)' }}>
            Your Academic
            <span className='block mt-2' style={{ color: 'var(--brand-secondary)' }}>Journey, Simplified</span>
          </h3>
          <p className='text-xl max-w-3xl mx-auto font-medium' style={{ color: 'var(--text-body)' }}>
            Everything you need to track your progress, understand your performance, and excel in your studies
          </p>
        </div>

        {/* Features Grid - Bento Style */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto'>
          {studentFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            const isLarge = feature.size === 'large';
            return (
              <div
                key={index}
                className={`group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 ${
                  isLarge ? 'md:col-span-1 lg:row-span-2' : ''
                }`}
                style={{ borderColor: feature.color }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 25px 50px ${feature.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                {/* Number Badge */}
                <div 
                  className='absolute -top-3 -right-3 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg group-hover:scale-125 transition-transform duration-300'
                  style={{ background: feature.color }}
                >
                  {feature.number}
                </div>

                {/* Icon */}
                <div 
                  className='inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 shadow-lg'
                  style={{ 
                    backgroundColor: feature.color
                  }}
                >
                  <IconComponent className='w-8 h-8 text-white' />
                </div>

                {/* Title */}
                <h4 className={`font-extrabold mb-4 transition-colors ${isLarge ? 'text-2xl' : 'text-xl'}`} style={{ color: 'var(--text-heading)' }}>
                  {feature.title}
                </h4>

                {/* Description */}
                <p className={`leading-relaxed font-medium ${isLarge ? 'text-base' : 'text-sm'}`} style={{ color: 'var(--text-body)' }}>
                  {feature.description}
                </p>

                {/* Glow Effect */}
                <div 
                  className='absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl'
                  style={{ background: feature.color }}
                ></div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className='mt-16 text-center'>
          <div className='inline-block bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-xl border-2'
            style={{ borderColor: 'var(--brand-secondary)' }}
          >
            <p className='text-xl font-bold mb-2' style={{ color: 'var(--text-heading)' }}>
              Ready to get started?
            </p>
            <a 
              href='/#portal' 
              className='inline-flex items-center gap-2 font-bold text-lg hover:gap-3 transition-all'
              style={{ color: 'var(--brand-secondary)' }}
            >
              Access Student Portal
              <span className='text-2xl'>→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

