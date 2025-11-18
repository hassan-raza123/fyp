'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Features', href: '/features' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export default function NavbarClient() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
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
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-card/80 backdrop-blur-md border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          <div className='flex-shrink-0'>
            <Link
              href='/'
              className='flex items-center space-x-3 transition-all duration-300'
            >
              <img
                src='/logo.png'
                alt='Smart Campus Logo'
                className='w-12 h-12 rounded-full shadow-md object-cover'
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                }}
              />
              <span
                className={`text-xl font-bold transition-colors duration-300 ${
                  isScrolled ? 'bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent' : 'text-white'
                }`}
              >
                Smart Campus
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden md:block'>
            <div className='ml-10 flex items-center space-x-4'>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isScrolled
                      ? isActive(item.href)
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent font-bold bg-purple-50'
                        : 'text-slate-700 hover:text-purple-600'
                      : isActive(item.href)
                      ? 'text-white font-bold bg-white/25 backdrop-blur-md border border-white/40 shadow-lg'
                      : 'text-white hover:text-white hover:bg-white/15 backdrop-blur-sm'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href='/login'
                className={`ml-4 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  isScrolled
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-700 hover:to-cyan-700'
                    : 'bg-white text-purple-600 hover:bg-white/95'
                }`}
              >
                Login
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className='md:hidden'>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md transition-colors duration-300 ${
                isScrolled
                  ? 'text-foreground hover:text-primary-600'
                  : 'text-white hover:text-white/80'
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
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className='md:hidden bg-white/95 backdrop-blur-xl border-b-2 border-purple-200 shadow-2xl'>
          <div className='px-4 pt-4 pb-4 space-y-2 sm:px-6'>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent font-bold bg-purple-50 border-2 border-purple-200'
                    : 'text-slate-700 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href='/login'
              className='block px-4 py-3 rounded-xl text-base font-bold bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all'
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
