import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import NavbarClient from './NavbarClient';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '@/constants/branding';

export default function HeroSection() {
  return (
    <div className='relative overflow-hidden section-ink'>
      {/*
        Two accent washes over the ink ground.

        These used to be packed into one `background` shorthand alongside
        `var(--ground-deep)` and friends, none of which were defined — one
        undefined var invalidates the whole declaration, so the hero rendered
        with no background at all. The ground now comes from `.section-ink`
        and the washes sit in their own layer, so a future missing token can
        only cost the wash, never the ground under the type.

        The `bg-fixed bg-center bg-cover` classes that were here did nothing —
        there is no background image — and `bg-fixed` forces a repaint on
        every scroll frame on mobile.
      */}
      <div
        aria-hidden
        className='absolute inset-0'
        style={{
          background:
            'radial-gradient(1100px 560px at 18% 12%, var(--brand-primary-opacity-30), transparent 62%), ' +
            'radial-gradient(900px 480px at 88% 88%, var(--brand-primary-opacity-15), transparent 60%)',
        }}
      />

      {/* Grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.06]"
      />

      <NavbarClient />

      <div className='relative pt-32 pb-28 sm:pt-44 sm:pb-36'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
          {/* Positioning badge. This named a single university when the product
              served one; the marketing site now speaks to every university. */}
          <span className='inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs sm:text-sm font-semibold tracking-wide text-white/90'>
            Built for PEC, HEC &amp; NCEAC accreditation
          </span>

          {/* The product name was set at text-8xl/font-black — 96px of brand
              shouting above the sentence that actually explains the product.
              The name leads, but at a scale the value proposition can follow. */}
          <h1 className='mt-8 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white'>
            {PRODUCT_NAME}
          </h1>

          {/* Was `text-brand-secondary`, which resolves to the same indigo as
              the primary — roughly 3.4:1 on this ground. A lighter step off
              the same ramp keeps the accent and clears AA comfortably. */}
          <p
            className='mt-4 text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight'
            style={{ color: 'var(--primary-300)' }}
          >
            {PRODUCT_TAGLINE}
          </p>

          <p className='mt-6 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed text-white/80'>
            {/* Named one university until now. It was written with a space
                in the middle, so the earlier search for the short form went
                straight past it — worth remembering if another one turns up. */}
            Every mark your faculty enter becomes CLO and PLO attainment
            evidence — computed as the semester runs, not reconstructed from
            spreadsheets the month before a visit.
          </p>

          {/* CTA Buttons */}
          <div className='mt-10 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4'>
            <Link
              href='/login'
              className='inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-base transition-colors accent-btn'
            >
              Access portal
              <ArrowRight className='ml-2 w-5 h-5' />
            </Link>
            <Link
              href='/#how-it-works'
              className='inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white/10 border border-white/25 text-white font-semibold text-base backdrop-blur hover:bg-white/20 transition-colors'
            >
              What it does
            </Link>
          </div>

          {/*
            Three role cards linking to /login used to sit here, and three
            more linking to the same place sat in the band at the foot of the
            page. Both are now one "Built for every role" section, which says
            what each role actually gets rather than naming it twice. The
            navbar carries a Login button on every scroll position, so the
            shortcut is not lost.
          */}
        </div>
      </div>
    </div>
  );
}
