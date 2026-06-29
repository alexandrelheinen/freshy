import { test, expect } from '@playwright/test';

const pages = [
  { name: 'explore', path: '/explore', label: 'Freshy Map (Explore)' },
  { name: 'cooling', path: '/cooling', label: 'Categories (Cooling)' },
  { name: 'place-detail', path: '/places/ice-coffee-central', label: 'Place Details' },
  { name: 'profile', path: '/profile', label: 'My Profile' },
];

test.describe('Freshy page screenshots', () => {
  for (const page of pages) {
    test(`capture ${page.name}`, async ({ page: browserPage }) => {
      await browserPage.setViewportSize({ width: 390, height: 844 });
      await browserPage.goto(page.path);
      await browserPage.waitForSelector(`[data-page="${page.name}"]`, { timeout: 15000 });
      await browserPage.screenshot({
        path: `../../screenshots/${page.name}.png`,
        fullPage: true,
      });
      await expect(browserPage.locator(`[data-page="${page.name}"]`)).toBeVisible();
    });
  }
});
