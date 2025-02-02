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
  ArrowRight,
  Bell,
  PieChart,
} from 'lucide-react';
import Footer from '@/app/components/landing-page/Footer';
import NavbarClient from '@/app/components/landing-page/NavbarClient';

const features = [
  {
    icon: <Users className='h-6 w-6' />,
    title: 'Smart Attendance',
    description: 'Real-time tracking with AI-powered insights',
  },
  {
    icon: <Bell className='h-6 w-6' />,
    title: 'Instant Alerts',
    description: 'Automated notifications for absences',
  },
  {
    icon: <PieChart className='h-6 w-6' />,
    title: 'Analytics Dashboard',
    description: 'Comprehensive performance metrics',
  },
  {
    icon: <FileBarChart className='h-6 w-6' />,
    title: 'Report Generation',
    description: 'One-click detailed reports',
  },
];

const statistics = [
  { value: '95%', label: 'Accuracy Rate' },
  { value: '50%', label: 'Time Saved' },
  { value: '24/7', label: 'Support' },
];

const userRoles = [
  {
    icon: <GraduationCap className='h-8 w-8' />,
    title: 'For Administration',
    description: 'Complete system oversight',
    features: ['User management', 'Analytics access', 'Policy control'],
  },
  {
    icon: <Book className='h-8 w-8' />,
    title: 'For Faculty',
    description: 'Streamlined tools',
    features: ['Quick marking', 'Reports', 'Performance tracking'],
  },
  {
    icon: <Users className='h-8 w-8' />,
    title: 'For Students',
    description: 'Easy monitoring',
    features: ['Attendance history', 'Progress tracking', 'Instant alerts'],
  },
];

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-secondary to-white'>
      {/* Hero Section */}
      <div className='relative bg-gradient-to-br from-primary via-primary-light to-primary'>
        <NavbarClient />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className='relative max-w-7xl mx-auto px-4 pt-24 pb-32 sm:px-6 lg:px-8'>
          <div className='max-w-4xl mx-auto text-center'>
            <div className='inline-flex items-center px-4 py-2 rounded-full bg-accent/10 backdrop-blur-sm border border-accent/20 mb-8'>
              <span className='text-accent text-sm font-medium'>
                Modern Attendance System
              </span>
            </div>

            <h1 className='text-5xl font-bold text-accent mb-8 lg:text-7xl'>
              Transform Your
              <span className='block bg-gradient-to-r from-accent via-accent/90 to-accent/80 text-transparent bg-clip-text'>
                Institution
              </span>
            </h1>

            <p className='text-xl text-accent/80 mb-12 max-w-2xl mx-auto leading-relaxed'>
              Revolutionize attendance management with our AI-powered system
            </p>

            <div className='flex flex-col sm:flex-row gap-6 justify-center'>
              <Link
                href='/login'
                className='inline-flex items-center px-8 py-4 rounded-xl bg-accent text-primary font-semibold hover:bg-accent/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              >
                Get Started
                <ArrowRight className='ml-2 h-5 w-5' />
              </Link>
              <Link
                href='/demo'
                className='inline-flex items-center px-8 py-4 rounded-xl bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all duration-300'
              >
                Watch Demo
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
              className='bg-accent rounded-2xl p-8 shadow-xl border border-primary/5 text-center group hover:shadow-2xl transition-all duration-300'
            >
              <div className='text-4xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300'>
                {stat.value}
              </div>
              <div className='text-text-light font-medium'>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className='py-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-primary mb-4'>
              Powerful Features
            </h2>
            <p className='text-xl text-text-light max-w-2xl mx-auto'>
              Everything you need for modern attendance management
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {features.map((feature, index) => (
              <div
                key={index}
                className='group bg-accent rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/5 hover:-translate-y-1'
              >
                <div className='bg-primary/5 p-4 rounded-xl inline-flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300'>
                  {feature.icon}
                </div>
                <h3 className='text-xl font-bold text-primary mb-3'>
                  {feature.title}
                </h3>
                <p className='text-text-light leading-relaxed'>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Roles Section */}
      <div className='py-20 bg-primary/5'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-primary mb-4'>
              Built for Everyone
            </h2>
            <p className='text-xl text-text-light max-w-2xl mx-auto'>
              Specialized features for every role
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {userRoles.map((role, index) => (
              <div
                key={index}
                className='bg-accent rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/5'
              >
                <div className='text-primary-light mb-6'>{role.icon}</div>
                <h3 className='text-xl font-bold text-primary mb-4'>
                  {role.title}
                </h3>
                <p className='text-text-light mb-6'>{role.description}</p>
                <ul className='space-y-3'>
                  {role.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className='flex items-center text-text-light'
                    >
                      <CheckCircle className='h-5 w-5 text-primary-light mr-2' />
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
      <div className='bg-gradient-to-br from-primary via-primary-light to-primary py-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-accent/10 backdrop-blur-md rounded-3xl p-12 border border-accent/20 text-center'>
            <h2 className='text-4xl font-bold text-accent mb-6'>
              Ready to Transform?
            </h2>
            <p className='text-xl text-accent/80 mb-8 max-w-2xl mx-auto'>
              Join leading institutions using our system
            </p>
            <Link
              href='/login'
              className='inline-flex items-center px-8 py-4 rounded-xl bg-accent text-primary font-semibold hover:bg-accent/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            >
              Get Started Now
              <ArrowRight className='ml-2 h-5 w-5' />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
