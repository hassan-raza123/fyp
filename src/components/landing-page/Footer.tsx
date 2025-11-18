// components/Footer.tsx

import React from 'react';
import Link from 'next/link';
import {
  Linkedin,
  Mail,
  Twitter,
  Github,
  Instagram,
  MapPin,
  Phone,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className='bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-slate-300'>
      {/* Main Footer Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-12'>
          {/* Brand Section */}
          <div className='col-span-1 md:col-span-2'>
            <div className='flex items-center space-x-3 mb-6'>
              <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg'>
                <span className='text-2xl font-bold text-white'>S</span>
              </div>
              <h3 className='text-2xl font-bold bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent'>
                Smart Campus for MNSUET
              </h3>
            </div>
            <p className='text-slate-400 max-w-md mb-6 leading-relaxed'>
              Revolutionizing educational management with our comprehensive
              OBE-based system. Making attendance tracking, assessment
              management, and academic progress monitoring seamless and
              efficient.
            </p>
            <div className='flex space-x-4'>
              <a
                href='#'
                className='w-10 h-10 rounded-xl bg-white/10 hover:bg-gradient-to-br hover:from-purple-500 hover:to-cyan-500 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg'
                aria-label='Twitter'
              >
                <Twitter className='h-5 w-5' />
              </a>
              <a
                href='#'
                className='w-10 h-10 rounded-xl bg-white/10 hover:bg-gradient-to-br hover:from-purple-500 hover:to-cyan-500 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg'
                aria-label='LinkedIn'
              >
                <Linkedin className='h-5 w-5' />
              </a>
              <a
                href='#'
                className='w-10 h-10 rounded-xl bg-white/10 hover:bg-gradient-to-br hover:from-purple-500 hover:to-cyan-500 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg'
                aria-label='GitHub'
              >
                <Github className='h-5 w-5' />
              </a>
              <a
                href='#'
                className='w-10 h-10 rounded-xl bg-white/10 hover:bg-gradient-to-br hover:from-purple-500 hover:to-cyan-500 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg'
                aria-label='Instagram'
              >
                <Instagram className='h-5 w-5' />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className='text-lg font-bold text-white mb-6'>
              Quick Links
            </h4>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='/features'
                  className='text-slate-400 hover:text-cyan-400 transition-colors font-medium hover:translate-x-1 inline-block duration-300'
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href='/about'
                  className='text-slate-400 hover:text-cyan-400 transition-colors font-medium hover:translate-x-1 inline-block duration-300'
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href='/contact'
                  className='text-slate-400 hover:text-cyan-400 transition-colors font-medium hover:translate-x-1 inline-block duration-300'
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className='text-lg font-bold text-white mb-6'>Contact</h4>
            <ul className='space-y-4'>
              <li className='flex items-start space-x-3'>
                <MapPin className='h-5 w-5 text-cyan-400 mt-1 flex-shrink-0' />
                <span className='text-slate-400'>MNS UET, Multan, Pakistan</span>
              </li>
              <li className='flex items-start space-x-3'>
                <Mail className='h-5 w-5 text-cyan-400 mt-1 flex-shrink-0' />
                <a
                  href='mailto:itzhassanraza276@gmail.com'
                  className='text-slate-400 hover:text-cyan-400 transition-colors break-all'
                >
                  itzhassanraza276@gmail.com
                </a>
              </li>
              <li className='flex items-start space-x-3'>
                <Phone className='h-5 w-5 text-cyan-400 mt-1 flex-shrink-0' />
                <span className='text-slate-400'>+92 (123) 456-7890</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='mt-12 pt-8 border-t border-white/10'>
          <div className='flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0'>
            <p className='text-slate-400 text-sm font-medium'>
              &copy; {new Date().getFullYear()} Smart Campus for MNSUET. All
              rights reserved.
            </p>
            <div className='flex space-x-6 text-sm font-medium'>
              <Link
                href='/privacy'
                className='text-slate-400 hover:text-cyan-400 transition-colors'
              >
                Privacy Policy
              </Link>
              <Link
                href='/terms'
                className='text-slate-400 hover:text-cyan-400 transition-colors'
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
