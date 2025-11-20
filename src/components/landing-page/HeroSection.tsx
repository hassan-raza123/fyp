import Link from 'next/link';
import { ArrowRight, Play, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';
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
              <Sparkles className='w-4 h-4 text-brand-secondary-light' />
              EduTrack • Outcome-Based Education
            </span>

            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight'>
              Smart Outcome-Based Education Platform
            </h1>

            <p className='text-lg text-indigo-100 mb-10 max-w-2xl leading-relaxed'>
              Manage CLOs, PLOs, assessments, analytics, and reporting in one connected platform built
              specifically for universities.
            </p>

            <div className='flex flex-wrap gap-4 mb-12'>
              <Link
                href='/login'
                className='inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-brand-primary font-bold text-lg shadow-lg hover:shadow-xl transition-transform hover:-translate-y-0.5'
              >
                Get Started
                <ArrowRight className='ml-2 w-5 h-5' />
              </Link>
              <Link
                href='/#modules'
                className='inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-white/40 text-white font-semibold hover:bg-white/10 transition-all duration-300'
              >
                <Play className='w-5 h-5 mr-2' />
                Watch Demo
              </Link>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-6 text-left'>
              {[
                { value: '5000+', label: 'Active Students' },
                { value: '200+', label: 'Faculty Members' },
                { value: '50+', label: 'Accredited Programs' },
              ].map((stat, idx) => (
                <div key={idx}>
                  <div className='text-3xl font-black text-white mb-1'>{stat.value}</div>
                  <div className='text-sm text-indigo-100'>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
