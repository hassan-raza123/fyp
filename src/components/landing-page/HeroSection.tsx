import Link from 'next/link';
import { ArrowRight, PlayCircle } from 'lucide-react';
import NavbarClient from './NavbarClient';

export default function HeroSection() {
  return (
    <div className='relative landing-hero-bg overflow-hidden min-h-screen flex items-center'>
      <NavbarClient />
      
      {/* Subtle background pattern - NO image */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
          {/* Left Content */}
          <div>
            <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-900 mb-6 animate-fade-in'>
              <span className='text-sm font-semibold'>MNS University of Engineering & Technology</span>
            </div>

            <h1 className='text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight'>
              Transform Your
              <span className='block text-cyan-300'>Learning Journey</span>
            </h1>

            <p className='text-xl text-blue-100 mb-8 leading-relaxed'>
              Experience the power of Outcome-Based Education with EduTrack - your comprehensive platform for academic excellence.
            </p>

            <div className='flex flex-col sm:flex-row gap-4'>
              <Link
                href='/login'
                className='group inline-flex items-center justify-center px-8 py-4 rounded-lg bg-white text-blue-900 font-semibold hover:bg-blue-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105'
              >
                Get Started
                <ArrowRight className='ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform' />
              </Link>
              <Link
                href='/#modules'
                className='group inline-flex items-center justify-center px-8 py-4 rounded-lg border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all duration-300'
              >
                <PlayCircle className='mr-2 h-5 w-5' />
                Watch Demo
              </Link>
            </div>

            {/* Quick Stats */}
            <div className='grid grid-cols-3 gap-6 mt-12'>
              <div>
                <div className='text-3xl font-bold text-white mb-1'>5000+</div>
                <div className='text-sm text-blue-200'>Students</div>
              </div>
              <div>
                <div className='text-3xl font-bold text-white mb-1'>200+</div>
                <div className='text-sm text-blue-200'>Faculty</div>
              </div>
              <div>
                <div className='text-3xl font-bold text-white mb-1'>50+</div>
                <div className='text-sm text-blue-200'>Programs</div>
              </div>
            </div>
          </div>

          {/* Right - Image/Illustration */}
          <div className='hidden lg:block'>
            <div className='relative'>
              <div className='absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-3xl opacity-20'></div>
              <div className='relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20'>
                <img 
                  src='/bg/path-foward-banner.jpg'
                  alt='Education'
                  className='rounded-2xl w-full h-auto shadow-2xl'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
