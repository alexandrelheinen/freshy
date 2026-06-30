# Theme Testing | Technical Specification

This document defines **all automated tests** required for the modular theme system. Implementation must follow TDD: write failing tests, then make them pass.

**Scope:** shell and design tokens only (`packages/theme`, `packages/config/tailwind.preset.ts`, `packages/ui`, `apps/web`, `apps/mobile`). No API, database, or cloud storage tests.

**Related:** [modularity-spec.md](modularity-spec.md), [dark-theme-spec.md](dark-theme-spec.md).

---

## 1. Test layers

| Layer              | Runner                              | When                         |
| ------------------ | ----------------------------------- | ---------------------------- |
| Theme compile unit | `pnpm --filter @freshy/theme test`  | Every PR                     |
| Config preset unit | `pnpm --filter @freshy/config test` | Every PR                     |
| UI theme unit      | `pnpm --filter @freshy/ui test`     | Phase C (ThemeProvider)      |
| Literal-color gate | `pnpm theme:validate`               | Every PR via `validation.sh` |
| Full pipeline      | `bash scripts/validation.sh`        | Before merge                 |

---

## 2. `packages/theme` unit tests

### 2.1 `compiler/compile-themes.test.ts`

| Test case                                              | Assert                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| compiles `default` theme without error                 | `generated/default.css` and `generated/default.tokens.ts` exist                |
| CSS defines `:root` and `[data-theme='default']`       | Both selectors set `--color-primary`                                           |
| every required color role has a CSS variable           | All keys in `src/roles.ts` `COLOR_ROLES` appear as `--color-<role>`            |
| every shadow role has a CSS variable                   | `--shadow-card`, `--shadow-nav`, `--shadow-card-elevated`, `--shadow-floating` |
| glass blur variable present                            | `--effect-glass-blur`                                                          |
| `default.tokens.ts` exports `colors.primary`           | Value is `#0c6780` (legacy parity)                                             |
| `default.tokens.ts` exports `colors.background`        | Value is `#f7f9fb`                                                             |
| `default.tokens.ts` exports `icons.nav.explore`        | Value is `explore`                                                             |
| `generated/index.ts` lists `default` in `THEME_IDS`    | `THEME_IDS` includes `'default'`                                               |
| `getThemeTokens('default')` returns colors and effects | Object shape matches `ThemeTokens` type                                        |
| invalid theme folder fails compile                     | Missing `colors.yaml` throws or exits non-zero                                 |
| theme with unknown color key fails                     | Extra key not in schema rejected (warn or fail per policy)                     |

### 2.2 `compiler/contrast.test.ts`

| Test case                                | Assert                                 |
| ---------------------------------------- | -------------------------------------- |
| `primary` / `on-primary` meets WCAG AA   | Contrast ratio >= 4.5:1                |
| `surface` / `on-surface` meets WCAG AA   | Ratio >= 4.5:1                         |
| `error` / `on-error` meets WCAG AA       | Ratio >= 4.5:1                         |
| `success` / `on-success` meets WCAG AA   | Ratio >= 4.5:1                         |
| all `on-*` / base pairs in `COLOR_ROLES` | Each pair >= 4.5:1 for `default` theme |

Contrast algorithm: WCAG 2.1 relative luminance on sRGB hex colors. Skip pairs where the base or on-color is rgba (glass, scrim).

### 2.3 `compiler/parity.test.ts`

| Test case                                | Assert                                                   |
| ---------------------------------------- | -------------------------------------------------------- |
| legacy preset primary                    | `getThemeTokens('default').colors.primary === '#0c6780'` |
| legacy preset primary-container          | `#87ceeb`                                                |
| legacy surface-container-highest         | `#e0e3e5` (status bar inactive segment)                  |
| spacing `margin-mobile`                  | `20px`                                                   |
| typography `headline-lg-mobile` fontSize | `24px`                                                   |

---

## 3. `packages/config` unit tests

### 3.1 `tailwind.preset.test.ts` (updated)

| Test case                       | Assert                                            |
| ------------------------------- | ------------------------------------------------- |
| preset colors use CSS variables | `freshyColors.primary === 'var(--color-primary)'` |
| preset has no hex literals      | No `#` in any `freshyColors` value                |
| boxShadow uses CSS variables    | `shadow-card` maps to `var(--shadow-card)`        |
| spacing unchanged               | `freshySpacing.lg === '24px'`                     |
| typography unchanged            | `freshyTypography['body-sm'].fontSize === '14px'` |

---

## 4. Literal-color gate

### 4.1 `packages/theme/compiler/check-no-literal-colors.ts`

Scanned paths:

- `apps/web/src/**/*.{ts,tsx,css}`
- `apps/mobile/app/**/*.{ts,tsx}`
- `apps/mobile/src/**/*.{ts,tsx}`
- `packages/ui/src/**/*.{ts,tsx}`

| Pattern                                  | Action |
| ---------------------------------------- | ------ |
| `#[0-9a-fA-F]{3,8}`                      | Fail   |
| `rgba?\(`                                | Fail   |
| `shadow-\[` with color                   | Fail   |
| `text-white`, `bg-white`, `border-white` | Fail   |

**Allowlist:** none in apps/ui after Phase B.

**Exit code:** non-zero on any match; print file path and line.

### 4.2 `compiler/validate-themes.ts`

Runs, in order:

1. `compile-themes.ts` (fresh build)
2. `contrast.test.ts` logic (or invoke test runner)
3. `check-no-literal-colors.ts`

---

## 5. `packages/ui` unit tests (Phase C)

### 5.1 `src/theme/ThemeProvider.test.tsx`

Deferred until dark theme. Documented here for completeness.

| Test case                           | Assert                                                 |
| ----------------------------------- | ------------------------------------------------------ |
| default mount sets `data-theme`     | `document.documentElement.dataset.theme === 'default'` |
| `setTheme('dark')` updates DOM      | `dataset.theme === 'dark'`                             |
| preference persists                 | `localStorage.getItem('freshy-theme')` matches         |
| `system` resolves from `matchMedia` | Mock `prefers-color-scheme: dark`                      |

---

## 6. Mobile shell tests

### 6.1 `apps/mobile/src/theme.test.ts`

| Test case                                 | Assert                                             |
| ----------------------------------------- | -------------------------------------------------- |
| `themeColors.primary` matches web default | Same as `getThemeTokens('default').colors.primary` |
| `themeColors.surface` matches web default | Same as web `surface`                              |

### 6.2 Mobile screen files

No per-screen snapshot tests required for Phase B. Colors must reference `themeColors` object, not string literals (enforced by literal-color gate).

---

## 7. Integration and E2E (optional, not blocking Phase A–B)

| Test                              | Tool       | Assert                                                                                        |
| --------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| explore page loads with theme CSS | Playwright | `getComputedStyle(document.documentElement).getPropertyValue('--color-primary')` is non-empty |
| no console errors on explore      | Playwright | Zero error logs                                                                               |

---

## 8. CI wiring

Add to root `package.json`:

```json
"theme:build": "pnpm --filter @freshy/theme build",
"theme:validate": "pnpm --filter @freshy/theme validate"
```

Add to `scripts/validation.sh` **before** lint:

```bash
step "Theme build + validate"
pnpm theme:build
pnpm theme:validate
```

`@freshy/theme` `build` script must run before `@freshy/config` and `@freshy/web` build in Turbo (`dependsOn: ["^build"]` handles this once theme package has a `build` task).

---

## 9. Definition of done (tests)

Phase A–B is test-complete when:

- [ ] All Section 2 tests pass
- [ ] All Section 3 tests pass
- [ ] Section 4 gate passes with zero violations
- [ ] Section 6.1 passes
- [ ] `bash scripts/validation.sh` passes with `SKIP_DB=1 SKIP_SCREENSHOTS=1`

---

_Last updated: June 2026_
