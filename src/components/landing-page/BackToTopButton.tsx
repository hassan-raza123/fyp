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
      className='fixed bottom-28 right-6 z-40 w-12 h-12 rounded-full bg-blue text-white shadow-lg hover:bg-blue-dark transition-all duration-300 hover:scale-110 flex items-center justify-center group'
      aria-label='Back to top'
    >
      <ArrowUp className='w-5 h-5 group-hover:-translate-y-1 transition-transform' />
    </button>
  );
}

