/** Web Mercator zoom level that fits a search radius (km) in the viewport width. */
export function zoomForRadiusKm(latitude: number, radiusKm: number, viewportWidthPx = 400): number {
  const diameterM = radiusKm * 1000 * 2;
  const metersPerPixel = diameterM / viewportWidthPx;
  const latRad = (latitude * Math.PI) / 180;
  const worldMetersPerPixel = 156543.03392 * Math.cos(latRad);
  const zoom = Math.log2(worldMetersPerPixel / metersPerPixel);
  return Math.min(18, Math.max(2, zoom));
}
