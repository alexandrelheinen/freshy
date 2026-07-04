const DEFAULT_WEB_APP_URL = 'https://freshy-25e.pages.dev';

export function resolveWebAppUrl(fromExtra: string | undefined | null): string {
  if (typeof fromExtra === 'string' && fromExtra.trim()) {
    return fromExtra.trim().replace(/\/$/, '');
  }
  return DEFAULT_WEB_APP_URL;
}

/** Production web app URL loaded inside the native WebView shell. */
export function readWebAppUrl(): string {
  // Lazy require keeps expo-constants (and react-native) out of unit test imports.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Constants = require('expo-constants').default as {
    expoConfig?: { extra?: { webAppUrl?: string } };
  };
  return resolveWebAppUrl(Constants.expoConfig?.extra?.webAppUrl);
}
