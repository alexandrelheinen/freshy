import type { LocationErrorCode } from './location-context';

export function locationStatusMessage(options: {
  permissionDenied: boolean;
  locationError: LocationErrorCode;
  searchRadiusKm: number;
  usingGps: boolean;
}): string | null {
  const { permissionDenied, locationError, searchRadiusKm, usingGps } = options;

  if (permissionDenied) {
    return 'Allow location access to discover cool places near you. Open this site in your browser settings, enable location, then tap Use my location again.';
  }

  if (locationError === 'timeout') {
    return `Could not get a GPS fix. Showing results within ${searchRadiusKm} km of your last map area. Tap Use my location to retry.`;
  }

  if (locationError === 'unavailable') {
    return `GPS is unavailable on this device. Showing results within ${searchRadiusKm} km of your last map area.`;
  }

  if (!usingGps) {
    return 'Allow location access to discover cool places near you, or pan the map to search another area.';
  }

  return null;
}
