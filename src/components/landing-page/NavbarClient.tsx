'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, Menu, X } from 'lucide-react';
import { PRODUCT_NAME } from '@/constants/branding';

/*
  Scroll position and the URL hash are browser state, not React state.

  They used to be mirrored into `useState` from an effect that called
  `setActiveHash` synchronously in its body — a cascading render on mount —
  and `setIsScrolled` on every single scroll event, so the navbar re-rendered
  continuously while the page moved rather than only when it crossed the
  20px threshold. `useSyncExternalStore` subscribes to each source and
  re-renders only when the derived value actually changes, and returns the
  server snapshot during SSR instead of reading `window` during render.
*/
const subscribeScroll = (onChange: () => void) => {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
};

const subscribeHash = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};

/* "Portal" pointed at the band that repeated the hero's role cards. That
   band is now a single call to action, so the slot goes to the roles
   section, which is what a reader looking for "is there a student view?"
   actually wants. */
const navigation = [
  { name: 'Home', href: '/' },
  { name: 'How it works', href: '/#how-it-works' },
  { name: 'Capabilities', href: '/#obe-showcase' },
  { name: 'Who uses it', href: '/#roles' },
  { name: 'Modules', href: '/#modules' },
];

export default function NavbarClient({
  /**
   * Force the opaque treatment.
   *
   * The bar is transparent with white type until the page scrolls, which is
   * right over the hero and wrong everywhere else: on the legal pages, the
   * 404 and any other light page it would paint white text on a white
   * background at scroll position zero. Those pages pass `solid`.
   */
  solid = false,
}: {
  solid?: boolean;
} = {}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const scrolledPastHero = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 20,
    () => false,
  );

  const isScrolled = solid || scrolledPastHero;

  const activeHash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => '',
  );

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/' && !activeHash;
    }
    // Returned `activeHash && ...` — the empty string, not false, whenever
    // there was no hash.
    return pathname === '/' && Boolean(activeHash) && href.endsWith(activeHash);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'navbar-glass shadow-xl border-b border-subtle'
            : 'bg-transparent'
        }`}
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-20'>
            {/* Logo Section - Enhanced */}
            <Link
              href='/'
              className='flex items-center space-x-3 group relative'
            >
              {/* Logo. Was a raw <img> at 80x80 inside a 80px-tall navbar —
                  the mark filled the bar edge to edge with no breathing room,
                  and bypassed next/image entirely. */}
              <div className='relative w-11 h-11 transition-transform duration-300 group-hover:scale-105'>
                <Image
                  src='/brand/attainly-mark.svg'
                  alt={`${PRODUCT_NAME} logo`}
                  width={44}
                  height={44}
                  priority
                  className='w-full h-full object-contain'
                />
              </div>
              
              {/* Brand Text */}
              <div className='relative'>
                <div className='flex items-center gap-2'>
                  <span
                    className={`text-xl font-bold tracking-tight transition-colors duration-300 ${
                      isScrolled ? 'text-ink' : 'text-white'
                    }`}
                  >
                    {PRODUCT_NAME}
                  </span>
                </div>
                {/* `--brand-secondary` is the same indigo as the primary, so
                    scrolled-state subtitle sat at ~3:1 on white. */}
                <div
                  className='text-[11px] font-semibold tracking-wide transition-colors duration-300'
                  style={{
                    color: isScrolled
                      ? 'var(--text-muted)'
                      : 'var(--white-opacity-70)',
                  }}
                >
                  OBE Management System
                </div>
              </div>
            </Link>

            {/* Desktop Navigation - Enhanced */}
            <div className='hidden lg:flex items-center space-x-2'>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold navbar-link ${
                    isScrolled
                      ? isActive(item.href)
                        ? 'navbar-link-active'
                        : 'text-ink-2 hover:bg-surface-2'
                      : isActive(item.href)
                      ? 'text-white bg-white/20 backdrop-blur-sm'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* CTA Button - Enhanced */}
            <div className='hidden lg:flex items-center space-x-4'>
              <Link
                href='/login'
                className='accent-btn px-6 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 group transition-colors'
              >
                Login
                <ArrowRight className='w-4 h-4 transition-transform group-hover:translate-x-0.5' />
              </Link>
            </div>

            {/* Mobile menu button - Enhanced */}
            {/* The only content was an icon, so the button had no accessible
                name at all: a screen reader announced "button", with nothing
                to say what it opened or whether it was open. */}
            <button
              type='button'
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls='mobile-menu'
              className={`lg:hidden p-2.5 rounded-xl transition-all duration-300 ${
                isScrolled
                  ? 'text-ink hover:bg-surface-2'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {isMobileMenuOpen ? (
                <X className='h-6 w-6' />
              ) : (
                <Menu className='h-6 w-6' />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu - Enhanced */}
      {isMobileMenuOpen && (
        <div className='fixed inset-0 z-40 lg:hidden'>
          {/* Backdrop */}
          {/* Was `bg-white/50` — a white scrim over a dark hero, which
              washed the page out instead of dimming it. */}
          <div
            className='fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in'
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div
            id='mobile-menu'
            className='fixed top-20 inset-x-4 bg-surface rounded-2xl border border-subtle shadow-2xl animate-slide-down overflow-hidden'
          >
            <div className='p-6 space-y-2'>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                    isActive(item.href)
                      ? 'navbar-link-active'
                      : 'text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile CTA */}
              <Link
                href='/login'
                onClick={() => setIsMobileMenuOpen(false)}
                className='accent-btn block px-4 py-3.5 rounded-xl text-base font-semibold text-white text-center mt-4'
              >
                Login to Portal
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
