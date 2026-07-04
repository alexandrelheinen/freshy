import type { ConfigContext, ExpoConfig } from 'expo/config';

const DEFAULT_WEB_APP_URL = 'https://freshy-25e.pages.dev';
const PLACEHOLDER_EAS_PROJECT_ID = 'REPLACE_WITH_EAS_PROJECT_ID';

function readEasProjectId(): string | undefined {
  const raw = process.env.EAS_PROJECT_ID?.trim();
  if (!raw || raw === PLACEHOLDER_EAS_PROJECT_ID) return undefined;
  return raw;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const easProjectId = readEasProjectId();

  return {
    ...config,
    name: 'Freshy',
    slug: 'freshy',
    version: '0.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'freshy',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0c6780',
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
        backgroundColor: '#0c6780',
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
      ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
    },
  };
};
