'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCw } from 'lucide-react';

/**
 * Route-level error boundary.
 *
 * Without this, an exception thrown while rendering any page shows Next's own
 * error screen — a stack trace in development and an unstyled default in
 * production, with no way back into the app.
 *
 * `reset()` re-renders the segment, which recovers from a transient failure
 * (a fetch that timed out, say) without a full reload.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is the only handle on the server-side stack in production.
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className='flex min-h-[70vh] flex-col items-center justify-center px-4 sm:px-6 py-16 text-center'>
      <span
        className='inline-flex w-14 h-14 rounded-2xl items-center justify-center'
        style={{ backgroundColor: 'var(--bad-wash)' }}
      >
        <AlertTriangle className='h-7 w-7 text-bad' />
      </span>

      <h1 className='mt-8 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink'>
        Something went wrong
      </h1>
      {/* Said "go back to your dashboard" beside a button labelled "Go home"
          pointing at `/`, which is the marketing page. */}
      <p className='mt-4 max-w-md text-base text-ink-2'>
        This page could not be displayed. You can try again, or start over from
        the home page.
      </p>
      {error.digest && (
        <p className='mt-3 text-xs text-ink-muted'>
          Reference: <code className='font-mono'>{error.digest}</code>
        </p>
      )}

      <div className='mt-10 flex flex-col sm:flex-row items-center justify-center gap-3'>
        <button
          type='button'
          onClick={reset}
          className='accent-btn inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base transition-colors'
        >
          <RotateCw className='h-4 w-4' />
          Try again
        </button>
        <Link
          href='/'
          className='inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-surface border border-firm text-ink font-semibold text-base hover:bg-surface-2 transition-colors'
        >
          Go to the home page
        </Link>
      </div>
    </div>
  );
}
