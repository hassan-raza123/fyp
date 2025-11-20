'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import ContactForm from '@/components/forms/ContactForm';

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className='fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full brand-gradient shadow-2xl hover:shadow-brand-primary/50 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:-translate-y-1 group'
        aria-label='Open contact form'
      >
        <MessageCircle className='w-7 h-7 group-hover:scale-110 transition-transform relative z-10' />
        {/* Pulse animation - only when not hovering */}
        <span className='absolute inset-0 rounded-full bg-brand-primary animate-ping opacity-20 group-hover:opacity-0 transition-opacity'></span>
        {/* Glow effect */}
        <span className='absolute inset-0 rounded-full bg-brand-primary blur-xl opacity-30 group-hover:opacity-50 transition-opacity -z-10'></span>
      </button>

      {/* Contact Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold landing-text-heading'>
              Get In Touch
            </DialogTitle>
            <DialogDescription className='text-base'>
              Have questions? We're here to help you get started
            </DialogDescription>
          </DialogHeader>

          <div className='mt-4'>
            {/* Contact Form */}
            <div className='bg-white rounded-2xl shadow-lg p-6 border border-slate-200'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='w-12 h-12 rounded-xl brand-gradient flex items-center justify-center shadow-lg'>
                  <MessageCircle className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h3 className='text-xl font-bold landing-text-heading'>
                    Send Message
                  </h3>
                  <p className='text-sm text-slate-600'>We'll respond within 24 hours</p>
                </div>
              </div>
              <ContactForm />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

