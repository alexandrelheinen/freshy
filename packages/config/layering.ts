/** Shared UI stacking order for Freshy web surfaces. Higher values paint above lower ones. */
export const FRESHY_Z_INDEX = {
  base: 0,
  map: 10,
  mapOverlay: 20,
  pageSticky: 40,
  nav: 50,
  popover: 60,
  modal: 70,
  toast: 80,
} as const;

export type FreshyZIndexLayer = keyof typeof FRESHY_Z_INDEX;
