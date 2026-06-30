# Dark Theme | Technical Specification

This document defines the **next implementation step** after the modularity foundation in [modularity-spec.md](modularity-spec.md): ship a **dark theme** as the first alternate theme in the registry.

**Scope:** specification only. Dark theme is **not** implemented until modularity Phases A and B are complete.

**Prerequisite:** [modularity-spec.md](modularity-spec.md) Phases A (foundation) and B (leak cleanup).

---

## 1. Why dark is first

| Reason | Detail |
| ------ | ------ |
| User expectation | Mobile PWAs and OS settings commonly offer dark mode |
| Design reference exists | Stitch HTML mocks already define `darkMode: "class"` and `dark:` utility patterns |
| Token readiness | Current palette includes `inverse-*` and `*-fixed-dim` roles suited to dark surfaces |
| Validates architecture | Proves `data-theme` switching before investing in `high-contrast`, `daltonic`, or `playful` themes |

Other alternate themes reuse the same pipeline; dark is the smallest meaningful proof.

---

## 2. Current gap

| Area | Light today | Dark today |
| ---- | ----------- | ---------- |
| `tailwind.preset.ts` | 48 roles, light values | Same object; `inverse-*` unused |
| `apps/web` components | Semantic utilities, no `dark:` | No dark variants |
| `globals.css` | White glass, light slider | N/A |
| `layout.tsx` | `themeColor: '#0c6780'` | Fixed light chrome |
| Stitch mocks | `class="light"` default | `dark:bg-surface-container`, `dark:text-primary-fixed-dim`, etc. |
| Mobile | Light hex only | `StatusBar style="dark"` only (status bar, not app colors) |

Stitch shows **intent** but is not wired to production. The dark theme must be implemented through the **CSS variable + `data-theme`** model from the modularity spec, not by copying every `dark:` class from HTML mocks verbatim.

---

## 3. Design direction

### 3.1 Principles

1. **Semantic roles stay stable** — components keep `bg-surface`, `text-on-surface`, `bg-primary-container`; only YAML values change per theme.
2. **Cooling brand preserved** — primary teal family remains recognizable; dark theme deepens surfaces, not the brand hue.
3. **Glass on dark bases** — glass uses `glass-surface` tokens with dark-tinted rgba, not `white/80`.
4. **WCAG AA** — all `on-*` pairs in `themes/dark/colors.yaml` must pass 4.5:1 contrast for body text (enforced in compile tests).
5. **Map and media overlays** — hero gradients and map markers use `scrim-*` and `marker-*` tokens, not `text-white`.

### 3.2 Stitch patterns to port (semantic mapping)

Stitch uses `dark:` prefixes. In the target architecture, the **same component classes** resolve differently because CSS variables change under `[data-theme='dark']`.

| Stitch pattern | Semantic role under dark | Notes |
| -------------- | ------------------------ | ----- |
| `dark:bg-surface-container` | `surface` → darker value in `dark/colors.yaml` | Header, nav backgrounds |
| `dark:bg-surface-container-highest/90` | `surface-container-highest` | Bottom nav backdrop |
| `dark:text-primary-fixed-dim` | `primary-fixed-dim` | Brand wordmark and icons on dark headers |
| `dark:bg-primary` + `dark:text-on-primary` | Active nav pill | Active tab inverts from `primary-container` pill to solid `primary` |
| `dark:text-secondary-fixed-dim` | `secondary-fixed-dim` | Inactive nav items |
| `dark:text-outline-variant` | `outline-variant` | Muted header links |

Reference files:

- `docs/stitch/mapa_freshy/code.html` (header, bottom nav, chips)
- `docs/stitch/lista_de_lugares_desktop/code.html` (desktop header, filter chips)
- `docs/stitch/meu_perfil_desktop/code.html` (profile header)

### 3.3 Proposed dark palette strategy

Derive `themes/dark/colors.yaml` by **inverting the surface ladder** and tuning brand containers, not by inventing a new naming scheme.

| Role group | Light (`default`) | Dark (`dark`) direction |
| ---------- | ----------------- | ----------------------- |
| `background`, `surface` | `#f7f9fb` | `#121416` to `#191c1e` range |
| `surface-container-*` | White to `#e0e3e5` ladder | `#1e2124` to `#2d3133` ladder |
| `on-surface`, `on-background` | `#191c1e` | `#e3e6e8` |
| `on-surface-variant` | `#3f484c` | `#bfc8cd` |
| `primary` | `#0c6780` | Keep or slightly lighten to `#4db8d4` for contrast on dark |
| `primary-fixed-dim` | `#89d0ed` | Header/icon accent on dark (Stitch uses this) |
| `primary-container` / `on-primary-container` | Light blue pill | Dark: invert active nav to `primary` + `on-primary` per Stitch |
| `outline-variant` | `#bfc8cd` | `#4f575c` |
| `inverse-*` | Dark gray | May swap usage with surface roles; values must still satisfy schema |

Exact hex values are filled by design during implementation. The compile step runs contrast validation before merge.

### 3.4 Dark `effects.yaml`

| Token | Light | Dark direction |
| ----- | ----- | -------------- |
| `glass.surface-bg` | `rgba(255,255,255,0.8)` | `rgba(30,33,36,0.85)` |
| `glass.surface-border` | `rgba(255,255,255,0.4)` | `rgba(255,255,255,0.08)` |
| `shadow.card` | Primary-tinted soft shadow | Neutral `rgba(0,0,0,0.25)` |
| `shadow.nav` | Upward light shadow | `rgba(0,0,0,0.4)` |
| `scrim.strong` | `rgba(0,0,0,0.7)` | Same or slightly deeper |

---

## 4. Prerequisites (modularity Phases A and B)

Do not start dark theme work until these are done:

| # | Item | Verification |
| - | ---- | ------------ |
| 1 | `@freshy/theme` package with compile script | `pnpm theme:build` succeeds |
| 2 | `themes/default/` YAML matches current visuals | Screenshot or token parity tests |
| 3 | Tailwind preset uses `var(--color-*)` | No hex in `tailwind.preset.ts` |
| 4 | Glass, shadows, scrims tokenized | No `white/80`, no arbitrary `shadow-[rgba(...)]` in components |
| 5 | `GlassCard` uses semantic glass utilities | `packages/ui/src/index.tsx` |
| 6 | `globals.css` uses CSS variables | Status bar, slider, `.glass` |
| 7 | CI grep blocks raw colors in apps/ui | `validation.sh` includes theme validate |

---

## 5. Implementation scope

### 5.1 New and modified files

| Action | Path |
| ------ | ---- |
| Add | `packages/theme/themes/dark/theme.meta.yaml` |
| Add | `packages/theme/themes/dark/colors.yaml` |
| Add | `packages/theme/themes/dark/effects.yaml` |
| Add | `packages/theme/themes/dark/icons.yaml` (optional; likely identical to default) |
| Add | `packages/theme/generated/dark.css`, `dark.tokens.ts` |
| Modify | `packages/theme/generated/index.ts` — register `dark` |
| Add | `packages/ui/src/theme/ThemeProvider.tsx` |
| Add | `packages/ui/src/theme/ThemeProvider.test.tsx` |
| Modify | `apps/web/src/app/layout.tsx` — wrap with `ThemeProvider`, dynamic `themeColor` |
| Modify | `apps/mobile/app/_layout.tsx` — read theme preference (or system) for colors + `StatusBar` |
| Modify | `apps/web/src/lib/map-styles.ts` — optional dark Mapbox style URL in `theme.meta.yaml` |

Typography, spacing, and radius for dark initially **inherit from `default`** via `theme.meta.yaml`:

```yaml
id: dark
label: Dark
colorScheme: dark
extends: default
overrides:
  - colors
  - effects
```

### 5.2 Components requiring visual review (no new classes if Phase B done)

These files use surfaces, glass, or overlays that must be checked under `data-theme="dark"`:

| File | Focus |
| ---- | ----- |
| `AppNav.tsx` | Top/bottom nav surfaces, active pill |
| `ExploreMapClient.tsx` | Search glass, chips, floating controls |
| `map-markers.tsx` | Marker fill, border, label chip |
| `PlaceListCard.tsx` | Card surface, shadow |
| `PlaceDetailClient.tsx` | Metrics cards, hero |
| `CoolingClient.tsx` | Category hero scrim, CTA |
| `ProfileClient.tsx` | Stats, badges |
| `StudioClient.tsx` | Tables, forms, error containers |
| `GlassCard` (`packages/ui`) | Frosted panels |

If Phase B is complete, these files should need **no code changes** for dark; only visual QA and possible token value tweaks in YAML.

### 5.3 ThemeProvider behavior

```typescript
type ThemePreference = 'default' | 'dark' | 'system';

// Resolution
// system + prefers-color-scheme: dark → dark
// system + light → default
// persisted in localStorage key freshy-theme
```

On change:

1. Set `document.documentElement.dataset.theme` to resolved id (`default` | `dark`).
2. Update `<meta name="theme-color">` from active theme primary.
3. Dispatch event for map style reload if Mapbox dark style is configured.

**Defer:** profile settings UI toggle (can ship with `system` default only in v1 dark).

### 5.4 Mobile

| Item | Approach |
| ---- | -------- |
| Colors | `import { dark, default } from '@freshy/theme/tokens'` |
| Preference | Same `freshy-theme` key via `expo-secure-store` or AsyncStorage |
| StatusBar | `style="light"` when `colorScheme === 'dark'` |
| Screens | Replace remaining hex with `colors.surface`, `colors.primary`, etc. |

Mobile dark ships in the **same PR** as web dark if Phase B mobile migration is done; otherwise mobile stays light until hex cleanup merges.

### 5.5 Mapbox (optional in v1 dark)

Add to `themes/dark/theme.meta.yaml`:

```yaml
mapboxStyleUrl: 'mapbox://styles/mapbox/dark-v11'
```

`ExploreMapClient` reads active theme metadata. If omitted, map keeps light style (acceptable for v1 with documented follow-up).

---

## 6. Testing and acceptance criteria

### 6.1 Automated

| Test | Assert |
| ---- | ------ |
| Schema | `dark` theme has all required color and effect roles |
| Contrast | Every `on-*` pair in `dark/colors.yaml` passes WCAG AA |
| Compile | `dark.css` defines all `--color-*` variables |
| ThemeProvider | Sets `data-theme="dark"`; persists preference |
| Parity | `default` theme unchanged when dark is added |
| CI grep | Still no hex in apps/ui |

### 6.2 Manual / E2E

| Check | Pages |
| ----- | ----- |
| Readable text on all surfaces | `/explore`, `/cooling`, `/profile`, `/places/[slug]`, `/studio` |
| Active nav visible | Bottom nav on mobile viewport |
| Glass panels legible | Explore search, map overlays |
| Map markers | Selected and unselected states |
| Clerk modals | Readable (may still be Clerk default until Phase E) |

Optional: extend Playwright to set `data-theme="dark"` and capture screenshots for PR comment.

### 6.3 Definition of done

- [ ] `themes/dark/` exists and passes schema + contrast validation.
- [ ] `ThemeProvider` resolves `default`, `dark`, and `system`.
- [ ] Web app is visually correct on all primary routes in dark mode.
- [ ] `themeColor` meta tag updates with active theme.
- [ ] `bash scripts/validation.sh` passes.
- [ ] No new hardcoded colors introduced in components.
- [ ] `docs/stitch/freshy/DESIGN.md` gains a short "Dark theme" section pointing to `themes/dark/` (doc sync only).

---

## 7. Work order (TDD-friendly)

Follow [development-cycle.md](../development-cycle.md).

| Step | Red | Green |
| ---- | --- | ----- |
| 1 | Test: `dark` theme compiles and includes `--color-surface` | Add `themes/dark/*.yaml`, run compile |
| 2 | Test: contrast validation catches bad `on-surface` pair | Implement contrast check in compile script |
| 3 | Test: `ThemeProvider` sets `data-theme` | Implement provider |
| 4 | Test: `getThemeTokens('dark').colors.primary` defined | Register in index |
| 5 | Manual QA on explore + nav | Tune YAML values until Stitch parity |
| 6 | E2E or screenshot optional | Playwright dark capture |

Branch naming: `feat/theme-dark` or `cursor/theme-dark-<id>`.

---

## 8. Out of scope for dark v1

| Item | Track in |
| ---- | -------- |
| Profile theme picker UI | Follow-up PR after dark infra |
| `high-contrast`, `daltonic`, `playful` themes | [modularity-spec.md](modularity-spec.md) Phase D |
| Clerk themed appearance | Modularity Phase E |
| Tailwind v4 migration | Separate roadmap item |
| Dark Stitch HTML sync | Informational only; production uses YAML |

---

## 9. Risks and mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Dark shipped before leak cleanup | Enforce Phase B checklist as PR gate |
| Map stays light while UI is dark | Document; add Mapbox dark URL in v1.1 |
| `primary-container` nav pill wrong on dark | Follow Stitch: active state uses `primary` + `on-primary` in dark YAML tuning |
| Mobile lag | Ship web dark first only if mobile hex migration is not ready; document split |
| Clerk modals clash | Acceptable short term; Phase E addresses |

---

## 10. After dark

Once dark is mergeable:

1. Add theme toggle to `/profile` settings (uses existing `ThemeProvider`).
2. Add `high-contrast` theme for accessibility (stricter contrast tests).
3. Add `daltonic` theme (remap `primary`, `success`, `warning` hues).
4. Add `playful` theme (warmer palette, larger radius in YAML).

Each is a new folder under `packages/theme/themes/` per [modularity-spec.md](modularity-spec.md).

---

_Last updated: June 2026_
