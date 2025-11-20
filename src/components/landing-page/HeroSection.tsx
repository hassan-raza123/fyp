import Link from 'next/link';
import { ArrowRight, GraduationCap, BookOpen, Users } from 'lucide-react';
import NavbarClient from './NavbarClient';

export default function HeroSection() {
  return (
    <div className='relative overflow-hidden bg-slate-900 text-white'>
      <NavbarClient />

      {/* Background */}
      <div className='absolute inset-0'>
        <img
          src='/bg/path-foward-banner.jpg'
          alt='Education Background'
          className='w-full h-full object-cover'
        />
        <div className='absolute inset-0 bg-linear-to-r from-slate-950/95 via-slate-900/80 to-transparent md:to-slate-900/60'></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      </div>

      <div className='relative pt-28 pb-32'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='lg:w-3/5'>
            <span className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold mb-6'>
              MNS University of Engineering & Technology
            </span>

            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight'>
              EduTrack
              <span className='block text-[#fc9928] mt-2'>OBE Management System</span>
            </h1>

            <p className='text-lg text-indigo-100 mb-10 max-w-2xl leading-relaxed'>
              Access your portal to manage courses, assessments, results, and track learning outcomes. 
              Login with your university credentials to get started.
            </p>

            <div className='flex flex-wrap gap-4 mb-12'>
              <Link
                href='/login'
                className='inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-brand-primary font-bold text-lg shadow-lg hover:shadow-xl transition-transform hover:-translate-y-0.5'
              >
                Login to Portal
                <ArrowRight className='ml-2 w-5 h-5' />
              </Link>
              <Link
                href='/#portals'
                className='inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-white/40 text-white font-semibold hover:bg-white/10 transition-all duration-300'
              >
                View Portals
                <ArrowRight className='ml-2 w-5 h-5' />
              </Link>
            </div>

            {/* Quick Access Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8'>
              <Link
                href='/login'
                className='bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all'
              >
                <GraduationCap className='w-8 h-8 text-[#fc9928] mb-2' />
                <div className='text-sm font-semibold text-white'>Student Portal</div>
                <div className='text-xs text-white/70 mt-1'>View results & progress</div>
              </Link>
              <Link
                href='/login'
                className='bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all'
              >
                <BookOpen className='w-8 h-8 text-[#fc9928] mb-2' />
                <div className='text-sm font-semibold text-white'>Faculty Portal</div>
                <div className='text-xs text-white/70 mt-1'>Manage courses & assessments</div>
              </Link>
              <Link
                href='/login'
                className='bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all'
              >
                <Users className='w-8 h-8 text-[#fc9928] mb-2' />
                <div className='text-sm font-semibold text-white'>Admin Portal</div>
                <div className='text-xs text-white/70 mt-1'>System management</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
