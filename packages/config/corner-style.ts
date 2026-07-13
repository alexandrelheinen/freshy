/** App-wide corner style. Change this single value to switch the whole UI. */
export const CORNER_STYLES = ['rounded', 'sharp'] as const;

export type CornerStyle = (typeof CORNER_STYLES)[number];

/**
 * Corner style for buttons, cards, and containers.
 * - `rounded`: default theme radii (pill chips, rounded cards)
 * - `sharp`: square corners with subtle fill-matched borders
 */
export const CORNER_STYLE: CornerStyle = 'rounded';

export function isCornerStyle(value: string | null | undefined): value is CornerStyle {
  return value === 'rounded' || value === 'sharp';
}
