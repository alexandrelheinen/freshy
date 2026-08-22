import { BRAND_NAME } from '@freshy/ui';

/** Document title for a loaded place page. Static export cannot emit per-place OG tags. */
export function placePageTitle(placeName: string): string {
  return `${placeName} | ${BRAND_NAME}`;
}
