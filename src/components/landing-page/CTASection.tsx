import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <div className='bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 py-24 relative overflow-hidden'>
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center'>
        <h2 className='text-4xl md:text-5xl font-extrabold text-white mb-6'>
          Ready to Get Started?
        </h2>
        <p className='text-xl text-blue-100 mb-10 max-w-2xl mx-auto'>
          Access your portal with your credentials
        </p>
        <Link
          href='/login'
          className='group inline-flex items-center justify-center px-10 py-5 rounded-xl bg-white text-blue-900 font-bold text-lg hover:bg-blue-50 transition-all duration-300 shadow-2xl hover:shadow-white/20 hover:scale-105'
        >
          Login to Portal
          <ArrowRight className='ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform' />
        </Link>
      </div>
    </div>
  );
}

