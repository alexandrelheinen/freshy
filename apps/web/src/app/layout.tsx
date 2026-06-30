import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { BRAND_TITLE } from '@freshy/ui';
import { FreshyClerkProvider } from '../components/FreshyClerkProvider';
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
  viewportFit: 'cover',
  themeColor: '#0c6780',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-sans bg-background text-on-background antialiased`}>
        <FreshyClerkProvider>{children}</FreshyClerkProvider>
      </body>
    </html>
  );
}
