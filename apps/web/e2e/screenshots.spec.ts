import { test } from '@playwright/test';

const pages = [
  { name: 'explore', path: '/explore', label: 'Freshy Map (Explore)' },
  { name: 'cooling', path: '/cooling', label: 'Categories (Cooling)' },
  { name: 'place-list', path: '/cooling/cafe', label: 'Place List (Category)' },
  { name: 'place-detail', path: '/places/detail', label: 'Place Details' },
  { name: 'saved', path: '/saved', label: 'Saved Places' },
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
    });
  }
});
