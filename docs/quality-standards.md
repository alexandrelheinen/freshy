# Quality Standards — Freshy

This document defines **quality rules** and **authoritative references** for every language and format used in the Freshy monorepo. All contributors must follow these standards; CI enforces the automated checks listed below.

See also [CONTRIBUTING.md](../CONTRIBUTING.md) and [development-cycle.md](development-cycle.md).

---

## TypeScript (`.ts`, `.tsx`)

**Scope:** `apps/web`, `apps/mobile`, `packages/api`, `packages/db`, `packages/ui`, `packages/config`, root tooling.

### Rules

| Rule                                                                               | Enforcement                         |
| ---------------------------------------------------------------------------------- | ----------------------------------- |
| `strict: true` in all `tsconfig.json` files                                        | `pnpm typecheck`                    |
| No `any` unless documented with a one-line comment explaining why                  | Code review                         |
| Prefer `const`; avoid mutable shared state                                         | Code review                         |
| Export types from package entry points (`src/index.ts`)                            | Code review                         |
| Use workspace imports: `@freshy/ui`, `@freshy/db`, `@freshy/api`, `@freshy/config` | ESLint / review                     |
| React components: functional only; hooks at top level                              | `eslint-plugin-react-hooks`         |
| Unused parameters: prefix with `_`                                                 | `@typescript-eslint/no-unused-vars` |
| User-facing strings in pt-BR; identifiers and comments in English                  | Code review                         |
| Co-locate tests: `foo.ts` → `foo.test.ts` or `src/**/*.test.ts`                    | `pnpm test`                         |

### Tooling configuration

| Tool       | Config file                                                   |
| ---------- | ------------------------------------------------------------- |
| TypeScript | `tsconfig.base.json`, per-package `tsconfig.json`             |
| ESLint     | `packages/config/eslint.config.mjs`, root `eslint.config.mjs` |
| Prettier   | `.prettierrc`, `.prettierignore`                              |
| Unit tests | `tsx --test` (Node built-in `node:test`)                      |

### References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — language and strict mode
- [typescript-eslint](https://typescript-eslint.io/) — lint rules for TS
- [React 19 docs](https://react.dev/) — components and hooks
- [Next.js 15 App Router](https://nextjs.org/docs/app) — web app routing and RSC
- [Expo Router](https://docs.expo.dev/router/introduction/) — mobile navigation
- [Node.js test runner](https://nodejs.org/api/test.html) — unit test API
- [TanStack Query](https://tanstack.com/query/latest) — server state (when adopted)
- [Zod](https://zod.dev/) — runtime validation (when adopted)

---

## SQL & Prisma (`.prisma`, migrations)

**Scope:** `packages/db/prisma/`

### Rules

| Rule                                                                             | Enforcement                                   |
| -------------------------------------------------------------------------------- | --------------------------------------------- |
| PostgreSQL 16 with PostGIS extension for geo columns                             | Docker Compose image `postgis/postgis:16-3.4` |
| Schema changes require a migration (or documented `db push` for prototypes only) | `pnpm db:migrate`                             |
| Use enums for fixed domains (`PlaceCategory`, `AcStrength`)                      | Prisma schema                                 |
| `slug` fields must be unique and URL-safe                                        | Schema + tests                                |
| Seed data in `prisma/seed.ts`; keep pilot-city sample data realistic             | `pnpm db:seed`                                |
| Never commit production `DATABASE_URL`                                           | `.gitignore`, review                          |

### Tooling

| Tool       | Command                                                |
| ---------- | ------------------------------------------------------ |
| Prisma CLI | `pnpm --filter @freshy/db generate`, `migrate`, `seed` |
| Local DB   | `bash scripts/setup-local-db.sh`                       |

### References

- [Prisma docs](https://www.prisma.io/docs) — schema, migrations, client
- [PostgreSQL 16 documentation](https://www.postgresql.org/docs/16/) — SQL dialect
- [PostGIS documentation](https://postgis.net/documentation/) — spatial queries (`ST_DWithin`, GIST indexes)
- [Prisma naming conventions](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#naming-conventions)

---

## CSS & Tailwind (`.css`, `tailwind.config.ts`)

**Scope:** `apps/web`, `packages/ui`, `packages/config/tailwind.preset.ts`

### Rules

| Rule                                                                                       | Enforcement          |
| ------------------------------------------------------------------------------------------ | -------------------- |
| Use design tokens from `docs/stitch/freshy/DESIGN.md` — no ad-hoc hex colors in components | Code review          |
| Import shared preset: `@freshy/config/tailwind`                                            | `tailwind.config.ts` |
| Prefer Tailwind utility classes over custom CSS                                            | Code review          |
| Glassmorphism: use `.glass` utility or `GlassCard` from `@freshy/ui`                       | UI package           |
| Mobile-first layouts; respect `margin-mobile` (20px) spacing token                         | Design system        |
| `data-page` attribute on top-level page containers for Playwright screenshots              | E2E tests            |

### Tooling

| Tool           | Config                                             |
| -------------- | -------------------------------------------------- |
| Tailwind CSS 4 | `apps/web/tailwind.config.ts`, `postcss.config.js` |
| Design tokens  | `packages/config/tailwind.preset.ts`               |

### References

- [Tailwind CSS v4 docs](https://tailwindcss.com/docs) — utilities and configuration
- [Freshy DESIGN.md](stitch/freshy/DESIGN.md) — colors, typography, spacing, components
- [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/) — accessibility targets for UI

---

## YAML (`.yml`, `.yaml`)

**Scope:** `.github/workflows/`, `infrastructure/docker/docker-compose.yml`, `pnpm-workspace.yaml`

### Rules

| Rule                                                 | Enforcement          |
| ---------------------------------------------------- | -------------------- |
| Formatted with Prettier (`pnpm format:check`)        | CI                   |
| GitHub Actions: pin major versions (`@v4`)           | Review               |
| Secrets only via `${{ secrets.* }}` — never hardcode | Review               |
| `concurrency` groups on CI to cancel stale runs      | `ci.yml`             |
| Docker Compose: healthchecks on database service     | `docker-compose.yml` |

### References

- [GitHub Actions syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Docker Compose specification](https://docs.docker.com/compose/compose-file/)
- [pnpm workspace](https://pnpm.io/pnpm-workspace_yaml)

---

## Bash (`.sh`)

**Scope:** `scripts/`

### Rules

| Rule                                                               | Enforcement             |
| ------------------------------------------------------------------ | ----------------------- |
| Shebang: `#!/usr/bin/env bash`                                     | Review                  |
| `set -euo pipefail` at top of orchestration scripts                | Review                  |
| Resolve repo root relative to script location                      | `validation.sh` pattern |
| Print clear step labels for CI/local debugging                     | Review                  |
| Support skip flags (`SKIP_DB`, `SKIP_SCREENSHOTS`, `SKIP_INSTALL`) | `validation.sh`         |
| No secrets echoed to stdout                                        | Review                  |

### References

- [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html)
- [ShellCheck](https://www.shellcheck.net/) — recommended for local linting

---

## JSON (`.json`)

**Scope:** `package.json`, `tsconfig.json`, `app.json`, `eas.json`, `turbo.json`

### Rules

| Rule                                                    | Enforcement         |
| ------------------------------------------------------- | ------------------- |
| Formatted with Prettier                                 | `pnpm format:check` |
| `packageManager` field set at root (`pnpm@9.15.0`)      | `package.json`      |
| `engines.node >= 20` at root                            | `package.json`      |
| Workspace packages use `"name": "@freshy/<pkg>"`        | Review              |
| Lockfile `pnpm-lock.yaml` committed; never edit by hand | CI                  |

### References

- [pnpm package.json fields](https://pnpm.io/package_json)
- [Turborepo pipeline](https://turbo.build/repo/docs/reference/configuration)

---

## Markdown (`.md`)

**Scope:** `docs/`, `README.md`, `CONTRIBUTING.md`

### Rules

| Rule                                                        | Enforcement         |
| ----------------------------------------------------------- | ------------------- |
| Formatted with Prettier where applicable                    | `pnpm format:check` |
| English for technical docs; pt-BR only when quoting UI copy | Review              |
| Link related docs (architecture, roadmap, contributing)     | Review              |
| Keep roadmap phase checkboxes in sync with delivered work   | Review              |

### References

- [Markdown Guide](https://www.markdownguide.org/basic-syntax/)
- [Mermaid diagrams](https://mermaid.js.org/) — used in architecture docs

---

## Playwright E2E (TypeScript)

**Scope:** `apps/web/e2e/`

### Rules

| Rule                                                          | Enforcement            |
| ------------------------------------------------------------- | ---------------------- |
| Mobile viewport 390×844 for screenshots                       | `playwright.config.ts` |
| Wait for `[data-page="…"]` before capturing screenshots       | `screenshots.spec.ts`  |
| Four canonical pages: explore, cooling, place-detail, profile | CI screenshot job      |
| Screenshots written to `screenshots/` (gitignored)            | CI artifact            |

### References

- [Playwright test docs](https://playwright.dev/docs/intro)
- [Playwright best practices](https://playwright.dev/docs/best-practices)

---

## CI quality gate (all languages)

Every pull request to `main` runs:

| Step                  | Command                           |
| --------------------- | --------------------------------- |
| Format                | `pnpm format:check`               |
| Lint                  | `pnpm lint`                       |
| Typecheck             | `pnpm typecheck`                  |
| Unit tests            | `pnpm test`                       |
| Build                 | `pnpm build`                      |
| Screenshots (PR only) | Playwright via `pnpm screenshots` |

Local equivalent: `bash scripts/validation.sh`.

---

## Security & secrets (cross-cutting)

| Rule                                                      | Reference                        |
| --------------------------------------------------------- | -------------------------------- |
| No `.env` or `*.json` service account keys in git         | [git-rules.md](git-rules.md)     |
| Validate all API input with Zod (when handlers are added) | [roadmap.md](roadmap.md) NFRs    |
| HTTPS only in production                                  | Infrastructure docs              |
| Location data requires user consent (LGPD)                | [roadmap.md](roadmap.md) Phase 7 |

---

_Last updated: June 2026_
