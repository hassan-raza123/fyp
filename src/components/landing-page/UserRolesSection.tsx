import { CheckCircle } from 'lucide-react';
import { userRoles } from '@/constants/landing-page';

export default function UserRolesSection() {
  return (
    <div id="portals" className='py-24 bg-white scroll-mt-20'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <span className='inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-900 font-semibold text-sm mb-4'>
            USER PORTALS
          </span>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            Built for Everyone
          </h2>
          <p className='text-xl landing-text-body max-w-2xl mx-auto'>
            Specialized dashboards for each role
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {userRoles.map((role, index) => {
            const IconComponent = role.icon;
            return (
              <div
                key={index}
                className='group bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300'
              >
                <div className='w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300'>
                  <IconComponent className='h-7 w-7 text-white' />
                </div>
                <h3 className='text-2xl font-bold landing-text-heading mb-3'>
                  {role.title}
                </h3>
                <p className='landing-text-body mb-6'>{role.description}</p>
                <ul className='space-y-2'>
                  {role.features.map((feature, idx) => (
                    <li key={idx} className='flex items-start landing-text-muted text-sm'>
                      <CheckCircle className='h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5' />
                      <span>{feature}</span>
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
