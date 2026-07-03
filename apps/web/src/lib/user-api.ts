import type { PlaceDto } from './api';
import { API_BASE } from './api-base';

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

export interface ProfileFetchResult {
  profile: UserProfileDto | null;
  error: string | null;
}

async function authFetch(
  path: string,
  getToken: () => Promise<string | null>,
  init?: RequestInit,
): Promise<Response | null> {
  try {
    const token = await getToken();
    if (!token) return null;
    return await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    return null;
  }
}

export function profileErrorMessage(status: number, body: unknown): string {
  if (status === 401) {
    return 'Your session expired. Sign in again and retry.';
  }
  if (status === 503) {
    const errorText =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : '';
    if (errorText === 'Database unavailable') {
      return 'The server database is unavailable. D1 migrations may need to run. Try again in a few minutes.';
    }
    if (errorText === 'Auth not configured') {
      return 'Sign-in is not configured on the API. Contact support.';
    }
    if (errorText === 'Could not sync user') {
      return 'Could not sync your account. Try signing out and back in.';
    }
    return 'Service temporarily unavailable. Try again in a few minutes.';
  }
  return 'Could not load profile. Check that the API is running and Clerk is configured.';
}

export async function fetchMyProfile(
  getToken: () => Promise<string | null>,
): Promise<ProfileFetchResult> {
  const res = await authFetch('/users/me', getToken);
  if (!res) {
    return { profile: null, error: 'Sign in to view your profile.' };
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as unknown;
    return { profile: null, error: profileErrorMessage(res.status, body) };
  }
  const json = (await res.json()) as { data: UserProfileDto };
  return { profile: json.data, error: null };
}

export async function fetchMyContributorSecret(
  getToken: () => Promise<string | null>,
): Promise<string | null> {
  const res = await authFetch('/users/me/contributor-secret', getToken);
  if (!res?.ok) return null;
  const json = (await res.json()) as { data: { secret: string } };
  return json.data.secret ?? null;
}

export async function fetchMySavedPlaces(
  getToken: () => Promise<string | null>,
): Promise<PlaceDto[]> {
  const res = await authFetch('/users/me/saved', getToken);
  if (!res?.ok) return [];
  const json = (await res.json()) as { data: PlaceDto[] };
  return json.data ?? [];
}

export function deleteAccountErrorMessage(status: number, body: unknown): string {
  if (status === 401) {
    return 'Your session expired. Sign in again and retry.';
  }
  if (status === 503) {
    const errorText =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : '';
    if (errorText === 'Could not delete account') {
      return 'Could not delete your account. Try again in a few minutes.';
    }
    return 'Service temporarily unavailable. Try again in a few minutes.';
  }
  return 'Could not delete your account. Try again.';
}

export type DeleteAccountResult = { ok: true } | { ok: false; error: string };

export async function deleteMyAccount(
  getToken: () => Promise<string | null>,
): Promise<DeleteAccountResult> {
  const res = await authFetch('/users/me', getToken, { method: 'DELETE' });
  if (!res) {
    return { ok: false, error: 'Sign in to delete your account.' };
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as unknown;
    return { ok: false, error: deleteAccountErrorMessage(res.status, body) };
  }
  return { ok: true };
}

export async function fetchIsPlaceSaved(
  getToken: () => Promise<string | null>,
  placeId: string,
): Promise<boolean> {
  const res = await authFetch(`/users/me/saved/${placeId}`, getToken);
  if (!res?.ok) return false;
  const json = (await res.json()) as { data: { saved: boolean } };
  return json.data.saved;
}

export async function savePlaceForUser(
  getToken: () => Promise<string | null>,
  placeId: string,
): Promise<boolean> {
  const res = await authFetch(`/users/me/saved/${placeId}`, getToken, { method: 'POST' });
  return res?.ok ?? false;
}

export async function unsavePlaceForUser(
  getToken: () => Promise<string | null>,
  placeId: string,
): Promise<boolean> {
  const res = await authFetch(`/users/me/saved/${placeId}`, getToken, { method: 'DELETE' });
  return res?.ok ?? false;
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
  if (!res?.ok) return [];
  const json = (await res.json()) as { data: UserReviewDto[] };
  return json.data;
}

export interface CreatePlacePayload {
  name: string;
  category: string;
  address: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  aggregatedFreshnessLevel:
    | 'NONE'
    | 'GOOD_VENTILATION'
    | 'MODEST_AC'
    | 'VERY_COLD_AC'
    | 'NATURALLY_FRESH';
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED';
  photoUrl?: string;
}

export interface CreatePlaceOptions {
  photo?: File | null;
  photoUrl?: string | null;
}

export type CreatePlaceResult = { ok: true; slug: string } | { ok: false; error: string };

export const UNKNOWN_SECRET_MESSAGE =
  'This secret is not recognized. Contact a team member to get one.';

function readApiMessage(body: unknown): string | null {
  if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
    return body.message;
  }
  return null;
}

export function anonymousPlaceErrorMessage(status: number, body: unknown): string {
  if (status === 400) {
    const errorText =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : '';
    if (errorText === 'UNKNOWN_SECRET' || errorText === 'MISSING_SECRET') {
      return readApiMessage(body) ?? UNKNOWN_SECRET_MESSAGE;
    }
    return createPlaceErrorMessage(status, body);
  }
  return createPlaceErrorMessage(status, body);
}

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
      return 'The server database is unavailable. D1 migrations may need to run. Try again in a few minutes.';
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
    const errorText =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : '';
    if (errorText) return errorText;
    return 'Check the form: name needs at least 2 characters, address at least 3.';
  }
  return 'Could not save place. Check your connection and try again.';
}

export async function createUserPlace(
  getToken: () => Promise<string | null>,
  payload: CreatePlacePayload,
  options?: CreatePlaceOptions,
): Promise<CreatePlaceResult> {
  try {
    const photo = options?.photo ?? null;
    const photoUrl = options?.photoUrl?.trim() || payload.photoUrl?.trim() || null;
    let res: Response | null;

    if (photo) {
      const form = new FormData();
      form.append('name', payload.name);
      form.append('category', payload.category);
      form.append('address', payload.address);
      if (payload.description) form.append('description', payload.description);
      if (payload.latitude != null) form.append('latitude', String(payload.latitude));
      if (payload.longitude != null) form.append('longitude', String(payload.longitude));
      form.append('aggregatedFreshnessLevel', payload.aggregatedFreshnessLevel);
      form.append('tags', JSON.stringify(payload.tags));
      form.append('photo', photo);
      res = await authFetch('/users/me/places', getToken, { method: 'POST', body: form });
    } else {
      const body: CreatePlacePayload = { ...payload };
      if (photoUrl) body.photoUrl = photoUrl;
      res = await authFetch('/users/me/places', getToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    if (!res) {
      return { ok: false, error: 'Sign in to submit a place.' };
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as unknown;
      return { ok: false, error: createPlaceErrorMessage(res.status, body) };
    }
    const json = (await res.json()) as { data: { slug: string } };
    return { ok: true, slug: json.data.slug };
  } catch {
    return { ok: false, error: 'Could not reach the API. Check your connection and try again.' };
  }
}

export async function createAnonymousPlace(
  secret: string,
  payload: CreatePlacePayload,
  options?: CreatePlaceOptions,
): Promise<CreatePlaceResult> {
  try {
    const photo = options?.photo ?? null;
    const photoUrl = options?.photoUrl?.trim() || payload.photoUrl?.trim() || null;
    let res: Response;

    if (photo) {
      const form = new FormData();
      form.append('secret', secret.trim());
      form.append('name', payload.name);
      form.append('category', payload.category);
      form.append('address', payload.address);
      if (payload.description) form.append('description', payload.description);
      if (payload.latitude != null) form.append('latitude', String(payload.latitude));
      if (payload.longitude != null) form.append('longitude', String(payload.longitude));
      form.append('aggregatedFreshnessLevel', payload.aggregatedFreshnessLevel);
      form.append('tags', JSON.stringify(payload.tags));
      form.append('photo', photo);
      res = await fetch(`${API_BASE}/contributions/places`, { method: 'POST', body: form });
    } else {
      const body: CreatePlacePayload & { secret: string } = {
        ...payload,
        secret: secret.trim(),
      };
      if (photoUrl) body.photoUrl = photoUrl;
      res = await fetch(`${API_BASE}/contributions/places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as unknown;
      return { ok: false, error: anonymousPlaceErrorMessage(res.status, body) };
    }
    const json = (await res.json()) as { data: { slug: string } };
    return { ok: true, slug: json.data.slug };
  } catch {
    return { ok: false, error: 'Could not reach the API. Check your connection and try again.' };
  }
}
