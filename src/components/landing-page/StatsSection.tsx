import { statistics } from '@/constants/landing-page';

export default function StatsSection() {
  return (
    <div id="stats" className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 mb-20 z-10 scroll-mt-20'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {statistics.map((stat, index) => (
          <div
            key={index}
            className='group bg-white rounded-2xl shadow-xl p-8 border border-slate-200 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1'
          >
            <div className='text-5xl font-extrabold landing-stat-value mb-2 group-hover:scale-110 transition-transform'>
              {stat.value}
            </div>
            <div className='landing-text-body font-semibold text-lg'>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
