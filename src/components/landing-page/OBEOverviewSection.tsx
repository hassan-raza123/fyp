import Image from 'next/image';
import { BookOpen, Target, Award } from 'lucide-react';

export default function OBEOverviewSection() {
  return (
    <div className='py-24 bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <span className='inline-block px-4 py-2 rounded-full landing-badge font-semibold text-sm mb-4'>
            OUTCOME-BASED EDUCATION
          </span>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            What is OBE?
          </h2>
          <p className='text-xl landing-text-body max-w-2xl mx-auto'>
            A student-centric methodology focused on achieving specific learning outcomes
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
          {/* Left - Content */}
          <div className='space-y-6'>
            {[
              { icon: Target, title: 'Clear Learning Outcomes', desc: 'Define specific, measurable outcomes students should achieve' },
              { icon: BookOpen, title: 'Student-Centered Approach', desc: 'Focus on practical knowledge and demonstrable skills' },
              { icon: Award, title: 'Continuous Assessment', desc: 'Regular evaluation to ensure outcome achievement' }
            ].map((item, idx) => (
              <div key={idx} className='flex items-start space-x-4 p-6 rounded-xl hover:bg-slate-50 transition-colors duration-300'>
                <div className='w-12 h-12 rounded-lg brand-gradient flex items-center justify-center shrink-0 shadow-md'>
                  <item.icon className='h-6 w-6 text-white' />
                </div>
                <div>
                  <h3 className='text-lg font-bold landing-text-heading mb-2'>{item.title}</h3>
                  <p className='landing-text-body text-sm'>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right - Image */}
          <div className='relative'>
            <div className='absolute inset-0 bg-linear-to-br from-blue-100 to-cyan-100 rounded-3xl transform rotate-3'></div>
            <div className='relative bg-white rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-100'>
              <Image
                src='/info-images/outcome-based-education-l.webp'
                alt='Outcome Based Education'
                width={650}
                height={650}
                className='w-full h-auto'
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
