import '@/styles/globals.css';
import type { Metadata } from 'next';

// Metadata configuration
export const metadata: Metadata = {
  title: {
    default: 'University Portal | Your Academic Gateway',
    template: '%s | University Portal',
  },
  description:
    'Access your university resources, courses, and academic information all in one place.',
  keywords: [
    'university portal',
    'education',
    'learning management',
    'student portal',
    'academic portal',
    'online education',
  ],
  authors: [{ name: 'Your University Name' }],
  creator: 'Your University Name',
  publisher: 'Your University Name',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
