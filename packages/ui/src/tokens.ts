/** Re-export design token names for consumers that cannot import Tailwind preset directly. */
export { PILOT_CITY } from '@freshy/config/pilot-city';
import {
  defaultPlacePhotoLocalPath,
  resolvePlacePhotoUrl,
  type PlacePhotoCategory,
} from '@freshy/config/place-photos';
export {
  PLACE_TAGS,
  PLACE_TAG_IDS,
  PLACE_TAG_LABELS,
  PLACE_TAG_ICONS,
  filterValidPlaceTags,
  isPlaceTagId,
  type PlaceTagDefinition,
  type PlaceTagId,
} from '@freshy/config/place-tags';

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
  | 'BAR'
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

export const PLACE_CATEGORY_ICONS: Record<PlaceCategory, string> = {
  CAFE: 'local_cafe',
  RESTAURANT: 'restaurant',
  BAR: 'local_bar',
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
  'CAFE' | 'RESTAURANT' | 'BAR' | 'LIBRARY' | 'MALL' | 'MUSEUM' | 'COWORKING' | 'PUBLIC_SPACE',
  string
> = {
  CAFE: 'Cafés & Bakeries',
  RESTAURANT: 'Restaurants',
  BAR: 'Bars',
  LIBRARY: 'Libraries',
  MALL: 'Malls & Shops',
  MUSEUM: 'Museums',
  COWORKING: 'Coworking',
  PUBLIC_SPACE: 'Public Spaces',
};

export {
  FRESHNESS_LEVELS,
  FRESHNESS_LEVEL_IDS,
  FRESHNESS_LEVEL_LABELS,
  FRESHNESS_LEVEL_SHORT_LABELS,
  FRESHNESS_LEVEL_DESCRIPTIONS,
  freshnessBarSegments,
  freshnessTone,
  isFreshnessLevelId,
  type FreshnessLevelDefinition,
  type FreshnessLevelId,
  type FreshnessTone,
} from '@freshy/config/freshness-levels';

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
  { label: 'Malls & Shops', category: 'MALL' },
];

export const ALL_PLACE_CATEGORIES: PlaceCategory[] = [
  'CAFE',
  'RESTAURANT',
  'BAR',
  'LIBRARY',
  'MALL',
  'MUSEUM',
  'COWORKING',
  'PUBLIC_SPACE',
];

export const DEFAULT_PLACE_PHOTO_PATHS: Record<PlaceCategory, string> = {
  CAFE: defaultPlacePhotoLocalPath('CAFE'),
  RESTAURANT: defaultPlacePhotoLocalPath('RESTAURANT'),
  BAR: defaultPlacePhotoLocalPath('BAR'),
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
