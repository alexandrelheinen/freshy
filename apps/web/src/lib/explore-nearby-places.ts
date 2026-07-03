import type { PlaceDto } from './api';

/** Nearby list for explore: closest places, always including the current selection when possible. */
export function nearbyPlacesForList(
  places: PlaceDto[],
  selectedSlug: string | null,
  limit = 5,
): PlaceDto[] {
  const sorted = [...places].sort(
    (a, b) =>
      (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY),
  );
  const closest = sorted.slice(0, limit);
  if (!selectedSlug) return closest;

  if (closest.some((place) => place.slug === selectedSlug)) {
    return closest;
  }

  const selected = places.find((place) => place.slug === selectedSlug);
  if (!selected) return closest;

  return [selected, ...closest.slice(0, limit - 1)];
}
