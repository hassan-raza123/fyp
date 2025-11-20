'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sparkles } from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Features', href: '/#modules' },
  { name: 'Portals', href: '/#portals' },
  { name: 'Team', href: '/#team' },
];

export default function NavbarClient() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'navbar-glass shadow-xl border-b border-slate-200'
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
              {/* Glow Effect */}
              <div className='absolute -inset-2 brand-gradient rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity'></div>
              
              {/* Logo Container */}
              <div className='relative'>
                <div className='w-14 h-14 rounded-xl brand-gradient flex items-center justify-center shadow-lg transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-300'>
                  <img
                    src="/logo's/logo.png"
                    alt='EduTrack Logo'
                    className='w-9 h-9 object-contain'
                  />
                </div>
              </div>
              
              {/* Brand Text */}
              <div className='relative'>
                <div className='flex items-center gap-2'>
                  <span
                    className={`text-2xl font-extrabold tracking-tight transition-colors duration-300 ${
                      isScrolled ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    EduTrack
                  </span>
                  <Sparkles className={`w-5 h-5 ${isScrolled ? 'text-brand-primary' : 'text-cyan-300'}`} />
                </div>
                <div className={`text-xs font-semibold tracking-wide transition-colors duration-300 ${
                  isScrolled ? 'text-brand-primary' : 'text-cyan-200'
                }`}>
                  Outcome-Based Education
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
                        : 'text-slate-700 hover:bg-slate-100'
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
                className='navbar-cta px-8 py-3 rounded-xl text-sm font-bold text-white relative overflow-hidden group'
              >
                <span className='relative z-10 flex items-center gap-2'>
                  Login
                  <svg className='w-4 h-4 group-hover:translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 7l5 5m0 0l-5 5m5-5H6' />
                  </svg>
                </span>
                {/* Shine effect */}
                <div className='absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-linear-to-r from-transparent via-white/20 to-transparent'></div>
              </Link>
            </div>

            {/* Mobile menu button - Enhanced */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2.5 rounded-xl transition-all duration-300 ${
                isScrolled
                  ? 'text-slate-900 hover:bg-slate-100'
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
          <div 
            className='fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in'
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className='fixed top-20 inset-x-4 bg-white rounded-2xl border border-slate-200 shadow-2xl animate-slide-down overflow-hidden'>
            <div className='p-6 space-y-2'>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                    isActive(item.href)
                      ? 'navbar-link-active'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile CTA */}
              <Link
                href='/login'
                onClick={() => setIsMobileMenuOpen(false)}
                className='block navbar-cta px-4 py-4 rounded-xl text-base font-bold text-white text-center mt-4'
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
