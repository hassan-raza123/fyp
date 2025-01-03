import React from 'react';
import Footer from '../components/Footer';
import NavbarClient from '../components/NavbarClient';
import { GraduationCap, Github, Linkedin } from 'lucide-react';

const supervisor = {
  name: 'Mr. Abdul Basit',
  role: 'Project Supervisor',
  designation: 'Associate Professor',
  department: 'Computer Science Department',
  linkedin: 'https://linkedin.com/in/supervisor',
  picture: '/team/supervisor.png',
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
    picture: '/images/talha.jpg',
  },
  {
    name: 'Muhammad Ahmar',
    role: 'Backend Developer',
    github: 'https://github.com/member3',
    linkedin: 'https://linkedin.com/in/member3',
    picture: '/images/ahmar.jpg',
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
    picture: '/images/zohaib.jpg',
  },
];

const goals = [
  {
    title: 'Our Mission',
    description:
      'To revolutionize attendance management in educational institutions through innovative technology and user-centric design.',
  },
  {
    title: 'Our Vision',
    description:
      'To become the leading attendance management solution for educational institutions worldwide, setting new standards for efficiency and reliability.',
  },
  {
    title: 'Our Values',
    description:
      "Innovation, reliability, and user experience drive everything we do. We're committed to continuous improvement and excellence in service.",
  },
];

const stats = [
  { value: '5+', label: 'Team Members' },
  { value: '1000+', label: 'Hours Invested' },
  { value: '100+', label: 'Features' },
  { value: '24/7', label: 'Support' },
];

export default function About() {
  return (
    <div className='min-h-screen bg-white'>
      {/* Header Section */}
      <div className='relative bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900'>
        <NavbarClient />
        <div className='absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]' />
        <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20'>
          <div className='text-center'>
            <h1 className='text-4xl md:text-6xl font-bold text-white mb-6'>
              About UniAttend
            </h1>
            <p className='text-xl text-indigo-100 mb-10 max-w-3xl mx-auto'>
              A student-led initiative to transform attendance management in
              universities
            </p>
          </div>

          {/* Stats Grid */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-16'>
            {stats.map((stat, index) => (
              <div key={index} className='text-center'>
                <div className='text-4xl font-bold text-white mb-2'>
                  {stat.value}
                </div>
                <div className='text-indigo-200'>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Wave SVG */}
        <div className='absolute bottom-0 left-0 right-0'>
          <svg
            viewBox='0 0 1440 120'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M0 30L48 35C96 40 192 50 288 55C384 60 480 60 576 55C672 50 768 40 864 45C960 50 1056 70 1152 75C1248 80 1344 70 1392 65L1440 60V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V30Z'
              fill='white'
            />
          </svg>
        </div>
      </div>

      {/* Goals Section */}
      <div className='py-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {goals.map((goal, index) => (
              <div
                key={index}
                className='bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100'
              >
                <h3 className='text-2xl font-bold text-gray-900 mb-4'>
                  {goal.title}
                </h3>
                <p className='text-gray-600 leading-relaxed'>
                  {goal.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className='bg-white py-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Supervisor Section */}
          <div className='text-center mb-16'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              Project Supervision
            </h2>
          </div>

          <div className='mb-20'>
            <div className='max-w-2xl mx-auto text-center'>
              <div className='mb-6'>
                <div className='w-40 h-40 rounded-full overflow-hidden bg-gray-100 mx-auto ring-4 ring-indigo-100'>
                  <img
                    src={supervisor.picture}
                    alt={`${supervisor.name}'s picture`}
                    className='w-full h-full object-cover'
                  />
                </div>
              </div>
              <h3 className='text-2xl font-bold text-gray-900 mb-2'>
                {supervisor.name}
              </h3>
              <p className='text-indigo-600 font-semibold mb-2'>
                {supervisor.role}
              </p>
              <p className='text-gray-600 mb-4'>
                {supervisor.designation}
                <br />
                {supervisor.department}
                <br />
                MNS University of Engineering & Technology, Multan
              </p>
              <a
                href={supervisor.linkedin}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors'
              >
                <Linkedin className='h-5 w-5 mr-2' />
                <span>Connect on LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Team Section */}
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>
              Meet Our Team
            </h2>
            <p className='text-gray-600 max-w-2xl mx-auto'>
              Proud developers and designers behind UniAttend - Building the
              future of attendance management
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-16'>
            {teamMembers.map((member, index) => (
              <div key={index} className='text-center group'>
                <div className='mb-4'>
                  <div className='w-32 h-32 rounded-full overflow-hidden bg-gray-100 mx-auto ring-2 ring-indigo-100 group-hover:ring-indigo-400 transition-all'>
                    <img
                      src={member.picture}
                      alt={`${member.name}'s picture`}
                      className='w-full h-full object-cover'
                    />
                  </div>
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-1'>
                  {member.name}
                </h3>
                <p className='text-indigo-600 text-sm mb-3'>{member.role}</p>
                <div className='flex justify-center space-x-3'>
                  <a
                    href={member.github}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-gray-400 hover:text-gray-600 transition-colors'
                  >
                    <Github className='h-5 w-5' />
                  </a>
                  <a
                    href={member.linkedin}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-gray-400 hover:text-gray-600 transition-colors'
                  >
                    <Linkedin className='h-5 w-5' />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className='bg-gradient-to-b from-gray-50 to-white py-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='max-w-3xl mx-auto text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
              Our Story
            </h2>
            <p className='text-xl text-gray-600'>
              UniAttend began as a final year project at MNS UET Multan, born
              from our firsthand experience with the challenges of traditional
              attendance systems.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-16 items-center'>
            <div>
              <div className='relative rounded-2xl overflow-hidden'>
                <div className='aspect-w-16 aspect-h-9 bg-gradient-to-br from-indigo-500 to-indigo-700'>
                  <div className='flex items-center justify-center'>
                    <GraduationCap className='h-24 w-24 text-white' />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className='text-2xl font-bold text-gray-900 mb-6'>
                Built by Students, for Students
              </h3>
              <p className='text-gray-600 mb-6 leading-relaxed'>
                As students ourselves, we understood the pain points of both
                students and faculty when it came to attendance management. This
                firsthand experience drove us to create a solution that would
                make the process seamless and efficient.
              </p>
              <p className='text-gray-600 leading-relaxed'>
                What started as a university project has evolved into a
                comprehensive attendance management system, designed to meet the
                unique needs of educational institutions while maintaining
                simplicity and user-friendliness.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
