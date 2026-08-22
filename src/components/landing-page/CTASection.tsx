import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ContactDialog from './ContactDialog';

/**
 * The closing call to action.
 *
 * This band used to repeat the hero: the same three roles, as three cards,
 * linking to the same login screen, under an eyebrow reading "ACCESS YOUR
 * PORTAL" directly above a heading reading "Access Your Portal". Those three
 * roles are now covered once, with substance, in the roles section above.
 *
 * What was missing is what is here instead. Every call to action on the page
 * said "sign in", which is the right thing to offer someone whose institution
 * already runs the product and a dead end for anyone evaluating it for
 * theirs — the only route to the contact form was the floating bubble in the
 * corner. Both readers now have a door.
 */
export default function CTASection() {
  return (
    <section id='portal' className='relative section-paper scroll-mt-24'>
      <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center'>
        <span
          className='inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider'
          style={{
            backgroundColor: 'var(--accent-wash)',
            color: 'var(--accent-active)',
          }}
        >
          GET STARTED
        </span>

        <h2 className='mt-6 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ink'>
          Start collecting evidence this semester
        </h2>
        <p className='mt-4 text-base sm:text-lg text-ink-2'>
          Sign in if your institution already runs Attainly. If you are
          weighing it up for yours, tell us about your programmes and your next
          review date.
        </p>

        <div className='mt-10 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4'>
          <Link
            href='/login'
            className='accent-btn inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-white font-semibold text-base transition-colors'
          >
            Sign in
            <ArrowRight className='ml-2 h-5 w-5' />
          </Link>

          <ContactDialog>
            <button
              type='button'
              className='inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-surface border border-firm text-ink font-semibold text-base hover:bg-surface-2 transition-colors'
            >
              Talk to us
            </button>
          </ContactDialog>
        </div>
      </div>
    </section>
  );
}
