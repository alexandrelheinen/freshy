import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { BRAND_TITLE, THEME_BOOTSTRAP_SCRIPT } from '@freshy/ui';
import { getDefaultThemeTokens } from '@freshy/theme/tokens';
import { FreshyClerkProvider } from '../components/FreshyClerkProvider';
import { FreshyLocationProvider } from '../components/FreshyLocationProvider';
import { FreshyThemeProvider } from '../components/FreshyThemeProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-sans bg-background text-on-background antialiased`}>
        <FreshyThemeProvider>
          <FreshyClerkProvider>
            <FreshyLocationProvider>{children}</FreshyLocationProvider>
          </FreshyClerkProvider>
        </FreshyThemeProvider>
      </body>
    </html>
  );
}
