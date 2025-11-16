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
    icon: <Users className='h-6 w-6 text-white' />,
    title: 'Smart Attendance',
    description:
      'Real-time tracking with AI-powered insights and facial recognition',
  },
  {
    icon: <Bell className='h-6 w-6 text-white' />,
    title: 'Instant Alerts',
    description: 'Automated notifications for absences and important updates',
  },
  {
    icon: <PieChart className='h-6 w-6 text-white' />,
    title: 'Analytics Dashboard',
    description: 'Comprehensive performance metrics and attendance trends',
  },
  {
    icon: <FileBarChart className='h-6 w-6 text-white' />,
    title: 'Report Generation',
    description: 'One-click detailed reports and export capabilities',
  },
  {
    icon: <Shield className='h-6 w-6 text-white' />,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with data encryption',
  },
  {
    icon: <Zap className='h-6 w-6 text-white' />,
    title: 'Fast & Efficient',
    description: 'Lightning-fast processing with minimal latency',
  },
];

const statistics = [
  { value: '99.9%', label: 'System Uptime' },
  { value: '50%', label: 'Time Saved' },
  { value: '24/7', label: 'Support Available' },
];

const userRoles = [
  {
    icon: <GraduationCap className='h-8 w-8 text-purple-600' />,
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
    icon: <Book className='h-8 w-8 text-purple-600' />,
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
    icon: <Users className='h-8 w-8 text-purple-600' />,
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
    <div className='min-h-screen bg-background'>
      {/* Hero Section */}
      <div className='relative bg-linear-to-br from-primary via-primary to-accent'>
        <NavbarClient />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className='relative max-w-7xl mx-auto px-4 pt-24 pb-32 sm:px-6 lg:px-8'>
          <div className='max-w-4xl mx-auto text-center'>
            <div className='inline-flex items-center px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 mb-8'>
              <span className='text-primary-foreground text-sm font-medium'>
                Modern Attendance System
              </span>
            </div>

            <h1 className='text-5xl font-bold text-white mb-8 lg:text-7xl'>
              Transform Your
              <span className='block bg-gradient-to-r from-white via-white/90 to-white/80 text-transparent bg-clip-text'>
                Institution
              </span>
            </h1>

            <p className='text-xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto leading-relaxed'>
              Revolutionize attendance management with our AI-powered system.
              Save time, reduce errors, and gain valuable insights.
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                href='/login'
                className='inline-flex items-center px-8 py-4 rounded-xl bg-card text-primary font-semibold hover:bg-card/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              >
                Get Started
                <ArrowRight className='ml-2 h-5 w-5' />
              </Link>
              <Link
                href='/demo'
                className='inline-flex items-center px-8 py-4 rounded-xl bg-primary/10 backdrop-blur-md border border-primary/20 text-primary-foreground hover:bg-primary/20 transition-all duration-300'
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
              className='bg-card rounded-xl shadow-lg p-6 border border-border hover:scale-105 hover:shadow-xl transition-all duration-300'
            >
              <div className='text-4xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300'>
                {stat.value}
              </div>
              <div className='text-muted-foreground font-medium'>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20'>
        <div className='text-center mb-16'>
          <h2 className='text-4xl font-bold text-foreground mb-6'>
            Key Features
          </h2>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Everything you need for modern attendance management
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature, index) => (
            <div
              key={index}
              className='bg-card rounded-xl shadow-lg p-6 border border-border hover:scale-105 hover:shadow-xl transition-all duration-300'
            >
              <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center mb-4'>
                {feature.icon}
              </div>
              <h3 className='text-xl font-semibold text-foreground mb-2'>
                {feature.title}
              </h3>
              <p className='text-muted-foreground'>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* User Roles Section */}
      <div className='py-20 bg-muted'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-foreground mb-6'>
              Built for Everyone
            </h2>
            <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
              Specialized features for every role in your institution
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {userRoles.map((role, index) => (
              <div
                key={index}
                className='bg-card rounded-xl shadow-lg p-6 border border-border hover:scale-105 hover:shadow-xl transition-all duration-300'
              >
                <div className='mb-6'>{role.icon}</div>
                <h3 className='text-xl font-semibold text-foreground mb-4'>
                  {role.title}
                </h3>
                <p className='text-muted-foreground mb-6'>{role.description}</p>
                <ul className='space-y-3'>
                  {role.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className='flex items-center text-muted-foreground'
                    >
                      <CheckCircle className='h-5 w-5 text-primary mr-2' />
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
      <div className='bg-gradient-to-br from-primary via-primary to-accent py-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-primary/10 backdrop-blur-md border border-primary/20 rounded-3xl p-12 text-center'>
            <h2 className='text-4xl font-bold text-primary-foreground mb-6'>
              Ready to Transform?
            </h2>
            <p className='text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto'>
              Join leading institutions using our modern attendance system
            </p>
            <Link
              href='/login'
              className='inline-flex items-center px-8 py-4 rounded-xl bg-card text-primary font-semibold hover:bg-card/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
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
