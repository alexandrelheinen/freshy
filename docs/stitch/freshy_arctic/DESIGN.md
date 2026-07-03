---
name: Freshy Arctic
colors:
  surface: '#f3faff'
  surface-dim: '#d2dbe1'
  surface-bright: '#f3faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ecf5fb'
  surface-container: '#e6eff5'
  surface-container-high: '#e0eaef'
  surface-container-highest: '#dae4e9'
  on-surface: '#141d21'
  on-surface-variant: '#404751'
  inverse-surface: '#293236'
  inverse-on-surface: '#e9f2f8'
  outline: '#707883'
  outline-variant: '#c0c7d3'
  surface-tint: '#0062a1'
  primary: '#005f9d'
  on-primary: '#ffffff'
  primary-container: '#0078c5'
  on-primary-container: '#fdfcff'
  inverse-primary: '#9dcaff'
  secondary: '#006495'
  on-secondary: '#ffffff'
  secondary-container: '#64beff'
  on-secondary-container: '#004c72'
  tertiary: '#37607a'
  on-tertiary: '#ffffff'
  tertiary-container: '#507994'
  on-tertiary-container: '#fcfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d0e4ff'
  primary-fixed-dim: '#9dcaff'
  on-primary-fixed: '#001d35'
  on-primary-fixed-variant: '#00497b'
  secondary-fixed: '#cbe6ff'
  secondary-fixed-dim: '#90cdff'
  on-secondary-fixed: '#001e30'
  on-secondary-fixed-variant: '#004b71'
  tertiary-fixed: '#c6e7ff'
  tertiary-fixed-dim: '#a2cce9'
  on-tertiary-fixed: '#001e2e'
  on-tertiary-fixed-variant: '#1f4b64'
  background: '#f3faff'
  on-background: '#141d21'
  surface-variant: '#dae4e9'
typography:
  headline-lg:
    fontFamily: Quicksand
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
  body-lg:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
  label-sm:
    fontFamily: Quicksand
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  xs: 4px
  base: 8px
  sm: 12px
  margin-mobile: 16px
  gutter: 20px
  md: 24px
  lg: 48px
  margin-desktop: 64px
  xl: 80px
---

## Brand & Style
Freshy is a refreshing, hyper-modern discovery platform designed to help users find "cool" spots during hot weather. The brand personality is optimistic, energetic, and playful, aimed at a youthful, urban demographic. 

The design style is a sophisticated blend of **Glassmorphism** and **Tactile Minimalism**. It uses high-vibrancy accent colors against clean, airy surfaces. Visual interest is driven by "bubble" elements—pill-shaped containers and circular buttons—that feel bouncy and responsive. The interface emphasizes clarity and speed, using translucent blurs to maintain context while focusing on high-intent actions.

## Colors
The palette is rooted in deep, refreshing blues, moving away from high-contrast neon accents toward a more cohesive, "icy water" spectrum. The brand uses a systematic gradient of blues to establish hierarchy and professional polish.

- **Primary & Containers:** The primary deep azure (`#1185d7`) provides a strong, reliable anchor for interactive states and primary actions. It represents the deep chill of water and provides excellent legibility against soft, cool surfaces.
- **Surfaces:** We use a systematic approach to light surfaces ranging from pure white (`surface-lowest`) to a very pale blue-tinted grey (`surface-variant`), ensuring depth without heavy shadows.
- **Dynamic Accents:** Use Secondary (`#5cb7f8`) and Tertiary (`#b2dcfa`) tones for secondary informational badges (like "Trending" or "Super Cold") to maintain a colorful, high-energy vibe across the interface.

## Typography
The system exclusively uses **Quicksand** to maintain a modern, friendly, and approachable geometric appearance. Its rounded terminals perfectly complement the "bubble" aesthetic of the UI.

- **Headlines:** Use Bold weight (700) and slightly negative letter spacing for large displays to create a friendly yet impactful brand presence.
- **Hierarchy:** Use font weight and size to distinguish importance. Since Quicksand is naturally light and airy, primary labels and names should lean toward Semi-Bold (600) or Bold (700) to ensure high visibility against soft backgrounds.
- **Clarity:** Body text is kept at a generous 16px/18px with Medium (500) or Regular (400) weights to ensure legibility while users are on the move.

## Layout & Spacing
The layout follows a **Fluid Canvas** approach, specifically optimized for map-centric interfaces.

- **Margins:** A strict 16px safe-zone is maintained on mobile, expanding to 64px on desktop to give elements "room to breathe."
- **Floating UI:** Interactive elements (Search, Sheets, Nav) should float above the base canvas with generous internal padding (typically 16px to 24px).
- **Responsiveness:** On mobile, navigation is anchored to the bottom using a "Floating Bar" pattern. On desktop, navigation moves to a top-right cluster to maximize map visibility.

## Elevation & Depth
Depth is created through **Blue-Tinted Shadows** and **Glassmorphism** rather than traditional grey shadows.

- **Floating Elements:** Search bars and floating cards use shadows that include a subtle 15-20% opacity blue tint (`#1185d7`) to simulate light passing through ice.
- **Backdrop Blurs:** Navigation bars and sticky headers must use `backdrop-blur-xl` with an 80-90% opacity surface color to maintain a sense of layering.
- **Micro-interactions:** Elevation should increase on hover (scale up + deeper shadow) to provide tactile feedback in a digital environment.

## Shapes
The shape language is defined by **organic, pill-shaped geometry**, which aligns with the rounded characteristics of the Quicksand typeface.

- **Pills:** Search bars, chips, and primary buttons use a full `rounded-full` radius to evoke a friendly, "bubble" aesthetic.
- **Containers:** Informational cards and bottom sheets use a `1rem` to `2rem` radius (`rounded-xl` or `rounded-2xl`).
- **Interactive Pins:** Map markers are perfect circles with pulsating outer rings to indicate activity and draw the eye.

## Components
- **Buttons:** Primary buttons are circular or pill-shaped. Icons should be centered. Use the deep `primary` azure for high-visibility actions and `secondary` sky blue for standard secondary actions.
- **Search Bar:** A floating pill-shaped component. It includes a leading icon and a trailing action button (filter). The background is always `surface-container-lowest`.
- **Chips:** Used for filtering. Active chips use `primary` azure with a high-contrast white text; inactive chips use `surface-container-lowest` with a subtle shadow.
- **Cards:** Spot cards use a vertical stack: high-quality image with a `1.25rem` radius, followed by title and metadata. Include a floating "Favorite" action in the top-right corner of the image.
- **Navigation Bar:** The mobile navigation is a floating "dock" with a backdrop blur. The active state is a pill-shaped "capsule" that surrounds both icon and text.
- **Map Pins:** Interactive pins should include a pulse animation using the `primary` azure color for featured locations and a simple bubble-shadow for standard locations.