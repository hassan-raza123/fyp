import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { userRoles } from '@/constants/landing-page';

export default function UserRolesSection() {
  return (
    <div id="portals" className='py-24 bg-white scroll-mt-20'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <span className='inline-block px-4 py-2 rounded-full landing-badge font-semibold text-sm mb-4'>
            USER PORTALS
          </span>
          <h2 className='text-4xl md:text-5xl font-extrabold landing-text-heading mb-4'>
            Access Your Portal
          </h2>
          <p className='text-xl landing-text-body max-w-2xl mx-auto'>
            Login with your university credentials to access your dedicated portal
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {userRoles.map((role, index) => {
            const IconComponent = role.icon;
            return (
              <Link
                key={index}
                href='/login'
                className='group bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-brand-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block'
              >
                <div className='w-14 h-14 rounded-xl brand-gradient flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg'>
                  <IconComponent className='h-7 w-7 text-white' />
                </div>
                <h3 className='text-2xl font-bold landing-text-heading mb-3'>
                  {role.title}
                </h3>
                <p className='landing-text-body mb-6'>{role.description}</p>
                <ul className='space-y-2 mb-6'>
                  {role.features.map((feature, idx) => (
                    <li key={idx} className='flex items-start landing-text-muted text-sm'>
                      <CheckCircle className='h-4 w-4 text-brand-secondary mr-2 shrink-0 mt-0.5' />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className='flex items-center text-brand-primary font-semibold group-hover:translate-x-2 transition-transform'>
                  Login to Portal <ArrowRight className='ml-2 w-5 h-5' />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
