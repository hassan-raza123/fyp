import Image from 'next/image';
import Link from 'next/link';
import { GitBranch, Target, Award, BarChart3, Zap, ArrowRight } from 'lucide-react';

const mappingFeatures = [
  {
    icon: Target,
    title: 'CLO Mapping',
    description: 'Course-specific learning outcomes',
    stats: '100+ CLOs',
    color: 'var(--brand-primary)'
  },
  {
    icon: GitBranch,
    title: 'PLO Alignment',
    description: 'Program-level outcome mapping',
    stats: 'Real-time',
    color: 'var(--brand-primary-light)'
  },
  {
    icon: Award,
    title: 'Attainment',
    description: 'Track achievement metrics',
    stats: '99% Accuracy',
    color: 'var(--brand-secondary)'
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Comprehensive reporting',
    stats: 'Instant',
    color: 'var(--brand-secondary-light)'
  }
];

export default function MappingProcessSection() {
  return (
    <div className='py-24 bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <span className='inline-block px-4 py-2 rounded-full landing-badge font-semibold text-sm mb-4'>
            CLO-PLO MAPPING
          </span>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            Powerful Outcome Mapping
          </h2>
          <div className='w-24 h-1.5 brand-gradient mx-auto rounded-full mb-6'></div>
          <p className='text-xl landing-text-body max-w-2xl mx-auto'>
            Seamlessly map course outcomes to program objectives
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16'>
          {/* Left - Image */}
          <div className='relative'>
            <div className='absolute -inset-4 brand-gradient rounded-3xl blur-2xl opacity-20'></div>
            <div className='relative bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-100 transform hover:scale-105 transition-all duration-500'>
              <Image
                src='/info-images/CO-PO-Mapping-Process.jpg'
                alt='CLO-PLO Mapping'
                width={800}
                height={600}
                className='w-full h-auto'
              />
            </div>
          </div>

          {/* Right - Features */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {mappingFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className='group bg-white rounded-2xl p-6 border-2 border-slate-100 hover:border-brand-primary hover:shadow-xl transition-all duration-300'
                >
                  <div
                    className='w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform'
                    style={{ background: feature.color }}
                  >
                    <IconComponent className='w-6 h-6 text-white' />
                  </div>
                  <div className='text-sm font-bold text-brand-primary mb-1'>{feature.stats}</div>
                  <h3 className='text-lg font-bold landing-text-heading mb-2'>
                    {feature.title}
                  </h3>
                  <p className='landing-text-body text-sm'>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA Card */}
        <div className='relative overflow-hidden brand-gradient rounded-3xl p-12 shadow-2xl'>
          <div className='absolute inset-0 bg-[url("/grid.svg")] opacity-10'></div>
          <div className='relative max-w-3xl mx-auto text-center'>
            <Zap className='w-16 h-16 text-white mx-auto mb-6' />
            <h3 className='text-3xl font-bold text-white mb-4'>
              Automated Outcome Tracking
            </h3>
            <p className='text-indigo-100 text-lg mb-8'>
              Let EduTrack handle the complexity while you focus on teaching excellence
            </p>
            <Link
              href='/#contact'
              className='inline-flex items-center px-8 py-4 rounded-xl bg-white text-brand-primary font-bold hover:bg-[#f4f1ff] transition-all duration-300 shadow-xl'
            >
              Learn More
              <ArrowRight className='ml-2 w-5 h-5' />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
