import Image from 'next/image';
import { Linkedin, Github, Award } from 'lucide-react';
import { supervisor, teamMembers } from '@/constants/landing-page';

export default function TeamSection() {
  return (
    <div id="team" className='relative py-24 bg-linear-to-b from-slate-50 to-white scroll-mt-20 overflow-hidden'>
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-64 h-64 landing-decorative-blur-1 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 landing-decorative-blur-2 rounded-full blur-3xl"></div>
      </div>

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <span className='inline-block px-4 py-2 rounded-full landing-badge font-semibold text-sm mb-4'>
            OUR TEAM
          </span>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            Meet the Team
          </h2>
          <div className='w-24 h-1.5 brand-gradient mx-auto rounded-full mb-6'></div>
          <p className='text-xl landing-text-body max-w-2xl mx-auto'>
            Dedicated professionals building the future of education
          </p>
        </div>

        {/* Supervisor Card - Featured */}
        <div className='max-w-2xl mx-auto mb-16'>
          <div className='relative group'>
            {/* Glow effect */}
            <div className='absolute -inset-4 brand-gradient rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity'></div>
            
            <div className='relative bg-white rounded-3xl shadow-2xl border-2 border-slate-100 overflow-hidden'>
              <div className='p-8 sm:p-10'>
                <div className='flex flex-col sm:flex-row items-center gap-8'>
                  {/* Photo */}
                  <div className='relative'>
                    <div className='absolute -inset-2 brand-gradient rounded-2xl blur-lg opacity-50'></div>
                    <div className='relative w-32 h-32 rounded-2xl overflow-hidden ring-4 ring-white shadow-xl'>
                      <Image
                        src={supervisor.picture}
                        alt={supervisor.name}
                        width={128}
                        height={128}
                        className='object-cover w-full h-full'
                      />
                    </div>
                    {/* Badge */}
                    <div className='absolute -bottom-2 -right-2 w-10 h-10 brand-gradient rounded-full flex items-center justify-center shadow-lg'>
                      <Award className='w-5 h-5 text-white' />
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className='flex-1 text-center sm:text-left'>
                    <h3 className='text-2xl font-bold landing-text-heading mb-2'>
                      {supervisor.name}
                    </h3>
                    <p className='text-brand-primary font-semibold mb-2'>
                      {supervisor.role}
                    </p>
                    <p className='landing-text-body text-sm mb-6'>
                      {supervisor.designation}
                    </p>
                    <a
                      href={supervisor.linkedin}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center px-6 py-3 rounded-xl brand-gradient text-white font-semibold hover:scale-105 transition-all duration-300 shadow-lg'
                    >
                      <Linkedin className='w-5 h-5 mr-2' />
                      Connect on LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6'>
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className='group bg-white rounded-2xl p-6 border-2 border-slate-100 hover:border-brand-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-2'
            >
              <div className='relative mb-4'>
                <div className='absolute -inset-1 brand-gradient rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity'></div>
                <div className='relative w-full aspect-square rounded-xl overflow-hidden ring-2 ring-slate-100 group-hover:ring-brand-primary transition-all'>
                  <Image
                    src={member.picture}
                    alt={member.name}
                    width={200}
                    height={200}
                    className='object-cover w-full h-full'
                  />
                </div>
              </div>
              
              <h3 className='text-sm font-bold landing-text-heading mb-1 text-center'>
                {member.name}
              </h3>
              <p className='text-brand-primary text-xs font-semibold mb-4 text-center'>
                {member.role}
              </p>
              
              <div className='flex justify-center gap-2'>
                <a
                  href={member.github}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all duration-300'
                >
                  <Github className='w-4 h-4' />
                </a>
                <a
                  href={member.linkedin}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='p-2 rounded-lg landing-badge hover:bg-brand-primary hover:text-white transition-all duration-300'
                  style={{ background: 'var(--badge-bg)', color: 'var(--badge-text)' }}
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
