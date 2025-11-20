import { features } from '@/constants/landing-page';

export default function FeaturesSection() {
  return (
    <div id="modules" className='py-24 bg-white scroll-mt-20'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-16'>
          <div className='inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-900 font-semibold text-sm mb-4'>
            SYSTEM MODULES
          </div>
          <h2 className='text-4xl md:text-5xl font-extrabold text-slate-900 mb-4'>
            Comprehensive OBE Features
          </h2>
          <p className='text-xl text-slate-600 max-w-3xl mx-auto'>
            Everything you need for effective outcome-based education management
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className='group bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg p-8 border border-slate-200 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1'
              >
                <div className='w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300'>
                  <IconComponent className='h-6 w-6 text-white' />
                </div>
                <h3 className='text-xl font-bold text-slate-900 mb-3'>
                  {feature.title}
                </h3>
                <p className='text-slate-600 leading-relaxed'>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

