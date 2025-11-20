import Link from 'next/link';
import { ArrowRight, Play, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';
import NavbarClient from './NavbarClient';

export default function HeroSection() {
  return (
    <div className='relative landing-hero-bg overflow-hidden'>
      <NavbarClient />
      
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-0 -left-4 w-96 h-96 landing-decorative-blur-1 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 landing-decorative-blur-2 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 landing-decorative-blur-1 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className='relative pt-32 pb-20 sm:pt-40 sm:pb-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            {/* Left Content */}
            <div className='text-left'>
              {/* Badge */}
              <div className='inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-6 shadow-lg'>
                <Sparkles className='w-4 h-4 text-cyan-300' />
                <span className='text-white text-sm font-semibold'>Trusted by 5000+ Students</span>
              </div>

              {/* Main Heading */}
              <h1 className='text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight'>
                Master Your
                <span className='block mt-2 bg-linear-to-r from-brand-secondary-light via-white to-white bg-clip-text text-transparent'>
                  Academic Journey
                </span>
              </h1>

              {/* Subtitle */}
              <p className='text-lg sm:text-xl text-indigo-100 mb-8 leading-relaxed'>
                Join <span className='font-bold text-white'>EduTrack</span>, the most powerful Outcome-Based Education platform designed for academic excellence at MNS University.
              </p>

              {/* Features List */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10'>
                {[
                  'Real-time Analytics',
                  'Automated Reporting',
                  'Easy Assessment',
                  'Mobile Friendly'
                ].map((item, idx) => (
                  <div key={idx} className='flex items-center gap-2'>
                    <CheckCircle2 className='w-5 h-5 text-brand-secondary-light' />
                    <span className='text-white font-medium'>{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className='flex flex-col sm:flex-row gap-4'>
                <Link
                  href='/login'
                  className='group relative inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-brand-primary font-bold text-lg overflow-hidden transition-all duration-300 shadow-2xl hover:shadow-white/30 hover:scale-105'
                >
                  <span className='relative z-10 flex items-center gap-2'>
                    Start Learning
                    <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                  </span>
                </Link>
                
                <Link
                  href='/#modules'
                  className='group inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm'
                >
                  <Play className='w-5 h-5 mr-2' />
                  Watch Demo
                </Link>
              </div>
            </div>

            {/* Right - Hero Visual */}
            <div className='relative lg:block hidden'>
              {/* Floating Cards */}
              <div className='relative'>
                {/* Main Image Card */}
                <div className='relative z-10 bg-white/10 backdrop-blur-2xl rounded-3xl p-6 border border-white/20 shadow-2xl'>
                  <img 
                    src='/bg/path-foward-banner.jpg'
                    alt='Education'
                    className='rounded-2xl w-full h-auto shadow-2xl'
                  />
                  
                  {/* Overlay Stats Card */}
                  <div className='absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 animate-float'>
                    <div className='flex items-center gap-4'>
                      <div className='w-14 h-14 rounded-xl brand-gradient flex items-center justify-center'>
                        <TrendingUp className='w-7 h-7 text-white' />
                      </div>
                      <div>
                        <div className='text-2xl font-black text-slate-900'>98%</div>
                        <div className='text-sm text-slate-600'>Success Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Students Badge */}
                  <div className='absolute -top-6 -right-6 bg-white rounded-2xl px-6 py-4 shadow-2xl border border-slate-100'>
                    <div className='flex items-center gap-3'>
                      <div className='flex -space-x-2'>
                        {[1,2,3].map((i) => (
                          <div key={i} className='w-8 h-8 rounded-full brand-gradient border-2 border-white'></div>
                        ))}
                      </div>
                      <div className='text-left'>
                        <div className='text-sm font-bold text-slate-900'>5000+</div>
                        <div className='text-xs text-slate-600'>Students</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className='absolute -top-8 -left-8 w-24 h-24 landing-decorative-blur-2 rounded-2xl rotate-12 blur-xl'></div>
                <div className='absolute -bottom-8 -right-8 w-32 h-32 landing-decorative-blur-1 rounded-2xl -rotate-12 blur-xl'></div>
              </div>
            </div>
          </div>

          {/* Bottom Stats Bar */}
          <div className='mt-20 grid grid-cols-3 gap-8 max-w-3xl'>
            {[
              { value: '5000+', label: 'Students' },
              { value: '200+', label: 'Faculty' },
              { value: '50+', label: 'Programs' }
            ].map((stat, idx) => (
              <div key={idx} className='text-center'>
                <div className='text-3xl sm:text-4xl font-black text-white mb-2'>{stat.value}</div>
                <div className='text-sm text-brand-secondary-light font-medium'>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
