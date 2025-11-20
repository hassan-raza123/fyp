import { Mail, MapPin, Phone, Send } from 'lucide-react';
import ContactForm from '@/components/forms/ContactForm';

export default function ContactSection() {
  return (
    <div id="contact" className='py-24 bg-linear-to-b from-white to-slate-50 scroll-mt-20'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <span className='inline-block px-4 py-2 rounded-full landing-badge font-semibold text-sm mb-4'>
            GET IN TOUCH
          </span>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            Let's Connect
          </h2>
          <div className='w-24 h-1.5 brand-gradient mx-auto rounded-full mb-6'></div>
          <p className='text-xl landing-text-body max-w-2xl mx-auto'>
            Have questions? We're here to help you get started
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Contact Form */}
          <div className='bg-white rounded-3xl shadow-xl p-8 border-2 border-slate-100'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='w-14 h-14 rounded-xl brand-gradient flex items-center justify-center shadow-lg'>
                <Send className='w-7 h-7 text-white' />
              </div>
              <div>
                <h3 className='text-2xl font-bold landing-text-heading'>
                  Send Message
                </h3>
                <p className='text-sm text-slate-600'>We'll respond within 24 hours</p>
              </div>
            </div>
            <ContactForm />
          </div>

          {/* Contact Info */}
          <div className='space-y-6'>
            {/* Info Cards */}
            {[
              {
                icon: MapPin,
                title: 'Visit Us',
                content: 'MNS University of Engineering and Technology, Multan, Pakistan',
                link: null
              },
              {
                icon: Mail,
                title: 'Email Us',
                content: 'itzhassanraza276@gmail.com',
                link: 'mailto:itzhassanraza276@gmail.com'
              },
              {
                icon: Phone,
                title: 'Call Us',
                content: '+92 (123) 456-7890',
                link: 'tel:+92123456789'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className='group bg-white rounded-2xl p-6 border-2 border-slate-100 hover:border-brand-primary hover:shadow-xl transition-all duration-300'
              >
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 rounded-xl brand-gradient flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform'>
                    <item.icon className='w-6 h-6 text-white' />
                  </div>
                  <div className='flex-1'>
                    <h4 className='font-bold landing-text-heading mb-2'>{item.title}</h4>
                    {item.link ? (
                      <a
                        href={item.link}
                        className='landing-text-body hover:text-brand-primary transition-colors text-sm'
                      >
                        {item.content}
                      </a>
                    ) : (
                      <p className='landing-text-body text-sm'>{item.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Info Note */}
            <div
              className='rounded-2xl p-6 border'
              style={{ background: 'var(--badge-bg)', borderColor: 'var(--badge-bg)' }}
            >
              <p className='text-sm leading-relaxed' style={{ color: 'var(--badge-text)' }}>
                <span className='font-bold'>EduTrack</span> is developed as a Final Year Project for MNS University of Engineering and Technology by the Computer Science Department.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
