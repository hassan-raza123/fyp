import Image from 'next/image';
import { Workflow, RefreshCw, ClipboardCheck, FileCheck, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: Workflow,
    number: '01',
    title: 'Plan',
    description: 'Define learning outcomes and curriculum structure',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: ClipboardCheck,
    number: '02',
    title: 'Do',
    description: 'Implement curriculum and conduct assessments',
    color: 'from-purple-500 to-blue-500'
  },
  {
    icon: FileCheck,
    number: '03',
    title: 'Check',
    description: 'Measure student performance and outcomes',
    color: 'from-cyan-500 to-teal-500'
  },
  {
    icon: RefreshCw,
    number: '04',
    title: 'Act',
    description: 'Improve based on analysis and feedback',
    color: 'from-blue-500 to-indigo-500'
  }
];

export default function OBEFrameworkSection() {
  return (
    <div className='py-24 bg-linear-to-b from-white via-slate-50 to-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <span className='inline-block px-4 py-2 rounded-full landing-badge font-semibold text-sm mb-4'>
            PDCA FRAMEWORK
          </span>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            How OBE Works
          </h2>
          <div className='w-24 h-1.5 brand-gradient mx-auto rounded-full mb-6'></div>
          <p className='text-xl landing-text-body max-w-2xl mx-auto'>
            A systematic approach following the Plan-Do-Check-Act cycle
          </p>
        </div>

        {/* Framework Diagram */}
        <div className='mb-16 max-w-4xl mx-auto'>
          <div className='relative group'>
            <div className='absolute -inset-4 brand-gradient rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity'></div>
            <div className='relative bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-100 p-8'>
              <Image
                src='/info-images/Outcome-based-education-OBE-framework-consistency-with-PDCAPlan-Do-Check-Act-principle.png'
                alt='OBE Framework'
                width={1200}
                height={800}
                className='w-full h-auto'
              />
            </div>
          </div>
        </div>

        {/* Steps Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div
                key={index}
                className='relative group'
              >
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className='hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-linear-to-r from-[#a89fce] to-transparent z-0'></div>
                )}
                
                <div className='relative bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-100 hover:border-brand-primary hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 h-full'>
                  {/* Step Number */}
                  <div className='text-6xl font-black text-slate-100 mb-4'>
                    {step.number}
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${step.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <IconComponent className='w-7 h-7 text-white' />
                  </div>
                  
                  <h3 className='text-xl font-bold landing-text-heading mb-3'>
                    {step.title}
                  </h3>
                  <p className='landing-text-body text-sm leading-relaxed'>
                    {step.description}
                  </p>

                  {/* Hover Arrow */}
                  <div className='mt-4 opacity-0 group-hover:opacity-100 transition-opacity'>
                    <ArrowRight className='w-5 h-5 text-brand-primary' />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
