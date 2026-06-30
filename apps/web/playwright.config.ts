import { defineConfig } from '@playwright/test';

/** Clichy pilot center — matches seeded places used in CI screenshots. */
const PILOT_LAT = 48.9042;
const PILOT_LNG = 2.3064;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'off',
    geolocation: { latitude: PILOT_LAT, longitude: PILOT_LNG },
    permissions: ['geolocation'],
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'pnpm serve:static',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: true,
        timeout: 120000,
      },
});
