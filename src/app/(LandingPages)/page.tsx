import React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  Clock,
  FileBarChart,
  ChevronRight,
  CheckCircle,
  Book,
  GraduationCap,
} from 'lucide-react';
import Footer from './components/Footer';
import NavbarClient from './components/NavbarClient';

const features = [
  {
    icon: <Users className='h-8 w-8' />,
    title: 'Attendance Tracking',
    description:
      'Effortlessly mark and monitor student attendance in real-time',
  },
  {
    icon: <BarChart3 className='h-8 w-8' />,
    title: 'Analytics Dashboard',
    description: 'Comprehensive insights into attendance patterns and trends',
  },
  {
    icon: <Clock className='h-8 w-8' />,
    title: 'Quick Reports',
    description: 'Generate detailed attendance reports with one click',
  },
  {
    icon: <FileBarChart className='h-8 w-8' />,
    title: 'Performance Metrics',
    description: 'Track attendance impact on academic performance',
  },
];

const userRoles = [
  {
    icon: <GraduationCap className='h-12 w-12' />,
    title: 'For Administrators',
    features: [
      'Complete system oversight',
      'User management control',
      'Institutional reporting',
      'Analytics dashboard',
      'Department management',
      'Policy enforcement',
    ],
  },
  {
    icon: <Book className='h-12 w-12' />,
    title: 'For Teachers',
    features: [
      'Easy attendance marking',
      'Class performance tracking',
      'Automated reporting',
      'Student monitoring',
      'Absence notifications',
      'Course management',
    ],
  },
  {
    icon: <Users className='h-12 w-12' />,
    title: 'For Students',
    features: [
      'Attendance history',
      'Performance tracking',
      'Course schedules',
      'Mobile check-in',
      'Absence alerts',
      'Progress reports',
    ],
  },
];

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-white'>
      {/* Hero Section */}
      <div className='relative bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900'>
        <NavbarClient />
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20'>
          <div className='text-center'>
            {/* Badge */}
            <div className='inline-flex items-center px-4 py-1.5 mb-6 text-sm font-semibold rounded-full bg-indigo-500/20 text-indigo-100 border border-indigo-400/20'>
              Leading Attendance Management System
            </div>
            <h1 className='text-4xl md:text-6xl font-bold text-white mb-6 leading-tight'>
              Transform Your Institution&apos;s <br />
              Attendance Management
            </h1>
            <p className='text-xl text-indigo-100 mb-10 max-w-3xl mx-auto'>
              Modernize attendance tracking with our comprehensive digital
              solution. Designed for universities, built for efficiency.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                href='/login'
                className='inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              >
                Get Started <ChevronRight className='ml-2 h-5 w-5' />
              </Link>
              <Link
                href='/demo'
                className='inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-white/20 text-white font-semibold hover:bg-white/10 transition-all duration-200'
              >
                Watch Demo
              </Link>
            </div>
          </div>
        </div>

        {/* Wave SVG Divider */}
        <div className='absolute bottom-0 left-0 right-0'>
          <svg
            viewBox='0 0 1440 120'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M0 30L48 35C96 40 192 50 288 55C384 60 480 60 576 55C672 50 768 40 864 45C960 50 1056 70 1152 75C1248 80 1344 70 1392 65L1440 60V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V30Z'
              fill='white'
            />
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className='py-20 -mt-10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {features.map((feature, index) => (
              <div
                key={index}
                className='bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100'
              >
                <div className='text-indigo-600 bg-indigo-50 p-4 rounded-xl inline-block mb-6'>
                  {feature.icon}
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-3'>
                  {feature.title}
                </h3>
                <p className='text-gray-600 leading-relaxed'>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Roles Section */}
      <div className='bg-gradient-to-b from-gray-50 to-white py-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
              Tailored for Every Role
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              Our platform provides specialized features for all users
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {userRoles.map((role, index) => (
              <div
                key={index}
                className='bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100'
              >
                <div className='text-indigo-600 mb-6'>{role.icon}</div>
                <h3 className='text-2xl font-bold text-gray-900 mb-6'>
                  {role.title}
                </h3>
                <ul className='space-y-4'>
                  {role.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className='flex items-start space-x-3'
                    >
                      <CheckCircle className='h-6 w-6 text-green-500 flex-shrink-0' />
                      <span className='text-gray-600'>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className='bg-indigo-900 py-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-gradient-to-br from-indigo-800 to-indigo-900 rounded-3xl p-8 md:p-16 shadow-xl relative overflow-hidden'>
            <div className='absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]'></div>
            <div className='relative'>
              <div className='text-center max-w-3xl mx-auto'>
                <h2 className='text-3xl md:text-4xl font-bold text-white mb-6'>
                  Ready to Modernize Your Institution?
                </h2>
                <p className='text-xl text-indigo-200 mb-8'>
                  Join leading universities worldwide in transforming their
                  attendance management
                </p>
                <Link
                  href='/login'
                  className='inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg'
                >
                  Get Started Now <ChevronRight className='ml-2 h-5 w-5' />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
