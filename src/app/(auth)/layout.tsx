import '@/styles/globals.css';
import { Metadata } from 'next';
import { BookOpen, Clock, School } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Auth | University Portal',
  description: 'Login to access your university portal',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen bg-secondary flex items-center justify-center p-4'>
      <div className='w-full max-w-6xl bg-accent rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row'>
        {/* Left Side */}
        <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-light items-center justify-center p-12'>
          <div className='max-w-lg text-center'>
            <div className='mb-8'>
              <School className='w-20 h-20 text-accent mx-auto mb-4' />
              <h1 className='text-5xl font-bold text-accent mb-6'>
                University Portal
              </h1>
              <p className='text-accent/80 text-xl leading-relaxed'>
                Your gateway to academic excellence
              </p>
            </div>

            <div className='mt-12 grid grid-cols-2 gap-6'>
              <div className='bg-accent/10 p-6 rounded-2xl backdrop-blur-lg border border-accent/20 hover:border-primary-light/50 transition-colors'>
                <div className='bg-accent w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto'>
                  <BookOpen className='w-6 h-6 text-primary' />
                </div>
                <h3 className='text-accent font-semibold mb-2'>Courses</h3>
                <p className='text-accent/80 text-sm'>
                  Access all your enrolled courses
                </p>
              </div>
              <div className='bg-accent/10 p-6 rounded-2xl backdrop-blur-lg border border-accent/20 hover:border-primary-light/50 transition-colors'>
                <div className='bg-accent w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto'>
                  <Clock className='w-6 h-6 text-primary' />
                </div>
                <h3 className='text-accent font-semibold mb-2'>Schedule</h3>
                <p className='text-accent/80 text-sm'>
                  Stay updated with your class timings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className='w-full lg:w-1/2 bg-accent flex items-center justify-center p-8'>
          {children}
        </div>
      </div>
    </div>
  );
}
