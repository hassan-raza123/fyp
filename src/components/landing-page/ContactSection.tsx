import { Mail, MapPin, Phone } from 'lucide-react';
import ContactForm from '@/components/forms/ContactForm';

export default function ContactSection() {
  return (
    <div id="contact" className='relative py-24 landing-section-gradient scroll-mt-20 overflow-hidden'>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-16'>
          <div className='inline-block px-4 py-2 rounded-full landing-badge font-semibold text-sm mb-4'>
            GET IN TOUCH
          </div>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            Contact Us
          </h2>
          <p className='text-xl landing-text-body max-w-3xl mx-auto'>
            Have questions about the system? We're here to help
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          {/* Contact Form */}
          <div className='landing-card rounded-2xl shadow-2xl p-8 border-2 hover:border-blue-300 transition-all duration-300'>
            <div className='w-14 h-14 rounded-xl landing-icon-bg flex items-center justify-center mb-6 shadow-lg'>
              <Mail className='h-7 w-7 text-white' />
            </div>
            <h3 className='text-2xl font-bold landing-text-heading mb-6'>
              Send us a Message
            </h3>
            <ContactForm />
          </div>

          {/* Contact Information */}
          <div className='landing-card rounded-2xl shadow-2xl p-8 border-2 hover:border-blue-300 transition-all duration-300'>
            <div className='w-14 h-14 rounded-xl landing-icon-bg flex items-center justify-center mb-6 shadow-lg'>
              <MapPin className='h-7 w-7 text-white' />
            </div>
            <h3 className='text-2xl font-bold landing-text-heading mb-6'>
              Contact Information
            </h3>
            <div className='space-y-6'>
              <div className='flex items-start space-x-3'>
                <div className='p-2 bg-blue-50 rounded-lg mt-1'>
                  <MapPin className='h-5 w-5 text-blue-900' />
                </div>
                <div>
                  <h4 className='font-semibold landing-text-heading mb-1'>Location</h4>
                  <p className='landing-text-body text-sm'>
                    MNS University of Engineering and Technology
                    <br />
                    Multan, Pakistan
                  </p>
                </div>
              </div>
              <div className='flex items-start space-x-3'>
                <div className='p-2 bg-blue-50 rounded-lg mt-1'>
                  <Mail className='h-5 w-5 text-blue-900' />
                </div>
                <div>
                  <h4 className='font-semibold landing-text-heading mb-1'>Email</h4>
                  <a
                    href='mailto:itzhassanraza276@gmail.com'
                    className='landing-text-body hover:text-blue-900 transition-colors text-sm'
                  >
                    itzhassanraza276@gmail.com
                  </a>
                </div>
              </div>
              <div className='flex items-start space-x-3'>
                <div className='p-2 bg-blue-50 rounded-lg mt-1'>
                  <Phone className='h-5 w-5 text-blue-900' />
                </div>
                <div>
                  <h4 className='font-semibold landing-text-heading mb-1'>Phone</h4>
                  <p className='landing-text-body text-sm'>+92 (123) 456-7890</p>
                </div>
              </div>

              {/* Note */}
              <div className='mt-8 bg-blue-50 rounded-lg p-4'>
                <p className='landing-text-body text-xs leading-relaxed'>
                  This system is developed as a Final Year Project for MNS University 
                  of Engineering and Technology by the Computer Science Department.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
