import Image from 'next/image';
import { Workflow, RefreshCw, ClipboardCheck, FileCheck } from 'lucide-react';

const steps = [
  {
    icon: Workflow,
    number: '01',
    title: 'Plan',
    description: 'Define Program Learning Outcomes (PLOs) and Course Learning Outcomes (CLOs)'
  },
  {
    icon: ClipboardCheck,
    number: '02',
    title: 'Do',
    description: 'Implement curriculum, deliver instruction, and conduct assessments'
  },
  {
    icon: FileCheck,
    number: '03',
    title: 'Check',
    description: 'Measure and evaluate student performance against defined outcomes'
  },
  {
    icon: RefreshCw,
    number: '04',
    title: 'Act',
    description: 'Analyze results and make improvements to teaching and curriculum'
  }
];

export default function OBEFrameworkSection() {
  return (
    <div className='relative py-24 bg-white overflow-hidden'>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/info-images/photo1.png')] bg-cover bg-center opacity-3 blur-sm" />
      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <div className='inline-block px-4 py-2 rounded-full landing-badge font-semibold text-sm mb-4'>
            PDCA CYCLE
          </div>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            OBE Framework
          </h2>
          <p className='text-xl landing-text-body max-w-3xl mx-auto'>
            A systematic approach following the Plan-Do-Check-Act principle for continuous improvement
          </p>
        </div>

        {/* Framework Image */}
        <div className='mb-16'>
          <div className='relative group max-w-5xl mx-auto'>
            <div className='absolute -inset-4 landing-decorative-blur-1 rounded-3xl blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500'></div>
            <div className='relative landing-card rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-[1.02] transition-all duration-500'>
              <Image
                src='/info-images/Outcome-based-education-OBE-framework-consistency-with-PDCAPlan-Do-Check-Act-principle.png'
                alt='OBE Framework - PDCA Cycle'
                width={1200}
                height={800}
                className='w-full h-auto object-contain bg-white p-8'
              />
            </div>
          </div>
        </div>

        {/* Steps Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div
                key={index}
                className='group relative landing-card rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2'
              >
                {/* Step Number Background */}
                <div className='absolute top-4 right-4 text-7xl font-black text-blue-50 group-hover:text-blue-100 transition-colors duration-300'>
                  {step.number}
                </div>
                
                <div className='relative z-10'>
                  <div className='landing-icon-bg rounded-xl p-3 w-14 h-14 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300'>
                    <IconComponent className='h-6 w-6 text-white' />
                  </div>
                  <h3 className='text-2xl font-bold landing-text-heading mb-3'>
                    {step.title}
                  </h3>
                  <p className='landing-text-body text-sm leading-relaxed'>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

