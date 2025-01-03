import React from 'react';
import Link from 'next/link';
import {
  Clock,
  BarChart3,
  Users,
  CheckCircle,
  ArrowRight,
  GraduationCap,
  School,
  BookOpen,
} from 'lucide-react';

const statistics = [
  {
    number: '98%',
    label: 'Attendance Rate',
    color: 'from-rose-400 to-orange-400',
  },
  {
    number: '2000+',
    label: 'Students',
    color: 'from-cyan-400 to-blue-400',
  },
  {
    number: '100+',
    label: 'Faculty',
    color: 'from-emerald-400 to-teal-400',
  },
  {
    number: '50+',
    label: 'Daily Classes',
    color: 'from-violet-400 to-purple-400',
  },
];

const features = [
  {
    icon: <Clock />,
    title: 'Real-time Tracking',
    description: 'Track attendance in real-time with our automated system',
    color: 'from-rose-500 to-orange-500',
    metrics: ['Instant Recording', 'Live Updates', 'Quick Reports'],
  },
  {
    icon: <School />,
    title: 'Class Management',
    description: 'Efficiently manage all your classes and student groups',
    color: 'from-cyan-500 to-blue-500',
    metrics: ['Course Scheduling', 'Student Lists', 'Class Analytics'],
  },
  {
    icon: <BarChart3 />,
    title: 'Performance Insights',
    description: 'Generate detailed attendance reports and analytics',
    color: 'from-emerald-500 to-teal-500',
    metrics: ['Attendance Reports', 'Student Stats', 'Department Analytics'],
  },
];

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-white'>
      {/* Hero Section */}
      <div className='relative overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#1E293B]'>
        <div className='absolute inset-0'>
          {/* Animated gradient orbs */}
          <div className='absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full blur-3xl' />
          <div className='absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-rose-600/30 to-orange-600/30 rounded-full blur-3xl' />

          {/* Grid pattern overlay */}
          <div
            className='absolute inset-0'
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.1) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
            <div>
              <div className='inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-rose-500/20 to-orange-500/20 border border-rose-500/10 mb-8'>
                <span className='relative flex h-2 w-2 mr-2'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-2 w-2 bg-rose-500'></span>
                </span>
                <span className='text-rose-200 text-sm font-medium'>
                  Smart Attendance System
                </span>
              </div>

              <h1 className='text-4xl lg:text-6xl font-bold text-white mb-8 leading-tight'>
                Modernize Your
                <span className='block mt-2 bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent'>
                  Educational Institution
                </span>
              </h1>

              <p className='text-lg text-slate-300 mb-10 leading-relaxed max-w-xl'>
                A comprehensive attendance management system designed
                specifically for educational institutions. Make attendance
                tracking efficient, accurate, and hassle-free.
              </p>

              <div className='flex flex-col sm:flex-row gap-4'>
                <Link
                  href='/demo'
                  className='inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold hover:from-rose-600 hover:to-orange-600 transition-all duration-200 shadow-lg shadow-orange-500/25 transform hover:-translate-y-0.5'
                >
                  Get Started
                  <ArrowRight className='ml-2 h-5 w-5' />
                </Link>
                <Link
                  href='/contact'
                  className='inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all duration-200 backdrop-blur-sm'
                >
                  Contact Admin
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <div className='relative'>
              <div className='absolute inset-0 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-3xl blur-2xl' />
              <div className='relative grid grid-cols-2 gap-4'>
                {statistics.map((stat, index) => (
                  <div
                    key={index}
                    className='bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10'
                  >
                    <div
                      className={`text-3xl font-bold mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                    >
                      {stat.number}
                    </div>
                    <div className='text-slate-300 font-medium'>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Custom wave divider */}
        <div className='absolute bottom-0 left-0 right-0'>
          <svg
            className='w-full h-24 fill-slate-50'
            viewBox='0 0 1440 74'
            preserveAspectRatio='none'
          >
            <path d='M0,0 C480,100 960,100 1440,0 L1440,74 L0,74 Z' />
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className='py-24 bg-slate-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl lg:text-4xl font-bold text-slate-900 mb-4'>
              Smart Features for Modern Education
            </h2>
            <p className='text-lg text-slate-600 max-w-2xl mx-auto'>
              Everything you need to manage attendance efficiently in one
              integrated platform
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {features.map((feature, index) => (
              <div
                key={index}
                className='group relative bg-white rounded-2xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl border border-slate-100'
              >
                <div className='absolute inset-0 bg-gradient-to-r from-slate-400/0 to-slate-400/0 group-hover:from-slate-50 group-hover:to-white rounded-2xl transition-colors duration-300' />
                <div className='relative'>
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {feature.icon}
                  </div>

                  <h3 className='text-xl font-bold text-slate-900 mb-4'>
                    {feature.title}
                  </h3>

                  <p className='text-slate-600 mb-6'>{feature.description}</p>

                  <div className='space-y-3'>
                    {feature.metrics.map((metric, idx) => (
                      <div key={idx} className='flex items-center space-x-2'>
                        <CheckCircle className='h-5 w-5 text-emerald-500' />
                        <span className='text-slate-600'>{metric}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className='py-24 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='relative rounded-3xl overflow-hidden'>
            <div className='absolute inset-0 bg-gradient-to-r from-rose-500 to-orange-500' />

            <div className='relative px-8 py-16 md:px-16 md:py-20'>
              <div className='text-center max-w-3xl mx-auto'>
                <h2 className='text-3xl lg:text-4xl font-bold text-white mb-6'>
                  Ready to Transform Your Institution?
                </h2>
                <p className='text-xl text-white/90 mb-10'>
                  Join leading educational institutions in modernizing their
                  attendance management
                </p>
                <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                  <Link
                    href='/signup'
                    className='inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-rose-600 font-semibold hover:bg-rose-50 transition-all duration-200 shadow-lg transform hover:-translate-y-0.5'
                  >
                    Get Started Now
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </Link>
                  <Link
                    href='/contact'
                    className='inline-flex items-center justify-center px-8 py-4 rounded-xl bg-rose-600/20 text-white font-semibold hover:bg-rose-600/30 transition-all duration-200 backdrop-blur-sm border border-white/20'
                  >
                    Contact Admin
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
