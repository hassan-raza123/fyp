import Image from 'next/image';
import { GitBranch, Target, Award, BarChart3 } from 'lucide-react';

const mappingFeatures = [
  {
    icon: Target,
    title: 'CLO (Course Learning Outcomes)',
    description: 'Specific knowledge and skills students gain from individual courses',
    color: 'bg-blue-500'
  },
  {
    icon: GitBranch,
    title: 'PLO (Program Learning Outcomes)',
    description: 'Broader competencies expected upon program completion',
    color: 'bg-purple-500'
  },
  {
    icon: Award,
    title: 'Attainment Tracking',
    description: 'Monitor and measure achievement of learning outcomes',
    color: 'bg-green-500'
  },
  {
    icon: BarChart3,
    title: 'Data Analysis',
    description: 'Generate comprehensive reports and analytics',
    color: 'bg-orange-500'
  }
];

export default function MappingProcessSection() {
  return (
    <div className='relative py-24 landing-section-gradient overflow-hidden'>
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('/bg/uni-connect-evaluation-reports.jpg')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/90 via-blue-50/90 to-slate-50/90" />
      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <div className='inline-block px-4 py-2 rounded-full landing-badge font-semibold text-sm mb-4'>
            CLO-PLO MAPPING
          </div>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            Outcome Mapping Process
          </h2>
          <p className='text-xl landing-text-body max-w-3xl mx-auto'>
            Systematic mapping of Course Learning Outcomes to Program Learning Outcomes
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16'>
          {/* Left - Mapping Features */}
          <div className='space-y-6 order-2 lg:order-1'>
            {mappingFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className='group landing-card rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1'
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className='flex items-start space-x-4'>
                    <div className={`${feature.color} rounded-xl p-3 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <IconComponent className='h-6 w-6 text-white' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='text-xl font-bold landing-text-heading mb-2'>
                        {feature.title}
                      </h3>
                      <p className='landing-text-body leading-relaxed'>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right - Mapping Process Image */}
          <div className='order-1 lg:order-2'>
            <div className='relative group'>
              <div className='absolute -inset-4 landing-decorative-blur-2 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500'></div>
              <div className='relative landing-card rounded-3xl overflow-hidden shadow-2xl transform group-hover:scale-105 transition-all duration-500'>
                <Image
                  src='/info-images/CO-PO-Mapping-Process.jpg'
                  alt='CLO-PLO Mapping Process'
                  width={800}
                  height={600}
                  className='w-full h-auto object-cover'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='landing-card rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2'>
            <div className='text-5xl font-extrabold landing-stat-value mb-2'>
              100%
            </div>
            <p className='landing-text-body font-semibold'>
              Automated Mapping
            </p>
          </div>
          <div className='landing-card rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2'>
            <div className='text-5xl font-extrabold landing-stat-value mb-2'>
              Real-time
            </div>
            <p className='landing-text-body font-semibold'>
              Attainment Tracking
            </p>
          </div>
          <div className='landing-card rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl transition-all duration-500 hover:-translate-y-2'>
            <div className='text-5xl font-extrabold landing-stat-value mb-2'>
              Instant
            </div>
            <p className='landing-text-body font-semibold'>
              Report Generation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

