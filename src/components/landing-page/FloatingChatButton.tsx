'use client';

import { MessageCircle } from 'lucide-react';
import ContactDialog from './ContactDialog';

/**
 * The floating contact bubble.
 *
 * The dialog it used to own now lives in ContactDialog, so the bottom-of-page
 * call to action can open the same form instead of the corner bubble being
 * the only way to reach it.
 */
export default function FloatingChatButton() {
  return (
    <ContactDialog>
      <button
        type='button'
        className='accent-btn fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-105'
        aria-label='Contact us'
      >
        <MessageCircle className='w-6 h-6' />
      </button>
    </ContactDialog>
  );
}
