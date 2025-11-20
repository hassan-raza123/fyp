import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Github,
  Linkedin,
} from 'lucide-react';
import NavbarClient from '@/components/landing-page/NavbarClient';
import Footer from '@/components/landing-page/Footer';
import Image from 'next/image';

const supervisor = {
  name: 'Mr. Abdul Basit',
  role: 'Project Supervisor',
  designation: 'Lecturer',
  department: 'Computer Science Department',
  linkedin: 'https://linkedin.com/in/supervisor',
  picture: '/team/supervisor.jpg',
};

const teamMembers = [
  {
    name: 'Hassan Raza',
    role: 'Full Stack Developer',
    github: 'https://github.com/member1',
    linkedin: 'https://linkedin.com/in/member1',
    picture: '/team/hassan.jpg',
  },
  {
    name: 'Muhammad Talha',
    role: 'Frontend Developer',
    github: 'https://github.com/member2',
    linkedin: 'https://linkedin.com/in/member2',
    picture: '/team/talha.jpg',
  },
  {
    name: 'Muhammad Ahmar',
    role: 'Backend Developer',
    github: 'https://github.com/member3',
    linkedin: 'https://linkedin.com/in/member3',
    picture: '/team/ahmar.jpg',
  },
  {
    name: 'Mueez Ahmed',
    role: 'UI/UX Designer',
    github: 'https://github.com/member4',
    linkedin: 'https://linkedin.com/in/member4',
    picture: '/team/mueez.jpg',
  },
  {
    name: 'Muhammad Zohaib Asgar',
    role: 'Database Engineer',
    github: 'https://github.com/member5',
    linkedin: 'https://linkedin.com/in/member5',
    picture: '/team/zohaib.jpg',
  },
];


export default function AboutPage() {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      {/* Hero Section */}
      <div className='relative bg-linear-to-br from-primary via-primary to-accent'>
        <NavbarClient />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className='relative max-w-7xl mx-auto px-4 pt-24 pb-16 sm:px-6 lg:px-8'>
          <div className='max-w-3xl mx-auto text-center'>
            <h1 className='text-4xl font-bold text-primary-foreground mb-6 lg:text-5xl'>
              About the
              <span className='block bg-gradient-to-r from-white via-white/90 to-white/80 text-transparent bg-clip-text'>
                OBE Management System
              </span>
            </h1>
            <p className='text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed'>
              Final Year Project - MNS University of Engineering & Technology
            </p>
          </div>
        </div>
      </div>

      {/* Project Overview */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <div className='max-w-3xl mx-auto'>
          <div className='bg-card rounded-xl shadow-lg p-8 border border-border'>
            <h3 className='text-2xl font-bold text-foreground mb-4'>
              Project Overview
            </h3>
            <p className='text-muted-foreground leading-relaxed mb-4'>
              This Outcome-Based Education (OBE) Management System is designed specifically for 
              MNS University of Engineering & Technology to streamline academic operations, 
              assessment management, and learning outcome tracking.
            </p>
            <p className='text-muted-foreground leading-relaxed'>
              The system provides comprehensive tools for managing students, faculty, courses, 
              assessments, and tracking CLO/PLO attainments, making OBE implementation 
              efficient and transparent.
            </p>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-muted'>
        <div className='text-center mb-16'>
          <h2 className='text-4xl font-bold text-foreground mb-4'>Development Team</h2>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Final Year Project Team - Computer Science Department
          </p>
        </div>

        {/* Top Row with Supervisor */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-12'>
          {/* First Team Member */}
          <div className='group relative'>
            <div className='absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300'></div>
            <div className='relative bg-card rounded-2xl shadow-lg overflow-hidden border border-border hover:shadow-xl transition-all duration-300'>
              <div className='p-6 flex flex-col items-center'>
                <div className='w-64 h-64 overflow-hidden bg-card ring-4 ring-primary/10 group-hover:ring-primary/20 transition-all duration-300 shadow-lg mb-6 rounded-xl relative'>
                  <Image
                    src={teamMembers[0].picture}
                    alt={teamMembers[0].name}
                    width={256}
                    height={256}
                    className='object-cover w-full h-full'
                  />
                </div>
                <h3 className='text-xl font-bold text-foreground mb-1'>
                  {teamMembers[0].name}
                </h3>
                <p className='text-primary font-medium mb-4'>
                  {teamMembers[0].role}
                </p>
                <div className='flex justify-center space-x-4'>
                  <a
                    href={teamMembers[0].github}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='p-2 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors'
                  >
                    <Github className='h-5 w-5' />
                  </a>
                  <a
                    href={teamMembers[0].linkedin}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='p-2 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors'
                  >
                    <Linkedin className='h-5 w-5' />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Supervisor Card */}
          <div className='group relative -mt-12'>
            <div className='absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300'></div>
            <div className='relative bg-card rounded-2xl shadow-xl overflow-hidden border border-border'>
              <div className='p-6 flex flex-col items-center'>
                <div className='w-64 h-64 overflow-hidden bg-card ring-4 ring-primary/10 group-hover:ring-primary/20 transition-all duration-300 shadow-lg mb-6 rounded-xl relative'>
                  <Image
                    src={supervisor.picture}
                    alt={supervisor.name}
                    width={256}
                    height={256}
                    className='object-cover w-full h-full'
                  />
                </div>
                <div className='text-center'>
                  <h3 className='text-2xl font-bold text-foreground mb-2'>
                    {supervisor.name}
                  </h3>
                  <p className='text-primary font-semibold mb-2'>
                    {supervisor.role}
                  </p>
                  <p className='text-muted-foreground mb-4'>
                    {supervisor.designation}
                    <br />
                    {supervisor.department}
                  </p>
                  <a
                    href={supervisor.linkedin}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors shadow-sm'
                  >
                    <Linkedin className='h-5 w-5 mr-2' />
                    <span>Connect on LinkedIn</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Second Team Member */}
          <div className='group relative'>
            <div className='absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300'></div>
            <div className='relative bg-card rounded-2xl shadow-lg overflow-hidden border border-border hover:shadow-xl transition-all duration-300'>
              <div className='p-6 flex flex-col items-center'>
                <div className='w-64 h-64 overflow-hidden bg-card ring-4 ring-primary/10 group-hover:ring-primary/20 transition-all duration-300 shadow-lg mb-6 rounded-xl relative'>
                  <Image
                    src={teamMembers[1].picture}
                    alt={teamMembers[1].name}
                    width={256}
                    height={256}
                    className='object-cover w-full h-full'
                  />
                </div>
                <h3 className='text-xl font-bold text-foreground mb-1'>
                  {teamMembers[1].name}
                </h3>
                <p className='text-primary font-medium mb-4'>
                  {teamMembers[1].role}
                </p>
                <div className='flex justify-center space-x-4'>
                  <a
                    href={teamMembers[1].github}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='p-2 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors'
                  >
                    <Github className='h-5 w-5' />
                  </a>
                  <a
                    href={teamMembers[1].linkedin}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='p-2 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors'
                  >
                    <Linkedin className='h-5 w-5' />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row with Three Team Members */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {teamMembers.slice(2).map((member, index) => (
            <div key={index} className='group relative'>
              <div className='absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300'></div>
              <div className='relative bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300'>
                <div className='p-6 flex flex-col items-center'>
                  <div className='w-64 h-64 overflow-hidden bg-white ring-4 ring-purple-100 group-hover:ring-purple-200 transition-all duration-300 shadow-lg mb-6 rounded-xl relative'>
                    <Image
                      src={member.picture}
                      alt={member.name}
                      width={256}
                      height={256}
                      className='object-cover w-full h-full'
                    />
                  </div>
                  <h3 className='text-xl font-bold text-gray-900 mb-1'>
                    {member.name}
                  </h3>
                  <p className='text-purple-600 font-medium mb-4'>
                    {member.role}
                  </p>
                  <div className='flex justify-center space-x-4'>
                    <a
                      href={member.github}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                    >
                      <Github className='h-5 w-5' />
                    </a>
                    <a
                      href={member.linkedin}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                    >
                      <Linkedin className='h-5 w-5' />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className='bg-gradient-to-br from-primary via-primary to-accent py-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-primary/10 backdrop-blur-md border border-primary/20 rounded-3xl p-12 text-center'>
            <h2 className='text-3xl font-bold text-primary-foreground mb-6'>
              Access the System
            </h2>
            <p className='text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto'>
              Login with your credentials to access the OBE management portal
            </p>
            <Link
              href='/login'
              className='inline-flex items-center px-8 py-4 rounded-xl bg-card text-primary font-semibold hover:bg-card/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            >
              Login to Portal
              <ArrowRight className='ml-2 h-5 w-5' />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
