import type { PlaceDto } from './api';
import { haversineDistanceKm } from './place-distance';

export const PENDING_MAP_PLACES_KEY = 'freshy-pending-map-places';

export interface PendingMapPlaceInput {
  slug: string;
  name: string;
  category: string;
  address: string | null;
  description?: string | null;
  latitude: number;
  longitude: number;
  aggregatedFreshnessLevel: PlaceDto['aggregatedFreshnessLevel'];
  tags?: string[];
  photoUrl?: string | null;
}

function sessionStorageRef(): Storage | null {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage;
  }
  if (typeof globalThis.sessionStorage !== 'undefined') {
    return globalThis.sessionStorage;
  }
  return null;
}

function pendingPlaceToDto(input: PendingMapPlaceInput): PlaceDto {
  return {
    id: `pending-${input.slug}`,
    slug: input.slug,
    name: input.name,
    description: input.description ?? null,
    category: input.category,
    latitude: input.latitude,
    longitude: input.longitude,
    address: input.address,
    photoUrl: input.photoUrl ?? null,
    aggregatedFreshnessLevel: input.aggregatedFreshnessLevel,
    tags: input.tags ?? [],
    isOpen: true,
    status: 'DRAFT',
  };
}

export function readPendingMapPlaces(): PlaceDto[] {
  const storage = sessionStorageRef();
  if (!storage) return [];
  try {
    const raw = storage.getItem(PENDING_MAP_PLACES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is PendingMapPlaceInput => {
        return (
          item != null &&
          typeof item === 'object' &&
          typeof (item as PendingMapPlaceInput).slug === 'string' &&
          typeof (item as PendingMapPlaceInput).latitude === 'number' &&
          typeof (item as PendingMapPlaceInput).longitude === 'number'
        );
      })
      .map(pendingPlaceToDto);
  } catch {
    return [];
  }
}

export function stagePendingMapPlace(input: PendingMapPlaceInput): void {
  const storage = sessionStorageRef();
  if (!storage) return;
  try {
    const existing = readPendingMapPlaces()
      .map(
        (place): PendingMapPlaceInput => ({
          slug: place.slug,
          name: place.name,
          category: place.category,
          address: place.address,
          description: place.description,
          latitude: place.latitude,
          longitude: place.longitude,
          aggregatedFreshnessLevel: place.aggregatedFreshnessLevel,
          tags: place.tags,
          photoUrl: place.photoUrl,
        }),
      )
      .filter((place) => place.slug !== input.slug);
    existing.unshift(input);
    storage.setItem(PENDING_MAP_PLACES_KEY, JSON.stringify(existing.slice(0, 10)));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function removePendingMapPlace(slug: string): void {
  const storage = sessionStorageRef();
  if (!storage) return;
  try {
    const remaining = readPendingMapPlaces()
      .filter((place) => place.slug !== slug)
      .map(
        (place): PendingMapPlaceInput => ({
          slug: place.slug,
          name: place.name,
          category: place.category,
          address: place.address,
          description: place.description,
          latitude: place.latitude,
          longitude: place.longitude,
          aggregatedFreshnessLevel: place.aggregatedFreshnessLevel,
          tags: place.tags,
          photoUrl: place.photoUrl,
        }),
      );
    if (remaining.length === 0) {
      storage.removeItem(PENDING_MAP_PLACES_KEY);
      return;
    }
    storage.setItem(PENDING_MAP_PLACES_KEY, JSON.stringify(remaining));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

/** Add session-staged draft places when verified-only is off and the API has not returned them yet. */
export function mergePendingMapPlaces(
  apiPlaces: PlaceDto[],
  center: { lat: number; lng: number; radiusKm: number; category?: string },
  options?: { pendingPlaces?: PlaceDto[] },
): PlaceDto[] {
  const pending = options?.pendingPlaces ?? readPendingMapPlaces();
  if (pending.length === 0) return apiPlaces;

  const slugs = new Set(apiPlaces.map((place) => place.slug));
  const merged = [...apiPlaces];

  for (const place of pending) {
    if (slugs.has(place.slug)) {
      if (!options?.pendingPlaces) {
        removePendingMapPlace(place.slug);
      }
      continue;
    }
    if (center.category && place.category !== center.category) continue;

    const distanceKm = haversineDistanceKm(center.lat, center.lng, place.latitude, place.longitude);
    if (distanceKm > center.radiusKm) continue;

    merged.push({
      ...place,
      distanceKm: Math.round(distanceKm * 100) / 100,
    });
  }

  return merged;
}
