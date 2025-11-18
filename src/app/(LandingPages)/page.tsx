import React from 'react';
import Link from 'next/link';
import {
  Users,
  Bell,
  PieChart,
  FileBarChart,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle,
  Book,
  GraduationCap,
} from 'lucide-react';
import Footer from '@/components/landing-page/Footer';
import NavbarClient from '@/components/landing-page/NavbarClient';

const features = [
  {
    icon: <Users className='h-6 w-6' />,
    title: 'Student Management',
    description:
      'Comprehensive student profiles, enrollment, and academic tracking',
  },
  {
    icon: <FileBarChart className='h-6 w-6' />,
    title: 'OBE Assessment',
    description: 'CLO/PLO mapping, attainment tracking, and outcome analysis',
  },
  {
    icon: <PieChart className='h-6 w-6' />,
    title: 'Analytics Dashboard',
    description: 'Real-time insights, performance metrics, and detailed reports',
  },
  {
    icon: <Book className='h-6 w-6' />,
    title: 'Course Management',
    description: 'Course offerings, sections, and curriculum management',
  },
  {
    icon: <Shield className='h-6 w-6' />,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with role-based access control',
  },
  {
    icon: <Bell className='h-6 w-6' />,
    title: 'Notifications',
    description: 'Automated alerts and updates for all stakeholders',
  },
];

const statistics = [
  { value: '99.9%', label: 'System Uptime' },
  { value: '50%', label: 'Time Saved' },
  { value: '24/7', label: 'Support Available' },
];

const userRoles = [
  {
    icon: <GraduationCap className='h-8 w-8 text-primary' />,
    title: 'For Administration',
    description: 'Complete system oversight and management',
    features: [
      'User management',
      'Analytics access',
      'Policy control',
      'System configuration',
    ],
  },
  {
    icon: <Book className='h-8 w-8 text-primary' />,
    title: 'For Faculty',
    description: 'Streamlined tools for efficient management',
    features: [
      'Quick marking',
      'Detailed reports',
      'Performance tracking',
      'Class management',
    ],
  },
  {
    icon: <Users className='h-8 w-8 text-primary' />,
    title: 'For Students',
    description: 'Easy monitoring and access',
    features: [
      'Attendance history',
      'Progress tracking',
      'Instant alerts',
      'Mobile access',
    ],
  },
];

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50'>
      {/* Hero Section */}
      <div className='relative bg-gradient-animated overflow-hidden'>
        <NavbarClient />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        {/* Floating Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{animationDelay: '4s'}}></div>

        <div className='relative max-w-7xl mx-auto px-4 pt-24 pb-32 sm:px-6 lg:px-8'>
          <div className='max-w-4xl mx-auto text-center'>
            <div className='inline-flex items-center px-6 py-3 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 mb-8 shadow-lg'>
              <Zap className='h-4 w-4 text-yellow-300 mr-2' />
              <span className='text-white text-sm font-semibold'>
                OBE-Based Education Management System
              </span>
            </div>

            <h1 className='text-6xl font-extrabold text-white mb-8 lg:text-8xl tracking-tight'>
              Smart Campus for
              <span className='block bg-gradient-to-r from-yellow-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent mt-2'>
                MNSUET
              </span>
            </h1>

            <p className='text-xl text-white/95 mb-12 max-w-2xl mx-auto leading-relaxed font-medium'>
              Comprehensive Outcome-Based Education system for modern universities.
              Manage attendance, assessments, and academic progress seamlessly.
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                href='/login'
                className='inline-flex items-center px-10 py-5 rounded-2xl bg-white text-purple-600 font-bold text-lg hover:bg-white/95 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105'
              >
                Get Started
                <ArrowRight className='ml-2 h-6 w-6' />
              </Link>
              <Link
                href='/features'
                className='inline-flex items-center px-10 py-5 rounded-2xl bg-white/15 backdrop-blur-xl border-2 border-white/30 text-white font-bold text-lg hover:bg-white/25 transition-all duration-300 hover:scale-105'
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 mb-20 relative z-10'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {statistics.map((stat, index) => (
            <div
              key={index}
              className='bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-2xl p-8 border-2 border-purple-200/50 hover:scale-110 hover:shadow-3xl transition-all duration-300 group'
            >
              <div className='text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300'>
                {stat.value}
              </div>
              <div className='text-slate-600 font-semibold text-lg'>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20'>
        <div className='text-center mb-16'>
          <h2 className='text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6'>
            Key Features
          </h2>
          <p className='text-xl text-slate-600 max-w-2xl mx-auto font-medium'>
            Everything you need for modern education management
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature, index) => (
            <div
              key={index}
              className='group bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-100 hover:border-purple-300 hover:scale-105 hover:shadow-2xl transition-all duration-300 card-hover relative overflow-hidden'
            >
              <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-cyan-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity'></div>
              <div className='relative'>
                <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300'>
                  <div className='text-white'>
                    {feature.icon}
                  </div>
                </div>
                <h3 className='text-2xl font-bold text-slate-800 mb-3'>
                  {feature.title}
                </h3>
                <p className='text-slate-600 leading-relaxed'>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Roles Section */}
      <div className='py-20 bg-gradient-to-br from-purple-100 via-blue-100 to-cyan-100'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6'>
              Built for Everyone
            </h2>
            <p className='text-xl text-slate-600 max-w-2xl mx-auto font-medium'>
              Specialized features for every role in your institution
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {userRoles.map((role, index) => (
              <div
                key={index}
                className='group bg-white rounded-2xl shadow-xl p-8 border-2 border-transparent hover:border-purple-300 hover:scale-105 hover:shadow-2xl transition-all duration-300'
              >
                <div className='mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300'>
                  <div className='text-white'>
                    {role.icon}
                  </div>
                </div>
                <h3 className='text-2xl font-bold text-slate-800 mb-4'>
                  {role.title}
                </h3>
                <p className='text-slate-600 mb-6 leading-relaxed'>{role.description}</p>
                <ul className='space-y-3'>
                  {role.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className='flex items-center text-slate-700 font-medium'
                    >
                      <CheckCircle className='h-5 w-5 text-green-500 mr-3 flex-shrink-0' />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className='bg-gradient-ocean py-24 relative overflow-hidden'>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative'>
          <div className='bg-white/20 backdrop-blur-xl border-2 border-white/30 rounded-3xl p-16 text-center shadow-2xl'>
            <h2 className='text-5xl font-extrabold text-white mb-6'>
              Ready to Transform Your Institution?
            </h2>
            <p className='text-2xl text-white/95 mb-10 max-w-2xl mx-auto font-medium'>
              Join leading universities using our comprehensive OBE management system
            </p>
            <Link
              href='/login'
              className='inline-flex items-center px-12 py-6 rounded-2xl bg-white text-purple-600 font-bold text-xl hover:bg-white/95 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105'
            >
              Get Started Now
              <ArrowRight className='ml-3 h-6 w-6' />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
