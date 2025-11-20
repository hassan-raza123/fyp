import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import NavbarClient from './NavbarClient';

export default function HeroSection() {
  return (
    <div className='relative landing-hero-bg overflow-hidden'>
      <NavbarClient />
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 landing-decorative-blur-1 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 landing-decorative-blur-2 rounded-full blur-3xl" />

      <div className='relative max-w-7xl mx-auto px-4 pt-32 pb-48 sm:px-6 lg:px-8'>
        <div className='max-w-4xl mx-auto text-center'>
          <div className='inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-8 shadow-lg'>
            <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
            <span className='text-white text-sm font-semibold tracking-wide'>
              OBE Management System
            </span>
          </div>

          <h1 className='text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight'>
            Smart Academic
            <span className='block bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-300 bg-clip-text text-transparent mt-2'>
              Management System
            </span>
          </h1>

          <p className='text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed'>
            Comprehensive Outcome-Based Education platform for academic excellence at 
            <span className='font-semibold text-white'> MNS University of Engineering & Technology</span>
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              href='/login'
              className='group inline-flex items-center justify-center px-8 py-4 rounded-xl landing-cta-btn font-bold text-lg shadow-2xl hover:shadow-white/20'
            >
              Access Portal
              <ArrowRight className='ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform' />
            </Link>
            <Link
              href='/#modules'
              className='group inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/10 backdrop-blur-xl border-2 border-white/30 text-white font-bold text-lg hover:bg-white/20 transition-all duration-300'
            >
              Explore Features
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
