import { features } from '@/constants/landing-page';

export default function FeaturesSection() {
  return (
    <div id="modules" className='relative py-24 bg-white scroll-mt-20 overflow-hidden'>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 bg-[url('/bg/istockphoto-1480277406-612x612.jpg')] bg-cover bg-center opacity-15" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/85 to-white/90" />
      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-16'>
          <div className='inline-block px-4 py-2 rounded-full landing-badge font-semibold text-sm mb-4'>
            SYSTEM MODULES
          </div>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            Comprehensive OBE Features
          </h2>
          <p className='text-xl landing-text-body max-w-3xl mx-auto'>
            Everything you need for effective outcome-based education management
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className='group landing-card-gradient rounded-2xl shadow-lg p-8 border border-slate-200 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1'
              >
                <div className='w-14 h-14 rounded-xl landing-icon-bg flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300'>
                  <IconComponent className='h-6 w-6 text-white' />
                </div>
                <h3 className='text-xl font-bold landing-text-heading mb-3'>
                  {feature.title}
                </h3>
                <p className='landing-text-body leading-relaxed'>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
