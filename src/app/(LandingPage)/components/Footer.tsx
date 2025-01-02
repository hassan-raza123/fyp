// components/Footer.tsx

import React from 'react';
import Link from 'next/link';
import { Github, Linkedin, Mail, Twitter } from 'lucide-react';

const teamMembers = [
  {
    name: 'Hassan Raza',
    role: 'Full Stack Developer',
    github: 'https://github.com/member1',
    linkedin: 'https://linkedin.com/in/member1',
    picture: '/team/hassan.jpg', // Path to Hassan's picture
  },
  {
    name: 'Muhammad Talha',
    role: 'Frontend Developer',
    github: 'https://github.com/member2',
    linkedin: 'https://linkedin.com/in/member2',
    picture: '/images/talha.jpg', // Path to Talha's picture
  },
  {
    name: 'Muhammad Ahmar',
    role: 'Backend Developer',
    github: 'https://github.com/member3',
    linkedin: 'https://linkedin.com/in/member3',
    picture: '/images/ahmar.jpg', // Path to Ahmar's picture
  },
  {
    name: 'Mueez Ahmed',
    role: 'UI/UX Designer',
    github: 'https://github.com/member4',
    linkedin: 'https://linkedin.com/in/member4',
    picture: '/team/mueez.jpg', // Path to Mueez's picture
  },
  {
    name: 'Muhammad Zohaib Asgar',
    role: 'Database Engineer',
    github: 'https://github.com/member5',
    linkedin: 'https://linkedin.com/in/member5',
    picture: '/images/zohaib.jpg', // Path to Zohaib's picture
  },
];

export default function Footer() {
  return (
    <footer className='bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300'>
      {/* Team Section */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl font-bold text-white mb-4'>Meet Our Team</h2>
          <p className='text-gray-400 max-w-2xl mx-auto'>
            Proud developers and designers behind UniAttend - Building the
            future of attendance management
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-16'>
          {teamMembers.map((member, index) => (
            <div key={index} className='text-center'>
              <div className='mb-4'>
                <div className='w-24 h-24 rounded-full overflow-hidden bg-gray-800 mx-auto'>
                  <img
                    src={member.picture}
                    alt={`${member.name}'s picture`}
                    className='w-full h-full object-cover'
                  />
                </div>
              </div>
              <h3 className='text-lg font-semibold text-white mb-1'>
                {member.name}
              </h3>
              <p className='text-indigo-400 text-sm mb-3'>{member.role}</p>
              <div className='flex justify-center space-x-3'>
                <a
                  href={member.github}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  <Github className='h-5 w-5' />
                </a>
                <a
                  href={member.linkedin}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  <Linkedin className='h-5 w-5' />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Footer Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-800'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {/* Brand Section */}
          <div className='col-span-1 md:col-span-2'>
            <div className='flex items-center space-x-3 mb-6'>
              <div className='w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center'>
                <span className='text-xl font-bold text-white'>U</span>
              </div>
              <h3 className='text-2xl font-bold text-white'>UniAttend</h3>
            </div>
            <p className='text-gray-400 max-w-md mb-6'>
              A modern attendance management system built with passion by
              students, for students. Making attendance tracking seamless and
              efficient.
            </p>
            <div className='flex space-x-4'>
              <a
                href='#'
                className='text-gray-400 hover:text-white transition-colors'
              >
                <Twitter className='h-5 w-5' />
              </a>
              <a
                href='#'
                className='text-gray-400 hover:text-white transition-colors'
              >
                <Linkedin className='h-5 w-5' />
              </a>
              <a
                href='#'
                className='text-gray-400 hover:text-white transition-colors'
              >
                <Mail className='h-5 w-5' />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className='text-lg font-semibold text-white mb-4'>
              Quick Links
            </h4>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/features'
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href='/about'
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href='/documentation'
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href='/blog'
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className='text-lg font-semibold text-white mb-4'>Contact</h4>
            <ul className='space-y-2'>
              <li className='flex items-center space-x-2'>
                <Mail className='h-5 w-5 text-indigo-400' />
                <span>support@uniattend.com</span>
              </li>
              <li>
                <p className='text-gray-400'>
                  MNS UET
                  <br />
                  Multan, Pakistan
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='mt-12 pt-8 border-t border-gray-800'>
          <div className='flex flex-col md:flex-row justify-between items-center'>
            <p className='text-gray-400 text-sm'>
              &copy; {new Date().getFullYear()} UniAttend. A Final Year Project
              by Team Members.
            </p>
            <div className='flex space-x-6 mt-4 md:mt-0 text-sm'>
              <Link
                href='/privacy'
                className='text-gray-400 hover:text-white transition-colors'
              >
                Privacy Policy
              </Link>
              <Link
                href='/terms'
                className='text-gray-400 hover:text-white transition-colors'
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
