/** Re-export design token names for consumers that cannot import Tailwind preset directly. */
export const BRAND_NAME = 'Freshy';

export const TYPOGRAPHY_SCALE = [
  'display-lg',
  'headline-lg',
  'headline-lg-mobile',
  'title-md',
  'body-lg',
  'body-sm',
  'label-caps',
] as const;

export const ROUTES = {
  explore: '/explore',
  cooling: '/cooling',
  place: (slug: string) => `/places/${slug}`,
  profile: '/profile',
} as const;
