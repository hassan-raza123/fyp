import React from 'react';
import { GraduationCap, Github, Linkedin } from 'lucide-react';
import NavbarClient from '@/components/landing-page/NavbarClient';
import Footer from '@/components/landing-page/Footer';

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary via-primary-light to-primary overflow-hidden">
        <NavbarClient/>
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              About UniAttend
            </h1>
            <p className="text-xl text-purple-100 mb-12 max-w-3xl mx-auto">
              A student-led initiative revolutionizing attendance management in universities
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-16">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-purple-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Curved divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-24 fill-current text-slate-50" viewBox="0 0 1440 74" preserveAspectRatio="none">
            <path d="M456.464 0.0433865C277.158 -1.70575 0 50.0141 0 50.0141V74H1440V50.0141C1440 50.0141 1320.4 31.1925 1243.09 27.0276C1099.33 19.2816 1019.08 53.1981 875.138 50.0141C710.527 46.3727 621.108 1.64949 456.464 0.0433865Z"></path>
          </svg>
        </div>
      </div>

      {/* Goals Section */}
      <div className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {goals.map((goal, index) => (
              <div key={index} 
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-purple-100">
                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-text transition-colors">
                  {goal.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {goal.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
       {/* Team Section */}
       <div className="bg-gradient-to-b from-slate-50 to-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Supervisor Section */}
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Project Supervision
          </h2>
          
          <div className="max-w-2xl mx-auto mt-12">
              <div className="relative">
                <div className="w-40 h-40 rounded-full overflow-hidden bg-white mx-auto ring-4 ring-purple-100 group-hover:ring-purple-200 transition-all duration-300 shadow-lg">
                  <img
                    src={supervisor.picture}
                    alt={`${supervisor.name}'s picture`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            
            <div className="mt-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {supervisor.name}
              </h3>
              <p className="text-primary font-semibold mb-2">
                {supervisor.role}
              </p>
              <p className="text-slate-600 mb-4">
                {supervisor.designation}
                <br />
                {supervisor.department}
                <br />
                
              </p>
              <a
                href={supervisor.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-slate-200 hover:border-purple-200 text-slate-600 hover:text-purple-600 transition-colors shadow-sm"
              >
                <Linkedin className="h-5 w-5 mr-2" />
                <span>Connect on LinkedIn</span>
              </a>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Meet Our Team
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Proud developers and designers behind UniAttend - Building the future of attendance management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-16">
          {teamMembers.map((member, index) => (
            <div 
              key={index} 
              className="group relative"
            >
              <div className="text-center relative transform transition duration-300 group-hover:-translate-y-2">
                <div className="relative mb-6">
                  {/* Glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                  
                  {/* Image container */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-white mx-auto ring-2 ring-purple-100 group-hover:ring-purple-300 transition-all duration-300 shadow-md">
                      <img
                        src={member.picture}
                        alt={`${member.name}'s picture`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-primary text-sm mb-4">{member.role}</p>
                
                {/* Social links */}
                <div className="flex justify-center space-x-3 opacity-70 group-hover:opacity-100 transition-opacity">
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <Github className="h-5 w-5" />
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
     
      {/* Story Section */}
      <div className="bg-gradient-to-b from-slate-50 to-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Our Story
            </h2>
            <p className="text-xl text-slate-600">
              UniAttend began as a final year project at MNS UET Multan, born from our firsthand experience 
              with the challenges of traditional attendance systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 shadow-xl">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                <div className="flex items-center justify-center p-8">
                  <svg className="w-24 h-24 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-6">
                Built by Students, for Students
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                As students ourselves, we understood the pain points of both students and faculty 
                when it came to attendance management. This firsthand experience drove us to create 
                a solution that would make the process seamless and efficient.
              </p>
              <p className="text-slate-600 leading-relaxed">
                What started as a university project has evolved into a comprehensive attendance 
                management system, designed to meet the unique needs of educational institutions 
                while maintaining simplicity and user-friendliness.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
