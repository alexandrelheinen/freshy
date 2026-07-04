import type { ConfigContext, ExpoConfig } from 'expo/config';
import { readAppVersion } from './src/read-app-version';

const DEFAULT_WEB_APP_URL = 'https://freshy-25e.pages.dev';
const DEFAULT_EAS_PROJECT_ID = 'ff3b74f8-863b-41cd-a83a-1c9f37a1dd42';
const PLACEHOLDER_EAS_PROJECT_ID = 'REPLACE_WITH_EAS_PROJECT_ID';

function readEasProjectId(): string {
  const raw = process.env.EAS_PROJECT_ID?.trim();
  if (raw && raw !== PLACEHOLDER_EAS_PROJECT_ID) return raw;
  return DEFAULT_EAS_PROJECT_ID;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const easProjectId = readEasProjectId();

  return {
    ...config,
    name: 'Freshy',
    slug: 'freshy',
    version: readAppVersion(),
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'freshy',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'app.freshy.mobile',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Freshy uses your location to show nearby cooling places on the map.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'app.freshy.mobile',
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
    },
    plugins: ['expo-router'],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      webAppUrl: process.env.EXPO_PUBLIC_WEB_APP_URL ?? DEFAULT_WEB_APP_URL,
      eas: { projectId: easProjectId },
    },
  };
};
