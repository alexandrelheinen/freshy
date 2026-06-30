const MAPBOX_GEOCODE_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

export interface GeocodedLocation {
  latitude: number;
  longitude: number;
}

function resolveMapboxToken(explicit?: string): string | undefined {
  return explicit ?? process.env.MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
}

/** Forward-geocode a street address via Mapbox. Returns null when token is missing or no match. */
export async function geocodeAddress(
  address: string,
  mapboxToken?: string,
): Promise<GeocodedLocation | null> {
  const token = resolveMapboxToken(mapboxToken);
  const trimmed = address.trim();
  if (!token || trimmed.length < 3) return null;

  const url = new URL(`${MAPBOX_GEOCODE_BASE}/${encodeURIComponent(trimmed)}.json`);
  url.searchParams.set('access_token', token);
  url.searchParams.set('limit', '1');

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const payload = (await res.json()) as {
    features?: Array<{ center?: [number, number] }>;
  };
  const center = payload.features?.[0]?.center;
  if (!center || center.length < 2) return null;

  return { longitude: center[0]!, latitude: center[1]! };
}

export function isGeocodingConfigured(mapboxToken?: string): boolean {
  return Boolean(resolveMapboxToken(mapboxToken));
}
