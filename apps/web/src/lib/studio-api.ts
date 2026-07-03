import type { PlaceDto } from './api';

import { filterValidPlaceTags, type PlaceTagId } from '@freshy/ui';
import { API_BASE } from './api-base';

export type StudioPlaceStatus = 'verified' | 'pending' | 'duplicate';

export interface StudioContributorDto {
  id: string;
  email: string;
  displayName: string;
  username: string;
}

export interface StudioPlaceDto extends PlaceDto {
  status: 'DRAFT' | 'PUBLISHED';
  createdById?: string | null;
  studioStatus: StudioPlaceStatus;
  duplicateOfId: string | null;
  contributor: StudioContributorDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudioPlacesPageDto {
  items: StudioPlaceDto[];
  total: number;
  page: number;
  limit: number;
}

export interface StudioStatsDto {
  totalVerified: number;
  pendingValidation: number;
  activeConflicts: number;
  averageFreshnessScore: number | null;
}

export interface UpdateStudioPlacePayload {
  name?: string;
  description?: string | null;
  category?: string;
  address?: string | null;
  latitude?: number;
  longitude?: number;
  aggregatedFreshnessLevel?:
    | 'NONE'
    | 'GOOD_VENTILATION'
    | 'MODEST_AC'
    | 'VERY_COLD_AC'
    | 'NATURALLY_FRESH'
    | null;
  tags?: string[];
  photoUrl?: string | null;
  isOpen?: boolean;
  status?: 'DRAFT' | 'PUBLISHED';
}

export interface UpdateStudioPlaceOptions {
  photo?: File | null;
}

export interface StudioUserSecretDto {
  id: string;
  email: string;
  displayName: string;
  username: string;
  secret: string;
}

async function studioFetch(
  path: string,
  getToken: () => Promise<string | null>,
  init?: RequestInit,
): Promise<Response> {
  const token = await getToken();
  if (!token) {
    throw new Error('Not signed in');
  }
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchStudioStats(
  getToken: () => Promise<string | null>,
): Promise<StudioStatsDto | null> {
  const res = await studioFetch('/studio/stats', getToken);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const json = (await res.json()) as { data: StudioStatsDto };
  return json.data;
}

export async function fetchStudioPlaces(
  getToken: () => Promise<string | null>,
  params?: {
    status?: 'all' | 'verified' | 'pending' | 'duplicate';
    q?: string;
    page?: number;
    limit?: number;
  },
): Promise<StudioPlacesPageDto | null> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.q) search.set('q', params.q);
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));

  const res = await studioFetch(`/studio/places?${search.toString()}`, getToken);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const json = (await res.json()) as { data: StudioPlacesPageDto };
  const data = json.data;
  return {
    ...data,
    items: await resolveMissingStudioContributors(getToken, data.items),
  };
}

export async function fetchStudioUserById(
  getToken: () => Promise<string | null>,
  userId: string,
): Promise<StudioContributorDto | null> {
  const res = await studioFetch(`/studio/users/${encodeURIComponent(userId)}`, getToken);
  if (res.status === 404 || !res.ok) return null;
  const json = (await res.json()) as { data: StudioContributorDto };
  return json.data ?? null;
}

export async function fetchStudioUsers(
  getToken: () => Promise<string | null>,
  params?: { q?: string; limit?: number },
): Promise<StudioUserSecretDto[]> {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.limit != null) search.set('limit', String(params.limit));

  const query = search.toString();
  const res = await studioFetch(`/studio/users${query ? `?${query}` : ''}`, getToken);
  if (res.status === 404 || !res.ok) return [];
  const json = (await res.json()) as { data: StudioUserSecretDto[] };
  return json.data;
}

export async function approveStudioPlace(
  getToken: () => Promise<string | null>,
  placeId: string,
): Promise<boolean> {
  const res = await studioFetch(`/studio/places/${placeId}/approve`, getToken, {
    method: 'POST',
  });
  return res.ok;
}

export async function deleteStudioPlace(
  getToken: () => Promise<string | null>,
  placeId: string,
): Promise<boolean> {
  const res = await studioFetch(`/studio/places/${placeId}`, getToken, {
    method: 'DELETE',
  });
  return res.ok;
}

export async function mergeStudioPlaces(
  getToken: () => Promise<string | null>,
  targetPlaceId: string,
  sourcePlaceId: string,
): Promise<boolean> {
  const res = await studioFetch('/studio/places/merge', getToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetPlaceId, sourcePlaceId }),
  });
  return res.ok;
}

export async function updateStudioPlace(
  getToken: () => Promise<string | null>,
  placeId: string,
  payload: UpdateStudioPlacePayload,
  options?: UpdateStudioPlaceOptions,
): Promise<boolean> {
  const photo = options?.photo ?? null;

  if (photo) {
    const form = new FormData();
    if (payload.name != null) form.append('name', payload.name);
    if (payload.description != null) form.append('description', payload.description);
    if (payload.category != null) form.append('category', payload.category);
    if (payload.address != null) form.append('address', payload.address);
    if (payload.latitude != null) form.append('latitude', String(payload.latitude));
    if (payload.longitude != null) form.append('longitude', String(payload.longitude));
    if (payload.aggregatedFreshnessLevel != null) {
      form.append('aggregatedFreshnessLevel', payload.aggregatedFreshnessLevel);
    }
    if (payload.tags != null) form.append('tags', JSON.stringify(payload.tags));
    if (payload.status != null) form.append('status', payload.status);
    if (payload.isOpen != null) form.append('isOpen', String(payload.isOpen));
    form.append('photo', photo);

    const res = await studioFetch(`/studio/places/${placeId}`, getToken, {
      method: 'PATCH',
      body: form,
    });
    return res.ok;
  }

  const res = await studioFetch(`/studio/places/${placeId}`, getToken, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export function isStudioAdmin(publicMetadata: unknown): boolean {
  if (!publicMetadata || typeof publicMetadata !== 'object') return false;
  return (publicMetadata as { role?: string }).role === 'admin';
}

/** Merge API contributor data with a lookup map keyed by Freshy User.id. */
export function mergeStudioPlaceContributor(
  place: StudioPlaceDto,
  contributorsById: ReadonlyMap<string, StudioContributorDto>,
): StudioPlaceDto {
  if (place.contributor) return place;
  if (!place.createdById) return place;
  const contributor = contributorsById.get(place.createdById) ?? null;
  if (!contributor) return place;
  return { ...place, contributor };
}

export function mergeStudioPlaceContributors(
  places: StudioPlaceDto[],
  contributorsById: ReadonlyMap<string, StudioContributorDto>,
): StudioPlaceDto[] {
  return places.map((place) => mergeStudioPlaceContributor(place, contributorsById));
}

function studioContributorFromUser(user: StudioUserSecretDto): StudioContributorDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    username: user.username,
  };
}

/** Resolve contributor profiles when the API only returned createdById. */
export async function resolveMissingStudioContributors(
  getToken: () => Promise<string | null>,
  places: StudioPlaceDto[],
): Promise<StudioPlaceDto[]> {
  const missingIds = [
    ...new Set(
      places
        .filter((place) => !place.contributor && place.createdById)
        .map((place) => place.createdById as string),
    ),
  ];
  if (missingIds.length === 0) return places;

  const contributorsById = new Map<string, StudioContributorDto>();
  await Promise.all(
    missingIds.map(async (userId) => {
      const user = await fetchStudioUserById(getToken, userId);
      if (user) {
        contributorsById.set(userId, studioContributorFromUser({ ...user, secret: user.id }));
      }
    }),
  );

  return mergeStudioPlaceContributors(places, contributorsById);
}

/** D1 stores tags as JSON; Studio list items should be arrays but normalize defensively. */
export function normalizeStudioPlaceTags(tags: string[] | string | null | undefined): PlaceTagId[] {
  if (Array.isArray(tags)) return filterValidPlaceTags(tags);
  if (typeof tags === 'string' && tags.trim()) {
    try {
      const parsed: unknown = JSON.parse(tags);
      if (!Array.isArray(parsed)) return [];
      return filterValidPlaceTags(parsed.filter((tag): tag is string => typeof tag === 'string'));
    } catch {
      return [];
    }
  }
  return [];
}
