import React from 'react';
import Link from 'next/link';
import {
  Target,
  Lightbulb,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Shield,
  Clock,
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

const values = [
  {
    icon: <GraduationCap className='h-8 w-8 text-white' />,
    title: 'Educational Excellence',
    description: 'Committed to enhancing learning outcomes through technology',
  },
  {
    icon: <BookOpen className='h-8 w-8 text-white' />,
    title: 'Innovation',
    description: 'Constantly pushing boundaries in educational technology',
  },
  {
    icon: <Shield className='h-8 w-8 text-white' />,
    title: 'Integrity',
    description: 'Maintaining highest standards of ethics and transparency',
  },
  {
    icon: <Clock className='h-8 w-8 text-white' />,
    title: 'Reliability',
    description: 'Consistent and dependable service for our clients',
  },
];

const stats = [
  { value: '50+', label: 'Institutions' },
  { value: '100K+', label: 'Students' },
  { value: '10K+', label: 'Faculty' },
  { value: '99.9%', label: 'Satisfaction' },
];

export default function AboutPage() {
  return (
    <div className='min-h-screen bg-white'>
      {/* Hero Section */}
      <div className='relative bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600'>
        <NavbarClient />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className='relative max-w-7xl mx-auto px-4 pt-24 pb-16 sm:px-6 lg:px-8'>
          <div className='max-w-3xl mx-auto text-center'>
            <h1 className='text-4xl font-bold text-white mb-6 lg:text-5xl'>
              About
              <span className='block bg-gradient-to-r from-white via-white/90 to-white/80 text-transparent bg-clip-text'>
                Smart Campus for MNSUET
              </span>
            </h1>
            <p className='text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed'>
              Transforming education through innovative technology solutions
            </p>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-12'>
          <div className='bg-white rounded-xl shadow-lg p-8 border border-gray-100'>
            <div className='w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 flex items-center justify-center mb-6'>
              <Target className='h-8 w-8 text-white' />
            </div>
            <h3 className='text-2xl font-bold text-gray-900 mb-4'>
              Our Mission
            </h3>
            <p className='text-gray-600 leading-relaxed'>
              To revolutionize educational management through cutting-edge
              technology, making it more efficient, transparent, and
              outcome-focused. We aim to empower educational institutions with
              tools that enhance learning experiences and administrative
              efficiency.
            </p>
          </div>
          <div className='bg-white rounded-xl shadow-lg p-8 border border-gray-100'>
            <div className='w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 flex items-center justify-center mb-6'>
              <Lightbulb className='h-8 w-8 text-white' />
            </div>
            <h3 className='text-2xl font-bold text-gray-900 mb-4'>
              Our Vision
            </h3>
            <p className='text-gray-600 leading-relaxed'>
              To be the global leader in educational management solutions,
              setting new standards for academic excellence and administrative
              efficiency. We envision a future where technology seamlessly
              enhances every aspect of education.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className='bg-gray-50 py-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
            {stats.map((stat, index) => (
              <div key={index} className='text-center'>
                <div className='text-4xl font-bold text-purple-600 mb-2'>
                  {stat.value}
                </div>
                <div className='text-gray-600'>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <div className='text-center mb-16'>
          <h2 className='text-4xl font-bold text-gray-900 mb-4'>Our Team</h2>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            Meet the brilliant minds behind Smart Campus for MNSUET
          </p>
        </div>

        {/* Top Row with Supervisor */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-12'>
          {/* First Team Member */}
          <div className='group relative'>
            <div className='absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300'></div>
            <div className='relative bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300'>
              <div className='p-6 flex flex-col items-center'>
                <div className='w-64 h-64 overflow-hidden bg-white ring-4 ring-purple-100 group-hover:ring-purple-200 transition-all duration-300 shadow-lg mb-6 rounded-xl relative'>
                  <Image
                    src={teamMembers[0].picture}
                    alt={teamMembers[0].name}
                    width={256}
                    height={256}
                    className='object-cover w-full h-full'
                  />
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-1'>
                  {teamMembers[0].name}
                </h3>
                <p className='text-purple-600 font-medium mb-4'>
                  {teamMembers[0].role}
                </p>
                <div className='flex justify-center space-x-4'>
                  <a
                    href={teamMembers[0].github}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                  >
                    <Github className='h-5 w-5' />
                  </a>
                  <a
                    href={teamMembers[0].linkedin}
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

          {/* Supervisor Card */}
          <div className='group relative -mt-12'>
            <div className='absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300'></div>
            <div className='relative bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100'>
              <div className='p-6 flex flex-col items-center'>
                <div className='w-64 h-64 overflow-hidden bg-white ring-4 ring-purple-100 group-hover:ring-purple-200 transition-all duration-300 shadow-lg mb-6 rounded-xl relative'>
                  <Image
                    src={supervisor.picture}
                    alt={supervisor.name}
                    width={256}
                    height={256}
                    className='object-cover w-full h-full'
                  />
                </div>
                <div className='text-center'>
                  <h3 className='text-2xl font-bold text-gray-900 mb-2'>
                    {supervisor.name}
                  </h3>
                  <p className='text-purple-600 font-semibold mb-2'>
                    {supervisor.role}
                  </p>
                  <p className='text-gray-600 mb-4'>
                    {supervisor.designation}
                    <br />
                    {supervisor.department}
                  </p>
                  <a
                    href={supervisor.linkedin}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center px-4 py-2 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors shadow-sm'
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
            <div className='absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300'></div>
            <div className='relative bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300'>
              <div className='p-6 flex flex-col items-center'>
                <div className='w-64 h-64 overflow-hidden bg-white ring-4 ring-purple-100 group-hover:ring-purple-200 transition-all duration-300 shadow-lg mb-6 rounded-xl relative'>
                  <Image
                    src={teamMembers[1].picture}
                    alt={teamMembers[1].name}
                    width={256}
                    height={256}
                    className='object-cover w-full h-full'
                  />
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-1'>
                  {teamMembers[1].name}
                </h3>
                <p className='text-purple-600 font-medium mb-4'>
                  {teamMembers[1].role}
                </p>
                <div className='flex justify-center space-x-4'>
                  <a
                    href={teamMembers[1].github}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                  >
                    <Github className='h-5 w-5' />
                  </a>
                  <a
                    href={teamMembers[1].linkedin}
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

      {/* Values Section */}
      <div className='bg-gray-50 py-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              Our Values
            </h2>
            <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
              The principles that guide everything we do
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {values.map((value, index) => (
              <div
                key={index}
                className='bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:scale-105 hover:shadow-xl transition-all duration-300'
              >
                <div className='w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 flex items-center justify-center mb-4'>
                  {value.icon}
                </div>
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                  {value.title}
                </h3>
                <p className='text-gray-600'>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className='bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 py-16'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-12 text-center'>
            <h2 className='text-3xl font-bold text-white mb-6'>
              Join Us in Transforming Education
            </h2>
            <p className='text-xl text-white/80 mb-8 max-w-2xl mx-auto'>
              Be part of the educational revolution with Smart Campus for MNSUET
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                href='/login'
                className='inline-flex items-center px-8 py-4 rounded-xl bg-white text-purple-600 font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              >
                Get Started
                <ArrowRight className='ml-2 h-5 w-5' />
              </Link>
              <Link
                href='/contact'
                className='inline-flex items-center px-8 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300'
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
