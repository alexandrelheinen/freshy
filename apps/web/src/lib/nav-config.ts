import { NAV_ITEMS } from '@freshy/ui';

/** Primary tabs in the desktop header (Saved and Profile live elsewhere). */
export const DESKTOP_NAV_ITEMS = NAV_ITEMS.filter(
  (item) => item.id !== 'profile' && item.id !== 'saved',
);

/** Drawer links on mobile; Profile is rendered separately at the bottom. */
export const MOBILE_MENU_NAV_ITEMS = NAV_ITEMS.filter((item) => item.id !== 'profile');
