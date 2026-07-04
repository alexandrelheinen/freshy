import Constants from 'expo-constants';

const DEFAULT_WEB_APP_URL = 'https://freshy-25e.pages.dev';

/** Production web app URL loaded inside the native WebView shell. */
export function readWebAppUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.webAppUrl;
  if (typeof fromExtra === 'string' && fromExtra.trim()) {
    return fromExtra.trim().replace(/\/$/, '');
  }
  return DEFAULT_WEB_APP_URL;
}
