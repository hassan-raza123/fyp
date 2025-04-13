import React from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  FileCheck,
  Calculator,
  BarChart3,
  Smartphone,
  Shield,
  ArrowRight,
} from 'lucide-react';
import NavbarClient from '@/components/landing-page/NavbarClient';
import Footer from '@/components/landing-page/Footer';

const features = [
  {
    icon: <Users className='h-8 w-8 text-white' />,
    title: 'User Management',
    description: 'Comprehensive user management system with role-based access control',
    items: [
      'Multi-level role-based access control',
      'Comprehensive user profile management',
      'Secure authentication and authorization',
      'Bulk user import capabilities',
    ],
  },
  {
    icon: <Building2 className='h-8 w-8 text-white' />,
    title: 'University Structure',
    description: 'Complete university structure management system',
    items: [
      'Department and program configuration',
      'Course catalog management',
      'Academic session and calendar setup',
      'Batch/section organization',
    ],
  },
  {
    icon: <Calendar className='h-8 w-8 text-white' />,
    title: 'Class Scheduling',
    description: 'Intelligent scheduling system for optimal resource utilization',
    items: [
      'Intelligent class scheduling with conflict detection',
      'Room capacity and availability management',
      'Teacher workload management',
      'Interactive schedule visualization',
    ],
  },
  {
    icon: <ClipboardCheck className='h-8 w-8 text-white' />,
    title: 'Attendance Management',
    description: 'Advanced attendance tracking and management',
    items: [
      'Real-time attendance tracking',
      'Mobile-friendly attendance marking',
      'Leave application processing',
      'Attendance statistics and eligibility calculation',
    ],
  },
  {
    icon: <GraduationCap className='h-8 w-8 text-white' />,
    title: 'OBE Framework',
    description: 'Comprehensive Outcome-Based Education implementation',
    items: [
      'PLO (Program Learning Outcome) management',
      'CLO (Course Learning Outcome) creation and mapping',
      'Bloom\'s taxonomy level assignment',
      'SDG (Sustainable Development Goals) alignment',
    ],
  },
  {
    icon: <FileCheck className='h-8 w-8 text-white' />,
    title: 'Assessment Management',
    description: 'Flexible and comprehensive assessment system',
    items: [
      'Flexible assessment type configuration',
      'CLO-mapped assessments',
      'Comprehensive grading system',
      'Assessment statistics and analysis',
    ],
  },
  {
    icon: <Calculator className='h-8 w-8 text-white' />,
    title: 'Results Processing',
    description: 'Automated result processing and analysis',
    items: [
      'Automated course result calculation',
      'GPA/CGPA computation',
      'CLO achievement tracking',
      'PLO attainment measurement',
    ],
  },
  {
    icon: <BarChart3 className='h-8 w-8 text-white' />,
    title: 'Analytics & Reporting',
    description: 'Comprehensive analytics and reporting tools',
    items: [
      'Customizable dashboard visualizations',
      'Standard and custom report generation',
      'Data export functionality',
      'Statistical analysis tools',
    ],
  },
  {
    icon: <Smartphone className='h-8 w-8 text-white' />,
    title: 'Mobile Accessibility',
    description: 'Full mobile support for all users',
    items: [
      'Responsive design for all devices',
      'Teacher-focused mobile attendance marking',
      'Student portal for mobile access',
      'Real-time notifications',
    ],
  },
  {
    icon: <Shield className='h-8 w-8 text-white' />,
    title: 'Security & Compliance',
    description: 'Enterprise-grade security and compliance',
    items: [
      'Data encryption and protection',
      'Role-based access controls',
      'Audit logging and tracking',
      'Backup and recovery solutions',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className='min-h-screen bg-white'>
      {/* Hero Section */}
      <div className='relative bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600'>
        <NavbarClient />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className='relative max-w-7xl mx-auto px-4 pt-24 pb-16 sm:px-6 lg:px-8'>
          <div className='max-w-3xl mx-auto text-center'>
            <h1 className='text-4xl font-bold text-white mb-6 lg:text-5xl'>
              Powerful Features for
              <span className='block bg-gradient-to-r from-white via-white/90 to-white/80 text-transparent bg-clip-text'>
                Modern Education
              </span>
            </h1>
            <p className='text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed'>
              Discover how UniTrack360's comprehensive features can transform your institution's management and educational processes.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature, index) => (
            <div
              key={index}
              className='bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:scale-105 hover:shadow-xl transition-all duration-300'
            >
              <div className='w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 flex items-center justify-center mb-4'>
                {feature.icon}
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>{feature.title}</h3>
              <p className='text-gray-600 mb-4'>{feature.description}</p>
              <ul className='space-y-2'>
                {feature.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className='flex items-start text-gray-700'
                  >
                    <div className='flex-shrink-0 mt-1'>
                      <div className='w-1.5 h-1.5 rounded-full bg-purple-600' />
                    </div>
                    <span className='ml-2'>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className='bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 py-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-12 text-center'>
            <h2 className='text-3xl font-bold text-white mb-6'>
              Ready to Transform Your Institution?
            </h2>
            <p className='text-xl text-white/80 mb-8 max-w-2xl mx-auto'>
              Experience the power of UniTrack360's comprehensive features and take your institution to the next level.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                href='/login'
                className='inline-flex items-center px-8 py-4 rounded-xl bg-white text-purple-600 font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              >
                Get Started
                <ArrowRight className='ml-2 h-5 w-5' />
              </Link>
              <Link
                href='/demo'
                className='inline-flex items-center px-8 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300'
              >
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
