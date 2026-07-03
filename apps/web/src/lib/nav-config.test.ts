import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ROUTES } from '@freshy/ui';
import { DESKTOP_NAV_ITEMS, MOBILE_MENU_NAV_ITEMS } from './nav-config';

describe('nav-config', () => {
  it('keeps Saved out of the desktop header', () => {
    const ids = DESKTOP_NAV_ITEMS.map((item) => item.id);
    assert.deepEqual(ids, ['explore', 'cooling']);
  });

  it('includes Saved in the mobile drawer', () => {
    const saved = MOBILE_MENU_NAV_ITEMS.find((item) => item.id === 'saved');
    assert.ok(saved, 'Saved should appear in the mobile menu');
    assert.equal(saved.label, 'Saved');
    assert.equal(saved.href, ROUTES.saved);
  });

  it('renders Profile only once in the mobile drawer footer', () => {
    const profileLinks = MOBILE_MENU_NAV_ITEMS.filter((item) => item.id === 'profile');
    assert.equal(profileLinks.length, 0);
  });
});
