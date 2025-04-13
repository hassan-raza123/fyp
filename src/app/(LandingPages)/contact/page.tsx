'use client'

import { Mail, MapPin, Phone } from 'lucide-react'
import NavbarClient from '@/components/landing-page/NavbarClient'
import Footer from '@/components/landing-page/Footer'
import ContactForm from '@/components/forms/ContactForm'

export default function Contact() {
  return (
    <div className='min-h-screen bg-white'>
      {/* Hero Section */}
      <div className='relative bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600'>
        <NavbarClient />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className='relative max-w-7xl mx-auto px-4 pt-24 pb-16 sm:px-6 lg:px-8'>
          <div className='max-w-3xl mx-auto text-center'>
            <h1 className='text-4xl font-bold text-white mb-6 lg:text-5xl'>
              Get in Touch with <span className='bg-gradient-to-r from-white via-white/90 to-white/80 text-transparent bg-clip-text'>UniTrack360</span>
            </h1>
            <p className='text-xl text-white/80 max-w-2xl mx-auto leading-relaxed'>
              Have questions? We&apos;re here to help you implement and get the most out of UniTrack360.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-12'>
          {/* Contact Form */}
          <div className='bg-white rounded-xl shadow-lg p-8 border border-gray-100'>
            <div className='w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 flex items-center justify-center mb-6'>
              <Mail className='h-8 w-8 text-white' />
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>
              Send us a Message
            </h2>
            <ContactForm />
          </div>

          {/* Contact Information */}
          <div className='bg-white rounded-xl shadow-lg p-8 border border-gray-100'>
            <div className='w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 flex items-center justify-center mb-6'>
              <MapPin className='h-8 w-8 text-white' />
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>
              Contact Information
            </h2>
            <div className='space-y-8'>
              <div className='flex items-start space-x-4'>
                <div className='p-3 bg-purple-50 rounded-lg'>
                  <MapPin className='h-6 w-6 text-purple-600' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 mb-1'>
                    Location
                  </h3>
                  <p className='text-gray-600'>
                    MNS University of Engineering and Technology
                    <br />
                    Multan, Pakistan
                  </p>
                </div>
              </div>
              <div className='flex items-start space-x-4'>
                <div className='p-3 bg-purple-50 rounded-lg'>
                  <Mail className='h-6 w-6 text-purple-600' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 mb-1'>Email</h3>
                  <a 
                    href="mailto:itzhassanraza276@gmail.com"
                    className='text-gray-600 hover:text-purple-600 transition-colors'
                  >
                    itzhassanraza276@gmail.com
                  </a>
                </div>
              </div>
              <div className='flex items-start space-x-4'>
                <div className='p-3 bg-purple-50 rounded-lg'>
                  <Phone className='h-6 w-6 text-purple-600' />
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 mb-1'>Phone</h3>
                  <p className='text-gray-600'>+92 (123) 456-7890</p>
                </div>
              </div>

              {/* Visit Us Section */}
              <div className='mt-12 bg-purple-50 rounded-xl p-8'>
                <h3 className='text-xl font-bold text-gray-900 mb-4'>
                  Visit Us
                </h3>
                <div className='space-y-2 text-gray-600'>
                  <p>We&apos;re located at MNS University of Engineering and Technology, Multan.</p>
                  <p>Feel free to stop by during office hours or schedule an appointment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
