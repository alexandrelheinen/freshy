import type { Metadata, Viewport } from 'next';
import { THEME_BOOTSTRAP_SCRIPT } from '@freshy/ui';
import { CORNER_STYLE } from '@freshy/config/corner-style';
import { buildGoogleFontsHref } from '@freshy/theme/fonts';
import { getDefaultThemeTokens } from '@freshy/theme/tokens';
import { FreshyClerkProvider } from '../components/FreshyClerkProvider';
import { FreshyLocationProvider } from '../components/FreshyLocationProvider';
import { FreshyThemeProvider } from '../components/FreshyThemeProvider';
import { appMetadata } from '../lib/app-metadata';
import './globals.css';

const defaultTheme = getDefaultThemeTokens();
const googleFontsHref = buildGoogleFontsHref(defaultTheme.fonts);

export const metadata: Metadata = appMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: defaultTheme.colors.primary,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-corners={CORNER_STYLE}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" as="style" href={googleFontsHref} />
        <link href={googleFontsHref} rel="stylesheet" />
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
        <FreshyThemeProvider>
          <FreshyClerkProvider>
            <FreshyLocationProvider>{children}</FreshyLocationProvider>
          </FreshyClerkProvider>
        </FreshyThemeProvider>
      </body>
    </html>
  );
}
