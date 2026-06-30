export type PlaceTagId = 'calm' | 'comfortable' | 'pet_friendly' | 'shaded' | 'quiet' | 'free_wifi';

export interface PlaceTagDefinition {
  id: PlaceTagId;
  label: string;
  icon: string;
}

export interface PlaceTagConfig {
  tags: PlaceTagDefinition[];
}

/** Runtime tag catalog. Keep in sync with place-tags.yaml. */
export const PLACE_TAGS: readonly PlaceTagDefinition[] = [
  { id: 'calm', label: 'Calm', icon: 'spa' },
  { id: 'comfortable', label: 'Comfortable', icon: 'event_seat' },
  { id: 'pet_friendly', label: 'Pet Friendly', icon: 'pets' },
  { id: 'shaded', label: 'Shaded', icon: 'wb_shade' },
  { id: 'quiet', label: 'Quiet', icon: 'volume_off' },
  { id: 'free_wifi', label: 'Free Wi-Fi', icon: 'wifi' },
] as const satisfies readonly PlaceTagDefinition[];

export const PLACE_TAG_IDS: PlaceTagId[] = PLACE_TAGS.map((tag) => tag.id);

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
