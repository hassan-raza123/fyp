import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, GraduationCap, BookOpen, Users, Sparkles } from 'lucide-react';
import NavbarClient from './NavbarClient';

export default function HeroSection() {
  return (
    <div 
      className='relative overflow-hidden bg-fixed bg-center bg-cover'
      style={{ backgroundImage: "url('/bg/hero-university-building.jpg')" }}
    >
      {/* Preload Background Image - Same as Login Page */}
      <Image
        src='/bg/hero-university-building.jpg'
        alt=''
        width={1920}
        height={1080}
        className='hidden'
        priority
        style={{ display: 'none' }}
      />
      <NavbarClient />

      {/* Dark Overlay */}
      <div 
        className='absolute inset-0'
        style={{ 
          background: `linear-gradient(135deg, var(--overlay-slate-85), var(--overlay-dark-80))`
        }}
      ></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>

      <div className='relative pt-32 pb-40'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          {/* University Badge */}
          <span className='inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-sm font-semibold mb-8 text-white'>
            MNS University of Engineering & Technology
          </span>

          {/* Main Heading */}
          <h1 className='text-6xl sm:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight'>
            EduTrack
          </h1>
          
          <div className='text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-secondary mb-8'>
            OBE Management System
          </div>

          {/* Description */}
          <p className='text-xl mb-12 max-w-3xl mx-auto leading-relaxed' style={{ color: 'var(--white-opacity-90)' }}>
            Comprehensive platform for managing Outcome-Based Education at MNS UET. 
            Track learning outcomes, manage assessments, and access detailed reports.
          </p>

          {/* CTA Buttons */}
          <div className='flex flex-wrap justify-center gap-4 mb-16'>
            <Link
              href='/login'
              className='inline-flex items-center justify-center px-10 py-5 rounded-xl text-white font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300'
              style={{
                backgroundColor: 'var(--brand-secondary)',
                boxShadow: `0 8px 30px var(--brand-secondary-opacity-40)`
              }}
            >
              Access Portal
              <ArrowRight className='ml-2 w-6 h-6' />
            </Link>
            <Link
              href='/#modules'
              className='inline-flex items-center justify-center px-10 py-5 rounded-xl text-white font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300'
              style={{
                backgroundColor: 'var(--brand-primary)',
                boxShadow: `0 8px 30px var(--brand-primary-opacity-40)`
              }}
            >
              Learn More
            </Link>
          </div>

          {/* Quick Access Cards */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto'>
            <Link
              href='/login'
              className='group relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:scale-105 transition-all duration-300 overflow-hidden'
              style={{
                border: `2px solid var(--brand-secondary-opacity-30)`
              }}
            >
              <div className='absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-20 group-hover:opacity-30 transition-opacity' style={{ backgroundColor: 'var(--brand-secondary)' }}></div>
              <GraduationCap className='w-12 h-12 mb-3 mx-auto relative z-10' style={{ color: 'var(--brand-secondary)' }} />
              <div className='text-lg font-bold text-white mb-2 relative z-10'>Student</div>
              <div className='text-sm relative z-10' style={{ color: 'var(--white-opacity-80)' }}>View results & progress</div>
            </Link>

            <Link
              href='/login'
              className='group relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:scale-105 transition-all duration-300 overflow-hidden'
              style={{
                border: `2px solid var(--brand-primary-opacity-30)`
              }}
            >
              <div className='absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-20 group-hover:opacity-30 transition-opacity' style={{ backgroundColor: 'var(--brand-primary)' }}></div>
              <BookOpen className='w-12 h-12 mb-3 mx-auto relative z-10' style={{ color: 'var(--brand-primary)' }} />
              <div className='text-lg font-bold text-white mb-2 relative z-10'>Faculty</div>
              <div className='text-sm relative z-10' style={{ color: 'var(--white-opacity-80)' }}>Manage courses</div>
            </Link>

            <Link
              href='/login'
              className='group relative bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:scale-105 transition-all duration-300 overflow-hidden'
              style={{
                border: `2px solid var(--brand-secondary-opacity-30)`
              }}
            >
              <div className='absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-20 group-hover:opacity-30 transition-opacity' style={{ backgroundColor: 'var(--brand-secondary)' }}></div>
              <Users className='w-12 h-12 mb-3 mx-auto relative z-10' style={{ color: 'var(--brand-secondary)' }} />
              <div className='text-lg font-bold text-white mb-2 relative z-10'>Admin</div>
              <div className='text-sm relative z-10' style={{ color: 'var(--white-opacity-80)' }}>System management</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
