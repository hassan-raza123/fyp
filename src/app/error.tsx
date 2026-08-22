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
    <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center'>
      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'>
        <AlertTriangle className='h-6 w-6 text-destructive' />
      </div>

      <div className='space-y-1'>
        <h1 className='text-lg font-semibold'>Something went wrong</h1>
        {/* Said "go back to your dashboard" beside a button labelled "Go
            home" pointing at `/`, which is the marketing page. */}
        <p className='max-w-md text-sm text-muted-foreground'>
          This page could not be displayed. You can try again, or start over
          from the home page.
        </p>
        {error.digest && (
          <p className='pt-1 text-xs text-muted-foreground'>
            Reference: <code>{error.digest}</code>
          </p>
        )}
      </div>

      <div className='flex flex-wrap items-center justify-center gap-2'>
        <button
          type='button'
          onClick={reset}
          className='inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
        >
          <RotateCw className='h-4 w-4' />
          Try again
        </button>
        <Link
          href='/'
          className='inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-accent'
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
