'use client';

import { features } from '@/constants/landing-page';

export default function FeaturesSection() {
  return (
    <div
      id="modules"
      className='relative bg-fixed bg-center bg-cover scroll-mt-20'
      style={{ backgroundImage: "url('/bg/Newroom-Summer-Graduation-2023.webp')" }}
    >
      <div className='bg-linear-to-b from-black/50 via-black/40 to-black/55'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24'>
          {/* Section Header */}
          <div className='text-center mb-16'>
            <span className='inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur text-sm font-semibold mb-4 text-white'>
              SYSTEM MODULES
            </span>
            <h2 className='text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight'>
              Powerful Features for Complete OBE
            </h2>
            <p className='text-xl text-indigo-100 max-w-2xl mx-auto'>
              Everything you need to implement, track, and report outcome-based education seamlessly
            </p>
          </div>

          {/* Features Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className='group bg-white/15 border border-white/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl hover:bg-white/20 transition-all duration-300'
                >
                  {/* Icon */}
                  <div className='w-16 h-16 bg-brand-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg'>
                    <IconComponent className='h-8 w-8 text-white' />
                  </div>

                  <h3 className='text-xl font-bold text-white mb-3'>
                    {feature.title}
                  </h3>
                  <p className='text-indigo-100 text-sm leading-relaxed'>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
