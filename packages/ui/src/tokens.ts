/** Re-export design token names for consumers that cannot import Tailwind preset directly. */
export { PILOT_CITY } from '@freshy/config/pilot-city';

export const BRAND_NAME = 'Freshy';
export const BRAND_TITLE = 'Freshy | Cooling Map';

export const TYPOGRAPHY_SCALE = [
  'display-lg',
  'headline-lg',
  'headline-lg-mobile',
  'title-md',
  'body-lg',
  'body-sm',
  'label-caps',
] as const;

export type PlaceCategory =
  | 'CAFE'
  | 'RESTAURANT'
  | 'LIBRARY'
  | 'MALL'
  | 'MUSEUM'
  | 'COWORKING'
  | 'PUBLIC_SPACE';

export const ROUTES = {
  explore: '/explore',
  saved: '/saved',
  cooling: '/cooling',
  categoryList: (category: PlaceCategory) => `/cooling/${category.toLowerCase()}`,
  place: (slug: string) => `/places/${slug}`,
  profile: '/profile',
} as const;

export const PLACE_CATEGORY_ICONS: Record<PlaceCategory, string> = {
  CAFE: 'local_cafe',
  RESTAURANT: 'restaurant',
  LIBRARY: 'menu_book',
  MALL: 'shopping_bag',
  MUSEUM: 'museum',
  COWORKING: 'laptop_mac',
  PUBLIC_SPACE: 'park',
};

export const NAV_ICONS: Record<'explore' | 'saved' | 'cooling' | 'profile', string> = {
  explore: 'map',
  saved: 'bookmark',
  cooling: 'cyclone',
  profile: 'person',
};

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
  { id: 'saved' as const, label: 'Saved', href: ROUTES.saved },
  { id: 'cooling' as const, label: 'Cooling', href: ROUTES.cooling },
  { id: 'profile' as const, label: 'Profile', href: ROUTES.profile },
];

export const EXPLORE_FILTER_CHIPS: Array<{ label: string; category?: PlaceCategory }> = [
  { label: 'Cafes', category: 'CAFE' },
  { label: 'Restaurants', category: 'RESTAURANT' },
  { label: 'Public Spaces', category: 'PUBLIC_SPACE' },
  { label: 'Malls', category: 'MALL' },
];

export const ALL_PLACE_CATEGORIES: PlaceCategory[] = [
  'CAFE',
  'RESTAURANT',
  'LIBRARY',
  'MALL',
  'MUSEUM',
  'COWORKING',
  'PUBLIC_SPACE',
];

export const DEFAULT_PLACE_PHOTO_PATHS: Record<PlaceCategory, string> = {
  CAFE: '/place-defaults/default-cafe.png',
  RESTAURANT: '/place-defaults/default-restaurant.png',
  LIBRARY: '/place-defaults/default-library.png',
  MALL: '/place-defaults/default-mall.png',
  MUSEUM: '/place-defaults/default-museum.png',
  COWORKING: '/place-defaults/default-coworking.png',
  PUBLIC_SPACE: '/place-defaults/default-public_space.png',
};

export function getPlacePhotoUrl(
  photoUrl: string | null | undefined,
  category: PlaceCategory,
): string {
  return photoUrl ?? DEFAULT_PLACE_PHOTO_PATHS[category];
}
