import '@/styles/globals.css';
import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'UniAttend - Modern Attendance Management',
  description:
    'Smart attendance management system for educational institutions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      <Navbar />
      <main className='flex-grow'>{children}</main>
      <Footer />
    </div>
  );
}
