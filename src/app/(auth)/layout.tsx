import '@/styles/globals.css';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Login | Smart Campus for MNSUET',
  description: 'Login to access your Smart Campus for MNSUET portal',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className='min-h-screen flex items-center justify-center p-4 lg:p-8 relative overflow-hidden light'
      style={{ colorScheme: 'light' }}
    >
      {/* Preload Background Image */}
      <img
        src='/bg/login-background.jpg'
        alt=''
        className='hidden'
        fetchPriority='high'
        loading='eager'
        style={{ display: 'none' }}
      />
      
      {/* Background Image - Optimized */}
      <div
        className='absolute inset-0 -z-10'
        style={{
          backgroundImage: 'url(/bg/login-background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat'
        }}
      />
      {/* Dark Blur Overlay */}
      <div 
        className='absolute inset-0'
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)'
        }}
      />

      {/* Logo - Top Left Corner */}
      <Link href='/' className='absolute top-6 left-6 z-30 flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer'>
        <div className='relative'>
          {/* White Spot Below Logo */}
          <div 
            className='absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full blur-2xl'
            style={{
              background: 'var(--white)',
              opacity: 0.6
            }}
          />
          {/* Logo - Direct, No Box */}
          <Image
            src="/logo's/logo.png"
            alt='EduTrack Logo'
            width={70}
            height={70}
            className='object-contain relative z-10'
            priority
            style={{
              filter: 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.5))',
              display: 'block'
            }}
          />
        </div>
        <div>
          <h1 
            className='text-2xl font-bold'
            style={{ 
              color: 'var(--brand-secondary)',
              textShadow: `0 2px 8px var(--brand-secondary-opacity-50)`
            }}
          >
            EduTrack
          </h1>
          <p className='text-xs text-white mt-0.5' style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
            MNS University of Engineering & Technology
          </p>
        </div>
      </Link>

      {/* Main Content Area */}
      <div className='w-full max-w-6xl mx-auto relative z-10 flex items-center gap-4'>
        {/* Left Side - Content */}
        <div className='hidden lg:block max-w-xl ml-auto'>
          <h1 
            className='text-3xl font-bold mb-4 leading-tight'
            style={{ 
              color: 'var(--brand-secondary)',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }}
          >
            Outcome-Based Education Management System
          </h1>
          <p className='text-base text-white/90 leading-relaxed'>
            MNS University of Engineering & Technology's dedicated platform for tracking CLO & PLO attainments, managing assessments, and generating OBE compliance reports.
          </p>
        </div>

        {/* Right Side - Login Form Card */}
        <div 
          className='w-full lg:w-auto lg:min-w-[450px] p-10 rounded-3xl shadow-2xl'
          style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className='absolute bottom-6 left-8 text-white/60 text-sm z-20'>
        © 2025 EduTrack - MNS UET. All rights reserved.
      </div>
    </div>
  );
}
