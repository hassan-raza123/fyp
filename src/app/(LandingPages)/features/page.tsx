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
  Shield,
  ArrowRight,
} from 'lucide-react';
import NavbarClient from '@/components/landing-page/NavbarClient';
import Footer from '@/components/landing-page/Footer';

const features = [
  {
    icon: <Users className='h-8 w-8 text-white' />,
    title: 'User Management',
    description:
      'Complete management of students, faculty, and administrators',
    items: [
      'Student profiles and enrollment',
      'Faculty member management',
      'Admin and role management',
      'Bulk student import',
    ],
  },
  {
    icon: <Building2 className='h-8 w-8 text-white' />,
    title: 'Academic Structure',
    description: 'Program and course management',
    items: [
      'Programs and departments',
      'Course catalog management',
      'Batch organization',
      'Section management',
    ],
  },
  {
    icon: <Calendar className='h-8 w-8 text-white' />,
    title: 'Course Offerings',
    description:
      'Semester-wise course offerings and enrollments',
    items: [
      'Create course offerings per semester',
      'Assign faculty to courses',
      'Section allocation',
      'Student enrollment',
    ],
  },
  {
    icon: <GraduationCap className='h-8 w-8 text-white' />,
    title: 'CLO/PLO/LLO Management',
    description: 'Outcome-Based Education framework',
    items: [
      'Program Learning Outcomes (PLOs)',
      'Course Learning Outcomes (CLOs)',
      'Lab Learning Outcomes (LLOs)',
      'CLO-PLO and LLO-PLO mappings',
    ],
  },
  {
    icon: <FileCheck className='h-8 w-8 text-white' />,
    title: 'Assessment Management',
    description: 'Create and manage course assessments',
    items: [
      'Create assessments with CLO mapping',
      'Multiple assessment types',
      'Assessment items configuration',
      'CLO-mapped evaluation',
    ],
  },
  {
    icon: <Calculator className='h-8 w-8 text-white' />,
    title: 'Results & Grading',
    description: 'Marks entry and result management',
    items: [
      'Marks entry for assessments',
      'Result evaluation and moderation',
      'Grade management',
      'Transcript generation',
    ],
  },
  {
    icon: <BarChart3 className='h-8 w-8 text-white' />,
    title: 'OBE Analytics',
    description: 'Track learning outcome attainments',
    items: [
      'CLO attainment tracking',
      'PLO attainment measurement',
      'LLO attainment analysis',
      'Course and student analytics',
    ],
  },
  {
    icon: <ClipboardCheck className='h-8 w-8 text-white' />,
    title: 'Reports & Transcripts',
    description: 'Generate academic reports',
    items: [
      'Student transcripts',
      'OBE reports',
      'Performance reports',
      'Analytical dashboards',
    ],
  },
  {
    icon: <Shield className='h-8 w-8 text-white' />,
    title: 'System Features',
    description: 'Additional system capabilities',
    items: [
      'Role-based access control',
      'Notifications system',
      'Session management',
      'Settings configuration',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      {/* Hero Section */}
      <div className='relative bg-gradient-to-br from-primary via-primary to-accent'>
        <NavbarClient />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className='relative max-w-7xl mx-auto px-4 pt-24 pb-16 sm:px-6 lg:px-8'>
          <div className='max-w-3xl mx-auto text-center'>
            <h1 className='text-4xl font-bold text-primary-foreground mb-6 lg:text-5xl'>
              System Modules
              <span className='block bg-gradient-to-r from-white via-white/90 to-white/80 text-transparent bg-clip-text'>
                Comprehensive OBE Management
              </span>
            </h1>
            <p className='text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed'>
              All the essential modules for managing academic programs, assessments, 
              and outcome-based education at MNS UET.
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
              className='bg-card rounded-xl shadow-lg p-6 border border-border hover:scale-105 hover:shadow-xl transition-all duration-300'
            >
              <div className='w-14 h-14 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center mb-4'>
                {feature.icon}
              </div>
              <h3 className='text-xl font-semibold text-foreground mb-2'>
                {feature.title}
              </h3>
              <p className='text-muted-foreground mb-4'>{feature.description}</p>
              <ul className='space-y-2'>
                {feature.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className='flex items-start text-muted-foreground'
                  >
                    <div className='flex-shrink-0 mt-1'>
                      <div className='w-1.5 h-1.5 rounded-full bg-primary' />
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
      <div className='bg-gradient-to-br from-primary via-primary to-accent py-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-primary/10 backdrop-blur-md border border-primary/20 rounded-3xl p-12 text-center'>
            <h2 className='text-3xl font-bold text-primary-foreground mb-6'>
              Access the System
            </h2>
            <p className='text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto'>
              Login with your credentials to start using the OBE management system.
            </p>
            <Link
              href='/login'
              className='inline-flex items-center px-8 py-4 rounded-xl bg-card text-primary font-semibold hover:bg-card/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            >
              Login to Portal
              <ArrowRight className='ml-2 h-5 w-5' />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
