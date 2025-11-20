'use client';

import Image from 'next/image';
import { Linkedin, Github, Award, Sparkles } from 'lucide-react';
import { supervisor, teamMembers } from '@/constants/landing-page';

export default function TeamSection() {
  return (
    <div id="team" className='relative py-32 bg-white scroll-mt-20 overflow-hidden'>
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-primary-light rounded-full blur-3xl"></div>
      </div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-20'>
          <div className='inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 mb-6'>
            <Sparkles className='w-4 h-4' style={{ color: 'var(--brand-primary)' }} />
            <span className='text-sm font-semibold' style={{ color: 'var(--brand-primary)' }}>
              OUR TEAM
            </span>
          </div>
          <h2 className='text-5xl md:text-6xl font-extrabold mb-6' style={{ color: 'var(--text-heading)' }}>
            Meet the Team
          </h2>
          <p className='text-lg max-w-2xl mx-auto' style={{ color: 'var(--text-body)' }}>
            Passionate developers and designers dedicated to transforming education through technology
          </p>
        </div>

        {/* Supervisor Card - Elegant & Featured */}
        <div className='max-w-3xl mx-auto mb-24'>
          <div className='relative group'>
            {/* Subtle glow on hover */}
            <div className='absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'
              style={{ 
                background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-light))',
                filter: 'blur(20px)'
              }}
            ></div>
            
            <div className='relative bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden backdrop-blur-sm'>
              <div className='p-10 sm:p-12'>
                <div className='flex flex-col sm:flex-row items-center gap-10'>
                  {/* Photo with elegant frame */}
                  <div className='relative shrink-0'>
                    <div className='absolute -inset-3 rounded-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500'
                      style={{ 
                        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-light))',
                        filter: 'blur(15px)'
                      }}
                    ></div>
                    <div className='relative w-36 h-36 rounded-3xl overflow-hidden ring-4 ring-white shadow-2xl transform group-hover:scale-105 transition-transform duration-500'>
                      <Image
                        src={supervisor.picture}
                        alt={supervisor.name}
                        width={144}
                        height={144}
                        className='object-cover w-full h-full'
                      />
                    </div>
                    {/* Elegant badge */}
                    <div className='absolute -bottom-3 -right-3 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300'
                      style={{ 
                        backgroundColor: 'var(--brand-primary)'
                      }}
                    >
                      <Award className='w-6 h-6 text-white' />
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className='flex-1 text-center sm:text-left space-y-4'>
                    <div>
                      <h3 className='text-3xl font-bold mb-2' style={{ color: 'var(--text-heading)' }}>
                        {supervisor.name}
                      </h3>
                      <p className='text-lg font-semibold mb-2' style={{ color: 'var(--brand-primary)' }}>
                        {supervisor.role}
                      </p>
                      <p className='text-base' style={{ color: 'var(--text-body)' }}>
                        {supervisor.designation}
                      </p>
                    </div>
                    <a
                      href={supervisor.linkedin}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300'
                      style={{ 
                        backgroundColor: 'var(--brand-primary)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--brand-primary-dark)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--brand-primary)';
                      }}
                    >
                      <Linkedin className='w-5 h-5' />
                      Connect on LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Grid - Modern & Clean */}
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8'>
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className='group relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1'
            >
              {/* Photo */}
              <div className='relative mb-5'>
                <div className='relative w-full aspect-square rounded-2xl overflow-hidden ring-1 ring-gray-200 group-hover:ring-gray-300 transition-all duration-300'>
                  <Image
                    src={member.picture}
                    alt={member.name}
                    width={200}
                    height={200}
                    className='object-cover w-full h-full transition-transform duration-300 group-hover:scale-105'
                  />
                </div>
              </div>
              
              {/* Info */}
              <div className='text-center space-y-2 mb-5'>
                <h3 className='text-base font-bold transition-colors duration-300' style={{ color: 'var(--text-heading)' }}>
                  {member.name}
                </h3>
                <p className='text-sm font-semibold' style={{ color: 'var(--brand-primary)' }}>
                  {member.role}
                </p>
              </div>
              
              {/* Social Links */}
              <div className='flex justify-center gap-3'>
                <a
                  href={member.github}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='p-2.5 rounded-xl border border-gray-200 hover:border-gray-900 hover:bg-gray-900 transition-all duration-300'
                  style={{ color: 'var(--text-body)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--white)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-body)';
                  }}
                >
                  <Github className='w-4 h-4' />
                </a>
                <a
                  href={member.linkedin}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='p-2.5 rounded-xl border transition-all duration-300'
                  style={{ 
                    borderColor: 'var(--brand-primary)',
                    backgroundColor: 'var(--brand-primary-opacity-10)',
                    color: 'var(--brand-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--brand-primary)';
                    e.currentTarget.style.color = 'var(--white)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--brand-primary-opacity-10)';
                    e.currentTarget.style.color = 'var(--brand-primary)';
                  }}
                >
                  <Linkedin className='w-4 h-4' />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
