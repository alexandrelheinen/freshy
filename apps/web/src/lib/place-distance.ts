import type { PlaceDto } from './api';
import { formatDistanceWithWalk } from './api';
import type { UserCoords } from './location-context';

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

/** Distance from the user's GPS position to a place. Returns undefined when GPS is unavailable. */
export function distanceKmFromUser(
  place: Pick<PlaceDto, 'latitude' | 'longitude'>,
  user: UserCoords | null,
): number | undefined {
  if (!user) return undefined;
  const km = haversineDistanceKm(user.lat, user.lng, place.latitude, place.longitude);
  return Math.round(km * 100) / 100;
}

/** Distance and walk time from the user's GPS position. Empty when GPS is unavailable. */
export function formatPlaceDistanceFromUser(
  place: Pick<PlaceDto, 'latitude' | 'longitude'>,
  user: UserCoords | null,
): string {
  return formatDistanceWithWalk(distanceKmFromUser(place, user));
}
