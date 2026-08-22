export const APP_ICON_PATHS = {
  faviconIco: '/favicon.ico',
  faviconSvg: '/favicon.svg',
  iconPng: '/icon.png',
  appleTouchIcon: '/apple-touch-icon.png',
} as const;

export const APP_METADATA_ICONS = {
  icon: [
    { url: APP_ICON_PATHS.faviconIco, sizes: 'any' },
    { url: APP_ICON_PATHS.faviconSvg, type: 'image/svg+xml' },
    { url: APP_ICON_PATHS.iconPng, type: 'image/png', sizes: '32x32' },
  ],
  apple: [{ url: APP_ICON_PATHS.appleTouchIcon, sizes: '180x180', type: 'image/png' }],
} as const;
