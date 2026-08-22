import { steps } from '@/constants/landing-page';

/**
 * The three steps of the evidence lifecycle.
 *
 * The steps themselves — and why the old three were wrong — are documented
 * where they are defined, in `@/constants/landing-page`. The heading here
 * read "Simple & Efficient Process", which described the page's opinion of
 * itself rather than the process.
 *
 * The component is named UniversityStatsBar and has never shown statistics.
 */
export default function HowItWorksSection() {
  return (
    <section
      id='how-it-works'
      className='relative py-24 overflow-hidden section-paper scroll-mt-24'
    >
      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          {/* The badge was `bg-gradient-to-r from-primary/10 to-primary/10` —
              a gradient between one colour and itself. */}
          <span
            className='inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider'
            style={{
              backgroundColor: 'var(--accent-wash)',
              color: 'var(--accent-active)',
            }}
          >
            HOW IT WORKS
          </span>
          <h2 className='mt-6 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ink'>
            From course outcomes to accreditation evidence
          </h2>
          <p className='mt-4 text-base sm:text-lg text-ink-2 max-w-2xl mx-auto'>
            Three steps, and only the middle one is work your faculty were not
            already doing.
          </p>
        </div>

        {/* Steps Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 relative'>
          {/* Connecting line (desktop) */}
          <div
            aria-hidden
            className='hidden md:block absolute top-24 left-[16%] right-[16%] h-px'
            style={{ background: 'var(--border-color)' }}
          />

          {steps.map((step) => (
            <div key={step.number} className='group relative'>
              {/* The card declared `border-2 border-subtle` and
                  `hover:border-subtle` — the same colour on both sides, so
                  the hover did nothing. */}
              <div className='relative h-full bg-surface rounded-2xl p-8 pt-10 border border-subtle hover:border-firm hover:shadow-md hover:-translate-y-1 transition-all duration-300'>
                {/* Number badge */}
                <div
                  className='absolute -top-5 left-8 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md z-10'
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {step.number}
                </div>

                <h3 className='text-lg font-semibold text-ink mb-3'>
                  {step.title}
                </h3>
                <p className='text-sm text-ink-2 leading-relaxed'>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
