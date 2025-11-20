import Link from 'next/link';
import { ArrowRight, GraduationCap, BookOpen, Users } from 'lucide-react';

export default function CTASection() {
  return (
    <div className='relative py-24 overflow-hidden bg-[#14171d]'>
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      
      <div className='relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-12'>
          <h2 className='text-4xl md:text-5xl font-extrabold text-white mb-4'>
            Access Your Portal
          </h2>
          <p className='text-xl text-white/70 max-w-2xl mx-auto'>
            Login with your university credentials to access your dedicated portal
          </p>
        </div>
        
        {/* Portal Access Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-10'>
          <Link
            href='/login'
            className='bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all text-center group'
          >
            <div className='w-16 h-16 bg-[#fc9928] rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform'>
              <GraduationCap className='w-8 h-8 text-white' />
            </div>
            <h3 className='text-2xl font-bold text-white mb-3'>Student Portal</h3>
            <p className='text-white/70 mb-6'>
              View your courses, check results, track CLO/PLO progress, and download transcripts
            </p>
            <div className='flex items-center justify-center text-[#fc9928] font-semibold group-hover:translate-x-2 transition-transform'>
              Access Portal <ArrowRight className='ml-2 w-5 h-5' />
            </div>
          </Link>

          <Link
            href='/login'
            className='bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all text-center group'
          >
            <div className='w-16 h-16 bg-[#fc9928] rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform'>
              <BookOpen className='w-8 h-8 text-white' />
            </div>
            <h3 className='text-2xl font-bold text-white mb-3'>Faculty Portal</h3>
            <p className='text-white/70 mb-6'>
              Manage courses, create assessments, enter marks, and track student performance
            </p>
            <div className='flex items-center justify-center text-[#fc9928] font-semibold group-hover:translate-x-2 transition-transform'>
              Access Portal <ArrowRight className='ml-2 w-5 h-5' />
            </div>
          </Link>

          <Link
            href='/login'
            className='bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all text-center group'
          >
            <div className='w-16 h-16 bg-[#fc9928] rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform'>
              <Users className='w-8 h-8 text-white' />
            </div>
            <h3 className='text-2xl font-bold text-white mb-3'>Admin Portal</h3>
            <p className='text-white/70 mb-6'>
              Manage users, programs, courses, and generate comprehensive OBE reports
            </p>
            <div className='flex items-center justify-center text-[#fc9928] font-semibold group-hover:translate-x-2 transition-transform'>
              Access Portal <ArrowRight className='ml-2 w-5 h-5' />
            </div>
          </Link>
        </div>

        <div className='text-center'>
          <Link
            href='/login'
            className='inline-flex items-center justify-center px-10 py-4 rounded-xl bg-[#fc9928] text-white font-bold text-lg shadow-2xl hover:bg-[#e6891f] transition-colors'
          >
            Login to System
            <ArrowRight className='ml-2 h-6 w-6' />
          </Link>
        </div>
      </div>
    </div>
  );
}
