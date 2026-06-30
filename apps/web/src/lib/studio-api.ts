import type { PlaceDto } from './api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type StudioPlaceStatus = 'verified' | 'pending' | 'duplicate';

export interface StudioPlaceDto extends PlaceDto {
  status: 'DRAFT' | 'PUBLISHED';
  studioStatus: StudioPlaceStatus;
  duplicateOfId: string | null;
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
  averageTemperatureC: number | null;
}

export interface UpdateStudioPlacePayload {
  name?: string;
  description?: string | null;
  category?: string;
  address?: string | null;
  latitude?: number;
  longitude?: number;
  aggregatedTemperatureC?: number | null;
  aggregatedAcStrength?: 'LIGHTLY_COOLED' | 'COMFORTABLE' | 'FRIGID' | null;
  amenities?: string[];
  isOpen?: boolean;
  status?: 'DRAFT' | 'PUBLISHED';
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
): Promise<boolean> {
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
