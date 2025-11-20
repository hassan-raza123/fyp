import '@/styles/globals.css';
import { Metadata } from 'next';
import { BookOpen, Clock, School } from 'lucide-react';
import Image from 'next/image';

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
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <div className='w-full max-w-6xl bg-card rounded-3xl shadow-xl overflow-hidden flex flex-col lg:flex-row border border-border'>
        {/* Left Side */}
        <div className='hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground bg-linear-to-br from-primary via-primary to-accent items-center justify-center p-12'>
          <div className='max-w-lg text-center'>
            <div className='mb-8'>
              <div className='w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/30 mx-auto mb-6 flex items-center justify-center overflow-hidden'>
                <Image
                  src="/logo's/logo.png"
                  alt='EduTrack Logo'
                  width={96}
                  height={96}
                  className='object-contain'
                  priority
                />
              </div>
              <h1 className='text-3xl font-bold text-white mb-2'>
                EduTrack
              </h1>
              <p className='text-white/80 text-xl leading-relaxed'>
                Transforming Education Through Outcomes
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
