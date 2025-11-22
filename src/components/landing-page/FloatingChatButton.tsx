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
      {/* Floating Chat Button - Logo Blue Theme */}
      <button
        onClick={() => setIsOpen(true)}
        className='fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1 group'
        aria-label='Open contact form'
        style={{ 
          backgroundColor: 'var(--brand-primary)',
          boxShadow: `0 10px 25px var(--brand-primary-opacity-30)`
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--brand-primary-dark)';
          e.currentTarget.style.boxShadow = `0 12px 30px var(--brand-primary-opacity-40)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--brand-primary)';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(38, 40, 149, 0.3)';
        }}
      >
        <MessageCircle className='w-7 h-7 group-hover:scale-110 transition-transform' />
      </button>

      {/* Contact Modal - Simple & Professional */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold text-brand-primary' style={{ color: 'var(--brand-primary)' }}>
              Get In Touch
            </DialogTitle>
            <DialogDescription className='text-base' style={{ color: 'var(--text-body)' }}>
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

