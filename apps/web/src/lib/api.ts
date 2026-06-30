const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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
  aggregatedTemperatureC: number | null;
  aggregatedAcStrength: 'LIGHTLY_COOLED' | 'COMFORTABLE' | 'FRIGID' | null;
  isOpen?: boolean;
  distanceKm?: number;
}

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

export async function fetchPlaces(params?: {
  lat?: number;
  lng?: number;
  radius?: number;
  category?: string;
  q?: string;
}): Promise<PlaceDto[]> {
  const search = new URLSearchParams();
  if (params?.lat != null) search.set('lat', String(params.lat));
  if (params?.lng != null) search.set('lng', String(params.lng));
  if (params?.radius != null) search.set('radius', String(params.radius));
  if (params?.category) search.set('category', params.category);
  if (params?.q) search.set('q', params.q);

  const res = await fetch(`${API_BASE}/places?${search.toString()}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data: PlaceDto[] };
  return json.data;
}

export async function fetchCategoryMeta(): Promise<CategoryMeta | null> {
  const res = await fetch(`${API_BASE}/places/meta/categories`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: CategoryMeta };
  return json.data;
}

export async function fetchPlace(slug: string): Promise<PlaceDetailDto | null> {
  const res = await fetch(`${API_BASE}/places/${slug}`, { next: { revalidate: 30 } });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const json = (await res.json()) as { data: PlaceDetailDto };
  return json.data;
}

export function formatDistance(km: number | undefined): string {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export function acStrengthLevel(strength: PlaceDto['aggregatedAcStrength']): 1 | 2 | 3 {
  if (strength === 'FRIGID') return 3;
  if (strength === 'COMFORTABLE') return 2;
  return 1;
}

export function directionsUrl(lat: number, lng: number, label: string): string {
  const q = encodeURIComponent(`${label}@${lat},${lng}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}
