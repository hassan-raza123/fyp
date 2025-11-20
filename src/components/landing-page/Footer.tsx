import React from 'react';
import Link from 'next/link';
import { Linkedin, Mail, Twitter, Github, Instagram, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className='bg-linear-to-b from-white to-transparent border-t border-gray-200/60'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-12 items-start'>
          {/* Brand Section */}
          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <img src="/logo's/logo.png" alt='EduTrack Logo' className='w-16 h-16 object-contain' />
              <div>
                <h3 className='text-xl font-bold text-gray-900'>EduTrack</h3>
                <p className='text-sm text-gray-500'>OBE Management System</p>
              </div>
            </div>
            <p className='text-sm text-gray-600 leading-relaxed max-w-sm'>
              Transforming education through outcomes. A comprehensive OBE management system for tracking learning outcomes and academic excellence.
            </p>
            <div className='flex items-center gap-3'>
              {[Twitter, Linkedin, Github, Instagram].map((Icon, index) => (
                <a key={index} href='#' className='w-10 h-10 rounded-lg border border-gray-200 hover:border-blue hover:bg-blue/5 flex items-center justify-center text-gray-600 hover:text-blue transition-all'>
                  <Icon className='w-4 h-4' />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className='space-y-4'>
            <h4 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
              Quick Links
            </h4>
            <ul className='space-y-3'>
              <li>
                <Link
                  href='/#modules'
                  className='text-sm text-gray-600 hover:text-blue transition-colors'
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href='/#portals'
                  className='text-sm text-gray-600 hover:text-blue transition-colors'
                >
                  Portals
                </Link>
              </li>
              <li>
                <Link
                  href='/#team'
                  className='text-sm text-gray-600 hover:text-blue transition-colors'
                >
                  Team
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className='space-y-4'>
            <h4 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
              Contact
            </h4>
            <ul className='space-y-3'>
              <li className='flex items-start gap-2'>
                <MapPin className='h-4 w-4 text-orange mt-0.5 shrink-0' />
                <span className='text-sm text-gray-600'>MNS UET, Multan, Pakistan</span>
              </li>
              <li className='flex items-start gap-2'>
                <Mail className='h-4 w-4 text-orange mt-0.5 shrink-0' />
                <a
                  href='mailto:itzhassanraza276@gmail.com'
                  className='text-sm text-gray-600 hover:text-blue transition-colors break-all'
                >
                  itzhassanraza276@gmail.com
                </a>
              </li>
              <li className='flex items-start gap-2'>
                <Phone className='h-4 w-4 text-orange mt-0.5 shrink-0' />
                <span className='text-sm text-gray-600'>+92 (123) 456-7890</span>
              </li>
            </ul>
          </div>
        </div>

        <div className='pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 gap-3'>
          <p>&copy; {new Date().getFullYear()} EduTrack — All rights reserved.</p>
          <div className='flex gap-6'>
            <Link href='/privacy' className='hover:text-gray-900'>Privacy</Link>
            <Link href='/terms' className='hover:text-gray-900'>Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
