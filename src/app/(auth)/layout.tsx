import '@/styles/globals.css';
import { Metadata } from 'next';
import { BookOpen, Clock, School } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Login | Smart Campus for MNSUET',
  description: 'Login to access your Smart Campus for MNSUET portal',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='min-h-screen bg-white flex items-center justify-center p-4'>
      <div className='w-full max-w-6xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row'>
        {/* Left Side */}
        <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 items-center justify-center p-12'>
          <div className='max-w-lg text-center'>
            <div className='mb-8'>
              <div className='w-20 h-20 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 mx-auto mb-6 flex items-center justify-center'>
                <School className='w-12 h-12 text-white' />
              </div>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                Smart Campus for MNSUET
              </h1>
              <p className='text-white/80 text-xl leading-relaxed'>
                Your comprehensive OBE-based educational management system
              </p>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center justify-center space-x-4 text-white/80'>
                <div className='flex items-center space-x-2'>
                  <BookOpen className='w-5 h-5' />
                  <span>Attendance Tracking</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <Clock className='w-5 h-5' />
                  <span>Real-time Updates</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className='w-full lg:w-1/2 p-8 lg:p-12'>{children}</div>
      </div>
    </div>
  );
}
