/** Re-export design token names for consumers that cannot import Tailwind preset directly. */
export const BRAND_NAME = 'Freshy';

export const ROUTES = {
  explore: '/explore',
  cooling: '/cooling',
  place: (slug: string) => `/places/${slug}`,
  profile: '/profile',
} as const;
