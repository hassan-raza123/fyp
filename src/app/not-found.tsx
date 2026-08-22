import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowRight, FileQuestion } from 'lucide-react';
import PublicShell from '@/components/landing-page/PublicShell';
import { AUTH_TOKEN_COOKIE } from '@/constants/auth';

/**
 * 404 page.
 *
 * Reached for any unmatched route, signed in or not — until recently only
 * signed in: `proxy.ts` sent every unmatched path from a visitor without a
 * session to /login, so this never rendered for the public.
 *
 * One file serves two audiences, which is why it checks for a session.
 *
 *  - Signed out, this is a marketing-site page: someone mistyped a URL or
 *    followed a stale link, and they should get the site's own header and
 *    footer so they can navigate rather than reverse out. It used to render
 *    as a bare centred block on the page background, indistinguishable from
 *    an unstyled framework default.
 *
 *  - Signed in, they are inside the application and the marketing navbar
 *    would be wrong — a "Login" button and links to "How it works" and
 *    "Modules" served to somebody already three levels into their dashboard.
 *    They get the same styling with no site chrome.
 *
 * The presence of the cookie is all that is read; it is not trusted for
 * anything, and nothing here is gated on it. `proxy.ts` has already decided
 * what this request may reach.
 */
export default async function NotFound() {
  const signedIn = (await cookies()).has(AUTH_TOKEN_COOKIE);

  const body = (
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
          Go home
          <ArrowRight className='ml-2 w-5 h-5' />
        </Link>
        {!signedIn && (
          <Link
            href='/login'
            className='inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-surface border border-firm text-ink font-semibold text-base hover:bg-surface-2 transition-colors'
          >
            Sign in
          </Link>
        )}
      </div>
    </div>
  );

  if (signedIn) {
    return (
      <div className='flex min-h-[70vh] flex-col items-center justify-center'>
        {body}
      </div>
    );
  }

  return <PublicShell>{body}</PublicShell>;
}
