import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

export interface PlaceTagDefinition {
  id: string;
  label: string;
  icon: string;
}

export interface PlaceTagConfig {
  tags: PlaceTagDefinition[];
}

const configDir = __dirname;

function resolveYamlPath(): string {
  const candidates = [join(configDir, 'place-tags.yaml'), join(configDir, '..', 'place-tags.yaml')];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error('place-tags.yaml not found');
}

/** Load tag definitions from place-tags.yaml (Node.js only). */
export function loadPlaceTagsFromYaml(): PlaceTagConfig {
  const yamlPath = resolveYamlPath();
  return parse(readFileSync(yamlPath, 'utf8')) as PlaceTagConfig;
}

/**
 * Runtime tag catalog. Keep in sync with place-tags.yaml.
 * Used by web and API bundles that cannot read the filesystem at runtime.
 */
export const PLACE_TAGS: readonly PlaceTagDefinition[] = [
  { id: 'calm', label: 'Calm', icon: 'spa' },
  { id: 'comfortable', label: 'Comfortable', icon: 'event_seat' },
  { id: 'pet_friendly', label: 'Pet Friendly', icon: 'pets' },
  { id: 'shaded', label: 'Shaded', icon: 'wb_shade' },
  { id: 'quiet', label: 'Quiet', icon: 'volume_off' },
  { id: 'free_wifi', label: 'Free Wi-Fi', icon: 'wifi' },
] as const;

export type PlaceTagId = (typeof PLACE_TAGS)[number]['id'];

export const PLACE_TAG_IDS: PlaceTagId[] = PLACE_TAGS.map((tag) => tag.id as PlaceTagId);

export const PLACE_TAG_LABELS: Record<PlaceTagId, string> = Object.fromEntries(
  PLACE_TAGS.map((tag) => [tag.id, tag.label]),
) as Record<PlaceTagId, string>;

export const PLACE_TAG_ICONS: Record<PlaceTagId, string> = Object.fromEntries(
  PLACE_TAGS.map((tag) => [tag.id, tag.icon]),
) as Record<PlaceTagId, string>;

export function isPlaceTagId(value: string): value is PlaceTagId {
  return PLACE_TAG_IDS.includes(value as PlaceTagId);
}

export function filterValidPlaceTags(tags: string[]): PlaceTagId[] {
  return tags.filter(isPlaceTagId);
}
