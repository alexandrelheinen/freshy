/** Font role definitions compiled from theme YAML. */

export const FONT_ROLES = ['sans', 'logo'] as const;

export type FontRole = (typeof FONT_ROLES)[number];

export interface FontDefinition {
  family: string;
  fallbacks: readonly string[];
  weights: readonly number[];
  letterSpacing?: string;
  /** Vertical nudge for wordmark optical centering (e.g. `-0.05em`). */
  baselineOffset?: string;
}

export type ThemeFonts = Record<FontRole, FontDefinition>;

export function quoteFontFamily(family: string): string {
  return family.includes(' ') ? `"${family}"` : family;
}

export function fontStack(definition: FontDefinition): string[] {
  return [quoteFontFamily(definition.family), ...definition.fallbacks];
}

/** Build a Google Fonts CSS2 href for every family referenced in the theme. */
export function buildGoogleFontsHref(fonts: ThemeFonts): string {
  const byFamily = new Map<string, Set<number>>();

  for (const role of FONT_ROLES) {
    const definition = fonts[role];
    const weights = byFamily.get(definition.family) ?? new Set<number>();
    for (const weight of definition.weights) {
      weights.add(weight);
    }
    byFamily.set(definition.family, weights);
  }

  const families = [...byFamily.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, weights]) => {
      const sortedWeights = [...weights].sort((a, b) => a - b).join(';');
      const encodedFamily = encodeURIComponent(family).replace(/%20/g, '+');
      return `family=${encodedFamily}:wght@${sortedWeights}`;
    })
    .join('&');

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
