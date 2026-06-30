export const PLACE_PHOTO_CATEGORIES = [
  'CAFE',
  'RESTAURANT',
  'LIBRARY',
  'MALL',
  'MUSEUM',
  'COWORKING',
  'PUBLIC_SPACE',
] as const;

export type PlacePhotoCategory = (typeof PLACE_PHOTO_CATEGORIES)[number];

export const DEFAULT_PLACE_PHOTO_R2_PREFIX = 'places/defaults';

export function defaultPlacePhotoFilename(category: PlacePhotoCategory): string {
  return `default-${category.toLowerCase()}.png`;
}

export function defaultPlacePhotoR2Key(category: PlacePhotoCategory): string {
  return `${DEFAULT_PLACE_PHOTO_R2_PREFIX}/${defaultPlacePhotoFilename(category)}`;
}

export function defaultPlacePhotoLocalPath(category: PlacePhotoCategory): string {
  return `/place-defaults/${defaultPlacePhotoFilename(category)}`;
}

/** Resolve a venue photo URL, falling back to R2 or bundled defaults. */
export function resolvePlacePhotoUrl(
  photoUrl: string | null | undefined,
  category: PlacePhotoCategory,
  publicAssetBaseUrl?: string,
): string {
  if (photoUrl) return photoUrl;
  if (publicAssetBaseUrl) {
    const base = publicAssetBaseUrl.replace(/\/$/, '');
    return `${base}/${defaultPlacePhotoR2Key(category)}`;
  }
  return defaultPlacePhotoLocalPath(category);
}
