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

export const PLACE_CATEGORY_LABELS: Record<
  'CAFE' | 'RESTAURANT' | 'LIBRARY' | 'MALL' | 'MUSEUM' | 'COWORKING' | 'PUBLIC_SPACE',
  string
> = {
  CAFE: 'Cafés & Bakeries',
  RESTAURANT: 'Restaurants',
  LIBRARY: 'Libraries',
  MALL: 'Malls',
  MUSEUM: 'Museums',
  COWORKING: 'Coworking',
  PUBLIC_SPACE: 'Public Spaces',
};

export const AC_STRENGTH_LABELS: Record<'LIGHTLY_COOLED' | 'COMFORTABLE' | 'FRIGID', string> = {
  LIGHTLY_COOLED: 'Lightly Cooled',
  COMFORTABLE: 'Comfortable',
  FRIGID: 'Frigid',
};

export const NAV_ITEMS = [
  { id: 'explore' as const, label: 'Explore', href: ROUTES.explore },
  { id: 'saved' as const, label: 'Saved', href: ROUTES.explore },
  { id: 'cooling' as const, label: 'Cooling', href: ROUTES.cooling },
  { id: 'profile' as const, label: 'Profile', href: ROUTES.profile },
];
