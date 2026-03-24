'use client';

import Image from 'next/image';
import { Linkedin, Github } from 'lucide-react';
import { supervisor, teamMembers } from '@/constants/landing-page';

export default function TeamSection() {
  return (
    <div
      id="team"
      className='relative py-24 scroll-mt-20 overflow-hidden'
      style={{ background: `linear-gradient(to bottom, var(--gray-50), var(--white))` }}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <div className="absolute top-20 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'var(--brand-primary)' }} />
        <div className="absolute bottom-20 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'var(--brand-secondary)' }} />
      </div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-20'>
          <div
            className='inline-block px-4 py-2 rounded-full mb-4'
            style={{ backgroundColor: 'var(--brand-secondary-opacity-10)', color: 'var(--brand-secondary)' }}
          >
            <span className='text-sm font-semibold uppercase tracking-wide'>The Team</span>
          </div>
          <h2 className='text-4xl md:text-5xl font-bold mb-4' style={{ color: 'var(--text-heading)' }}>
            Behind the Project
          </h2>
          <p className='text-lg max-w-xl mx-auto leading-relaxed' style={{ color: 'var(--text-body)' }}>
            A Final Year Project developed under expert supervision — built with passion and purpose
          </p>
        </div>

        {/* Team: Supervisor (left, bigger) + Hassan (right, smaller) */}
        <div className='flex justify-center items-end gap-16 lg:gap-28'>

          {/* Supervisor — left, bigger */}
          <div className='flex flex-col items-center text-center group transform hover:-translate-y-3 transition-transform duration-300'>
            <div
              className='mb-4 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest'
              style={{ backgroundColor: 'var(--brand-secondary-opacity-10)', color: 'var(--brand-secondary)' }}
            >
              Supervisor
            </div>
            <div className='relative mb-6'>
              <div className='w-72 h-96 rounded-[7rem] overflow-hidden bg-gray-100 shadow-2xl'>
                <Image
                  src={supervisor.picture}
                  alt={supervisor.name}
                  width={288}
                  height={384}
                  className='object-cover w-full h-full'
                />
                <div
                  className='absolute inset-0 rounded-[7rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                  style={{ background: `linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.3), transparent)` }}
                />
              </div>
              <div className='absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 z-10'>
                <a
                  href={supervisor.linkedin}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110'
                  style={{ backgroundColor: 'var(--brand-secondary)' }}
                >
                  <Linkedin className='w-5 h-5 text-white' />
                </a>
              </div>
            </div>
            <h3 className='text-2xl font-bold mb-1' style={{ color: 'var(--text-heading)' }}>
              {supervisor.name}
            </h3>
            <p className='text-sm' style={{ color: 'var(--text-body)' }}>
              {supervisor.designation}
            </p>
          </div>

          {/* Hassan — right, smaller */}
          <div className='flex flex-col items-center text-center group transform hover:-translate-y-3 transition-transform duration-300'>
            <div
              className='mb-4 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest'
              style={{ backgroundColor: 'var(--brand-secondary-opacity-10)', color: 'var(--brand-secondary)' }}
            >
              Developer
            </div>
            <div className='relative mb-6'>
              <div className='w-72 h-96 rounded-[7rem] overflow-hidden bg-gray-100 shadow-2xl'>
                <Image
                  src={teamMembers[0].picture}
                  alt={teamMembers[0].name}
                  width={288}
                  height={384}
                  className='object-cover w-full h-full'
                />
                <div
                  className='absolute inset-0 rounded-[6rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                  style={{ background: `linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.3), transparent)` }}
                />
              </div>
              <div className='absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 z-10'>
                <a
                  href={teamMembers[0].github}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110'
                  style={{ backgroundColor: 'var(--brand-secondary)' }}
                >
                  <Github className='w-4 h-4 text-white' />
                </a>
                <a
                  href={teamMembers[0].linkedin}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110'
                  style={{ backgroundColor: 'var(--brand-secondary)' }}
                >
                  <Linkedin className='w-4 h-4 text-white' />
                </a>
              </div>
            </div>
            <h3 className='text-xl font-bold mb-1' style={{ color: 'var(--text-heading)' }}>
              {teamMembers[0].name}
            </h3>
            <p className='text-sm' style={{ color: 'var(--text-body)' }}>
              {teamMembers[0].role}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
