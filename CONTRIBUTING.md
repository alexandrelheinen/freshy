# Contributing to Freshy

Thank you for contributing to **Freshy** — the mobile-first cooling map. This document is the single entry point for how we build, test, and ship code in this repository.

## Before you start

| Resource                                                     | Purpose                                                               |
| ------------------------------------------------------------ | --------------------------------------------------------------------- |
| [docs/development-cycle.md](docs/development-cycle.md)       | **Mandatory** step-by-step workflow and test-driven development (TDD) |
| [docs/quality-standards.md](docs/quality-standards.md)       | Quality rules and external references **per language**                |
| [docs/roadmap.md](docs/roadmap.md)                           | Product phases — pick work from the current phase                     |
| [docs/todo_0.md](docs/todo_0.md)                             | Manual checklist before Phase 1 (deploy, accounts, decisions)         |
| [docs/architecture.md](docs/architecture.md)                 | Monorepo layout and data flow                                         |
| [docs/infrastructure.md](docs/infrastructure.md)             | Cloudflare vs external providers (R2, Pages, Workers, Neon)           |
| [docs/git-rules.md](docs/git-rules.md)                       | Branching, commits, PR checklist                                      |
| [docs/stitch/freshy/DESIGN.md](docs/stitch/freshy/DESIGN.md) | Design tokens and UI reference                                        |

## Core principles

1. **Test-driven development (TDD) is the default.** Write a failing test, make it pass, refactor. Do not land behavior without a test that proves it.
2. **Follow the development cycle in order.** Skipping steps (e.g. opening a PR before `validation.sh` passes) is not allowed.
3. **One logical change per commit.** Small, reviewable diffs aligned with a roadmap item or bug fix.
4. **Match existing conventions.** Read surrounding code before editing; reuse packages and patterns already in the monorepo.
5. **English for code and docs; Portuguese (pt-BR) for user-facing copy.**

## Languages in this project

Freshy is a **pnpm + Turborepo** monorepo. Every language has enforced quality rules — see [docs/quality-standards.md](docs/quality-standards.md) for the full reference list.

| Language / format  | Where it lives                                 | Primary tooling                                   |
| ------------------ | ---------------------------------------------- | ------------------------------------------------- |
| **TypeScript**     | `apps/`, `packages/`                           | ESLint, TypeScript strict, Prettier, `tsx --test` |
| **SQL**            | `packages/db/prisma/`                          | Prisma schema, PostgreSQL 16 + PostGIS            |
| **CSS (Tailwind)** | `apps/web`, `packages/ui`, `packages/config`   | Tailwind CSS 4, design tokens                     |
| **YAML**           | `.github/workflows/`, `infrastructure/docker/` | Prettier, CI validation                           |
| **Bash**           | `scripts/`                                     | `set -euo pipefail`, reviewed in PR               |
| **JSON**           | `package.json`, configs                        | Prettier, valid schemas                           |
| **Markdown**       | `docs/`, `README.md`                           | Prettier                                          |

## Development cycle (summary)

Every change **must** follow this sequence. Full detail, TDD examples, and phase alignment are in [docs/development-cycle.md](docs/development-cycle.md).

```
1. Select work     → Roadmap phase item or issue (docs/roadmap.md)
2. Branch          → feat/<name> or cursor/<feature>-e20f
3. Red             → Write failing test(s) for the behavior
4. Green           → Implement minimal code to pass tests
5. Refactor        → Clean up; keep tests green
6. Validate        → bash scripts/validation.sh (or targeted pnpm commands)
7. Commit          → Focused message, imperative mood, English
8. Pull request    → CI must pass; screenshots on UI changes
9. Review & merge  → Squash or merge per team preference
```

### Quick validation commands

```bash
pnpm format:check    # Prettier
pnpm lint            # ESLint (max-warnings 0)
pnpm typecheck       # TypeScript across packages
pnpm test            # Unit tests (Node test runner)
pnpm build           # Compile all packages
bash scripts/validation.sh   # Full local pipeline (recommended before PR)
```

Environment flags for `validation.sh`:

- `SKIP_DB=1` — skip Docker database setup
- `SKIP_SCREENSHOTS=1` — skip Playwright page captures
- `SKIP_INSTALL=1` — skip `pnpm install`

## Testing strategy

| Layer            | Tool                              | Location                      | When to add                                        |
| ---------------- | --------------------------------- | ----------------------------- | -------------------------------------------------- |
| **Unit**         | Node `node:test` via `tsx --test` | `**/*.test.ts` next to source | All business logic, tokens, helpers, API utilities |
| **Integration**  | Same runner + Prisma/Docker       | `packages/db`, `packages/api` | DB queries, storage adapters                       |
| **Visual / E2E** | Playwright                        | `apps/web/e2e/`               | Page renders, `data-page` markers, screenshot CI   |

**Rule:** If you add or change behavior, add or update a test in the same commit series. CI runs `pnpm test` on every pull request.

## Code style (all TypeScript)

- **Strict mode** — inherited from `tsconfig.base.json` (`strict: true`)
- **Formatting** — Prettier (`.prettierrc`): single quotes, semicolons, trailing commas, 100-char width
- **Linting** — ESLint flat config from `@freshy/config` (root `eslint.config.mjs`)
- **Unused vars** — prefix with `_` if intentionally unused
- **React** — no `react-in-jsx-scope`; hooks rules enforced
- **Imports** — prefer workspace packages (`@freshy/ui`, `@freshy/db`, etc.)

## Pull request requirements

- [ ] `bash scripts/validation.sh` passes locally (or document why a step was skipped)
- [ ] Tests cover new/changed behavior (TDD)
- [ ] No secrets in the diff (`.env`, service account keys)
- [ ] `.env.example` updated if new environment variables are introduced
- [ ] Prisma migrations included if the schema changed
- [ ] Docs updated when workflow or architecture changes

Use the [pull request template](.github/pull_request_template.md). CI posts a quality summary and page screenshots for UI changes.

## Branch naming

| Pattern                 | Use                         |
| ----------------------- | --------------------------- |
| `main`                  | Production-ready; protected |
| `feat/<name>`           | Human feature branches      |
| `fix/<name>`            | Bug fixes                   |
| `cursor/<feature>-e20f` | Cloud agent branches        |

Never force-push to `main`. All changes merge via pull request.

## Local setup

```bash
# Prerequisites: Node 20+, pnpm 9+, Docker (optional, for local DB)
bash scripts/setup-local-db.sh
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev    # web :3000, api :4000
```

## Where to put new code

| Change                   | Location                         |
| ------------------------ | -------------------------------- |
| Web screens (PWA)        | `apps/web/src/app/`              |
| Mobile screens           | `apps/mobile/app/`               |
| Shared UI components     | `packages/ui/src/`               |
| REST API / R2            | `packages/api/src/`              |
| Database schema          | `packages/db/prisma/`            |
| ESLint / Tailwind tokens | `packages/config/`               |
| CI / scripts             | `.github/workflows/`, `scripts/` |

## Questions?

Open a discussion or issue on GitHub. For design decisions, cite [docs/stitch/](docs/stitch/) and [DESIGN.md](docs/stitch/freshy/DESIGN.md).
