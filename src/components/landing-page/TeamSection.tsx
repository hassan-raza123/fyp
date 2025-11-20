'use client';

import Image from 'next/image';
import { Linkedin, Github } from 'lucide-react';
import { supervisor, teamMembers } from '@/constants/landing-page';

export default function TeamSection() {
  return (
    <div id="team" className='relative py-24 bg-white scroll-mt-20'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <h2 className='text-4xl md:text-5xl font-bold mb-4' style={{ color: 'var(--text-heading)' }}>
            Meet the Team
          </h2>
          <p className='text-lg max-w-3xl mx-auto leading-relaxed' style={{ color: 'var(--text-body)' }}>
            Dedicated professionals building the future of education through technology
          </p>
        </div>

        {/* First Row: 3 people with supervisor in center (bigger) */}
        <div className='flex justify-center items-end gap-16 lg:gap-24 mb-16'>
          {/* Left Developer */}
          <div className='flex flex-col items-center text-center group'>
            <div className='relative mb-5'>
              {/* Rounded Rectangle */}
              <div className='w-56 h-72 rounded-[7rem] overflow-hidden bg-gray-100 shadow-xl'>
                <Image
                  src={teamMembers[0].picture}
                  alt={teamMembers[0].name}
                  width={224}
                  height={288}
                  className='object-cover w-full h-full'
                />
              </div>
              
              {/* Social Icons on Hover */}
              <div className='absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                <a
                  href={teamMembers[0].github}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg'
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  <Github className='w-5 h-5 text-white' />
                </a>
                <a
                  href={teamMembers[0].linkedin}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg'
                  style={{ backgroundColor: 'var(--brand-primary)' }}
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
          <div className='flex flex-col items-center text-center group'>
            <div className='relative mb-6'>
              {/* Larger Rounded Rectangle */}
              <div className='w-72 h-88 rounded-[7rem] overflow-hidden bg-gray-100 shadow-2xl'>
                <Image
                  src={supervisor.picture}
                  alt={supervisor.name}
                  width={288}
                  height={352}
                  className='object-cover w-full h-full'
                />
              </div>
              
              {/* Social Icons on Hover */}
              <div className='absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                <a
                  href={supervisor.linkedin}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl'
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  <Linkedin className='w-6 h-6 text-white' />
                </a>
              </div>
            </div>
            <h3 className='text-2xl font-bold mb-2' style={{ color: 'var(--text-heading)' }}>
              {supervisor.name}
            </h3>
            <p className='text-lg' style={{ color: 'var(--text-body)' }}>
              {supervisor.designation}
            </p>
          </div>

          {/* Right Developer */}
          <div className='flex flex-col items-center text-center group'>
            <div className='relative mb-5'>
              {/* Rounded Rectangle */}
              <div className='w-56 h-72 rounded-[7rem] overflow-hidden bg-gray-100 shadow-xl'>
                <Image
                  src={teamMembers[1].picture}
                  alt={teamMembers[1].name}
                  width={224}
                  height={288}
                  className='object-cover w-full h-full'
                />
              </div>
              
              {/* Social Icons on Hover */}
              <div className='absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                <a
                  href={teamMembers[1].github}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg'
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  <Github className='w-5 h-5 text-white' />
                </a>
                <a
                  href={teamMembers[1].linkedin}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg'
                  style={{ backgroundColor: 'var(--brand-primary)' }}
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
            <div key={index} className='flex flex-col items-center text-center group'>
              <div className='relative mb-5'>
                {/* Rounded Rectangle */}
                <div className='w-56 h-72 rounded-[3rem] overflow-hidden bg-gray-100 shadow-xl'>
                  <Image
                    src={member.picture}
                    alt={member.name}
                    width={224}
                    height={288}
                    className='object-cover w-full h-full'
                  />
                </div>
                
                {/* Social Icons on Hover */}
                <div className='absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                  <a
                    href={member.github}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg'
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                  >
                    <Github className='w-5 h-5 text-white' />
                  </a>
                  <a
                    href={member.linkedin}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg'
                    style={{ backgroundColor: 'var(--brand-primary)' }}
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
