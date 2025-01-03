'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function NavbarClient() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '/features' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-md' : 'bg-transparent'
      }`}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-20'>
          {/* Logo */}
          <Link
            href='/'
            className={`text-2xl font-bold tracking-tight transition-colors ${
              isScrolled ? 'text-indigo-700' : 'text-white'
            }`}
          >
            UniAttend
          </Link>

          {/* Desktop Navigation */}
          <div className='hidden md:flex items-center space-x-8'>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isScrolled
                    ? 'text-gray-600 hover:text-indigo-700'
                    : 'text-indigo-100 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              href='/login'
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:-translate-y-0.5 ${
                isScrolled
                  ? 'bg-indigo-700 text-white hover:bg-indigo-800 shadow-md hover:shadow-lg'
                  : 'bg-white text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className='md:hidden'>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isScrolled
                  ? 'text-gray-600 hover:bg-gray-100'
                  : 'text-white hover:bg-white/10'
              }`}
              aria-expanded={isMenuOpen}
              aria-label='Toggle menu'
            >
              {isMenuOpen ? (
                <X className='h-6 w-6' />
              ) : (
                <Menu className='h-6 w-6' />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className='md:hidden absolute left-0 right-0 top-full bg-white border-b border-gray-200 shadow-lg'>
            <div className='px-4 pt-2 pb-3 space-y-1'>
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className='block px-3 py-2 text-base font-medium text-gray-600 hover:text-indigo-700 hover:bg-gray-50 rounded-lg'
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className='px-3 py-3'>
                <Link
                  href='/login'
                  className='block w-full px-4 py-2.5 text-center font-medium rounded-xl bg-indigo-700 text-white hover:bg-indigo-800 transition-colors'
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
