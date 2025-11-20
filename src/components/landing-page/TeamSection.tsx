import Image from 'next/image';
import { Linkedin, Github } from 'lucide-react';
import { supervisor, teamMembers } from '@/constants/landing-page';

export default function TeamSection() {
  return (
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
  );
}

