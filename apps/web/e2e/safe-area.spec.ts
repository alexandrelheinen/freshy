import { expect, test } from '@playwright/test';

/** Typical Android status bar height used in the native shell fallback. */
const ANDROID_STATUS_BAR_PX = 48;

test.describe('Android safe area layout', () => {
  test('keeps the mobile header below the system status bar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/explore');
    await page.waitForSelector('[data-page="explore"]', { timeout: 15000 });

    await page.evaluate((statusBarHeight) => {
      const root = document.documentElement;
      root.style.setProperty('--safe-area-inset-top', `${statusBarHeight}px`);
      root.style.setProperty('--safe-area-inset-bottom', '0px');

      const statusBar = document.createElement('div');
      statusBar.id = 'freshy-safe-area-check-status-bar';
      statusBar.setAttribute('data-testid', 'mock-android-status-bar');
      statusBar.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'right:0',
        `height:${statusBarHeight}px`,
        'z-index:99999',
        'background:#1a1a1a',
        'color:#fff',
        'display:flex',
        'align-items:center',
        'justify-content:space-between',
        'padding:0 16px',
        'font:600 14px/1 system-ui,sans-serif',
        'pointer-events:none',
      ].join(';');
      statusBar.innerHTML =
        '<span>10:02</span><span style="display:flex;gap:8px;align-items:center"><span>▮▮▮</span><span>WiFi</span><span>29%</span></span>';

      document.body.prepend(statusBar);
    }, ANDROID_STATUS_BAR_PX);

    const header = page.locator('header.safe-area-top:visible').first();
    await expect(header).toBeVisible();

    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();

    const brand = page.getByRole('heading', { name: /freshy/i });
    await expect(brand).toBeVisible();
    const brandBox = await brand.boundingBox();
    expect(brandBox).not.toBeNull();
    expect(brandBox!.y).toBeGreaterThanOrEqual(ANDROID_STATUS_BAR_PX - 1);

    await page.screenshot({
      path: '../../docs/mobile/android-safe-area-verification.png',
      fullPage: false,
    });
  });
});
