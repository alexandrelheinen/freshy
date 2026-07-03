/** Re-export design token names for consumers that cannot import Tailwind preset directly. */
export { PILOT_CITY } from '@freshy/config/pilot-city';
export { MAP_SEARCH } from '@freshy/config/map-search';
import { FRESHNESS_LEVELS, type FreshnessLevelId } from '@freshy/config/freshness-levels';
import { getDefaultThemeTokens } from '@freshy/theme/tokens';
import {
  defaultPlacePhotoLocalPath,
  resolvePlacePhotoUrl,
  type PlacePhotoVariant,
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

const defaultThemeIcons = getDefaultThemeTokens().icons;

export const BRAND_NAME = 'Freshy';
export const BRAND_TAGLINE = 'Find fresh places near you, from natural shade to cold AC.';
export const BRAND_TITLE = 'Freshy | Fresh Places Map';
export const BRAND_ICON = defaultThemeIcons.brand;

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
  CAFE: defaultThemeIcons.category.cafe,
  RESTAURANT: defaultThemeIcons.category.restaurant,
  BAR: defaultThemeIcons.category.bar,
  LIBRARY: defaultThemeIcons.category.library,
  MALL: defaultThemeIcons.category.mall,
  MUSEUM: defaultThemeIcons.category.museum,
  COWORKING: defaultThemeIcons.category.coworking,
  PUBLIC_SPACE: defaultThemeIcons.category.public_space,
};

export const NAV_ICONS: Record<'explore' | 'saved' | 'cooling' | 'profile', string> = {
  explore: defaultThemeIcons.nav.explore,
  saved: defaultThemeIcons.nav.saved,
  cooling: defaultThemeIcons.nav.cooling,
  profile: defaultThemeIcons.nav.profile,
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
  { id: 'cooling' as const, label: 'Categories', href: ROUTES.cooling },
  { id: 'saved' as const, label: 'Saved', href: ROUTES.saved },
  { id: 'profile' as const, label: 'Profile', href: ROUTES.profile },
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

/** Short labels for explore map filter chips. Keep in sync with ALL_PLACE_CATEGORIES. */
export const PLACE_CATEGORY_CHIP_LABELS: Record<PlaceCategory, string> = {
  CAFE: 'Cafes',
  RESTAURANT: 'Restaurants',
  BAR: 'Bars',
  LIBRARY: 'Libraries',
  MALL: 'Malls',
  MUSEUM: 'Museums',
  COWORKING: 'Coworking',
  PUBLIC_SPACE: 'Public Spaces',
};

export const EXPLORE_FILTER_CHIPS: Array<{ label: string; category: PlaceCategory }> =
  ALL_PLACE_CATEGORIES.map((category) => ({
    category,
    label: PLACE_CATEGORY_CHIP_LABELS[category],
  }));

/** Minimum freshness filter chips for the explore map (excludes "No Cooling"). */
export const EXPLORE_MIN_FRESHNESS_CHIPS: Array<{
  label: string;
  level: FreshnessLevelId;
}> = FRESHNESS_LEVELS.filter((level) => level.level > 0).map((level) => ({
  level: level.id,
  label: level.shortLabel,
}));

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

export type { PlacePhotoVariant };

export function getPlacePhotoUrl(
  photoUrl: string | null | undefined,
  category: PlaceCategory,
  variant: PlacePhotoVariant = 'full',
): string {
  const publicAssetBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? '';
  return resolvePlacePhotoUrl(
    photoUrl,
    category as PlacePhotoCategory,
    publicAssetBaseUrl || undefined,
    variant,
  );
}
