/** Shared thumb contrast filter for cooling category cards (web and native WebView). */
export const CATEGORY_THUMB_IMAGE_CLASS =
  'absolute inset-0 h-full w-full object-cover brightness-[0.72] contrast-[1.15] saturate-[1.02]';

export const CATEGORY_THUMB_SCRIM_CLASS = 'absolute inset-0 bg-black/20';

export const CATEGORY_THUMB_GRADIENT_CLASS =
  'absolute inset-0 bg-gradient-to-b from-scrim-strong/75 via-scrim-weak/25 to-scrim-strong';

export function formatCategoryPlaceCount(count: number): string {
  return `${count} ${count === 1 ? 'place' : 'places'} available`;
}
