'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Modules', href: '/#modules' },
  { name: 'Team', href: '/#team' },
  { name: 'Contact', href: '/#contact' },
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
                className={`text-xl font-semibold transition-colors duration-300 ${
                  isScrolled ? 'text-slate-900' : 'text-white'
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
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isScrolled
                      ? isActive(item.href)
                        ? 'text-blue-900 font-semibold bg-blue-50'
                        : 'text-slate-700 hover:text-blue-900 hover:bg-slate-50'
                      : isActive(item.href)
                      ? 'text-white font-semibold bg-white/20 backdrop-blur-sm'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href='/login'
                className={`ml-4 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isScrolled
                    ? 'bg-blue-900 text-white hover:bg-blue-800 shadow-md'
                    : 'bg-white text-blue-900 hover:bg-blue-50 shadow-md'
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
        <div className='md:hidden bg-white border-b border-gray-200 shadow-lg'>
          <div className='px-4 pt-3 pb-3 space-y-1'>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-base font-medium transition-all ${
                  isActive(item.href)
                    ? 'text-blue-900 font-semibold bg-blue-50'
                    : 'text-slate-700 hover:text-blue-900 hover:bg-slate-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href='/login'
              className='block px-3 py-2 rounded-lg text-base font-semibold bg-blue-900 text-white text-center mt-2 hover:bg-blue-800 transition-all'
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
