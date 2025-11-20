import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

// Metadata configuration
export const metadata: Metadata = {
  title: 'Smart Campus for MNSUET',
  description: 'Your comprehensive university management system - Outcome Based Education Management Platform',
  icons: {
    icon: [
      { url: "/logo's/logo.png", sizes: 'any' },
      { url: "/logo's/logo.png", sizes: '32x32', type: 'image/png' },
      { url: "/logo's/logo.png", sizes: '16x16', type: 'image/png' },
    ],
    apple: "/logo's/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
