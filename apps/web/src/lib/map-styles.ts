import type { ThemeId } from '@freshy/theme/tokens';

export const MAP_STYLES = {
  streets: 'mapbox://styles/mapbox/light-v11',
  streetsDark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
} as const;

export type MapStyleId = 'streets' | 'satellite';

export function mapStyleUrl(id: MapStyleId, resolvedTheme: ThemeId = 'default'): string {
  if (id === 'streets' && resolvedTheme === 'dark') {
    return MAP_STYLES.streetsDark;
  }
  return MAP_STYLES[id];
}
