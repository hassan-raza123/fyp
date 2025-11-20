'use client';

import React from 'react';
import Link from 'next/link';
import { Linkedin, Mail, Twitter, Instagram, MapPin, Phone, GraduationCap, BookOpen, Users, Facebook, Youtube, MessageCircle, ArrowRight } from 'lucide-react';

export default function Footer() {

  return (
    <footer className='relative overflow-hidden'>
      {/* Background Image */}
      <div 
        className='absolute inset-0 bg-cover bg-no-repeat'
        style={{ 
          backgroundImage: "url('/bg/uni-connect-evaluation-reports.jpg')",
          backgroundPosition: 'center top'
        }}
      ></div>
      
      {/* Modern Dark Gradient Overlay */}
      <div 
        className='absolute inset-0'
        style={{ 
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(0, 0, 0, 0.92))'
        }}
      ></div>

      {/* Decorative Elements */}
      <div className='absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10' style={{ background: 'var(--brand-secondary)' }}></div>
      <div className='absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10' style={{ background: 'var(--brand-primary)' }}></div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10'>
        {/* Top Section */}
        <div className='grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 mb-16'>
          {/* Brand Section - Wider */}
          <div className='md:col-span-5 space-y-8'>
            {/* Logo & Brand */}
            <div>
              <div className='flex items-center gap-4 mb-4'>
                <div className='relative group'>
                  {/* Orange Spot Under Logo */}
                  <div className='absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full blur-2xl opacity-70 group-hover:opacity-90 transition-all' 
                    style={{ backgroundColor: 'var(--brand-secondary)' }}>
                  </div>
                  <img src="/logo's/logo.png" alt='EduTrack Logo' className='relative z-10 w-20 h-20 object-contain transition-transform group-hover:scale-110' />
                </div>
                <div>
                  <h3 className='text-3xl font-black text-white mb-1'>EduTrack</h3>
                  <p className='text-base font-semibold' style={{ color: 'var(--brand-secondary)' }}>OBE Management System</p>
                </div>
              </div>
              <p className='text-base text-white/80 leading-relaxed'>
                Muhammad Nawaz Sharif University of Engineering & Technology, Multan. Transforming education through intelligent outcome tracking.
              </p>
            </div>
            
            {/* Social Media - Modern Grid */}
            <div>
              <h4 className='text-sm font-bold text-white mb-5 uppercase tracking-wider flex items-center gap-2'>
                <span className='w-8 h-0.5 rounded' style={{ background: 'var(--brand-secondary)' }}></span>
                Follow Us
              </h4>
              <div className='grid grid-cols-6 gap-3'>
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
                    className='relative w-12 h-12 rounded-xl backdrop-blur-md flex items-center justify-center text-white transition-all group overflow-hidden'
                    aria-label={label}
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--brand-secondary)';
                      e.currentTarget.style.borderColor = 'var(--brand-secondary)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(252, 153, 40, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Icon className='w-5 h-5 relative z-10' />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className='md:col-span-3 space-y-6'>
            <h4 className='text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2'>
              <span className='w-1 h-6 rounded' style={{ background: 'var(--brand-secondary)' }}></span>
              Quick Links
            </h4>
            <ul className='space-y-3'>
              {[
                { href: '/#modules', label: 'Features', icon: BookOpen },
                { href: '/#portal', label: 'Access Portal', icon: Users },
                { href: '/#team', label: 'Our Team', icon: GraduationCap }
              ].map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className='group flex items-center gap-3 text-base text-white/80 hover:text-white transition-all'
                  >
                    <div 
                      className='w-10 h-10 rounded-lg backdrop-blur-md flex items-center justify-center transition-all'
                      style={{ 
                        backgroundColor: 'rgba(252, 153, 40, 0.1)',
                        border: '1px solid rgba(252, 153, 40, 0.2)'
                      }}
                    >
                      <Icon className='w-5 h-5' style={{ color: 'var(--brand-secondary)' }} />
                    </div>
                    <span className='font-medium group-hover:translate-x-1 transition-transform'>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className='md:col-span-4 space-y-6'>
            <h4 className='text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2'>
              <span className='w-1 h-6 rounded' style={{ background: 'var(--brand-secondary)' }}></span>
              Get In Touch
            </h4>
            <ul className='space-y-4'>
              <li className='group'>
                <div className='flex items-start gap-4 p-4 rounded-xl backdrop-blur-md transition-all' 
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className='w-11 h-11 rounded-lg flex items-center justify-center shrink-0' style={{ backgroundColor: 'var(--brand-secondary)' }}>
                    <MapPin className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <p className='text-xs font-bold mb-1 uppercase tracking-wide' style={{ color: 'var(--brand-secondary)' }}>Address</p>
                    <span className='text-sm text-white/90 leading-relaxed'>
                      QasimPur Colony, BCG Chowk, Bahawalpur Road, Multan, Punjab, Pakistan
                    </span>
                  </div>
                </div>
              </li>
              <li className='group'>
                <a href='tel:+92619330592' className='flex items-center gap-4 p-4 rounded-xl backdrop-blur-md transition-all hover:bg-white/10' 
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className='w-11 h-11 rounded-lg flex items-center justify-center shrink-0' style={{ backgroundColor: 'var(--brand-secondary)' }}>
                    <Phone className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <p className='text-xs font-bold mb-1 uppercase tracking-wide' style={{ color: 'var(--brand-secondary)' }}>Phone</p>
                    <span className='text-sm text-white/90 font-medium'>+92-61-9330592</span>
                  </div>
                </a>
              </li>
              <li className='group'>
                <a href='mailto:info@mnsuet.edu.pk' className='flex items-center gap-4 p-4 rounded-xl backdrop-blur-md transition-all hover:bg-white/10' 
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className='w-11 h-11 rounded-lg flex items-center justify-center shrink-0' style={{ backgroundColor: 'var(--brand-secondary)' }}>
                    <Mail className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <p className='text-xs font-bold mb-1 uppercase tracking-wide' style={{ color: 'var(--brand-secondary)' }}>Email</p>
                    <span className='text-sm text-white/90 font-medium'>info@mnsuet.edu.pk</span>
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar - Modern */}
        <div className='pt-10 mt-10 border-t' style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className='flex flex-col md:flex-row items-center justify-between gap-6'>
            <div className='flex flex-col md:flex-row items-center gap-4 text-sm text-white/70'>
              <p className='font-medium'>&copy; {new Date().getFullYear()} <span className='text-white'>EduTrack</span> — All rights reserved.</p>
            </div>
            <div className='flex items-center gap-6 text-sm'>
              <Link href='/privacy' className='text-white/70 hover:text-white transition-colors font-medium flex items-center gap-1 group'>
                Privacy Policy
                <ArrowRight className='w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all' />
              </Link>
              <Link href='/terms' className='text-white/70 hover:text-white transition-colors font-medium flex items-center gap-1 group'>
                Terms of Service
                <ArrowRight className='w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all' />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
