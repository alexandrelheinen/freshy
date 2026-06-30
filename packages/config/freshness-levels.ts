export type FreshnessTone = 'neutral' | 'blue' | 'green';

export type FreshnessLevelId =
  | 'NONE'
  | 'GOOD_VENTILATION'
  | 'MODEST_AC'
  | 'VERY_COLD_AC'
  | 'NATURALLY_FRESH';

export interface FreshnessLevelDefinition {
  id: FreshnessLevelId;
  level: number;
  label: string;
  shortLabel: string;
  description: string;
  barSegments: number;
  tone: FreshnessTone;
}

export interface FreshnessLevelConfig {
  levels: FreshnessLevelDefinition[];
}

/** Runtime freshness catalog. Keep in sync with freshness-levels.yaml. */
export const FRESHNESS_LEVELS: readonly FreshnessLevelDefinition[] = [
  {
    id: 'NONE',
    level: 0,
    label: 'No Cooling',
    shortLabel: 'None',
    description:
      'No air conditioning or mechanical cooling. Rare, for iconic spots that stay cool on their own.',
    barSegments: 0,
    tone: 'neutral',
  },
  {
    id: 'GOOD_VENTILATION',
    level: 1,
    label: 'Good Ventilation',
    shortLabel: 'Ventilated',
    description: 'Natural airflow or light mechanical ventilation without strong air conditioning.',
    barSegments: 1,
    tone: 'blue',
  },
  {
    id: 'MODEST_AC',
    level: 2,
    label: 'Modest AC',
    shortLabel: 'Pleasant AC',
    description: 'Pleasant, modest air conditioning that keeps the space comfortable.',
    barSegments: 2,
    tone: 'blue',
  },
  {
    id: 'VERY_COLD_AC',
    level: 3,
    label: 'Very Cold AC',
    shortLabel: 'Frigid',
    description: 'Powerful air conditioning for maximum relief on hot days.',
    barSegments: 3,
    tone: 'blue',
  },
  {
    id: 'NATURALLY_FRESH',
    level: 4,
    label: 'Naturally Fresh',
    shortLabel: 'Natural',
    description:
      'Naturally cool thanks to shade, water, or greenery. The pinnacle of quality of life.',
    barSegments: 3,
    tone: 'green',
  },
] as const satisfies readonly FreshnessLevelDefinition[];

export const FRESHNESS_LEVEL_IDS: FreshnessLevelId[] = FRESHNESS_LEVELS.map((level) => level.id);

export const FRESHNESS_LEVEL_LABELS: Record<FreshnessLevelId, string> = Object.fromEntries(
  FRESHNESS_LEVELS.map((level) => [level.id, level.label]),
) as Record<FreshnessLevelId, string>;

export const FRESHNESS_LEVEL_SHORT_LABELS: Record<FreshnessLevelId, string> = Object.fromEntries(
  FRESHNESS_LEVELS.map((level) => [level.id, level.shortLabel]),
) as Record<FreshnessLevelId, string>;

export const FRESHNESS_LEVEL_DESCRIPTIONS: Record<FreshnessLevelId, string> = Object.fromEntries(
  FRESHNESS_LEVELS.map((level) => [level.id, level.description]),
) as Record<FreshnessLevelId, string>;

export function freshnessBarSegments(level: FreshnessLevelId | null | undefined): number {
  if (!level) return 0;
  const definition = FRESHNESS_LEVELS.find((entry) => entry.id === level);
  return definition?.barSegments ?? 0;
}

export function freshnessTone(level: FreshnessLevelId | null | undefined): FreshnessTone {
  if (!level) return 'neutral';
  const definition = FRESHNESS_LEVELS.find((entry) => entry.id === level);
  return definition?.tone ?? 'neutral';
}

export function freshnessLevelScore(level: FreshnessLevelId | null | undefined): number | null {
  if (!level) return null;
  const definition = FRESHNESS_LEVELS.find((entry) => entry.id === level);
  return definition?.level ?? null;
}

export function isFreshnessLevelId(value: string): value is FreshnessLevelId {
  return FRESHNESS_LEVEL_IDS.includes(value as FreshnessLevelId);
}
