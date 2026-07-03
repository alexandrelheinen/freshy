import { API_BASE } from './api-base';
import { mergePendingMapPlaces } from './pending-map-place';

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
  status?: 'DRAFT' | 'PUBLISHED';
}

export function isPlaceVerified(place: Pick<PlaceDto, 'status'>): boolean {
  return place.status !== 'DRAFT';
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

async function fetchDraftPlacesInArea(params: PlacesFetchParams): Promise<PlaceDto[]> {
  const search = buildPlacesSearchParams({ ...params, verifiedOnly: false });
  const res = await fetch(`${API_BASE}/places/drafts?${search.toString()}`, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = (await res.json()) as { data: PlaceDto[] };
  return json.data ?? [];
}

/** Client-side places fetch for map and list views (never cached). Returns null when the API fails. */
export async function fetchPlacesClient(params: PlacesFetchParams): Promise<PlaceDto[] | null> {
  const search = buildPlacesSearchParams(params);
  const res = await fetch(`${API_BASE}/places?${search.toString()}`, { cache: 'no-store' });
  if (!res.ok) return null;

  const json = (await res.json()) as { data: PlaceDto[] };
  let places = json.data ?? [];

  if (!params.verifiedOnly) {
    const hasDraftRows = places.some((place) => place.status === 'DRAFT');
    if (!hasDraftRows) {
      const drafts = await fetchDraftPlacesInArea(params);
      places = mergeDraftPlacesIntoResults(places, drafts);
    }

    places = mergePendingMapPlaces(places, {
      lat: params.lat,
      lng: params.lng,
      radiusKm: params.radius,
      category: params.category,
    });
  }

  return places;
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
  const search = new URLSearchParams();
  search.set('lat', String(params.lat));
  search.set('lng', String(params.lng));
  search.set('radius', String(params.radius));
  search.set('category', params.category);
  search.set('page', String(params.page ?? 1));
  search.set('limit', String(params.limit ?? CATEGORY_PLACES_PAGE_SIZE));
  if (params.q) search.set('q', params.q);
  if (params.verifiedOnly) search.set('verifiedOnly', 'true');
  if (params.minFreshnessLevel != null) {
    search.set('minFreshnessLevel', String(params.minFreshnessLevel));
  }

  const res = await fetch(`${API_BASE}/places/category-list?${search.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: CategoryPlacesPageDto };
  return json.data ?? null;
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

import {
  freshnessBarSegments,
  freshnessTone,
  type FreshnessLevelId,
} from '@freshy/config/freshness-levels';

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

/** @deprecated Use freshnessBarState */
export function acStrengthLevel(strength: PlaceDto['aggregatedFreshnessLevel']): 1 | 2 | 3 {
  const segments = freshnessBarSegments(strength as FreshnessLevelId | null | undefined);
  if (segments >= 3) return 3;
  if (segments === 2) return 2;
  return 1;
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
