---
name: Freshy
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3f484c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6f787d'
  outline-variant: '#bfc8cd'
  surface-tint: '#0c6780'
  primary: '#0c6780'
  on-primary: '#ffffff'
  primary-container: '#87ceeb'
  on-primary-container: '#005870'
  inverse-primary: '#89d0ed'
  secondary: '#4f616a'
  on-secondary: '#ffffff'
  secondary-container: '#cfe3ee'
  on-secondary-container: '#53656f'
  tertiary: '#446464'
  on-tertiary: '#ffffff'
  tertiary-container: '#a9cbcb'
  on-tertiary-container: '#375757'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#baeaff'
  primary-fixed-dim: '#89d0ed'
  on-primary-fixed: '#001f29'
  on-primary-fixed-variant: '#004d62'
  secondary-fixed: '#d2e6f0'
  secondary-fixed-dim: '#b6c9d4'
  on-secondary-fixed: '#0b1e26'
  on-secondary-fixed-variant: '#374952'
  tertiary-fixed: '#c6e9e9'
  tertiary-fixed-dim: '#abcdcd'
  on-tertiary-fixed: '#002020'
  on-tertiary-fixed-variant: '#2c4c4c'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 20px
  gutter-mobile: 12px
---

## Brand & Style
The brand personality is refreshing, vital, and cooling—acting as a digital "breath of fresh air" for users escaping urban heat. The target audience includes commuters, tourists, and remote workers seeking thermal comfort.

The design style is **Modern Minimalism with Glassmorphic accents**. It prioritizes vast whitespace to evoke a sense of "airiness" and uses translucent, frosted layers to mimic the appearance of chilled glass or ice. The emotional response should be one of immediate relief and clarity.

## Colors
The palette is anchored by **Sky Blue (#87CEEB)**, used for primary actions and active states to represent cooling and open skies. **Crisp White (#FFFFFF)** serves as the primary surface color to maintain a sterile, clean environment.

- **Secondary Blue (#E0F4FF):** A pale ice-blue used for subtle backgrounds and light "cooling" accents.
- **Deep Slate (#2F4F4F):** Used sparingly for high-contrast text and iconography to ensure legibility against light backgrounds.
- **Functional Colors:** Success (Green-Blue) for high AC availability and Warning (Amber) for low capacity/broken AC.

## Typography
**Inter** is utilized for its exceptional legibility and neutral, modern tone. The typographic scale emphasizes hierarchy through weight rather than dramatic size shifts, keeping the interface feeling grounded and professional.

- **Headlines:** Use Semi-Bold weight with slight negative letter-spacing to create a "contained" and clean look.
- **Body Text:** Standard Regular weight with generous line-height to ensure readability while on the move.
- **Labels:** Uppercase bold labels are used for categories (e.g., "COFFEE SHOP", "LIBRARY") to provide quick scanning.

## Layout & Spacing
This design system uses a **Fluid Grid** with a 4px baseline rhythm. For mobile, a 4-column layout is standard, while tablet shifts to an 8-column layout.

- **Margins:** 20px side margins provide enough "breathing room" to prevent the UI from feeling cramped.
- **Vertical Rhythm:** Content blocks are separated by `lg` (24px) spacing to maintain the airy aesthetic.
- **Safe Areas:** Interactive map elements must respect a 16px bottom-safe-area margin to ensure they don't clash with OS-level gestures.

## Elevation & Depth
Depth is conveyed through **Soft Ambient Shadows** and **Backdrop Blurs (Glassmorphism)**. 

- **Surface 0 (Background):** Crisp White or Neutral Slate-50.
- **Surface 1 (Cards):** White with a very soft, diffused shadow (Blur: 20px, Opacity: 4%, Color: Primary Blue tinted).
- **Surface 2 (Overlays/Modals):** Semi-transparent white (80% opacity) with a 15px backdrop blur. This creates the "frosted glass" effect for search bars and navigation headers.
- **Markers:** High-elevation shadows (Opacity: 12%) are used for map markers to make them appear "lifted" above the map plane.

## Shapes
The shape language is consistently **Rounded (Level 2)**. 

- **Standard Elements:** Buttons and input fields use a 0.5rem (8px) radius.
- **Cards & Sheets:** Large containers like location cards or bottom sheets use a 1.5rem (24px) radius on top corners to evoke a friendly, approachable feel.
- **Indicators:** Map markers and status chips use pill-shapes (full rounding) to differentiate them from structural layout elements.

## Components
- **Buttons:** Primary buttons are Sky Blue with white text. Use a subtle inner-glow (white, 10% opacity) on the top edge to give a "cool" tactile feel.
- **Map Markers:** Circular markers with a "snowflake" or "fan" icon. The color intensity of the marker indicates the AC strength (vibrant blue = icy, pale blue = mild).
- **AC Status Indicators:** A horizontal bar with three segments. 
    - 3 segments = "Frigid"
    - 2 segments = "Comfortable"
    - 1 segment = "Lightly Cooled"
- **Input Fields:** Soft grey borders (1px) that transition to Sky Blue on focus. Use "Glassmorphic" backgrounds for search bars overlaid on maps.
- **Chips:** Small, rounded-pill tags for amenities like "Free Wi-Fi" or "Quiet Zone," using the Secondary Blue background.
- **Location Cards:** Featuring a large image, a prominent "Degrees Celsius" indicator, and a "Coolness Score" badge.