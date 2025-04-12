import React from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import NavbarClient from '@/components/landing-page/NavbarClient';
import Footer from '@/components/landing-page/Footer';

export default function Contact() {
  return (
    <div className='min-h-screen bg-white'>
      {/* Header Section */}
      <div className='relative bg-gradient-to-br from-primary via-primary-light to-primary'>
        <NavbarClient />
        <div className='absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]' />
        <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20'>
          <div className='text-center'>
            <h1 className='text-4xl md:text-6xl font-bold text-white mb-6'>
              Get in Touch
            </h1>
            <p className='text-xl text-indigo-100 mb-10 max-w-3xl mx-auto'>
              Have questions about UniAttend? We&apos;re here to help.
            </p>
          </div>
        </div>

        {/* Wave SVG */}
        <div className="absolute bottom-0 left-0 right-0 -mb-1">
        <svg
          viewBox="0 0 1440 120"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-auto"
        >
          <path
            d="M0,0 C480,100 960,100 1440,0 L1440,120 L0,120 Z"
            fill="white"
          />
        </svg>
      </div>
      </div>

      {/* Contact Section */}
      <div className='py-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-16'>
            {/* Contact Form */}
            <div className='bg-white rounded-2xl p-8 shadow-lg border border-gray-100'>
              <h2 className='text-2xl font-bold text-gray-900 mb-6'>
                Send us a Message
              </h2>
              <form className='space-y-6'>
                <div>
                  <label
                    htmlFor='name'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Full Name
                  </label>
                  <input
                    type='text'
                    id='name'
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent'
                    placeholder='John Doe'
                  />
                </div>
                <div>
                  <label
                    htmlFor='email'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Email Address
                  </label>
                  <input
                    type='email'
                    id='email'
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent'
                    placeholder='john@example.com'
                  />
                </div>
                <div>
                  <label
                    htmlFor='subject'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Subject
                  </label>
                  <input
                    type='text'
                    id='subject'
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent'
                    placeholder='How can we help?'
                  />
                </div>
                <div>
                  <label
                    htmlFor='message'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Message
                  </label>
                  <textarea
                    id='message'
                    rows={4}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent'
                    placeholder='Your message here...'
                  />
                </div>
                <button
                  type='submit'
                  className='w-full px-8 py-4 bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center'
                >
                  Send Message
                  <Send className='ml-2 h-5 w-5' />
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className='text-2xl font-bold text-gray-900 mb-6'>
                Contact Information
              </h2>
              <div className='space-y-8'>
                <div className='flex items-start space-x-4'>
                  <div className='p-3 bg-purple-100 rounded-lg'>
                    <MapPin className='h-6 w-6 text-primary' />
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
                  <div className='p-3 bg-purple-100 rounded-lg'>
                    <Mail className='h-6 w-6 text-primary' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-gray-900 mb-1'>Email</h3>
                    <p className='text-gray-600'>support@uniattend.com</p>
                  </div>
                </div>
                <div className='flex items-start space-x-4'>
                  <div className='p-3 bg-purple-100 rounded-lg'>
                    <Phone className='h-6 w-6 text-primary' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-gray-900 mb-1'>Phone</h3>
                    <p className='text-gray-600'>+92 (123) 456-7890</p>
                  </div>
                </div>
              </div>

              {/* Map or Additional Information */}
              <div className='mt-12 bg-purple-50 rounded-2xl p-8'>
                <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                  Office Hours
                </h3>
                <div className='space-y-2 text-gray-600'>
                  <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
                  <p>Saturday: 9:00 AM - 1:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
