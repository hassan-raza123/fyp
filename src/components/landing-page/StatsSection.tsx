import { statistics } from '@/constants/landing-page';

export default function StatsSection() {
  return (
    <div className='bg-white py-16'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {statistics.map((stat, index) => (
            <div
              key={index}
              className='text-center group'
            >
              <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 mb-4 group-hover:scale-110 transition-transform duration-300'>
                <span className='text-2xl font-bold text-white'>
                  {index + 1}
                </span>
              </div>
              <div className='text-4xl font-extrabold landing-stat-value mb-2'>
                {stat.value}
              </div>
              <div className='landing-text-body font-medium'>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
