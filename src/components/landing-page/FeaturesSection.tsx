import { features } from '@/constants/landing-page';

export default function FeaturesSection() {
  return (
    <div id="modules" className='py-24 bg-linear-to-b from-white to-slate-50 scroll-mt-20'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <span className='inline-block px-4 py-2 rounded-full landing-badge font-semibold text-sm mb-4'>
            FEATURES
          </span>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            System Features
          </h2>
          <p className='text-xl landing-text-body max-w-2xl mx-auto'>
            Comprehensive tools for managing Outcome-Based Education at MNS UET
          </p>
        </div>

        {/* Features Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className='group bg-white rounded-2xl p-8 border border-slate-200 hover:border-brand-primary hover:shadow-xl transition-all duration-300'
              >
                {/* Icon with unified gradient */}
                <div className='w-14 h-14 rounded-xl brand-gradient flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg'>
                  <IconComponent className='h-7 w-7 text-white' />
                </div>
                
                <h3 className='text-xl font-bold landing-text-heading mb-3 group-hover:text-brand-primary transition-colors'>
                  {feature.title}
                </h3>
                <p className='landing-text-body leading-relaxed'>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
