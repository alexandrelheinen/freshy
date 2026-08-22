export const PLACE_PHOTO_CATEGORIES = [
  'CAFE',
  'RESTAURANT',
  'BAR',
  'LIBRARY',
  'MALL',
  'MUSEUM',
  'COWORKING',
  'PUBLIC_SPACE',
] as const;

export type PlacePhotoCategory = (typeof PLACE_PHOTO_CATEGORIES)[number];

export const DEFAULT_PLACE_PHOTO_R2_PREFIX = 'places/defaults';
export const DEFAULT_PLACE_PHOTO_THUMB_SUBDIR = 'thumbs';
export const DEFAULT_PLACE_PHOTO_THUMB_WIDTH = 640;
export const DEFAULT_PLACE_PHOTO_THUMB_QUALITY = 75;

export type PlacePhotoVariant = 'full' | 'thumb';

export function defaultPlacePhotoFilename(category: PlacePhotoCategory): string {
  return `default-${category.toLowerCase()}.png`;
}

export function defaultPlacePhotoThumbFilename(category: PlacePhotoCategory): string {
  return `default-${category.toLowerCase()}.webp`;
}

export function defaultPlacePhotoR2Key(category: PlacePhotoCategory): string {
  return `${DEFAULT_PLACE_PHOTO_R2_PREFIX}/${defaultPlacePhotoFilename(category)}`;
}

export function defaultPlacePhotoThumbR2Key(category: PlacePhotoCategory): string {
  return `${DEFAULT_PLACE_PHOTO_R2_PREFIX}/${DEFAULT_PLACE_PHOTO_THUMB_SUBDIR}/${defaultPlacePhotoThumbFilename(category)}`;
}

export function defaultPlacePhotoLocalPath(category: PlacePhotoCategory): string {
  return `/place-defaults/${defaultPlacePhotoFilename(category)}`;
}

export function defaultPlacePhotoThumbLocalPath(category: PlacePhotoCategory): string {
  return `/place-defaults/${DEFAULT_PLACE_PHOTO_THUMB_SUBDIR}/${defaultPlacePhotoThumbFilename(category)}`;
}

function defaultPlacePhotoPathForVariant(
  category: PlacePhotoCategory,
  variant: PlacePhotoVariant,
): string {
  return variant === 'thumb'
    ? defaultPlacePhotoThumbLocalPath(category)
    : defaultPlacePhotoLocalPath(category);
}

function defaultPlacePhotoR2KeyForVariant(
  category: PlacePhotoCategory,
  variant: PlacePhotoVariant,
): string {
  return variant === 'thumb'
    ? defaultPlacePhotoThumbR2Key(category)
    : defaultPlacePhotoR2Key(category);
}

/** Resolve a venue photo URL, falling back to R2 or bundled defaults. */
export function resolvePlacePhotoUrl(
  photoUrl: string | null | undefined,
  category: PlacePhotoCategory,
  publicAssetBaseUrl?: string,
  variant: PlacePhotoVariant = 'full',
): string {
  if (photoUrl) return photoUrl;
  if (publicAssetBaseUrl) {
    const base = publicAssetBaseUrl.replace(/\/$/, '');
    return `${base}/${defaultPlacePhotoR2KeyForVariant(category, variant)}`;
  }
  return defaultPlacePhotoPathForVariant(category, variant);
}

/** After a remote (or other) photo fails to load, use the category default once. */
export function placePhotoSrcAfterError(
  failedSrc: string,
  category: PlacePhotoCategory,
  publicAssetBaseUrl?: string,
  variant: PlacePhotoVariant = 'full',
): string | null {
  const fallback = resolvePlacePhotoUrl(null, category, publicAssetBaseUrl, variant);
  if (failedSrc === fallback) return null;
  return fallback;
}
