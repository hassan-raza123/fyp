'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTopButton() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!showBackToTop) return null;

  return (
    <button
      onClick={scrollToTop}
      /* Was sitting bottom-28 left-6 — alone in the bottom-left corner,
         diagonally opposite the contact button, so the page had a floating
         control in each of two corners. It now stacks above the contact
         button on the right. Hover moved from JS handlers to CSS. */
      className='accent-btn fixed bottom-24 right-6 z-40 w-11 h-11 rounded-full text-white transition-transform duration-300 hover:scale-105 flex items-center justify-center'
      aria-label='Back to top'
    >
      <ArrowUp className='w-5 h-5' />
    </button>
  );
}

