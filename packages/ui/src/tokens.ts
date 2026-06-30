/** Re-export design token names for consumers that cannot import Tailwind preset directly. */
export { PILOT_CITY } from '@freshy/config/pilot-city';
import {
  defaultPlacePhotoLocalPath,
  resolvePlacePhotoUrl,
  type PlacePhotoCategory,
} from '@freshy/config/place-photos';

export const BRAND_NAME = 'Freshy';
export const BRAND_TITLE = 'Freshy | Cooling Map';
export const BRAND_ICON = 'nest_farsight_cool';

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
  addPlace: '/profile/places/new',
  studio: '/studio',
} as const;

/** Primary amenity chip shown on explore preview cards per category. */
export const CATEGORY_HIGHLIGHT_AMENITY: Partial<Record<PlaceCategory, string>> = {
  CAFE: 'FREE WI-FI',
  RESTAURANT: 'COMFY SEATING',
  LIBRARY: 'QUIET ZONE',
  MALL: 'FREE WI-FI',
  MUSEUM: 'QUIET ZONE',
  COWORKING: 'FREE WI-FI',
  PUBLIC_SPACE: 'COMFY SEATING',
};

export type PlaceAmenity =
  | 'FREE_WIFI'
  | 'QUIET_ZONE'
  | 'POWER_OUTLETS'
  | 'COMFY_SEATING'
  | 'FREE_WATER'
  | 'LAPTOP_SPACE';

export const PLACE_AMENITIES: PlaceAmenity[] = [
  'FREE_WIFI',
  'QUIET_ZONE',
  'POWER_OUTLETS',
  'COMFY_SEATING',
  'FREE_WATER',
  'LAPTOP_SPACE',
];

export const AMENITY_LABELS: Record<PlaceAmenity, string> = {
  FREE_WIFI: 'FREE WI-FI',
  QUIET_ZONE: 'QUIET ZONE',
  POWER_OUTLETS: 'POWER OUTLETS',
  COMFY_SEATING: 'COMFY SEATING',
  FREE_WATER: 'FREE WATER',
  LAPTOP_SPACE: 'LAPTOP SPACE',
};

export const AMENITY_ICONS: Record<PlaceAmenity, string> = {
  FREE_WIFI: 'wifi',
  QUIET_ZONE: 'volume_off',
  POWER_OUTLETS: 'electrical_services',
  COMFY_SEATING: 'event_seat',
  FREE_WATER: 'water_drop',
  LAPTOP_SPACE: 'laptop_mac',
};

/** Default amenities seeded per category when a place has none stored. */
export const CATEGORY_DEFAULT_AMENITIES: Record<PlaceCategory, PlaceAmenity[]> = {
  CAFE: ['FREE_WIFI', 'COMFY_SEATING'],
  RESTAURANT: ['COMFY_SEATING', 'FREE_WATER'],
  LIBRARY: ['QUIET_ZONE', 'FREE_WIFI', 'POWER_OUTLETS'],
  MALL: ['FREE_WIFI', 'COMFY_SEATING'],
  MUSEUM: ['QUIET_ZONE', 'COMFY_SEATING'],
  COWORKING: ['FREE_WIFI', 'POWER_OUTLETS', 'LAPTOP_SPACE'],
  PUBLIC_SPACE: ['COMFY_SEATING', 'FREE_WATER'],
};

export const PLACE_CATEGORY_ICONS: Record<PlaceCategory, string> = {
  CAFE: 'local_cafe',
  RESTAURANT: 'restaurant',
  LIBRARY: 'menu_book',
  MALL: 'shopping_bag',
  MUSEUM: 'museum',
  COWORKING: 'laptop_mac',
  PUBLIC_SPACE: 'nature',
};

export const NAV_ICONS: Record<'explore' | 'saved' | 'cooling' | 'profile', string> = {
  explore: 'explore',
  saved: 'bookmark_heart',
  cooling: 'climate_mini_split',
  profile: 'digital_wellbeing',
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
  CAFE: defaultPlacePhotoLocalPath('CAFE'),
  RESTAURANT: defaultPlacePhotoLocalPath('RESTAURANT'),
  LIBRARY: defaultPlacePhotoLocalPath('LIBRARY'),
  MALL: defaultPlacePhotoLocalPath('MALL'),
  MUSEUM: defaultPlacePhotoLocalPath('MUSEUM'),
  COWORKING: defaultPlacePhotoLocalPath('COWORKING'),
  PUBLIC_SPACE: defaultPlacePhotoLocalPath('PUBLIC_SPACE'),
};

export function getPlacePhotoUrl(
  photoUrl: string | null | undefined,
  category: PlaceCategory,
): string {
  const publicAssetBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? '';
  return resolvePlacePhotoUrl(
    photoUrl,
    category as PlacePhotoCategory,
    publicAssetBaseUrl || undefined,
  );
}
