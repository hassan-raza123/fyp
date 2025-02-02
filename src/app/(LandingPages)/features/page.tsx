import React from 'react';
import {
  Clock,
  Shield,
  UserCheck,
  Database,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import Footer from '@/app/components/landing-page/Footer';
import NavbarClient from '@/app/components/landing-page/NavbarClient';

const mainFeatures = [
  {
    icon: <UserCheck className='h-6 w-6' />,
    title: 'Smart Recognition',
    description: 'Advanced facial recognition for accurate attendance',
  },
  {
    icon: <Database className='h-6 w-6' />,
    title: 'Data Integration',
    description: 'Seamless sync with existing systems',
  },
  {
    icon: <Shield className='h-6 w-6' />,
    title: 'Enhanced Security',
    description: 'Role-based access and data protection',
  },
  {
    icon: <Clock className='h-6 w-6' />,
    title: 'Time Tracking',
    description: 'Accurate monitoring of attendance hours',
  },
];

const additionalFeatures = [
  {
    title: 'Mobile Access',
    description: 'Access from any device, anywhere',
  },
  {
    title: 'Quick Reports',
    description: 'Generate reports with one click',
  },
  {
    title: 'Smart Analytics',
    description: 'AI-powered attendance insights',
  },
  {
    title: 'Auto Notifications',
    description: 'Real-time alerts and updates',
  },
  {
    title: 'Batch Processing',
    description: 'Handle multiple records efficiently',
  },
  {
    title: 'Custom Rules',
    description: 'Set your own attendance policies',
  },
];

const statistics = [
  { value: '99.9%', label: 'System Uptime' },
  { value: '50%', label: 'Reduced Workload' },
  { value: '24/7', label: 'Support Available' },
];

export default function Features() {
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
                Advanced Features
              </span>
            </div>

            <h1 className='text-5xl font-bold text-accent mb-8 lg:text-7xl'>
              Power-Packed
              <span className='block bg-gradient-to-r from-accent via-accent/90 to-accent/80 text-transparent bg-clip-text'>
                Features
              </span>
            </h1>

            <p className='text-xl text-accent/80 mb-12 max-w-2xl mx-auto leading-relaxed'>
              Discover how our comprehensive features transform attendance
              management
            </p>
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

      {/* Main Features */}
      <div className='py-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-primary mb-4'>
              Core Features
            </h2>
            <p className='text-xl text-text-light max-w-2xl mx-auto'>
              Advanced tools for modern attendance management
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {mainFeatures.map((feature, index) => (
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

      {/* Additional Features Grid */}
      <div className='py-20 bg-primary/5'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl font-bold text-primary mb-4'>
              More Features
            </h2>
            <p className='text-xl text-text-light max-w-2xl mx-auto'>
              Everything you need for complete attendance management
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {additionalFeatures.map((feature, index) => (
              <div
                key={index}
                className='flex items-start p-6 bg-accent rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-primary/5'
              >
                <CheckCircle className='h-6 w-6 text-primary-light mt-1 mr-4 flex-shrink-0' />
                <div>
                  <h3 className='text-lg font-bold text-primary mb-2'>
                    {feature.title}
                  </h3>
                  <p className='text-text-light'>{feature.description}</p>
                </div>
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
              Ready to Get Started?
            </h2>
            <p className='text-xl text-accent/80 mb-8 max-w-2xl mx-auto'>
              Join leading institutions using our modern attendance system
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
