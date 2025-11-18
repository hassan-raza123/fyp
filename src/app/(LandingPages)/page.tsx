import React from 'react';
import Link from 'next/link';
import {
  Users,
  Bell,
  PieChart,
  FileBarChart,
  Shield,
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
    <div className='min-h-screen bg-white'>
      {/* Hero Section */}
      <div className='relative bg-gradient-professional overflow-hidden'>
        <NavbarClient />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

        <div className='relative max-w-7xl mx-auto px-4 pt-32 pb-40 sm:px-6 lg:px-8'>
          <div className='max-w-4xl mx-auto text-center'>
            <div className='inline-flex items-center px-5 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8'>
              <span className='text-white text-sm font-medium'>
                Outcome-Based Education Management System
              </span>
            </div>

            <h1 className='text-5xl font-bold text-white mb-6 lg:text-6xl tracking-tight leading-tight'>
              Smart Campus Management for
              <span className='block text-white mt-2'>
                MNS University of Engineering & Technology
              </span>
            </h1>

            <p className='text-lg text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed'>
              A comprehensive education management system designed to streamline 
              attendance tracking, assessment management, and academic progress monitoring 
              for modern universities.
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                href='/login'
                className='inline-flex items-center px-8 py-4 rounded-lg bg-white text-blue-900 font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg'
              >
                Get Started
                <ArrowRight className='ml-2 h-5 w-5' />
              </Link>
              <Link
                href='/features'
                className='inline-flex items-center px-8 py-4 rounded-lg bg-transparent backdrop-blur-sm border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-200'
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 mb-24 relative z-10'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {statistics.map((stat, index) => (
            <div
              key={index}
              className='bg-white rounded-lg shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-all duration-200'
            >
              <div className='text-4xl font-bold text-blue-900 mb-2'>
                {stat.value}
              </div>
              <div className='text-slate-600 font-medium'>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24'>
        <div className='text-center mb-16'>
          <h2 className='text-4xl font-bold text-slate-900 mb-4'>
            Key Features
          </h2>
          <p className='text-lg text-slate-600 max-w-2xl mx-auto'>
            Comprehensive tools designed for modern educational institutions
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {features.map((feature, index) => (
            <div
              key={index}
              className='group bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200'
            >
              <div className='w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors duration-200'>
                <div className='text-blue-900'>
                  {feature.icon}
                </div>
              </div>
              <h3 className='text-xl font-semibold text-slate-900 mb-2'>
                {feature.title}
              </h3>
              <p className='text-slate-600 leading-relaxed'>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* User Roles Section */}
      <div className='py-20 bg-slate-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-slate-900 mb-4'>
              Built for Everyone
            </h2>
            <p className='text-lg text-slate-600 max-w-2xl mx-auto'>
              Tailored solutions for administration, faculty, and students
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {userRoles.map((role, index) => (
              <div
                key={index}
                className='bg-white rounded-lg shadow-md p-8 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200'
              >
                <div className='mb-6 w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center'>
                  <div className='text-blue-900'>
                    {role.icon}
                  </div>
                </div>
                <h3 className='text-xl font-semibold text-slate-900 mb-3'>
                  {role.title}
                </h3>
                <p className='text-slate-600 mb-6 leading-relaxed'>{role.description}</p>
                <ul className='space-y-2'>
                  {role.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className='flex items-center text-slate-700'
                    >
                      <CheckCircle className='h-4 w-4 text-teal-600 mr-2 shrink-0' />
                      <span className='text-sm'>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className='bg-gradient-professional py-20 relative overflow-hidden'>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center'>
          <h2 className='text-3xl font-bold text-white mb-4'>
            Ready to Transform Your Institution?
          </h2>
          <p className='text-lg text-white/90 mb-8 max-w-2xl mx-auto'>
            Join leading universities leveraging our comprehensive OBE management system
          </p>
          <Link
            href='/login'
            className='inline-flex items-center px-8 py-4 rounded-lg bg-white text-blue-900 font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg'
          >
            Get Started Now
            <ArrowRight className='ml-2 h-5 w-5' />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
