import Image from 'next/image';
import { BookOpen, Target, Award } from 'lucide-react';

export default function OBEOverviewSection() {
  return (
    <div className='relative py-24 bg-white overflow-hidden'>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 bg-[url('/bg/Applying-to-university-college.jpg')] bg-cover bg-center opacity-15" />
      <div className="absolute inset-0 bg-white/85" />
      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16 animate-fade-in-up'>
          <div className='inline-block px-4 py-2 rounded-full landing-badge font-semibold text-sm mb-4'>
            OUTCOME-BASED EDUCATION
          </div>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            What is OBE?
          </h2>
          <p className='text-xl landing-text-body max-w-3xl mx-auto'>
            A student-centric teaching and learning methodology focused on achieving specific outcomes
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
          {/* Left - Content */}
          <div className='space-y-6 order-2 lg:order-1'>
            <div className='group landing-card rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1'>
              <div className='flex items-start space-x-4'>
                <div className='landing-icon-bg rounded-xl p-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-300'>
                  <Target className='h-6 w-6 text-white' />
                </div>
                <div>
                  <h3 className='text-xl font-bold landing-text-heading mb-2'>
                    Clear Learning Outcomes
                  </h3>
                  <p className='landing-text-body leading-relaxed'>
                    Define specific, measurable learning outcomes that students should achieve by the end of their program
                  </p>
                </div>
              </div>
            </div>

            <div className='group landing-card rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1'>
              <div className='flex items-start space-x-4'>
                <div className='landing-icon-bg rounded-xl p-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-300'>
                  <BookOpen className='h-6 w-6 text-white' />
                </div>
                <div>
                  <h3 className='text-xl font-bold landing-text-heading mb-2'>
                    Student-Centered Approach
                  </h3>
                  <p className='landing-text-body leading-relaxed'>
                    Focus on what students can demonstrate upon completion, ensuring practical knowledge and skills
                  </p>
                </div>
              </div>
            </div>

            <div className='group landing-card rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1'>
              <div className='flex items-start space-x-4'>
                <div className='landing-icon-bg rounded-xl p-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-300'>
                  <Award className='h-6 w-6 text-white' />
                </div>
                <div>
                  <h3 className='text-xl font-bold landing-text-heading mb-2'>
                    Continuous Assessment
                  </h3>
                  <p className='landing-text-body leading-relaxed'>
                    Regular evaluation and feedback to ensure students are meeting the intended learning outcomes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Image */}
          <div className='order-1 lg:order-2'>
            <div className='relative group'>
              <div className='absolute -inset-4 landing-decorative-blur-1 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500'></div>
              <div className='relative landing-card rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-all duration-500'>
                <Image
                  src='/info-images/outcome-based-education-l.webp'
                  alt='Outcome Based Education Overview'
                  width={650}
                  height={650}
                  className='w-full h-auto object-cover'
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

