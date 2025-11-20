'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Bell,
  PieChart,
  FileBarChart,
  Shield,
  ArrowRight,
  CheckCircle,
  Book,
  GraduationCap,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import Footer from '@/components/landing-page/Footer';
import NavbarClient from '@/components/landing-page/NavbarClient';
import ContactForm from '@/components/forms/ContactForm';

const features = [
  {
    icon: <Users className='h-6 w-6' />,
    title: 'User Management',
    description:
      'Comprehensive management for students, faculty, and administrators',
  },
  {
    icon: <Book className='h-6 w-6' />,
    title: 'Academic Structure',
    description: 'Programs, courses, batches, sections, and course offerings',
  },
  {
    icon: <FileBarChart className='h-6 w-6' />,
    title: 'Assessments',
    description: 'Complete assessment management with CLO/PLO mapping',
  },
  {
    icon: <CheckCircle className='h-6 w-6' />,
    title: 'Results & Grading',
    description: 'Marks entry, result evaluation, and transcript generation',
  },
  {
    icon: <PieChart className='h-6 w-6' />,
    title: 'OBE Analytics',
    description: 'CLO/PLO/LLO attainment tracking and outcome analysis',
  },
  {
    icon: <Bell className='h-6 w-6' />,
    title: 'Reports & Notifications',
    description: 'Comprehensive reports and real-time notifications',
  },
];

const statistics = [
  { value: '5000+', label: 'Students' },
  { value: '200+', label: 'Faculty Members' },
  { value: '50+', label: 'Programs' },
];

const userRoles = [
  {
    icon: <GraduationCap className='h-8 w-8 text-primary' />,
    title: 'Admin Portal',
    description: 'Complete control over academic operations',
    features: [
      'Manage students, faculty & programs',
      'Configure courses & offerings',
      'Monitor CLO/PLO attainments',
      'Generate comprehensive reports',
    ],
  },
  {
    icon: <Book className='h-8 w-8 text-primary' />,
    title: 'Faculty Portal',
    description: 'Efficient tools for teaching and assessment',
    features: [
      'Manage course sections',
      'Create & grade assessments',
      'Track student performance',
      'View CLO/PLO analytics',
    ],
  },
  {
    icon: <Users className='h-8 w-8 text-primary' />,
    title: 'Student Portal',
    description: 'Access to academic information',
    features: [
      'View enrolled courses',
      'Check assessment results',
      'Track CLO/PLO progress',
      'Download transcript',
    ],
  },
];

const supervisor = {
  name: 'Mr. Abdul Basit',
  role: 'Project Supervisor',
  designation: 'Lecturer, Computer Science Department',
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

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50'>
      {/* Hero Section */}
      <div className='relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 overflow-hidden'>
        <NavbarClient />
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/50 to-transparent" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />

        <div className='relative max-w-7xl mx-auto px-4 pt-32 pb-48 sm:px-6 lg:px-8'>
          <div className='max-w-4xl mx-auto text-center'>
            <div className='inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-8 shadow-lg'>
              <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
              <span className='text-white text-sm font-semibold tracking-wide'>
                OBE Management System
              </span>
            </div>

            <h1 className='text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight'>
              Smart Academic
              <span className='block bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-300 bg-clip-text text-transparent mt-2'>
                Management System
              </span>
            </h1>

            <p className='text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed'>
              Comprehensive Outcome-Based Education platform for academic excellence at 
              <span className='font-semibold text-white'> MNS University of Engineering & Technology</span>
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                href='/login'
                className='group inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-blue-900 font-bold text-lg hover:bg-blue-50 transition-all duration-300 shadow-2xl hover:shadow-white/20 hover:scale-105'
              >
                Access Portal
                <ArrowRight className='ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform' />
              </Link>
              <Link
                href='/#modules'
                className='group inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/10 backdrop-blur-xl border-2 border-white/30 text-white font-bold text-lg hover:bg-white/20 transition-all duration-300'
              >
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div id="stats" className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 mb-20 relative z-10 scroll-mt-20'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {statistics.map((stat, index) => (
            <div
              key={index}
              className='group bg-white rounded-2xl shadow-xl p-8 border border-slate-200 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-2'
            >
              <div className='text-5xl font-extrabold bg-gradient-to-br from-blue-900 to-blue-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform'>
                {stat.value}
              </div>
              <div className='text-slate-600 font-semibold text-lg'>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div id="modules" className='py-24 bg-white scroll-mt-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <div className='inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-900 font-semibold text-sm mb-4'>
              SYSTEM MODULES
            </div>
            <h2 className='text-4xl md:text-5xl font-extrabold text-slate-900 mb-4'>
              Comprehensive OBE Features
            </h2>
            <p className='text-xl text-slate-600 max-w-3xl mx-auto'>
              Everything you need for effective outcome-based education management
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {features.map((feature, index) => (
              <div
                key={index}
                className='group bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg p-8 border border-slate-200 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1'
              >
                <div className='w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300'>
                  <div className='text-white'>
                    {feature.icon}
                  </div>
                </div>
                <h3 className='text-xl font-bold text-slate-900 mb-3'>
                  {feature.title}
                </h3>
                <p className='text-slate-600 leading-relaxed'>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Roles Section */}
      <div id="portals" className='py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 scroll-mt-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <div className='inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-900 font-semibold text-sm mb-4'>
              USER PORTALS
            </div>
            <h2 className='text-4xl md:text-5xl font-extrabold text-slate-900 mb-4'>
              Three Dedicated Interfaces
            </h2>
            <p className='text-xl text-slate-600 max-w-3xl mx-auto'>
              Specialized dashboards designed for each user role
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {userRoles.map((role, index) => (
              <div
                key={index}
                className='group bg-white rounded-2xl shadow-xl p-8 border-2 border-slate-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2'
              >
                <div className='mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300'>
                  <div className='text-white'>
                    {role.icon}
                  </div>
                </div>
                <h3 className='text-2xl font-bold text-slate-900 mb-3'>
                  {role.title}
                </h3>
                <p className='text-slate-600 mb-6 leading-relaxed'>{role.description}</p>
                <ul className='space-y-3'>
                  {role.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className='flex items-start text-slate-700'
                    >
                      <CheckCircle className='h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5' />
                      <span className='text-sm font-medium'>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div id="team" className='py-24 bg-white scroll-mt-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <div className='inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-900 font-semibold text-sm mb-4'>
              PROJECT TEAM
            </div>
            <h2 className='text-4xl md:text-5xl font-extrabold text-slate-900 mb-4'>
              Development Team
            </h2>
            <p className='text-xl text-slate-600 max-w-3xl mx-auto'>
              Final Year Project - Computer Science Department, MNS UET
            </p>
          </div>

          {/* Supervisor */}
          <div className='max-w-md mx-auto mb-16'>
            <div className='group bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-8 border-2 border-blue-200 hover:shadow-3xl transition-all duration-300'>
              <div className='flex flex-col items-center text-center'>
                <div className='w-36 h-36 rounded-2xl overflow-hidden mb-6 shadow-xl ring-4 ring-blue-100 group-hover:ring-blue-300 transition-all'>
                  <Image
                    src={supervisor.picture}
                    alt={supervisor.name}
                    width={144}
                    height={144}
                    className='object-cover w-full h-full'
                  />
                </div>
                <h3 className='text-2xl font-extrabold text-slate-900 mb-2'>
                  {supervisor.name}
                </h3>
                <p className='text-blue-700 font-bold mb-2'>
                  {supervisor.role}
                </p>
                <p className='text-slate-600 text-sm mb-6'>
                  {supervisor.designation}
                </p>
                <a
                  href={supervisor.linkedin}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl'
                >
                  <Linkedin className='h-5 w-5 mr-2' />
                  LinkedIn
                </a>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6'>
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className='group bg-white rounded-2xl shadow-lg p-6 border-2 border-slate-200 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2'
              >
                <div className='flex flex-col items-center text-center'>
                  <div className='w-28 h-28 rounded-xl overflow-hidden mb-4 shadow-lg ring-2 ring-slate-200 group-hover:ring-blue-300 transition-all'>
                    <Image
                      src={member.picture}
                      alt={member.name}
                      width={112}
                      height={112}
                      className='object-cover w-full h-full'
                    />
                  </div>
                  <h3 className='text-base font-bold text-slate-900 mb-1'>
                    {member.name}
                  </h3>
                  <p className='text-blue-600 text-sm font-semibold mb-4'>
                    {member.role}
                  </p>
                  <div className='flex space-x-2'>
                    <a
                      href={member.github}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='p-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-800 hover:text-white transition-all duration-300'
                    >
                      <Github className='h-4 w-4' />
                    </a>
                    <a
                      href={member.linkedin}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='p-2.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white transition-all duration-300'
                    >
                      <Linkedin className='h-4 w-4' />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div id="contact" className='py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 scroll-mt-20'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <div className='inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-900 font-semibold text-sm mb-4'>
              GET IN TOUCH
            </div>
            <h2 className='text-4xl md:text-5xl font-extrabold text-slate-900 mb-4'>
              Contact Us
            </h2>
            <p className='text-xl text-slate-600 max-w-3xl mx-auto'>
              Have questions about the system? We're here to help
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Contact Form */}
            <div className='bg-white rounded-2xl shadow-2xl p-8 border-2 border-slate-200 hover:border-blue-300 transition-all duration-300'>
              <div className='w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mb-6 shadow-lg'>
                <Mail className='h-7 w-7 text-white' />
              </div>
              <h3 className='text-2xl font-bold text-slate-900 mb-6'>
                Send us a Message
              </h3>
              <ContactForm />
            </div>

            {/* Contact Information */}
            <div className='bg-white rounded-2xl shadow-2xl p-8 border-2 border-slate-200 hover:border-blue-300 transition-all duration-300'>
              <div className='w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mb-6 shadow-lg'>
                <MapPin className='h-7 w-7 text-white' />
              </div>
              <h3 className='text-2xl font-bold text-slate-900 mb-6'>
                Contact Information
              </h3>
              <div className='space-y-6'>
                <div className='flex items-start space-x-3'>
                  <div className='p-2 bg-blue-50 rounded-lg mt-1'>
                    <MapPin className='h-5 w-5 text-blue-900' />
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-900 mb-1'>Location</h4>
                    <p className='text-slate-600 text-sm'>
                      MNS University of Engineering and Technology
                      <br />
                      Multan, Pakistan
                    </p>
                  </div>
                </div>
                <div className='flex items-start space-x-3'>
                  <div className='p-2 bg-blue-50 rounded-lg mt-1'>
                    <Mail className='h-5 w-5 text-blue-900' />
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-900 mb-1'>Email</h4>
                    <a
                      href='mailto:itzhassanraza276@gmail.com'
                      className='text-slate-600 hover:text-blue-900 transition-colors text-sm'
                    >
                      itzhassanraza276@gmail.com
                    </a>
                  </div>
                </div>
                <div className='flex items-start space-x-3'>
                  <div className='p-2 bg-blue-50 rounded-lg mt-1'>
                    <Phone className='h-5 w-5 text-blue-900' />
                  </div>
                  <div>
                    <h4 className='font-semibold text-slate-900 mb-1'>Phone</h4>
                    <p className='text-slate-600 text-sm'>+92 (123) 456-7890</p>
                  </div>
                </div>

                {/* Note */}
                <div className='mt-8 bg-blue-50 rounded-lg p-4'>
                  <p className='text-slate-600 text-xs leading-relaxed'>
                    This system is developed as a Final Year Project for MNS University 
                    of Engineering and Technology by the Computer Science Department.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className='bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 py-24 relative overflow-hidden'>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center'>
          <h2 className='text-4xl md:text-5xl font-extrabold text-white mb-6'>
            Ready to Get Started?
          </h2>
          <p className='text-xl text-blue-100 mb-10 max-w-2xl mx-auto'>
            Access your portal with your credentials
          </p>
          <Link
            href='/login'
            className='group inline-flex items-center justify-center px-10 py-5 rounded-xl bg-white text-blue-900 font-bold text-lg hover:bg-blue-50 transition-all duration-300 shadow-2xl hover:shadow-white/20 hover:scale-105'
          >
            Login to Portal
            <ArrowRight className='ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform' />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
