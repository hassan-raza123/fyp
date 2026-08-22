import '@/styles/globals.css';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getBranding } from '@/lib/branding';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '@/constants/branding';

/**
 * Group-level fallback only. This set `title: 'Login | Attainly'` for every
 * page in the group, so /forgot-password, /verify-otp and /reset-password all
 * called themselves the login screen. Each page now sets its own title and
 * overrides this.
 */
export const metadata: Metadata = {
  title: {
    default: `Sign in | ${PRODUCT_NAME}`,
    template: `%s | ${PRODUCT_NAME}`,
  },
  description: `Sign in to your ${PRODUCT_NAME} portal.`,
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
      {/*
        Background.

        This was a stock photograph of a street with no licence on file, sitting
        behind the sign-in form of a product sold to universities. It is now
        drawn from the palette: an ink ground with two soft accent washes. No
        third-party imagery, nothing to license, no 400KB download before a user
        can type their password, and it inherits any future palette change.
      */}
      <div className='absolute inset-0 -z-10 section-ink'>
        {/*
          The three layers were packed into one `background` shorthand, and
          the three `--ground-*` tokens it named were never defined. An
          undefined var() makes the whole declaration invalid at
          computed-value time, so the property fell back to `transparent` —
          this page rendered white type on the near-white page colour: the
          logo wordmark, the institution name, the tagline, the description
          and the copyright line were all invisible.

          The ground now comes from `.section-ink`, which is defined in the
          same stylesheet as the tokens it uses, and the accent washes sit in
          their own layer above it. A missing token can now cost the wash but
          never the ground the type is read against.
        */}
        <div
          aria-hidden
          className='absolute inset-0'
          style={{
            background:
              'radial-gradient(1200px 600px at 15% 20%, var(--brand-primary-opacity-30), transparent 60%), ' +
              'radial-gradient(900px 500px at 85% 85%, var(--brand-primary-opacity-15), transparent 60%)',
          }}
        />
      </div>

      {/* Logo - Top Left Corner */}
      <Link href='/' className='absolute top-6 left-6 z-30 flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer'>
        {/* The mark had a 60%-opaque white blur behind it and a black
            drop-shadow on top — two effects fighting on a 70px logo. */}
        <Image
          src='/brand/attainly-mark.svg'
          alt={`${PRODUCT_NAME} logo`}
          width={44}
          height={44}
          priority
          className='object-contain block shrink-0'
        />
        <div>
          {/* The text-shadows here and on the left-hand column were
              compensating for a background that never rendered. With real
              ink under the type they only muddy it. */}
          <span className='block text-xl font-bold text-white'>
            {PRODUCT_NAME}
          </span>
          <span className='block text-xs text-white/70 mt-0.5'>
            {branding.institutionName}
          </span>
        </div>
      </Link>

      {/* Main Content Area */}
      <div className='w-full max-w-6xl mx-auto relative z-10 flex items-center gap-4'>
        {/* Left Side - Content */}
        <div className='hidden lg:block max-w-xl ml-auto'>
          {/* This and the wordmark above were both `<h1>` — two first-level
              headings on one page, and the wordmark is not the heading. */}
          <h1
            className='text-3xl font-bold mb-4 leading-tight'
            style={{ color: 'var(--primary-200)' }}
          >
            {PRODUCT_TAGLINE}
          </h1>
          <p className='text-base text-white/80 leading-relaxed'>
            {branding.isUnbranded
              ? 'Track CLO & PLO attainments, manage assessments, and generate OBE compliance reports.'
              : `${branding.institutionName}'s platform for tracking CLO & PLO attainments, managing assessments, and generating OBE compliance reports.`}
          </p>
        </div>

        {/* Right Side - Login Form Card */}
        <div 
          className='w-full lg:w-auto lg:min-w-[450px] p-10 rounded-3xl shadow-2xl'
          style={{
            background: 'var(--surface)',
            backdropFilter: 'blur(20px)',
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
      <div className='absolute bottom-6 left-8 text-white/50 text-xs z-20'>
        © {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.
      </div>
    </div>
  );
}
