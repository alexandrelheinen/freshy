import type { PlaceDto } from './api';
import { haversineDistanceKm } from './place-distance';

export type ExploreOrigin = { lat: number; lng: number };

/** Map search/fetch point used for GET /places, nearby sort, and distance labels. */
export function exploreSearchOrigin(anchor: {
  latitude: number;
  longitude: number;
}): ExploreOrigin {
  return { lat: anchor.latitude, lng: anchor.longitude };
}

function distanceFromOriginKm(
  place: Pick<PlaceDto, 'latitude' | 'longitude'>,
  origin: ExploreOrigin,
): number {
  const km = haversineDistanceKm(origin.lat, origin.lng, place.latitude, place.longitude);
  return Math.round(km * 100) / 100;
}

function withOriginDistance(place: PlaceDto, origin: ExploreOrigin): PlaceDto {
  return { ...place, distanceKm: distanceFromOriginKm(place, origin) };
}

/** Nearby list for explore: closest places, always including the current selection when possible. */
export function nearbyPlacesForList(
  places: PlaceDto[],
  selectedSlug: string | null,
  limit = 5,
  origin: ExploreOrigin,
): PlaceDto[] {
  const measured = places.map((place) => withOriginDistance(place, origin));
  const sorted = [...measured].sort(
    (a, b) =>
      (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY),
  );
  const closest = sorted.slice(0, limit);
  if (!selectedSlug) return closest;

  if (closest.some((place) => place.slug === selectedSlug)) {
    return closest;
  }

  const selected = measured.find((place) => place.slug === selectedSlug);
  if (!selected) return closest;

  return [selected, ...closest.slice(0, limit - 1)];
}
