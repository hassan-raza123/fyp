import Link from 'next/link';
import { ArrowRight, FileQuestion } from 'lucide-react';
import PublicShell from '@/components/landing-page/PublicShell';

/**
 * 404 page.
 *
 * Reached for any unmatched route, signed in or not — until recently only
 * signed in: `proxy.ts` sent every unmatched path from a visitor without a
 * session to /login, so this never rendered for the public.
 *
 * It used to be a bare centred block on the page background with no header,
 * no footer and no branding — the same treatment as an unstyled framework
 * default. It now carries the site chrome, so a visitor who mistyped a URL
 * can navigate rather than reverse out.
 *
 * The claim that used to be here — that `proxy.ts` redirects `/` to the right
 * dashboard for a signed-in user — was not true: `/` is in `publicWebRoutes`
 * and is served to everyone.
 */
export default function NotFound() {
  return (
    <PublicShell>
      <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center'>
        <span
          className='inline-flex w-14 h-14 rounded-2xl items-center justify-center'
          style={{ backgroundColor: 'var(--accent-wash)' }}
        >
          <FileQuestion className='w-7 h-7' style={{ color: 'var(--accent)' }} />
        </span>

        <h1 className='mt-8 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink'>
          Page not found
        </h1>
        <p className='mt-4 text-base sm:text-lg text-ink-2'>
          The page you are looking for does not exist, or you no longer have
          access to it.
        </p>

        <div className='mt-10 flex flex-col sm:flex-row justify-center gap-3'>
          <Link
            href='/'
            className='accent-btn inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-white font-semibold text-base transition-colors'
          >
            Go to the home page
            <ArrowRight className='ml-2 w-5 h-5' />
          </Link>
          <Link
            href='/login'
            className='inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-surface border border-firm text-ink font-semibold text-base hover:bg-surface-2 transition-colors'
          >
            Sign in
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
