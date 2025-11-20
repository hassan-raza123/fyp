import { CheckCircle } from 'lucide-react';
import { userRoles } from '@/constants/landing-page';

export default function UserRolesSection() {
  return (
    <div id="portals" className='py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 scroll-mt-20'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-16'>
          <div className='inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-900 font-semibold text-sm mb-4'>
            USER PORTALS
          </div>
          <h2 className='text-4xl md:text-5xl font-extrabold text-slate-900 mb-4'>
            Three Dedicated Interfaces
          </h2>
          <p className='text-xl text-slate-600 max-w-3xl mx-auto'>
            Specialized dashboards designed for each user role
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {userRoles.map((role, index) => {
            const IconComponent = role.icon;
            return (
              <div
                key={index}
                className='group bg-white rounded-2xl shadow-xl p-8 border-2 border-slate-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2'
              >
                <div className='mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300'>
                  <IconComponent className='h-8 w-8 text-white' />
                </div>
                <h3 className='text-2xl font-bold text-slate-900 mb-3'>
                  {role.title}
                </h3>
                <p className='text-slate-600 mb-6 leading-relaxed'>{role.description}</p>
                <ul className='space-y-3'>
                  {role.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className='flex items-start text-slate-700'
                    >
                      <CheckCircle className='h-5 w-5 text-green-500 mr-3 shrink-0 mt-0.5' />
                      <span className='text-sm font-medium'>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

