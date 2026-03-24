'use client';

import Link from 'next/link';
import { ArrowRight, GraduationCap, BookOpen, Users } from 'lucide-react';

export default function CTASection() {
  return (
    <div
      id="portal"
      className='relative bg-fixed bg-center bg-cover scroll-mt-20'
      style={{ backgroundImage: "url('/bg/graduation-ceremony.webp')" }}
    >
      <div 
        style={{
          background: `linear-gradient(to bottom, var(--black-opacity-50), rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.55))`
        }}
      >
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24'>
          <div className='text-center mb-12'>
            <span className='inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur text-sm font-semibold mb-4'>
              ACCESS YOUR PORTAL
            </span>
            <h2 className='text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight'>
              Access Your Portal
            </h2>
            <p className='text-xl max-w-2xl mx-auto' style={{ color: 'var(--white-opacity-90)' }}>
              Login with your university credentials to access your dedicated portal
            </p>
          </div>
          
          {/* Portal Access Cards */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-10'>
            <Link
              href='/login'
              className='bg-white/15 border border-white/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl hover:bg-white/20 transition-all text-center group'
            >
              <div className='w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg' style={{ backgroundColor: 'var(--brand-secondary)' }}>
                <GraduationCap className='w-8 h-8 text-white' />
              </div>
              <h3 className='text-2xl font-bold text-white mb-3'>Student Portal</h3>
              <p className='mb-6 text-sm leading-relaxed' style={{ color: 'var(--white-opacity-90)' }}>
                View your courses, check results, track CLO/PLO progress, and download transcripts
              </p>
              <div className='flex items-center justify-center font-semibold group-hover:translate-x-2 transition-transform' style={{ color: 'var(--brand-secondary)' }}>
                Access Portal <ArrowRight className='ml-2 w-5 h-5' />
              </div>
            </Link>

            <Link
              href='/login'
              className='bg-white/15 border border-white/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl hover:bg-white/20 transition-all text-center group'
            >
              <div className='w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg' style={{ backgroundColor: 'var(--brand-secondary)' }}>
                <BookOpen className='w-8 h-8 text-white' />
              </div>
              <h3 className='text-2xl font-bold text-white mb-3'>Faculty Portal</h3>
              <p className='mb-6 text-sm leading-relaxed' style={{ color: 'var(--white-opacity-90)' }}>
                Manage courses, create assessments, enter marks, and track student performance
              </p>
              <div className='flex items-center justify-center font-semibold group-hover:translate-x-2 transition-transform' style={{ color: 'var(--brand-secondary)' }}>
                Access Portal <ArrowRight className='ml-2 w-5 h-5' />
              </div>
            </Link>

            <Link
              href='/login'
              className='bg-white/15 border border-white/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl hover:bg-white/20 transition-all text-center group'
            >
              <div className='w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg' style={{ backgroundColor: 'var(--brand-secondary)' }}>
                <Users className='w-8 h-8 text-white' />
              </div>
              <h3 className='text-2xl font-bold text-white mb-3'>Admin Portal</h3>
              <p className='mb-6 text-sm leading-relaxed' style={{ color: 'var(--white-opacity-90)' }}>
                Manage users, programs, courses, and generate comprehensive OBE reports
              </p>
              <div className='flex items-center justify-center font-semibold group-hover:translate-x-2 transition-transform' style={{ color: 'var(--brand-secondary)' }}>
                Access Portal <ArrowRight className='ml-2 w-5 h-5' />
              </div>
            </Link>
          </div>

          <div className='text-center'>
            <Link
              href='/login'
              className='inline-flex items-center justify-center px-10 py-4 rounded-xl text-white font-bold text-lg shadow-2xl transition-colors'
              style={{
                backgroundColor: 'var(--brand-secondary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--brand-secondary-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--brand-secondary)';
              }}
            >
              Login to System
              <ArrowRight className='ml-2 h-6 w-6' />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
