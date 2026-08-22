import '@/styles/globals.css';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
      className='min-h-screen flex items-center justify-center px-4 lg:px-8 pt-28 pb-20 relative overflow-hidden light'
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

      {/*
        Header.

        The logo was pinned `absolute top-6 left-6` — a lockup stuck in the
        corner rather than a header, so it sat at a different height and a
        different left edge from the navbar on every other page, and moving
        between the marketing site and the sign-in screen made it jump.

        It is a real bar now, on the same `max-w-7xl` container, the same
        `h-20` height and the same 44px mark as `NavbarClient`, so the logo
        lands on exactly the same pixel on both. It is not the marketing
        navbar: this is a focused task page and a row of "How it works /
        Modules / Login" links belongs on the site, not over a password field.
        The one link out is the way back.
      */}
      <header className='absolute top-0 inset-x-0 z-30'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-20'>
            <Link
              href='/'
              className='flex items-center gap-3 group hover:opacity-90 transition-opacity'
            >
              {/* The mark had a 60%-opaque white blur behind it and a black
                  drop-shadow on top — two effects fighting on a 70px logo. */}
              <div className='relative w-11 h-11 transition-transform duration-300 group-hover:scale-105'>
                <Image
                  src='/brand/attainly-mark.svg'
                  alt={`${PRODUCT_NAME} logo`}
                  width={44}
                  height={44}
                  priority
                  className='w-full h-full object-contain'
                />
              </div>
              <div>
                {/* The text-shadows here and on the left-hand column were
                    compensating for a background that never rendered. With
                    real ink under the type they only muddy it. */}
                <span className='block text-xl font-bold tracking-tight text-white'>
                  {PRODUCT_NAME}
                </span>
                <span className='block text-[11px] font-semibold tracking-wide text-white/70'>
                  {branding.institutionName}
                </span>
              </div>
            </Link>

            <Link
              href='/'
              className='hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white/85 hover:text-white hover:bg-white/10 transition-colors'
            >
              <ArrowLeft className='w-4 h-4' />
              Back to site
            </Link>
          </div>
        </div>
      </header>

      {/*
        Main content.

        The two columns were `flex items-center gap-4` inside a `max-w-6xl`,
        with `ml-auto` on the left one — so the text hugged the middle, the
        card hugged the right, and the pair floated with a large dead gap
        between them and another below. A 12-column grid puts the copy and the
        card in a fixed relationship at any width.
      */}
      <div className='w-full max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center'>
        {/* Left Side - Content */}
        <div className='hidden lg:block lg:col-span-6'>
          {/* The badge, heading weight and body size are the hero's, so the
              sign-in page reads as the same site rather than a separate app
              that happens to share a logo. */}
          <span className='inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold tracking-wide text-white/90'>
            Built for PEC, HEC &amp; NCEAC accreditation
          </span>

          {/* This and the wordmark above were both `<h1>` — two first-level
              headings on one page, and the wordmark is not the heading. */}
          <h1
            className='mt-6 text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight'
            style={{ color: 'var(--primary-200)' }}
          >
            {PRODUCT_TAGLINE}
          </h1>
          <p className='mt-4 text-base text-white/80 leading-relaxed'>
            {branding.isUnbranded
              ? 'Track CLO & PLO attainments, manage assessments, and generate OBE compliance reports.'
              : `${branding.institutionName}'s platform for tracking CLO & PLO attainments, managing assessments, and generating OBE compliance reports.`}
          </p>
        </div>

        {/* Right Side - Login Form Card.

            Was `rounded-3xl` with no border and a backdrop blur behind an
            already-opaque surface. Every other card on the site is a
            `rounded-2xl` surface with a hairline border. */}
        <div className='w-full lg:col-span-6 p-8 sm:p-10 rounded-2xl border border-subtle shadow-2xl bg-surface'>
          {children}

          {branding.supportEmail && (
            <p className='text-center text-sm mt-6 pt-6 border-t border-subtle text-ink-muted'>
              Need help? Contact{' '}
              <a
                href={`mailto:${branding.supportEmail}`}
                className='font-medium hover:underline'
                style={{ color: 'var(--accent)' }}
              >
                IT support
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
