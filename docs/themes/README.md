# Themes | Freshy

Technical specifications for modular theming: file-driven tokens, multi-theme support, and the first alternate theme (dark).

## Documents

| Document                                 | Purpose                                                                                                   |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [modularity-spec.md](modularity-spec.md) | Target architecture: `@freshy/theme`, YAML token files, CSS variables, enforcement rules                  |
| [dark-theme-spec.md](dark-theme-spec.md) | Next implementation step: ship dark mode as the first alternate theme on top of the modularity foundation |
| [testing-spec.md](testing-spec.md)       | Automated test catalog for compile, contrast, parity, and literal-color gate                              |

## Related references

| Document                                              | Role                                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [stitch/freshy/DESIGN.md](../stitch/freshy/DESIGN.md) | Visual design reference (light theme today)                                          |
| [quality-standards.md](../quality-standards.md)       | CSS and Tailwind rules for contributors                                              |
| [architecture.md](../architecture.md)                 | Monorepo layout                                                                      |
| [roadmap.md](../roadmap.md)                           | Product phases; theme work is tracked under Phase 6 (PWA polish) and Phase 8 backlog |

## Current state (June 2026)

- **Single light theme** compiled from `packages/config/tailwind.preset.ts` (48 semantic color roles, spacing, typography, radius).
- **Web** consumes tokens via Tailwind utilities (`bg-primary`, `text-on-surface`, etc.) in ~20 components under `apps/web/src/components/`.
- **`packages/ui`** exports brand, routes, and icon name maps in `tokens.ts`; `GlassCard` still hardcodes white glass.
- **Mobile** duplicates hex values in `StyleSheet.create` blocks; no shared color module.
- **Stitch HTML mocks** under `docs/stitch/` define `darkMode: "class"` and `dark:` variants, but the production app does not implement them.
- **No** `packages/theme`, **no** CSS custom properties, **no** runtime theme switcher.

---

_Last updated: June 2026_
