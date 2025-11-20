'use client';

import { Mail, MapPin, Phone } from 'lucide-react';
import NavbarClient from '@/components/landing-page/NavbarClient';
import Footer from '@/components/landing-page/Footer';
import ContactForm from '@/components/forms/ContactForm';

export default function Contact() {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      {/* Hero Section */}
      <div className='relative bg-gradient-to-br from-primary via-primary to-accent'>
        <NavbarClient />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className='relative max-w-7xl mx-auto px-4 pt-24 pb-16 sm:px-6 lg:px-8'>
          <div className='max-w-3xl mx-auto text-center'>
            <h1 className='text-4xl font-bold text-primary-foreground mb-6 lg:text-5xl'>
              Contact Us
              <span className='block bg-gradient-to-r from-white via-white/90 to-white/80 text-transparent bg-clip-text'>
                Get in Touch
              </span>
            </h1>
            <p className='text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed'>
              Have questions about the OBE Management System? Reach out to us.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-12'>
          {/* Contact Form */}
          <div className='bg-card rounded-xl shadow-lg p-8 border border-border'>
            <div className='w-14 h-14 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center mb-6'>
              <Mail className='h-8 w-8 text-white' />
            </div>
            <h2 className='text-2xl font-bold text-foreground mb-6'>
              Send us a Message
            </h2>
            <ContactForm />
          </div>

          {/* Contact Information */}
          <div className='bg-card rounded-xl shadow-lg p-8 border border-border'>
            <div className='w-14 h-14 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center mb-6'>
              <MapPin className='h-8 w-8 text-white' />
            </div>
            <h2 className='text-2xl font-bold text-foreground mb-6'>
              Contact Information
            </h2>
            <div className='space-y-8'>
              <div className='flex items-start space-x-4'>
                <div className='p-3 bg-primary/10 rounded-lg'>
                  <MapPin className='h-6 w-6 text-primary' />
                </div>
                <div>
                  <h3 className='font-semibold text-foreground mb-1'>Location</h3>
                  <p className='text-muted-foreground'>
                    MNS University of Engineering and Technology
                    <br />
                    Multan, Pakistan
                  </p>
                </div>
              </div>
              <div className='flex items-start space-x-4'>
                <div className='p-3 bg-primary/10 rounded-lg'>
                  <Mail className='h-6 w-6 text-primary' />
                </div>
                <div>
                  <h3 className='font-semibold text-foreground mb-1'>Email</h3>
                  <a
                    href='mailto:itzhassanraza276@gmail.com'
                    className='text-muted-foreground hover:text-primary transition-colors'
                  >
                    itzhassanraza276@gmail.com
                  </a>
                </div>
              </div>
              <div className='flex items-start space-x-4'>
                <div className='p-3 bg-primary/10 rounded-lg'>
                  <Phone className='h-6 w-6 text-primary' />
                </div>
                <div>
                  <h3 className='font-semibold text-foreground mb-1'>Phone</h3>
                  <p className='text-muted-foreground'>+92 (123) 456-7890</p>
                </div>
              </div>

              {/* Note Section */}
              <div className='mt-12 bg-primary/5 rounded-xl p-6'>
                <p className='text-muted-foreground text-sm'>
                  This system is developed as a Final Year Project for MNS University 
                  of Engineering and Technology by the Computer Science Department.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
