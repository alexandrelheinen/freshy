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
  aggregatedFreshnessLevel:
    | 'NONE'
    | 'GOOD_VENTILATION'
    | 'MODEST_AC'
    | 'VERY_COLD_AC'
    | 'NATURALLY_FRESH';
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED';
}

export type CreatePlaceResult = { ok: true; slug: string } | { ok: false; error: string };

export function createPlaceErrorMessage(status: number, body: unknown): string {
  if (status === 401) {
    return 'Your session expired. Sign in again and retry.';
  }
  if (status === 503) {
    const errorText =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : '';
    if (errorText === 'Database unavailable') {
      return 'The server database is unavailable. Migrations may need to run, or Neon may be paused. Try again in a few minutes.';
    }
    if (errorText === 'Auth not configured') {
      return 'Sign-in is not configured on the API. Contact support.';
    }
    if (errorText === 'Could not sync user') {
      return 'Could not sync your account. Try signing out and back in.';
    }
    return 'Service temporarily unavailable. Try again in a few minutes.';
  }
  if (status === 400) {
    return 'Check the form: name needs at least 2 characters, address at least 3.';
  }
  return 'Could not save place. Check your connection and try again.';
}

export async function createUserPlace(
  getToken: () => Promise<string | null>,
  payload: CreatePlacePayload,
): Promise<CreatePlaceResult> {
  try {
    const res = await authFetch('/users/me/places', getToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as unknown;
      return { ok: false, error: createPlaceErrorMessage(res.status, body) };
    }
    const json = (await res.json()) as { data: { slug: string } };
    return { ok: true, slug: json.data.slug };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    if (message === 'Not signed in') {
      return { ok: false, error: 'Sign in to submit a place.' };
    }
    return { ok: false, error: 'Could not reach the API. Check your connection and try again.' };
  }
}
