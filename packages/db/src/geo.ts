/** Geo helpers for places API and seed scripts. */
export { PILOT_CITY } from '@freshy/config/pilot-city';

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in kilometers between two WGS84 points. */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface PlaceWithDistance<T extends { latitude: number; longitude: number }> {
  place: T;
  distanceKm: number;
}

/** Filter and sort places within radius (km) from a center point. */
export function filterPlacesByRadius<T extends { latitude: number; longitude: number }>(
  places: T[],
  centerLat: number,
  centerLng: number,
  radiusKm: number,
): PlaceWithDistance<T>[] {
  return places
    .map((place) => ({
      place,
      distanceKm: haversineDistanceKm(centerLat, centerLng, place.latitude, place.longitude),
    }))
    .filter(({ distanceKm }) => distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
