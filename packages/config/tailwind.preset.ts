import { getDefaultThemeTokens } from '@freshy/theme/tokens';
import {
  COLOR_ROLES,
  SHADOW_ROLES,
  colorVarRef,
  shadowVarRef,
  type ColorRole,
  type ShadowRole,
} from '@freshy/theme/roles';

const defaultTheme = getDefaultThemeTokens();

export const freshyColors = Object.fromEntries(
  COLOR_ROLES.map((role: ColorRole) => [role, colorVarRef(role)]),
) as Record<ColorRole, string>;

export const freshyShadows = Object.fromEntries(
  SHADOW_ROLES.map((role: ShadowRole) => [role, shadowVarRef(role)]),
) as Record<ShadowRole, string>;

export const freshySpacing = defaultTheme.spacing;

export const freshyTypography = defaultTheme.typography;

const preset = {
  theme: {
    extend: {
      colors: freshyColors,
      boxShadow: {
        ...freshyShadows,
        sm: 'var(--shadow-floating)',
      },
      backdropBlur: {
        glass: 'var(--effect-glass-blur)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': [
          freshyTypography['display-lg'].fontSize,
          {
            lineHeight: freshyTypography['display-lg'].lineHeight,
            fontWeight: freshyTypography['display-lg'].fontWeight,
            letterSpacing: freshyTypography['display-lg'].letterSpacing,
          },
        ],
        'headline-lg': [
          freshyTypography['headline-lg'].fontSize,
          {
            lineHeight: freshyTypography['headline-lg'].lineHeight,
            fontWeight: freshyTypography['headline-lg'].fontWeight,
            letterSpacing: freshyTypography['headline-lg'].letterSpacing,
          },
        ],
        'headline-lg-mobile': [
          freshyTypography['headline-lg-mobile'].fontSize,
          {
            lineHeight: freshyTypography['headline-lg-mobile'].lineHeight,
            fontWeight: freshyTypography['headline-lg-mobile'].fontWeight,
          },
        ],
        'title-md': [
          freshyTypography['title-md'].fontSize,
          {
            lineHeight: freshyTypography['title-md'].lineHeight,
            fontWeight: freshyTypography['title-md'].fontWeight,
          },
        ],
        'body-lg': [
          freshyTypography['body-lg'].fontSize,
          {
            lineHeight: freshyTypography['body-lg'].lineHeight,
            fontWeight: freshyTypography['body-lg'].fontWeight,
          },
        ],
        'body-sm': [
          freshyTypography['body-sm'].fontSize,
          {
            lineHeight: freshyTypography['body-sm'].lineHeight,
            fontWeight: freshyTypography['body-sm'].fontWeight,
          },
        ],
        'label-caps': [
          freshyTypography['label-caps'].fontSize,
          {
            lineHeight: freshyTypography['label-caps'].lineHeight,
            fontWeight: freshyTypography['label-caps'].fontWeight,
            letterSpacing: freshyTypography['label-caps'].letterSpacing,
          },
        ],
      },
      borderRadius: {
        sm: defaultTheme.radius.sm,
        DEFAULT: defaultTheme.radius.default,
        md: defaultTheme.radius.md,
        lg: defaultTheme.radius.lg,
        xl: defaultTheme.radius.xl,
        full: defaultTheme.radius.full,
      },
      spacing: freshySpacing,
    },
  },
};

export default preset;
