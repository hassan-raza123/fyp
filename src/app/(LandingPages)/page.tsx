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
    title: 'User Management',
    description:
      'Comprehensive management for students, faculty, and administrators',
  },
  {
    icon: <Book className='h-6 w-6' />,
    title: 'Academic Structure',
    description: 'Programs, courses, batches, sections, and course offerings',
  },
  {
    icon: <FileBarChart className='h-6 w-6' />,
    title: 'Assessments',
    description: 'Complete assessment management with CLO/PLO mapping',
  },
  {
    icon: <CheckCircle className='h-6 w-6' />,
    title: 'Results & Grading',
    description: 'Marks entry, result evaluation, and transcript generation',
  },
  {
    icon: <PieChart className='h-6 w-6' />,
    title: 'OBE Analytics',
    description: 'CLO/PLO/LLO attainment tracking and outcome analysis',
  },
  {
    icon: <Bell className='h-6 w-6' />,
    title: 'Reports & Notifications',
    description: 'Comprehensive reports and real-time notifications',
  },
];

const statistics = [
  { value: '5000+', label: 'Students' },
  { value: '200+', label: 'Faculty Members' },
  { value: '50+', label: 'Programs' },
];

const userRoles = [
  {
    icon: <GraduationCap className='h-8 w-8 text-primary' />,
    title: 'Admin Portal',
    description: 'Complete control over academic operations',
    features: [
      'Manage students, faculty & programs',
      'Configure courses & offerings',
      'Monitor CLO/PLO attainments',
      'Generate comprehensive reports',
    ],
  },
  {
    icon: <Book className='h-8 w-8 text-primary' />,
    title: 'Faculty Portal',
    description: 'Efficient tools for teaching and assessment',
    features: [
      'Manage course sections',
      'Create & grade assessments',
      'Track student performance',
      'View CLO/PLO analytics',
    ],
  },
  {
    icon: <Users className='h-8 w-8 text-primary' />,
    title: 'Student Portal',
    description: 'Access to academic information',
    features: [
      'View enrolled courses',
      'Check assessment results',
      'Track CLO/PLO progress',
      'Download transcript',
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
              Outcome-Based Education Management System
              <span className='block text-white mt-2'>
                MNS University of Engineering & Technology
              </span>
            </h1>

            <p className='text-lg text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed'>
              Comprehensive OBE management system for academic programs, assessments, 
              results, and CLO/PLO attainment tracking at MNS UET.
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
            System Features
          </h2>
          <p className='text-lg text-slate-600 max-w-2xl mx-auto'>
            Core modules for complete academic and OBE management
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
              Three Dedicated Portals
            </h2>
            <p className='text-lg text-slate-600 max-w-2xl mx-auto'>
              Separate interfaces for admins, faculty, and students
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
            Access the System
          </h2>
          <p className='text-lg text-white/90 mb-8 max-w-2xl mx-auto'>
            Login with your credentials to access your portal
          </p>
          <Link
            href='/login'
            className='inline-flex items-center px-8 py-4 rounded-lg bg-white text-blue-900 font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg'
          >
            Login to Portal
            <ArrowRight className='ml-2 h-5 w-5' />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
