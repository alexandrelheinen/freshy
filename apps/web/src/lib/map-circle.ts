/** GeoJSON polygon approximating a circle on the Earth's surface. */
export function circlePolygonGeoJson(
  latitude: number,
  longitude: number,
  radiusKm: number,
  points = 64,
): {
  type: 'Feature';
  properties: Record<string, never>;
  geometry: { type: 'Polygon'; coordinates: [number, number][][] };
} {
  const radiusM = radiusKm * 1000;
  const coordinates: [number, number][] = [];

  for (let index = 0; index <= points; index += 1) {
    const angle = (index / points) * 2 * Math.PI;
    const dx = radiusM * Math.cos(angle);
    const dy = radiusM * Math.sin(angle);
    const deltaLng = dx / (111_320 * Math.cos((latitude * Math.PI) / 180));
    const deltaLat = dy / 110_540;
    coordinates.push([longitude + deltaLng, latitude + deltaLat]);
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
  };
}
