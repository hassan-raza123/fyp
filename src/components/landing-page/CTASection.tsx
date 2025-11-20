import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <div className='relative py-24 overflow-hidden'>
      {/* Background Image - Graduation scene for impact */}
      <div className="absolute inset-0 bg-[url('/bg/Newroom-Summer-Graduation-2023.webp')] bg-cover bg-center" />
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-blue-900/55" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-blue-800/50 to-blue-950/50" />
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-72 h-72 landing-decorative-blur-1 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 landing-decorative-blur-2 rounded-full blur-3xl" />
      
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center'>
        <h2 className='text-4xl md:text-5xl font-extrabold text-white mb-6'>
          Ready to Get Started?
        </h2>
        <p className='text-xl text-blue-100 mb-10 max-w-2xl mx-auto'>
          Access your portal with your credentials
        </p>
        <Link
          href='/login'
          className='group inline-flex items-center justify-center px-10 py-5 rounded-xl landing-cta-btn font-bold text-lg shadow-2xl hover:shadow-white/20'
        >
          Login to Portal
          <ArrowRight className='ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform' />
        </Link>
      </div>
    </div>
  );
}
