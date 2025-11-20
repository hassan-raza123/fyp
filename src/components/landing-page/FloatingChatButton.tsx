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
      {/* Floating Chat Button - Orange Theme */}
      <button
        onClick={() => setIsOpen(true)}
        className='fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-brand-secondary text-white shadow-lg hover:bg-brand-secondary-dark flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 group'
        aria-label='Open contact form'
        style={{ 
          backgroundColor: 'var(--brand-secondary)',
          boxShadow: '0 10px 25px rgba(252, 153, 40, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--brand-secondary-dark)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(252, 153, 40, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--brand-secondary)';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(252, 153, 40, 0.3)';
        }}
      >
        <MessageCircle className='w-7 h-7 group-hover:scale-110 transition-transform' />
      </button>

      {/* Contact Modal - Simple & Professional */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold text-gray-900'>
              Get In Touch
            </DialogTitle>
            <DialogDescription className='text-base text-gray-600'>
              Have questions? We're here to help you get started
            </DialogDescription>
          </DialogHeader>

          <div className='mt-6'>
            <ContactForm />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

