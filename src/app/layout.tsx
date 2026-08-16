import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import { Toaster } from 'sonner';
import { PRODUCT_DESCRIPTION, PRODUCT_FULL_NAME } from '@/constants/branding';

const inter = Inter({ subsets: ['latin'] });

// Metadata configuration.
//
// Only the product name appears here, never the customer's. This is the root
// layout for every installation, and making it name one university is what it
// did before. The institution's own name is a setting — see `getBranding()`.
export const metadata: Metadata = {
  title: PRODUCT_FULL_NAME,
  description: PRODUCT_DESCRIPTION,
  // One SVG covers every size. The previous entries claimed `image/png` for
  // three copies of the same file, and that file was the university's crest.
  icons: {
    icon: [{ url: '/brand/attainly-mark.svg', type: 'image/svg+xml', sizes: 'any' }],
    apple: '/brand/attainly-mark.svg',
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
