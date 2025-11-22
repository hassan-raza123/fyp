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
      className='fixed bottom-28 left-6 z-40 w-12 h-12 rounded-full bg-brand-primary text-white shadow-lg hover:bg-brand-primary-dark transition-all duration-300 hover:scale-110 flex items-center justify-center group'
      aria-label='Back to top'
      style={{
        backgroundColor: 'var(--brand-primary)',
        boxShadow: `0 4px 15px var(--brand-primary-opacity-30)`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--brand-primary-dark)';
        e.currentTarget.style.boxShadow = `0 6px 20px var(--brand-primary-opacity-40)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--brand-primary)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(38, 40, 149, 0.3)';
      }}
    >
      <ArrowUp className='w-5 h-5 group-hover:-translate-y-1 transition-transform' />
    </button>
  );
}

