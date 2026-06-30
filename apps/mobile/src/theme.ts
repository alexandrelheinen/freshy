import { getDefaultThemeTokens } from '@freshy/theme/tokens';

const { colors } = getDefaultThemeTokens();

/** Semantic shell colors for React Native StyleSheets. */
export const themeColors = {
  background: colors.background,
  surface: colors.surface,
  onSurface: colors['on-surface'],
  onSurfaceVariant: colors['on-surface-variant'],
  primary: colors.primary,
  onPrimary: colors['on-primary'],
  onPrimaryContainer: colors['on-primary-container'],
  primaryContainer: colors['primary-container'],
  secondary: colors.secondary,
  secondaryContainer: colors['secondary-container'],
  onScrim: colors['on-scrim'],
  markerLabelBg: colors['marker-label-bg'],
  glassSurface: colors['glass-surface'],
  glassHighlight: colors['glass-highlight'],
} as const;
