'use client';

import { Star, Quote, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

const testimonials = [
  {
    name: 'Ahmed Hassan',
    role: 'Computer Science',
    batch: '2023',
    image: '/team/ahmar.jpg',
    rating: 5,
    content: 'EduTrack made tracking my academic progress incredibly easy. I can see my CLO attainments and understand exactly where I stand.'
  },
  {
    name: 'Sara Khan',
    role: 'Software Engineering',
    batch: '2025',
    image: '/team/hassan.jpg',
    rating: 5,
    content: 'The real-time analytics and transparent grading system helped me identify my strengths and areas for improvement.'
  },
  {
    name: 'Ali Raza',
    role: 'Information Technology',
    batch: '2023',
    image: '/team/mueez.jpg',
    rating: 5,
    content: 'Finally, a system that makes OBE simple! The portal is intuitive and I can access all my materials in one place.'
  },
  {
    name: 'Fatima Malik',
    role: 'Data Science',
    batch: '2025',
    image: '/team/talha.jpg',
    rating: 5,
    content: 'EduTrack\'s automated tracking is a game-changer. It gives me clear insights into my learning outcomes.'
  },
  {
    name: 'Usman Ali',
    role: 'Cybersecurity',
    batch: '2025',
    image: '/team/zohaib.jpg',
    rating: 5,
    content: 'The digital assessment system is efficient and transparent. I always know how my performance contributes to outcomes.'
  },
  {
    name: 'Ayesha Nadeem',
    role: 'AI & Machine Learning',
    batch: '2025',
    image: '/team/ahmar.jpg',
    rating: 5,
    content: 'Love how organized everything is! From assignments to results, EduTrack keeps me updated on my academics.'
  }
];

export default function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollInterval: NodeJS.Timeout;
    let isPaused = false;

    const startAutoScroll = () => {
      scrollInterval = setInterval(() => {
        if (!isPaused && scrollContainer) {
          const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
          
          if (scrollContainer.scrollLeft >= maxScroll - 50) {
            scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            scrollContainer.scrollBy({ left: 380, behavior: 'smooth' });
          }
        }
      }, 3500);
    };

    startAutoScroll();

    const handleMouseEnter = () => { isPaused = true; };
    const handleMouseLeave = () => { isPaused = false; };

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearInterval(scrollInterval);
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className='relative py-24 overflow-hidden'>
      {/* Gradient Background with Blur Circles */}
      <div 
        className='absolute inset-0'
        style={{
          background: 'linear-gradient(to bottom right, var(--gray-50), var(--white), var(--gray-50))'
        }}
        suppressHydrationWarning
      >
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: 'var(--brand-primary)' }}></div>
        <div className="absolute top-40 right-20 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: 'var(--brand-secondary)' }}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full blur-3xl opacity-15" style={{ background: 'var(--brand-primary)' }}></div>
      </div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-12'>
          <div className='inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 backdrop-blur-md' 
            style={{ 
              backgroundColor: 'var(--brand-secondary-opacity-10)',
              border: `1px solid var(--brand-secondary-opacity-20)`
            }}
          >
            <Sparkles className='w-4 h-4' style={{ color: 'var(--brand-secondary)' }} />
            <span className='text-sm font-semibold' style={{ color: 'var(--brand-secondary)' }}>
              STUDENT VOICES
            </span>
          </div>
          <h2 className='text-5xl md:text-6xl font-extrabold mb-4 bg-clip-text text-transparent' 
            style={{ 
              backgroundImage: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))'
            }}
          >
            Loved by Students
          </h2>
          <p className='text-xl max-w-2xl mx-auto' style={{ color: 'var(--text-body)' }}>
            Hear from students who use EduTrack every day 🎓
          </p>
        </div>

        {/* Auto-Scrolling Testimonials with Glassmorphism */}
        <div 
          ref={scrollRef}
          className='flex gap-6 overflow-x-auto py-8 scrollbar-hide'
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingTop: '2rem',
            paddingBottom: '2rem'
          }}
        >
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <div
              key={index}
              className='flex-none w-[360px] rounded-3xl p-6 backdrop-blur-xl shadow-xl border transition-all duration-500 hover:scale-105 group cursor-pointer'
              style={{ 
                backgroundColor: 'var(--white-opacity-70)',
                borderColor: 'var(--white-opacity-50)',
                boxShadow: '0 8px 32px var(--black-opacity-05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--white-opacity-90)';
                e.currentTarget.style.borderColor = 'var(--brand-primary)';
                e.currentTarget.style.boxShadow = `0 20px 60px var(--brand-primary-opacity-20)`;
                e.currentTarget.style.transform = 'scale(1.03) translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--white-opacity-70)';
                e.currentTarget.style.borderColor = 'var(--white-opacity-50)';
                e.currentTarget.style.boxShadow = '0 8px 32px var(--black-opacity-05)';
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
              }}
            >
              {/* Quote Background */}
              <div className='absolute top-6 right-6 opacity-5'>
                <Quote className='w-20 h-20' style={{ color: 'var(--brand-secondary)' }} />
              </div>

              {/* Rating Stars */}
              <div className='flex gap-1 mb-4'>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className='w-5 h-5 fill-current'
                    style={{ color: 'var(--brand-secondary)' }}
                  />
                ))}
              </div>

              {/* Content */}
              <p 
                className='text-base leading-relaxed mb-6 relative z-10'
                style={{ color: 'var(--text-body)' }}
              >
                "{testimonial.content}"
              </p>

              {/* Divider */}
              <div className='h-px mb-6' style={{ background: 'linear-gradient(90deg, transparent, var(--brand-primary-opacity-20), transparent)' }}></div>

              {/* Student Info */}
              <div className='flex items-center gap-4'>
                <div className='relative'>
                  {/* Gradient Ring */}
                  <div 
                    className='absolute inset-0 rounded-full blur-sm opacity-60 group-hover:opacity-100 transition-opacity'
                    style={{ 
                      background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                      padding: '2px'
                    }}
                  ></div>
                  <div 
                    className='relative w-14 h-14 rounded-full overflow-hidden bg-white p-0.5'
                  >
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={56}
                      height={56}
                      className='w-full h-full object-cover rounded-full'
                    />
                  </div>
                </div>
                <div className='flex-1 min-w-0'>
                  <h4 className='font-bold text-base truncate' style={{ color: 'var(--text-heading)' }}>
                    {testimonial.name}
                  </h4>
                  <p className='text-sm truncate' style={{ color: 'var(--text-body)' }}>
                    {testimonial.role}
                  </p>
                  <div className='flex items-center gap-2'>
                    <div className='w-2 h-2 rounded-full' style={{ backgroundColor: 'var(--brand-secondary)' }}></div>
                    <p 
                      className='text-xs font-semibold'
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      Batch {testimonial.batch}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
