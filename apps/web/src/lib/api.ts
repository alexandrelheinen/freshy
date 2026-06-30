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
  amenities?: string[];
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

export function acStrengthLevel(strength: PlaceDto['aggregatedAcStrength']): 1 | 2 | 3 {
  if (strength === 'FRIGID') return 3;
  if (strength === 'COMFORTABLE') return 2;
  return 1;
}

export function directionsUrl(lat: number, lng: number, label: string): string {
  const q = encodeURIComponent(`${label}@${lat},${lng}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}
