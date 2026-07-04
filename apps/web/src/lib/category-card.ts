export const CATEGORY_CARD_IMAGE_BASE = 'absolute inset-0 h-full w-full object-cover';

export const CATEGORY_CARD_IMAGE_FILTER = 'brightness-[0.72] contrast-[1.15] saturate-[1.02]';

export const CATEGORY_CARD_FLAT_SCRIM = 'absolute inset-0 bg-black/20';

export const CATEGORY_CARD_GRADIENT_SCRIM =
  'absolute inset-0 bg-gradient-to-b from-scrim-strong/75 via-scrim-weak/25 to-scrim-strong';

export function formatCategoryPlaceCount(count: number): string {
  return `${count} ${count === 1 ? 'place' : 'places'} available`;
}
