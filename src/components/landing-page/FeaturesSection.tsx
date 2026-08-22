import { features } from '@/constants/landing-page';

/**
 * The "System modules" band.
 *
 * The section used to paint a light surface gradient and then lay a
 * 40–55% black gradient over it. Two layers fighting each other resolve to
 * flat dishwater grey, which is exactly how this band rendered — grey cards
 * on a grey ground, white text on mid-grey. It now sits on the ink ground
 * directly, one layer, so the glass cards have something to be glass over.
 *
 * Also dropped: `bg-fixed bg-center bg-cover`, which styled a background
 * image that does not exist, and `'use client'` — nothing here is
 * interactive, so it was shipping the component to the browser for nothing.
 */
export default function FeaturesSection() {
  return (
    <section id='modules' className='relative section-ink scroll-mt-24'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24'>
        {/* Section Header */}
        <div className='text-center mb-14'>
          <span className='inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-xs font-semibold tracking-wider text-white/90'>
            SYSTEM MODULES
          </span>
          {/* Was "Powerful features for complete OBE" over "Everything you
              need to implement, track and report outcome-based education" —
              two lines that between them named nothing the software does. */}
          <h2 className='mt-6 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white'>
            What is in the system
          </h2>
          <p className='mt-4 text-base sm:text-lg max-w-2xl mx-auto text-white/75'>
            Six modules, one database. No spreadsheet lives between any two of
            them.
          </p>
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.title}
                className='group rounded-2xl bg-white/[0.06] border border-white/12 p-7 backdrop-blur-sm hover:bg-white/[0.1] hover:border-white/25 transition-colors'
              >
                <div
                  className='w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-105'
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <IconComponent className='h-6 w-6 text-white' />
                </div>

                <h3 className='text-lg font-semibold text-white mb-2'>
                  {feature.title}
                </h3>
                <p className='text-sm leading-relaxed text-white/70'>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
