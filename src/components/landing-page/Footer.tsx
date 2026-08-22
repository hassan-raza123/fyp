'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Twitter,
  Users,
  Workflow,
  Youtube,
} from 'lucide-react';
import {
  COMPANY_CONTACT,
  COMPANY_SOCIAL,
  PRODUCT_NAME,
  PRODUCT_TAGLINE,
  PRODUCT_DESCRIPTION,
} from '@/constants/branding';

/** Icon for a social network named in COMPANY_SOCIAL, by label. */
const SOCIAL_ICONS: Record<string, typeof Linkedin> = {
  Facebook,
  Twitter,
  LinkedIn: Linkedin,
  Instagram,
  YouTube: Youtube,
  WhatsApp: MessageCircle,
};

export default function Footer() {
  /*
    The contact column only renders once COMPANY_CONTACT is filled in, and the
    social row only once COMPANY_SOCIAL is. Both start empty. The grid was a
    fixed 5 + 3 + 4 of twelve columns, so with contact absent the footer laid
    out eight columns of content and four of empty space, and the whole thing
    sat hard against the left edge. The spans adapt instead.
  */
  const hasContact = Boolean(
    COMPANY_CONTACT.address || COMPANY_CONTACT.phone || COMPANY_CONTACT.email,
  );

  return (
    <footer
      className='relative overflow-hidden'
      style={{
        background:
          'linear-gradient(180deg, var(--ground-foot) 0%, var(--ground-floor) 100%)',
      }}
    >
      {/*
        The ground used to be a `background` shorthand referencing
        `--ground-foot` and `--ground-floor`, neither of which existed — one
        undefined var invalidates the whole declaration, so the footer had no
        background and its white type sat on the page colour. A 92%-opaque
        overlay was then stacked on top of it, which would have flattened the
        wash even had the ground resolved. Ground below, wash above, one of
        each.
      */}
      <div
        aria-hidden
        className='absolute inset-0'
        style={{
          background:
            'radial-gradient(800px 420px at 10% 0%, var(--brand-primary-opacity-20), transparent 60%)',
        }}
      />

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10'>
        {/* Top Section */}
        <div className='grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 mb-16'>
          {/* Brand Section - Wider */}
          <div
            className={`space-y-8 ${hasContact ? 'md:col-span-5' : 'md:col-span-7'}`}
          >
            {/* Logo & Brand */}
            <div>
              <div className='flex items-center gap-4 mb-4'>
                {/* Was a raw <img>, bypassing next/image, behind a blurred
                    indigo halo that read as a smudge on the dark ground. */}
                <Image
                  src='/brand/attainly-mark.svg'
                  alt={`${PRODUCT_NAME} logo`}
                  width={56}
                  height={56}
                  className='w-14 h-14 object-contain shrink-0'
                />
                <div>
                  <h3 className='text-2xl font-bold text-white'>
                    {PRODUCT_NAME}
                  </h3>
                  {/* `--brand-secondary` is the same indigo as the primary and
                      sits near 3:1 here; the lighter step reads. */}
                  <p
                    className='text-sm font-medium'
                    style={{ color: 'var(--primary-300)' }}
                  >
                    {PRODUCT_TAGLINE}
                  </p>
                </div>
              </div>
              <p className='text-base text-white/80 leading-relaxed'>
                {PRODUCT_DESCRIPTION}
              </p>
            </div>
            
            {/* Social Media - rendered only once COMPANY_SOCIAL is filled in.
                It previously listed the university's own official accounts. */}
            {COMPANY_SOCIAL.length > 0 && (
            <div>
              <h4 className='text-sm font-bold text-white mb-5 uppercase tracking-wider flex items-center gap-2'>
                <span className='w-8 h-0.5 rounded' style={{ background: 'var(--brand-secondary)' }}></span>
                Follow Us
              </h4>
              <div className='grid grid-cols-6 gap-3'>
                {COMPANY_SOCIAL.map(({ label, href }) => {
                  const Icon = SOCIAL_ICONS[label] ?? ArrowRight;
                  return (
                  <a
                    key={label}
                    href={href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='relative w-12 h-12 rounded-xl backdrop-blur-md flex items-center justify-center text-white transition-all group overflow-hidden'
                    aria-label={label}
                    style={{ 
                      backgroundColor: 'var(--white-opacity-08)',
                      border: `1px solid var(--white-opacity-15)`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--brand-secondary)';
                      e.currentTarget.style.borderColor = 'var(--brand-secondary)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = `0 10px 30px var(--brand-secondary-opacity-40)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--white-opacity-08)';
                      e.currentTarget.style.borderColor = 'var(--white-opacity-15)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Icon className='w-5 h-5 relative z-10' />
                  </a>
                  );
                })}
              </div>
            </div>
            )}
          </div>

          {/* Quick Links */}
          <div
            className={`space-y-6 ${hasContact ? 'md:col-span-3' : 'md:col-span-5'}`}
          >
            <h4 className='text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2'>
              <span className='w-1 h-6 rounded' style={{ background: 'var(--brand-secondary)' }}></span>
              Quick Links
            </h4>
            <ul className='space-y-3'>
              {[
                { href: '/#how-it-works', label: 'How it works', icon: Workflow },
                { href: '/#roles', label: 'Who uses it', icon: Users },
                { href: '/#modules', label: 'Modules', icon: BookOpen },
              ].map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className='group flex items-center gap-3 text-base text-white/80 hover:text-white transition-all'
                  >
                    <div 
                      className='w-10 h-10 rounded-lg backdrop-blur-md flex items-center justify-center transition-all'
                      style={{ 
                        backgroundColor: 'var(--brand-secondary-opacity-10)',
                        border: `1px solid var(--brand-secondary-opacity-20)`
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

          {/* Contact Info.
              Each entry renders only when COMPANY_CONTACT supplies it. These
              slots held one university's real address, switchboard and inbox,
              which would route this product's enquiries to them. */}
          {hasContact && (
          <div className='md:col-span-4 space-y-6'>
            <h4 className='text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2'>
              <span className='w-1 h-6 rounded' style={{ background: 'var(--brand-secondary)' }}></span>
              Get In Touch
            </h4>
            <ul className='space-y-4'>
              {COMPANY_CONTACT.address && (
              <li className='group'>
                <div className='flex items-start gap-4 p-4 rounded-xl backdrop-blur-md transition-all'
                  style={{
                    backgroundColor: 'var(--white-opacity-08)',
                    border: `1px solid var(--white-opacity-10)`
                  }}
                >
                  <div className='w-11 h-11 rounded-lg flex items-center justify-center shrink-0' style={{ backgroundColor: 'var(--brand-secondary)' }}>
                    <MapPin className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <p className='text-xs font-bold mb-1 uppercase tracking-wide' style={{ color: 'var(--brand-secondary)' }}>Address</p>
                    <span className='text-sm text-white/90 leading-relaxed'>
                      {COMPANY_CONTACT.address}
                    </span>
                  </div>
                </div>
              </li>
              )}
              {COMPANY_CONTACT.phone && (
              <li className='group'>
                <a href={`tel:${COMPANY_CONTACT.phone.replace(/[^+\d]/g, '')}`} className='flex items-center gap-4 p-4 rounded-xl backdrop-blur-md transition-all hover:bg-white/10'
                  style={{
                    backgroundColor: 'var(--white-opacity-08)',
                    border: `1px solid var(--white-opacity-10)`
                  }}
                >
                  <div className='w-11 h-11 rounded-lg flex items-center justify-center shrink-0' style={{ backgroundColor: 'var(--brand-secondary)' }}>
                    <Phone className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <p className='text-xs font-bold mb-1 uppercase tracking-wide' style={{ color: 'var(--brand-secondary)' }}>Phone</p>
                    <span className='text-sm text-white/90 font-medium'>{COMPANY_CONTACT.phone}</span>
                  </div>
                </a>
              </li>
              )}
              {COMPANY_CONTACT.email && (
              <li className='group'>
                <a href={`mailto:${COMPANY_CONTACT.email}`} className='flex items-center gap-4 p-4 rounded-xl backdrop-blur-md transition-all hover:bg-white/10'
                  style={{ 
                    backgroundColor: 'var(--white-opacity-08)',
                    border: `1px solid var(--white-opacity-10)`
                  }}
                >
                  <div className='w-11 h-11 rounded-lg flex items-center justify-center shrink-0' style={{ backgroundColor: 'var(--brand-secondary)' }}>
                    <Mail className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <p className='text-xs font-bold mb-1 uppercase tracking-wide' style={{ color: 'var(--brand-secondary)' }}>Email</p>
                    <span className='text-sm text-white/90 font-medium'>{COMPANY_CONTACT.email}</span>
                  </div>
                </a>
              </li>
              )}
            </ul>
          </div>
          )}
        </div>

        {/* Bottom Bar - Modern */}
        <div className='pt-10 mt-10 border-t' style={{ borderColor: 'var(--white-opacity-10)' }}>
          <div className='flex flex-col md:flex-row items-center justify-between gap-6'>
            <div className='flex flex-col md:flex-row items-center gap-4 text-sm text-white/70'>
              <p className='font-medium'>&copy; {new Date().getFullYear()} <span className='text-white'>{PRODUCT_NAME}</span> — All rights reserved.</p>
            </div>
            <div className='flex items-center gap-6 text-sm'>
              <Link href='/legal/privacy' className='text-white/70 hover:text-white transition-colors font-medium flex items-center gap-1 group'>
                Privacy Policy
                <ArrowRight className='w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all' />
              </Link>
              <Link href='/legal/terms' className='text-white/70 hover:text-white transition-colors font-medium flex items-center gap-1 group'>
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
