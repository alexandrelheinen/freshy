/** Web Mercator zoom level that fits a search radius (km) in the viewport width. */
export function zoomForRadiusKm(latitude: number, radiusKm: number, viewportWidthPx = 400): number {
  const diameterM = radiusKm * 1000 * 2;
  const metersPerPixel = diameterM / viewportWidthPx;
  const latRad = (latitude * Math.PI) / 180;
  const worldMetersPerPixel = 156543.03392 * Math.cos(latRad);
  const zoom = Math.log2(worldMetersPerPixel / metersPerPixel);
  return Math.min(18, Math.max(2, zoom));
}

/** Search radius (km) implied by the current map zoom, rounded to one decimal. */
export function radiusKmFromZoom(latitude: number, zoom: number, viewportWidthPx = 400): number {
  const latRad = (latitude * Math.PI) / 180;
  const metersPerPixel = (156543.03392 * Math.cos(latRad)) / 2 ** zoom;
  const radiusKm = (metersPerPixel * viewportWidthPx) / 2000;
  return Math.round(radiusKm * 10) / 10;
}

/** Clamp search radius to configured min/max bounds. */
export function cappedSearchRadiusKm(
  latitude: number,
  zoom: number,
  maxRadiusKm: number,
  minRadiusKm = 0.1,
  viewportWidthPx = 400,
): number {
  const raw = radiusKmFromZoom(latitude, zoom, viewportWidthPx);
  return Math.min(maxRadiusKm, Math.max(minRadiusKm, raw));
}

/** Format search radius for display (e.g. "5.4 km"). */
export function formatSearchRadiusKm(radiusKm: number): string {
  return `${radiusKm.toFixed(1)} km`;
}
