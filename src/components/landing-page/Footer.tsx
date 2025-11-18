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
    <footer className='bg-slate-900 text-slate-300'>
      {/* Main Footer Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {/* Brand Section */}
          <div className='col-span-1 md:col-span-2'>
            <div className='flex items-center space-x-3 mb-4'>
              <div className='w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center'>
                <span className='text-xl font-bold text-white'>S</span>
              </div>
              <h3 className='text-xl font-semibold text-white'>
                Smart Campus for MNSUET
              </h3>
            </div>
            <p className='text-slate-400 max-w-md mb-4 text-sm leading-relaxed'>
              A comprehensive education management system designed to streamline
              attendance tracking, assessment management, and academic progress
              monitoring for modern universities.
            </p>
            <div className='flex space-x-3'>
              <a
                href='#'
                className='w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition-colors duration-200'
                aria-label='Twitter'
              >
                <Twitter className='h-4 w-4' />
              </a>
              <a
                href='#'
                className='w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition-colors duration-200'
                aria-label='LinkedIn'
              >
                <Linkedin className='h-4 w-4' />
              </a>
              <a
                href='#'
                className='w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition-colors duration-200'
                aria-label='GitHub'
              >
                <Github className='h-4 w-4' />
              </a>
              <a
                href='#'
                className='w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition-colors duration-200'
                aria-label='Instagram'
              >
                <Instagram className='h-4 w-4' />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className='text-base font-semibold text-white mb-4'>
              Quick Links
            </h4>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/features'
                  className='text-slate-400 hover:text-white transition-colors text-sm'
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href='/about'
                  className='text-slate-400 hover:text-white transition-colors text-sm'
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href='/contact'
                  className='text-slate-400 hover:text-white transition-colors text-sm'
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className='text-base font-semibold text-white mb-4'>Contact</h4>
            <ul className='space-y-3'>
              <li className='flex items-start space-x-2'>
                <MapPin className='h-4 w-4 text-blue-400 mt-0.5 shrink-0' />
                <span className='text-slate-400 text-sm'>MNS UET, Multan, Pakistan</span>
              </li>
              <li className='flex items-start space-x-2'>
                <Mail className='h-4 w-4 text-blue-400 mt-0.5 shrink-0' />
                <a
                  href='mailto:itzhassanraza276@gmail.com'
                  className='text-slate-400 hover:text-white transition-colors text-sm break-all'
                >
                  itzhassanraza276@gmail.com
                </a>
              </li>
              <li className='flex items-start space-x-2'>
                <Phone className='h-4 w-4 text-blue-400 mt-0.5 shrink-0' />
                <span className='text-slate-400 text-sm'>+92 (123) 456-7890</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='mt-8 pt-6 border-t border-slate-800'>
          <div className='flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0'>
            <p className='text-slate-400 text-sm'>
              &copy; {new Date().getFullYear()} Smart Campus for MNSUET. All rights reserved.
            </p>
            <div className='flex space-x-6 text-sm'>
              <Link
                href='/privacy'
                className='text-slate-400 hover:text-white transition-colors'
              >
                Privacy Policy
              </Link>
              <Link
                href='/terms'
                className='text-slate-400 hover:text-white transition-colors'
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
