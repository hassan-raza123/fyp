'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sparkles } from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'How It Works', href: '/#how-it-works' },
  { name: 'Features', href: '/#modules' },
  { name: 'Team', href: '/#team' },
  { name: 'Portal', href: '/#portal' },
];

export default function NavbarClient() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      
      // Update active hash based on scroll position
      const sections = ['how-it-works', 'modules', 'team', 'portal'];
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      
      if (currentSection) {
        setActiveHash(`#${currentSection}`);
      } else if (window.scrollY < 100) {
        setActiveHash('');
      }
    };

    // Set initial hash from URL
    setActiveHash(window.location.hash);

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('hashchange', () => setActiveHash(window.location.hash));
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', () => setActiveHash(window.location.hash));
    };
  }, []);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' && !activeHash;
    }
    // Check if the hash part matches
    const hrefHash = href.includes('#') ? href.split('#')[1] : '';
    return activeHash === `#${hrefHash}`;
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
              {/* Logo Container */}
              <div className='relative'>
                {/* Orange Spot Behind Logo */}
                <div 
                  className='absolute inset-0 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300'
                  style={{ 
                    background: 'var(--brand-secondary)',
                    transform: 'scale(1.2)'
                  }}
                ></div>
                
                {/* Logo */}
                <div className='relative w-14 h-14 transform group-hover:scale-110 transition-all duration-300'>
                  <img
                    src="/logo's/logo.png"
                    alt='EduTrack Logo'
                    className='w-full h-full object-contain drop-shadow-lg'
                  />
                </div>
              </div>
              
              {/* Brand Text */}
              <div className='relative'>
                <div className='flex items-center gap-2'>
                  <span
                    className={`text-2xl font-black tracking-tight transition-colors duration-300 ${
                      isScrolled ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    EduTrack
                  </span>
                </div>
                <div className={`text-xs font-bold tracking-wide transition-colors duration-300 ${
                  isScrolled ? 'text-brand-secondary' : 'text-orange-200'
                }`}>
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
                className='px-8 py-3 rounded-xl text-sm font-bold text-white relative overflow-hidden group transition-all duration-300 hover:scale-105 shadow-lg'
                style={{
                  backgroundColor: 'var(--brand-secondary)',
                  boxShadow: '0 4px 20px rgba(252, 153, 40, 0.3)'
                }}
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
                className='block px-4 py-4 rounded-xl text-base font-bold text-white text-center mt-4 shadow-lg'
                style={{
                  backgroundColor: 'var(--brand-secondary)',
                  boxShadow: '0 4px 20px rgba(252, 153, 40, 0.3)'
                }}
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
