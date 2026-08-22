import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { roles } from '@/constants/landing-page';

/**
 * What each role gets.
 *
 * This replaces a six-card "For Students" block that carried the largest
 * heading on the page. Students are the people whose work the system records;
 * they are not the people deciding whether an institution adopts it, and
 * giving them the page's loudest section left the reader who *does* decide
 * with feature grids on either side of it. The three role columns below cover
 * the same ground as that section and the three duplicate portal cards that
 * used to sit at the foot of the page, in one place instead of three.
 *
 * The file is still named StatsOverview; it has never shown a statistic.
 */
export default function RolesSection() {
  return (
    <section id='roles' className='relative py-24 overflow-hidden section-paper scroll-mt-24'>
      {/* Decorative wash. The three blurred circles were 72–96 rem-wide
          absolutely positioned blur-3xl layers; two is enough to give the
          band depth without three composited layers on scroll. */}
      <div aria-hidden className='absolute inset-0 overflow-hidden'>
        <div
          className='absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full blur-3xl'
          style={{ background: 'var(--brand-primary-opacity-08)' }}
        />
        <div
          className='absolute top-1/2 -right-24 w-[26rem] h-[26rem] rounded-full blur-3xl'
          style={{ background: 'var(--brand-primary-opacity-06)' }}
        />
      </div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-14'>
          <span
            className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider'
            style={{
              backgroundColor: 'var(--accent-wash)',
              color: 'var(--accent-active)',
            }}
          >
            WHO USES IT
          </span>
          {/*
            The heading this replaces was an `<h3>` at text-6xl — the largest
            type on the page, in the wrong heading level, on a section
            following an `<h2>`.
          */}
          <h2 className='mt-6 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ink'>
            One record, three points of view
          </h2>
          <p className='mt-4 text-base sm:text-lg max-w-2xl mx-auto text-ink-2'>
            Everyone works from the same data. What changes is how much of it
            you can see and change.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.title}
                className='flex flex-col rounded-2xl bg-surface border border-subtle p-7 shadow-sm'
              >
                <span
                  className='inline-flex w-12 h-12 rounded-xl items-center justify-center mb-5'
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Icon className='w-6 h-6 text-white' />
                </span>

                <h3 className='text-lg font-semibold text-ink'>{role.title}</h3>
                <p className='mt-1 text-sm text-ink-2'>{role.blurb}</p>

                <ul className='mt-5 space-y-2.5 list-none p-0 m-0'>
                  {role.points.map((point) => (
                    <li key={point} className='flex items-start gap-2.5'>
                      <Check
                        aria-hidden
                        className='w-4 h-4 mt-0.5 shrink-0'
                        style={{ color: 'var(--accent)' }}
                      />
                      <span className='text-sm leading-snug text-ink-2'>
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className='mt-12 text-center'>
          <Link
            href='/login'
            className='inline-flex items-center gap-2 font-semibold text-base hover:underline'
            style={{ color: 'var(--accent)' }}
          >
            Sign in to your portal
            <ArrowRight className='w-4 h-4' />
          </Link>
        </div>
      </div>
    </section>
  );
}
