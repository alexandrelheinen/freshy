import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { BRAND_TITLE } from '@freshy/ui';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: BRAND_TITLE,
  description: 'Find air-conditioned refuges near you.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0c6780',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-background text-on-background antialiased`}>
        {children}
      </body>
    </html>
  );
}
