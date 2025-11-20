import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function CTASection() {
  return (
    <div className='relative py-24 overflow-hidden landing-hero-bg'>
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      <div className="absolute top-10 left-10 w-72 h-72 landing-decorative-blur-2 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-10 right-10 w-96 h-96 landing-decorative-blur-1 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}} />
      
      <div className='relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
        <h2 className='text-4xl md:text-5xl font-extrabold text-white mb-6'>
          Ready to Transform Education?
        </h2>
        <p className='text-xl text-brand-secondary-light mb-10 max-w-2xl mx-auto'>
          Join thousands of educators using EduTrack for outcome-based education management
        </p>
        
        {/* Features List */}
        <div className='flex flex-wrap justify-center gap-6 mb-10'>
          {['Easy Setup', 'Real-time Analytics', '24/7 Support'].map((item, idx) => (
            <div key={idx} className='flex items-center gap-2 text-white'>
              <CheckCircle className='h-5 w-5 text-brand-secondary-light' />
              <span className='font-medium'>{item}</span>
            </div>
          ))}
        </div>
        
        <Link
          href='/login'
          className='inline-flex items-center justify-center navbar-cta px-10 py-5 rounded-xl font-bold text-white text-lg shadow-2xl hover:shadow-white/30'
        >
          Get Started Now
          <ArrowRight className='ml-2 h-6 w-6' />
        </Link>
      </div>
    </div>
  );
}
