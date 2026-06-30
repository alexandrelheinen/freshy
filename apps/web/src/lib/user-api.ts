import type { PlaceDto } from './api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface UserProfileDto {
  id: string;
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  reliefPoints: number;
  reviewCount: number;
  savedCount: number;
}

async function authFetch(
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

export async function fetchMyProfile(
  getToken: () => Promise<string | null>,
): Promise<UserProfileDto | null> {
  const res = await authFetch('/users/me', getToken);
  if (!res.ok) return null;
  const json = (await res.json()) as { data: UserProfileDto };
  return json.data;
}

export async function fetchMySavedPlaces(
  getToken: () => Promise<string | null>,
): Promise<PlaceDto[]> {
  const res = await authFetch('/users/me/saved', getToken);
  if (!res.ok) return [];
  const json = (await res.json()) as { data: PlaceDto[] };
  return json.data;
}

export async function fetchIsPlaceSaved(
  getToken: () => Promise<string | null>,
  placeId: string,
): Promise<boolean> {
  const res = await authFetch(`/users/me/saved/${placeId}`, getToken);
  if (!res.ok) return false;
  const json = (await res.json()) as { data: { saved: boolean } };
  return json.data.saved;
}

export async function savePlaceForUser(
  getToken: () => Promise<string | null>,
  placeId: string,
): Promise<boolean> {
  const res = await authFetch(`/users/me/saved/${placeId}`, getToken, { method: 'POST' });
  return res.ok;
}

export async function unsavePlaceForUser(
  getToken: () => Promise<string | null>,
  placeId: string,
): Promise<boolean> {
  const res = await authFetch(`/users/me/saved/${placeId}`, getToken, { method: 'DELETE' });
  return res.ok;
}

export interface UserReviewDto {
  id: string;
  comment: string | null;
  acStrength: number;
  createdAt: string;
  place: {
    id: string;
    slug: string;
    name: string;
    category: string;
  };
}

export async function fetchMyReviews(
  getToken: () => Promise<string | null>,
): Promise<UserReviewDto[]> {
  const res = await authFetch('/users/me/reviews', getToken);
  if (!res.ok) return [];
  const json = (await res.json()) as { data: UserReviewDto[] };
  return json.data;
}

export interface CreatePlacePayload {
  name: string;
  category: string;
  address: string;
  description?: string;
  latitude: number;
  longitude: number;
  aggregatedTemperatureC: number;
  aggregatedAcStrength: 'LIGHTLY_COOLED' | 'COMFORTABLE' | 'FRIGID';
  amenities: string[];
  status: 'DRAFT' | 'PUBLISHED';
}

export async function createUserPlace(
  getToken: () => Promise<string | null>,
  payload: CreatePlacePayload,
): Promise<{ slug: string } | null> {
  const res = await authFetch('/users/me/places', getToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: { slug: string } };
  return json.data;
}
