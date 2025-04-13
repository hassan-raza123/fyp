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
          ? 'bg-white/80 backdrop-blur-md border-b border-gray-200'
          : 'bg-transparent'
      }`}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          <div className='flex-shrink-0'>
            <Link 
              href='/' 
              className={`text-2xl font-bold transition-colors duration-300 ${
                isScrolled ? 'text-purple-600' : 'text-white'
              }`}
            >
              UniTrack360
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden md:block'>
            <div className='ml-10 flex items-center space-x-4'>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    isScrolled
                      ? isActive(item.href)
                        ? 'text-purple-600 font-semibold bg-purple-50'
                        : 'text-gray-900 hover:text-purple-600'
                      : isActive(item.href)
                      ? 'text-white font-semibold bg-white/10 backdrop-blur-sm border border-white/20'
                      : 'text-white hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href='/login'
                className={`ml-4 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isScrolled
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-white text-purple-600 hover:bg-white/90'
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
                isScrolled ? 'text-gray-900 hover:text-purple-600' : 'text-white hover:text-white/80'
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
        <div className='md:hidden bg-white border-b border-gray-200'>
          <div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(item.href)
                    ? 'text-purple-600 font-semibold bg-purple-50'
                    : 'text-gray-900 hover:text-purple-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href='/login'
              className='block px-3 py-2 rounded-md text-base font-medium text-purple-600 hover:text-purple-700'
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
