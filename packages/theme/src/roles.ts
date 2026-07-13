/** Required semantic color roles every theme must define. */
export const COLOR_ROLES = [
  'surface',
  'surface-dim',
  'surface-bright',
  'surface-container-lowest',
  'surface-container-low',
  'surface-container',
  'surface-container-high',
  'surface-container-highest',
  'on-surface',
  'on-surface-variant',
  'inverse-surface',
  'inverse-on-surface',
  'outline',
  'outline-variant',
  'surface-tint',
  'primary',
  'on-primary',
  'primary-container',
  'on-primary-container',
  'inverse-primary',
  'secondary',
  'on-secondary',
  'secondary-container',
  'on-secondary-container',
  'tertiary',
  'on-tertiary',
  'tertiary-container',
  'on-tertiary-container',
  'error',
  'on-error',
  'error-container',
  'on-error-container',
  'primary-fixed',
  'primary-fixed-dim',
  'on-primary-fixed',
  'on-primary-fixed-variant',
  'secondary-fixed',
  'secondary-fixed-dim',
  'on-secondary-fixed',
  'on-secondary-fixed-variant',
  'tertiary-fixed',
  'tertiary-fixed-dim',
  'on-tertiary-fixed',
  'on-tertiary-fixed-variant',
  'background',
  'on-background',
  'surface-variant',
  'success',
  'on-success',
  'success-container',
  'on-success-container',
  'warning',
  'on-warning',
  'warning-container',
  'on-warning-container',
  'glass-surface',
  'glass-border',
  'glass-highlight',
  'scrim-strong',
  'scrim-weak',
  'on-scrim',
  'marker-border',
  'marker-label-bg',
  'marker-ring',
] as const;

export type ColorRole = (typeof COLOR_ROLES)[number];

export const SHADOW_ROLES = ['card', 'card-elevated', 'nav', 'floating'] as const;

export type ShadowRole = (typeof SHADOW_ROLES)[number];

export function colorCssVar(role: ColorRole): string {
  return `--color-${role}`;
}

export function colorVarRef(role: ColorRole): string {
  return `var(--color-${role})`;
}

export function shadowCssVar(role: ShadowRole): string {
  return `--shadow-${role}`;
}

export function shadowVarRef(role: ShadowRole): string {
  return `var(--shadow-${role})`;
}

/** Radius scale keys emitted as CSS variables (--radius-*). */
export const RADIUS_ROLES = ['sm', 'default', 'md', 'lg', 'xl', '2xl', '3xl', 'full'] as const;

export type RadiusRole = (typeof RADIUS_ROLES)[number];

export function radiusCssVar(role: RadiusRole): string {
  return `--radius-${role}`;
}

export function radiusVarRef(role: RadiusRole): string {
  return `var(--radius-${role})`;
}
