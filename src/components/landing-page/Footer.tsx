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
    <footer className='bg-muted text-muted-foreground'>
      {/* Main Footer Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-12'>
          {/* Brand Section */}
          <div className='col-span-1 md:col-span-2'>
            <div className='flex items-center space-x-3 mb-6'>
              <div className='w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center'>
                <span className='text-xl font-bold text-white'>S</span>
              </div>
              <h3 className='text-2xl font-bold text-foreground'>
                Smart Campus for MNSUET
              </h3>
            </div>
            <p className='text-muted-foreground max-w-md mb-6'>
              Revolutionizing educational management with our comprehensive
              OBE-based system. Making attendance tracking, assessment
              management, and academic progress monitoring seamless and
              efficient.
            </p>
            <div className='flex space-x-4'>
              <a
                href='#'
                className='text-muted-foreground hover:text-primary transition-colors'
                aria-label='Twitter'
              >
                <Twitter className='h-5 w-5' />
              </a>
              <a
                href='#'
                className='text-muted-foreground hover:text-primary transition-colors'
                aria-label='LinkedIn'
              >
                <Linkedin className='h-5 w-5' />
              </a>
              <a
                href='#'
                className='text-muted-foreground hover:text-primary transition-colors'
                aria-label='GitHub'
              >
                <Github className='h-5 w-5' />
              </a>
              <a
                href='#'
                className='text-muted-foreground hover:text-primary transition-colors'
                aria-label='Instagram'
              >
                <Instagram className='h-5 w-5' />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className='text-lg font-semibold text-foreground mb-4'>
              Quick Links
            </h4>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='/features'
                  className='text-muted-foreground hover:text-primary transition-colors'
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href='/about'
                  className='text-muted-foreground hover:text-primary transition-colors'
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href='/contact'
                  className='text-muted-foreground hover:text-primary transition-colors'
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className='text-lg font-semibold text-foreground mb-4'>Contact</h4>
            <ul className='space-y-3'>
              <li className='flex items-center space-x-3'>
                <MapPin className='h-5 w-5 text-primary' />
                <span className='text-muted-foreground'>MNS UET, Multan, Pakistan</span>
              </li>
              <li className='flex items-center space-x-3'>
                <Mail className='h-5 w-5 text-primary' />
                <a
                  href='mailto:itzhassanraza276@gmail.com'
                  className='text-muted-foreground hover:text-primary transition-colors'
                >
                  itzhassanraza276@gmail.com
                </a>
              </li>
              <li className='flex items-center space-x-3'>
                <Phone className='h-5 w-5 text-primary' />
                <span className='text-muted-foreground'>+92 (123) 456-7890</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='mt-12 pt-8 border-t border-border'>
          <div className='flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0'>
            <p className='text-muted-foreground text-sm'>
              &copy; {new Date().getFullYear()} Smart Campus for MNSUET. All
              rights reserved.
            </p>
            <div className='flex space-x-6 text-sm'>
              <Link
                href='/privacy'
                className='text-muted-foreground hover:text-primary transition-colors'
              >
                Privacy Policy
              </Link>
              <Link
                href='/terms'
                className='text-muted-foreground hover:text-primary transition-colors'
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
