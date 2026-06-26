/** Design tokens from docs/stitch/freshy/DESIGN.md */
export const freshyColors = {
  surface: '#f7f9fb',
  'surface-dim': '#d8dadc',
  'surface-bright': '#f7f9fb',
  'surface-container-lowest': '#ffffff',
  'surface-container-low': '#f2f4f6',
  'surface-container': '#eceef0',
  'surface-container-high': '#e6e8ea',
  'surface-container-highest': '#e0e3e5',
  'on-surface': '#191c1e',
  'on-surface-variant': '#3f484c',
  'inverse-surface': '#2d3133',
  'inverse-on-surface': '#eff1f3',
  outline: '#6f787d',
  'outline-variant': '#bfc8cd',
  'surface-tint': '#0c6780',
  primary: '#0c6780',
  'on-primary': '#ffffff',
  'primary-container': '#87ceeb',
  'on-primary-container': '#005870',
  'inverse-primary': '#89d0ed',
  secondary: '#4f616a',
  'on-secondary': '#ffffff',
  'secondary-container': '#cfe3ee',
  'on-secondary-container': '#53656f',
  tertiary: '#446464',
  'on-tertiary': '#ffffff',
  'tertiary-container': '#a9cbcb',
  'on-tertiary-container': '#375757',
  error: '#ba1a1a',
  'on-error': '#ffffff',
  'error-container': '#ffdad6',
  'on-error-container': '#93000a',
  'primary-fixed': '#baeaff',
  'primary-fixed-dim': '#89d0ed',
  'on-primary-fixed': '#001f29',
  'on-primary-fixed-variant': '#004d62',
  'secondary-fixed': '#d2e6f0',
  'secondary-fixed-dim': '#b6c9d4',
  'on-secondary-fixed': '#0b1e26',
  'on-secondary-fixed-variant': '#374952',
  'tertiary-fixed': '#c6e9e9',
  'tertiary-fixed-dim': '#abcdcd',
  'on-tertiary-fixed': '#002020',
  'on-tertiary-fixed-variant': '#2c4c4c',
  background: '#f7f9fb',
  'on-background': '#191c1e',
  'surface-variant': '#e0e3e5',
} as const;

export const freshySpacing = {
  base: '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  'margin-mobile': '20px',
  'gutter-mobile': '12px',
} as const;

export const freshyTypography = {
  'display-lg': {
    fontSize: '36px',
    lineHeight: '44px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  'headline-lg': {
    fontSize: '28px',
    lineHeight: '34px',
    fontWeight: '600',
    letterSpacing: '-0.01em',
  },
  'headline-lg-mobile': {
    fontSize: '24px',
    lineHeight: '30px',
    fontWeight: '600',
  },
  'title-md': {
    fontSize: '18px',
    lineHeight: '24px',
    fontWeight: '600',
  },
  'body-lg': {
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: '400',
  },
  'body-sm': {
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: '400',
  },
  'label-caps': {
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: '700',
    letterSpacing: '0.05em',
  },
} as const;

const preset = {
  theme: {
    extend: {
      colors: freshyColors,
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
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      spacing: freshySpacing,
    },
  },
};

export default preset;
