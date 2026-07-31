import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

/**
 * 404 page.
 *
 * Reached for any unmatched route. Deliberately offers only a link home: the
 * visitor's role decides which dashboard they belong on, and `proxy.ts`
 * already redirects `/` to the right place for a signed-in user.
 */
export default function NotFound() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center'>
      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
        <FileQuestion className='h-6 w-6 text-muted-foreground' />
      </div>

      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold'>Page not found</h1>
        <p className='max-w-md text-sm text-muted-foreground'>
          The page you are looking for does not exist, or you no longer have
          access to it.
        </p>
      </div>

      <Link
        href='/'
        className='inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
      >
        Go home
      </Link>
    </div>
  );
}
