import type { Metadata, Viewport } from 'next';
import { BRAND_TITLE } from '@freshy/ui';
import { getDefaultThemeTokens } from '@freshy/theme/tokens';
import { FreshyClerkProvider } from '../components/FreshyClerkProvider';
import { FreshyLocationProvider } from '../components/FreshyLocationProvider';
import './globals.css';

const defaultTheme = getDefaultThemeTokens();

export const metadata: Metadata = {
  title: BRAND_TITLE,
  description: 'Find air-conditioned refuges near you.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: defaultTheme.colors.primary,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="default">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=block"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-background text-on-background antialiased">
        <FreshyClerkProvider>
          <FreshyLocationProvider>{children}</FreshyLocationProvider>
        </FreshyClerkProvider>
      </body>
    </html>
  );
}
