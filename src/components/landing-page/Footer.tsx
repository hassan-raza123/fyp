import React from 'react';
import Link from 'next/link';
import { Linkedin, Mail, Twitter, Github, Instagram, MapPin, Phone, GraduationCap, BookOpen, Users, Facebook, Youtube, MessageCircle } from 'lucide-react';

export default function Footer() {

  return (
    <footer className='bg-linear-to-b from-white to-gray-50/50 border-t border-gray-200/60 relative'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        {/* Top Section */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-12'>
          {/* Brand Section */}
          <div className='space-y-5'>
            <div className='flex items-center gap-3'>
              <img src="/logo's/logo.png" alt='EduTrack Logo' className='w-16 h-16 object-contain' />
              <div>
                <h3 className='text-xl font-bold text-gray-900'>EduTrack</h3>
                <p className='text-sm text-gray-500'>OBE Management System</p>
              </div>
            </div>
            <p className='text-sm text-gray-600 leading-relaxed'>
              Muhammad Nawaz Sharif University of Engineering & Technology (MNS-UET), Multan. A comprehensive OBE management system for tracking learning outcomes and academic excellence.
            </p>
            
            {/* Social Links */}
            <div className='flex items-center gap-2 flex-wrap'>
              {[
                { Icon: Facebook, label: 'Facebook', href: 'https://www.facebook.com/mnsuet' },
                { Icon: Twitter, label: 'Twitter', href: 'https://twitter.com/mnsuet' },
                { Icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/school/mnsuet' },
                { Icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/mnsuet' },
                { Icon: Youtube, label: 'YouTube', href: 'https://www.youtube.com/@mnsuet' },
                { Icon: MessageCircle, label: 'WhatsApp', href: 'https://wa.me/92619330592' }
              ].map(({ Icon, label, href }) => (
                <a 
                  key={label}
                  href={href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-10 h-10 rounded-lg border border-gray-200 hover:border-blue hover:bg-blue/5 flex items-center justify-center text-gray-600 hover:text-blue transition-all group'
                  aria-label={label}
                >
                  <Icon className='w-4 h-4 group-hover:scale-110 transition-transform' />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className='space-y-5'>
            <h4 className='text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2'>
              <span className='w-1 h-4 bg-orange rounded-full'></span>
              Quick Links
            </h4>
            <ul className='space-y-3'>
              {[
                { href: '/#modules', label: 'Features', icon: BookOpen },
                { href: '/#portals', label: 'Portals', icon: Users },
                { href: '/#team', label: 'Team', icon: GraduationCap }
              ].map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className='text-sm text-gray-600 hover:text-blue transition-colors flex items-center gap-2 group'
                  >
                    <Icon className='w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all' />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className='space-y-5'>
            <h4 className='text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2'>
              <span className='w-1 h-4 bg-orange rounded-full'></span>
              Contact
            </h4>
            <ul className='space-y-4'>
              <li className='flex items-start gap-3'>
                <div className='w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center flex-shrink-0 group-hover:bg-orange/20 transition-colors'>
                  <MapPin className='h-4 w-4 text-orange' />
                </div>
                <span className='text-sm text-gray-600 leading-relaxed'>
                  QasimPur Colony, BCG Chowk,<br />
                  Bahawalpur Road, Multan,<br />
                  Punjab, Pakistan
                </span>
              </li>
              <li className='flex items-start gap-3'>
                <div className='w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center flex-shrink-0 group-hover:bg-orange/20 transition-colors'>
                  <Phone className='h-4 w-4 text-orange' />
                </div>
                <a
                  href='tel:+92619330592'
                  className='text-sm text-gray-600 hover:text-blue transition-colors leading-relaxed'
                >
                  +92-61-9330592
                </a>
              </li>
              <li className='flex items-start gap-3'>
                <div className='w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center flex-shrink-0 group-hover:bg-orange/20 transition-colors'>
                  <Mail className='h-4 w-4 text-orange' />
                </div>
                <a
                  href='mailto:info@mnsuet.edu.pk'
                  className='text-sm text-gray-600 hover:text-blue transition-colors break-all leading-relaxed'
                >
                  info@mnsuet.edu.pk
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='pt-8 border-t border-gray-200'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left'>
            <div className='flex flex-col md:flex-row items-center gap-3 md:gap-4 text-sm text-gray-500'>
              <p>&copy; {new Date().getFullYear()} EduTrack — All rights reserved.</p>
              <span className='hidden md:inline text-gray-300'>|</span>
              <p className='text-xs'>Developed by Final Year Students at MNS UET</p>
            </div>
            <div className='flex gap-6 text-sm'>
              <Link href='/privacy' className='text-gray-500 hover:text-blue transition-colors'>
                Privacy Policy
              </Link>
              <Link href='/terms' className='text-gray-500 hover:text-blue transition-colors'>
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
