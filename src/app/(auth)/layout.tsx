import '@/styles/globals.css';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getBranding } from '@/lib/branding';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '@/constants/branding';

export const metadata: Metadata = {
  title: `Login | ${PRODUCT_NAME}`,
  description: `Login to access your ${PRODUCT_NAME} portal`,
};

/**
 * Render per request rather than at build time.
 *
 * This layout reads the institution name from the database. Without this the
 * auth pages prerender as static HTML, which bakes whatever the setting held
 * when the deploy ran into the page — so an administrator changing their
 * institution name would see no change until the next deploy, with nothing to
 * indicate why. A query per login page view is the right trade for that.
 */
export const dynamic = 'force-dynamic';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await getBranding();

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
            alt={`${PRODUCT_NAME} logo`}
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
              color: 'var(--white)',
              textShadow: '0 2px 8px rgba(0,0,0,0.6)'
            }}
          >
            {PRODUCT_NAME}
          </h1>
          <p className='text-xs text-white mt-0.5' style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
            {branding.institutionName}
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
              color: 'var(--primary-200)',
              textShadow: '0 2px 8px rgba(0,0,0,0.6)'
            }}
          >
            {PRODUCT_TAGLINE}
          </h1>
          <p className='text-base text-white/90 leading-relaxed'>
            {branding.isUnbranded
              ? 'Track CLO & PLO attainments, manage assessments, and generate OBE compliance reports.'
              : `${branding.institutionName}'s platform for tracking CLO & PLO attainments, managing assessments, and generating OBE compliance reports.`}
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

          {branding.supportEmail && (
            <p className='text-center text-sm mt-4' style={{ color: 'var(--gray-500)' }}>
              Need help? Contact{' '}
              <a
                href={`mailto:${branding.supportEmail}`}
                className='font-medium hover:underline'
                style={{ color: 'var(--brand-primary)' }}
              >
                IT Support
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className='absolute bottom-6 left-8 text-white/60 text-sm z-20'>
        © {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.
      </div>
    </div>
  );
}
