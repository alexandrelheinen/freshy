import type { LocationErrorCode } from './location-context';

export function locationStatusMessage(options: {
  permissionDenied: boolean;
  locationError: LocationErrorCode;
  searchRadiusKm: number;
  usingGps: boolean;
}): string | null {
  const { permissionDenied, locationError, searchRadiusKm, usingGps } = options;

  if (permissionDenied) {
    return `Location is blocked in your browser. Open this site's settings, allow location access, then tap Use my location again.`;
  }

  if (locationError === 'timeout') {
    return `Could not get a GPS fix. Showing results within ${searchRadiusKm} km of your last map area.`;
  }

  if (locationError === 'unavailable') {
    return `GPS is unavailable on this device. Showing results within ${searchRadiusKm} km of your last map area.`;
  }

  if (!usingGps) {
    return `Showing results within ${searchRadiusKm} km of your last map area. Use my location for results near you.`;
  }

  return null;
}
