import { getApiBase } from './api-base';
import { MAP_SEARCH } from '@freshy/config/map-search';
import { mergePendingMapPlaces } from './pending-map-place';
import { freshnessLevelScore, type FreshnessLevelId } from '@freshy/config/freshness-levels';

export interface PlaceDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  latitude: number;
  longitude: number;
  address: string | null;
  photoUrl?: string | null;
  aggregatedFreshnessLevel:
    | 'NONE'
    | 'GOOD_VENTILATION'
    | 'MODEST_AC'
    | 'VERY_COLD_AC'
    | 'NATURALLY_FRESH'
    | null;
  tags?: string[];
  isOpen?: boolean;
  distanceKm?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'IMPORTED';
}

export function isPlaceVerified(place: Pick<PlaceDto, 'status'>): boolean {
  return place.status === 'PUBLISHED';
}

export function filterPlacesByVerifiedOnly(
  places: PlaceDto[],
  verifiedOnly?: boolean,
): PlaceDto[] {
  if (!verifiedOnly) return places;
  return places.filter(isPlaceVerified);
}

export interface PlacesFetchParams {
  lat: number;
  lng: number;
  radius: number;
  category?: string;
  q?: string;
  verifiedOnly?: boolean;
  minFreshnessLevel?: number;
}

/** Build query params for GET /places. Sends verifiedOnly=true only when the filter is on. */
export function buildPlacesSearchParams(params: PlacesFetchParams): URLSearchParams {
  const search = new URLSearchParams();
  search.set('lat', String(params.lat));
  search.set('lng', String(params.lng));
  search.set('radius', String(params.radius));
  if (params.category) search.set('category', params.category);
  if (params.q) search.set('q', params.q);
  if (params.verifiedOnly) search.set('verifiedOnly', 'true');
  if (params.minFreshnessLevel != null) {
    search.set('minFreshnessLevel', String(params.minFreshnessLevel));
  }
  return search;
}

/** True when a place meets the minimum freshness score filter. */
export function placeMatchesMinFreshnessFilter(
  place: Pick<PlaceDto, 'aggregatedFreshnessLevel'>,
  minFreshnessLevel: number | undefined,
): boolean {
  if (minFreshnessLevel == null) return true;
  const score = freshnessLevelScore(place.aggregatedFreshnessLevel as FreshnessLevelId | null);
  return score != null && score >= minFreshnessLevel;
}

export function filterPlacesByMinFreshnessLevel(
  places: PlaceDto[],
  minFreshnessLevel: number | undefined,
): PlaceDto[] {
  if (minFreshnessLevel == null) return places;
  return places.filter((place) => placeMatchesMinFreshnessFilter(place, minFreshnessLevel));
}

/** Merge draft rows into a published list without duplicating slugs. */
export function mergeDraftPlacesIntoResults(published: PlaceDto[], drafts: PlaceDto[]): PlaceDto[] {
  if (drafts.length === 0) return published;
  const slugs = new Set(published.map((place) => place.slug));
  const merged = [...published];
  for (const draft of drafts) {
    if (!slugs.has(draft.slug)) {
      merged.push(draft);
    }
  }
  return merged;
}

/** Paginate a distance-sorted place list for category views (fallback when category-list is unavailable). */
export function buildCategoryPlacesPageFromList(
  places: PlaceDto[],
  options: { page: number; limit: number; radiusKm: number },
): CategoryPlacesPageDto {
  const sorted = [...places].sort(
    (left, right) =>
      (left.distanceKm ?? Number.POSITIVE_INFINITY) -
      (right.distanceKm ?? Number.POSITIVE_INFINITY),
  );
  const nearbyCount = sorted.filter(
    (place) => (place.distanceKm ?? Number.POSITIVE_INFINITY) <= options.radiusKm,
  ).length;
  const total = sorted.length;
  const offset = (options.page - 1) * options.limit;
  const items = sorted.slice(offset, offset + options.limit);

  return {
    items,
    total,
    page: options.page,
    limit: options.limit,
    nearbyCount,
  };
}

/** Client-side places fetch for map and list views (never cached). Returns null when the API fails. */
export async function fetchPlacesClient(params: PlacesFetchParams): Promise<PlaceDto[] | null> {
  const search = buildPlacesSearchParams(params);
  const res = await fetch(`${getApiBase()}/places?${search.toString()}`, { cache: 'no-store' });
  if (!res.ok) return null;

  const json = (await res.json()) as { data: PlaceDto[] };
  let places = json.data ?? [];

  if (!params.verifiedOnly) {
    places = mergePendingMapPlaces(places, {
      lat: params.lat,
      lng: params.lng,
      radiusKm: params.radius,
      category: params.category,
    });
  }

  return filterPlacesByMinFreshnessLevel(places, params.minFreshnessLevel);
}

export { mergePendingMapPlaces };

export interface CategoryMeta {
  categories: Array<{ category: string; count: number }>;
  featured: PlaceDto | null;
}

export interface PlaceDetailDto extends PlaceDto {
  reviews: Array<{
    id: string;
    comment: string | null;
    acStrength: number;
    createdAt: string;
    user: { displayName: string; username: string };
  }>;
}

export const CATEGORY_PLACES_PAGE_SIZE = 5;

export interface CategoryPlacesPageDto {
  items: PlaceDto[];
  total: number;
  page: number;
  limit: number;
  nearbyCount: number;
}

export interface CategoryPlacesFetchParams {
  lat: number;
  lng: number;
  radius: number;
  category: string;
  page?: number;
  limit?: number;
  q?: string;
  verifiedOnly?: boolean;
  minFreshnessLevel?: number;
}

export async function fetchCategoryPlacesPage(
  params: CategoryPlacesFetchParams,
): Promise<CategoryPlacesPageDto | null> {
  const page = params.page ?? 1;
  const limit = params.limit ?? CATEGORY_PLACES_PAGE_SIZE;
  const search = new URLSearchParams();
  search.set('lat', String(params.lat));
  search.set('lng', String(params.lng));
  search.set('category', params.category);
  search.set('page', String(page));
  search.set('limit', String(limit));
  if (params.q) search.set('q', params.q);
  if (params.verifiedOnly) search.set('verifiedOnly', 'true');
  if (params.minFreshnessLevel != null) {
    search.set('minFreshnessLevel', String(params.minFreshnessLevel));
  }

  const res = await fetch(`${getApiBase()}/places/category-list?${search.toString()}`, {
    cache: 'no-store',
  });
  if (res.ok) {
    const json = (await res.json()) as { data: CategoryPlacesPageDto };
    if (json.data) {
      return {
        ...json.data,
        items: filterPlacesByVerifiedOnly(json.data.items, params.verifiedOnly),
      };
    }
  }

  const places = await fetchPlacesClient({
    lat: params.lat,
    lng: params.lng,
    radius: MAP_SEARCH.maxRadiusKm,
    category: params.category,
    q: params.q,
    verifiedOnly: params.verifiedOnly,
    minFreshnessLevel: params.minFreshnessLevel,
  });
  if (places === null) return null;

  const categoryPlaces = filterPlacesByVerifiedOnly(
    places.filter((place) => place.category === params.category),
    params.verifiedOnly,
  );
  return buildCategoryPlacesPageFromList(categoryPlaces, {
    page,
    limit,
    radiusKm: params.radius,
  });
}

export async function fetchPlaces(params?: {
  lat?: number;
  lng?: number;
  radius?: number;
  category?: string;
  q?: string;
  verifiedOnly?: boolean;
  minFreshnessLevel?: number;
}): Promise<PlaceDto[]> {
  if (params?.lat == null || params?.lng == null || params?.radius == null) {
    return [];
  }

  return fetchPlacesClient({
    lat: params.lat,
    lng: params.lng,
    radius: params.radius,
    category: params.category,
    q: params.q,
    verifiedOnly: params.verifiedOnly,
    minFreshnessLevel: params.minFreshnessLevel,
  }).then((places) => places ?? []);
}

export function formatDistance(km: number | undefined): string {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

/** Approximate walk time at 5 km/h (Stitch explore card format). */
export function formatWalkTime(km: number | undefined): string {
  if (km == null) return '';
  const minutes = Math.max(1, Math.round((km / 5) * 60));
  return `${minutes} min${minutes === 1 ? '' : 's'} walk`;
}

export function formatDistanceWithWalk(km: number | undefined): string {
  if (km == null) return '';
  return `${formatDistance(km)} • ${formatWalkTime(km)}`;
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  return new Date(isoDate).toLocaleDateString();
}

export function staticMapUrl(lat: number, lng: number, token?: string): string | null {
  if (!token) return null;
  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-l+0c6780(${lng},${lat})/${lng},${lat},14,0/600x300@2x?access_token=${token}`;
}

import { freshnessBarSegments, freshnessTone } from '@freshy/config/freshness-levels';

export function freshnessBarState(level: PlaceDto['aggregatedFreshnessLevel']): {
  segments: number;
  tone: 'neutral' | 'blue' | 'green';
} {
  const id = level as FreshnessLevelId | null | undefined;
  return {
    segments: freshnessBarSegments(id),
    tone: freshnessTone(id),
  };
}

export function directionsUrl(options: {
  latitude: number;
  longitude: number;
  address?: string | null;
}): string {
  const { latitude, longitude, address } = options;
  const trimmed = address?.trim();
  const destination =
    trimmed && trimmed.length > 0 ? encodeURIComponent(trimmed) : `${latitude},${longitude}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}
