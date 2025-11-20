'use client';

import Image from 'next/image';
import { Linkedin, Github } from 'lucide-react';
import { supervisor, teamMembers } from '@/constants/landing-page';

export default function TeamSection() {
  return (
    <div id="team" className='relative py-24 bg-linear-to-b from-gray-50 to-white scroll-mt-20 overflow-hidden'>
      {/* Subtle decorative background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-20 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'var(--brand-primary)' }}></div>
        <div className="absolute bottom-20 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'var(--brand-secondary)' }}></div>
      </div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <div className='inline-block px-4 py-2 rounded-full mb-4' style={{ backgroundColor: 'var(--brand-secondary-opacity-10)', color: 'var(--brand-secondary)' }}>
            <span className='text-sm font-semibold uppercase tracking-wide'>Our Team</span>
          </div>
          <h2 className='text-4xl md:text-5xl font-bold mb-4' style={{ color: 'var(--text-heading)' }}>
            Meet the Team
          </h2>
          <p className='text-lg max-w-3xl mx-auto leading-relaxed' style={{ color: 'var(--text-body)' }}>
            Dedicated professionals building the future of education through technology
          </p>
        </div>

        {/* First Row: 3 people */}
        <div className='flex justify-center items-end gap-16 lg:gap-24 mb-16'>
          {/* Left Developer */}
          <div className='flex flex-col items-center text-center group transform hover:-translate-y-2 transition-transform duration-300'>
            <div className='relative mb-5'>
              {/* Rounded Rectangle */}
              <div className='w-64 h-80 rounded-[7rem] overflow-hidden bg-gray-100 shadow-xl'>
                <Image
                  src={teamMembers[0].picture}
                  alt={teamMembers[0].name}
                  width={256}
                  height={320}
                  className='object-cover w-full h-full'
                />
                {/* Gradient Overlay on Hover */}
                <div className='absolute inset-0 rounded-[7rem] bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
              </div>
              
              {/* Social Icons on Hover */}
              <div className='absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 z-10'>
                <a
                  href={teamMembers[0].github}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg'
                  style={{ backgroundColor: 'var(--brand-secondary)' }}
                >
                  <Github className='w-5 h-5 text-white' />
                </a>
                <a
                  href={teamMembers[0].linkedin}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg'
                  style={{ backgroundColor: 'var(--brand-secondary)' }}
                >
                  <Linkedin className='w-5 h-5 text-white' />
                </a>
              </div>
            </div>
            <h3 className='text-xl font-bold mb-2' style={{ color: 'var(--text-heading)' }}>
              {teamMembers[0].name}
            </h3>
            <p className='text-base' style={{ color: 'var(--text-body)' }}>
              {teamMembers[0].role}
            </p>
          </div>

          {/* Center Supervisor (Bigger) */}
          <div className='flex flex-col items-center text-center group transform hover:-translate-y-2 transition-transform duration-300'>
            <div className='relative mb-5'>
              {/* Rounded Rectangle - Bigger */}
              <div className='w-72 h-88 rounded-[7rem] overflow-hidden bg-gray-100 shadow-2xl'>
                <Image
                  src={supervisor.picture}
                  alt={supervisor.name}
                  width={288}
                  height={352}
                  className='object-cover w-full h-full'
                />
                {/* Gradient Overlay on Hover */}
                <div className='absolute inset-0 rounded-[7rem] bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
              </div>
              
              {/* Social Icons on Hover */}
              <div className='absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 z-10'>
                <a
                  href={supervisor.linkedin}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg'
                  style={{ backgroundColor: 'var(--brand-secondary)' }}
                >
                  <Linkedin className='w-6 h-6 text-white' />
                </a>
              </div>
            </div>
            <div className='space-y-1'>
              <h3 className='text-2xl font-bold' style={{ color: 'var(--text-heading)' }}>
                {supervisor.name}
              </h3>
              <p className='text-sm font-semibold uppercase tracking-wide' style={{ color: 'var(--brand-primary)' }}>
                Project Supervisor
              </p>
              <p className='text-base' style={{ color: 'var(--text-body)' }}>
                {supervisor.designation}
              </p>
            </div>
          </div>

          {/* Right Developer */}
          <div className='flex flex-col items-center text-center group transform hover:-translate-y-2 transition-transform duration-300'>
            <div className='relative mb-5'>
              {/* Rounded Rectangle */}
              <div className='w-64 h-80 rounded-[7rem] overflow-hidden bg-gray-100 shadow-xl'>
                <Image
                  src={teamMembers[1].picture}
                  alt={teamMembers[1].name}
                  width={256}
                  height={320}
                  className='object-cover w-full h-full'
                />
                {/* Gradient Overlay on Hover */}
                <div className='absolute inset-0 rounded-[7rem] bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
              </div>
              
              {/* Social Icons on Hover */}
              <div className='absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 z-10'>
                <a
                  href={teamMembers[1].github}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg'
                  style={{ backgroundColor: 'var(--brand-secondary)' }}
                >
                  <Github className='w-5 h-5 text-white' />
                </a>
                <a
                  href={teamMembers[1].linkedin}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg'
                  style={{ backgroundColor: 'var(--brand-secondary)' }}
                >
                  <Linkedin className='w-5 h-5 text-white' />
                </a>
              </div>
            </div>
            <h3 className='text-xl font-bold mb-2' style={{ color: 'var(--text-heading)' }}>
              {teamMembers[1].name}
            </h3>
            <p className='text-base' style={{ color: 'var(--text-body)' }}>
              {teamMembers[1].role}
            </p>
          </div>
        </div>

        {/* Second Row: 3 developers */}
        <div className='flex justify-center gap-16 lg:gap-24'>
          {teamMembers.slice(2, 5).map((member, index) => (
            <div key={index} className='flex flex-col items-center text-center group transform hover:-translate-y-2 transition-transform duration-300'>
              <div className='relative mb-5'>
                {/* Rounded Rectangle */}
                <div className='w-64 h-80 rounded-[7rem] overflow-hidden bg-gray-100 shadow-xl'>
                  <Image
                    src={member.picture}
                    alt={member.name}
                    width={256}
                    height={320}
                    className='object-cover w-full h-full'
                  />
                  {/* Gradient Overlay on Hover */}
                  <div className='absolute inset-0 rounded-[7rem] bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                </div>
                
                {/* Social Icons on Hover */}
                <div className='absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 z-10'>
                  <a
                    href={member.github}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg'
                    style={{ backgroundColor: 'var(--brand-secondary)' }}
                  >
                    <Github className='w-5 h-5 text-white' />
                  </a>
                  <a
                    href={member.linkedin}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg'
                    style={{ backgroundColor: 'var(--brand-secondary)' }}
                  >
                    <Linkedin className='w-5 h-5 text-white' />
                  </a>
                </div>
              </div>
              <h3 className='text-xl font-bold mb-2' style={{ color: 'var(--text-heading)' }}>
                {member.name}
              </h3>
              <p className='text-base' style={{ color: 'var(--text-body)' }}>
                {member.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
