export const MAP_STYLES = {
  streets: 'mapbox://styles/mapbox/light-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
} as const;

export type MapStyleId = keyof typeof MAP_STYLES;

export function mapStyleUrl(id: MapStyleId): string {
  return MAP_STYLES[id];
}
