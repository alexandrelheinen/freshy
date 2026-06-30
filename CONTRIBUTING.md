# Contributing to Freshy

Thank you for contributing to **Freshy**, the mobile-first cooling map. This document is the single entry point for how we build, test, and ship code in this repository.

## Before you start

| Resource                                                                                 | Purpose                                                                   |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [.cursor/rules/contributing-and-writing.mdc](.cursor/rules/contributing-and-writing.mdc) | Cursor agent: writing, naming, TDD, idiomatic code (summary of this file) |
| [docs/development-cycle.md](docs/development-cycle.md)                                   | **Mandatory** step-by-step workflow and test-driven development (TDD)     |
| [docs/quality-standards.md](docs/quality-standards.md)                                   | Quality rules and external references **per language**                    |
| [docs/roadmap.md](docs/roadmap.md)                                                       | Product phases: pick work from the current phase                          |
| [docs/setup-guide.md](docs/setup-guide.md)                                               | **Start here**: platform setup for dummies (click-by-click)               |
| [docs/milestones/](docs/milestones/)                                                     | Operational checklists per roadmap phase                                  |
| [docs/milestones/phase-0-bootstrap.md](docs/milestones/phase-0-bootstrap.md)             | Milestone 0: accounts, deploy, pilot city (before Phase 1)                |
| [docs/architecture.md](docs/architecture.md)                                             | Monorepo layout and data flow                                             |
| [docs/studio.md](docs/studio.md)                                                         | Admin Studio: Clerk role, moderation API, testing                         |
| [docs/infrastructure.md](docs/infrastructure.md)                                         | Cloudflare vs external providers (R2, Pages, Workers, Neon)               |
| [docs/git-rules.md](docs/git-rules.md)                                                   | Branching, commits, PR checklist                                          |
| [docs/stitch/freshy/DESIGN.md](docs/stitch/freshy/DESIGN.md)                             | Design tokens and UI reference                                            |

## Core principles

1. **Test-driven development (TDD) is the default.** Write a failing test, make it pass, refactor. Do not land behavior without a test that proves it.
2. **Follow the development cycle in order.** Skipping steps (e.g. opening a PR before `validation.sh` passes) is not allowed.
3. **One logical change per commit.** Small, reviewable diffs aligned with a roadmap item or bug fix.
4. **Match existing conventions.** Read surrounding code before editing; reuse packages and patterns already in the monorepo.
5. **English everywhere in the repo.** All documentation and source code must be in English. See [Language](#language) below.
6. **No em dashes in names or titles.** Use pipes, hyphens, or commas instead. See [Naming](#naming) below.
7. **A task is done only when its PR is mergeable.** Green CI is not enough. The branch must rebase cleanly onto `main` with no conflicts before the work is considered complete.

## Language

**English only** for documentation and source code in this repository:

| Area                                                | Rule    |
| --------------------------------------------------- | ------- |
| `docs/`, README, milestones, architecture           | English |
| Code: identifiers, comments, logs, tests            | English |
| Commit messages and PR titles/descriptions          | English |
| Seed data, fixtures, placeholder UI strings in apps | English |

Locale-specific copy (e.g. pt-BR for Brazilian users) belongs in **i18n message catalogs** when [next-intl](docs/roadmap.md) is adopted, not hardcoded in other languages in source files.

**Exception:** Stitch exports under `docs/stitch/` are historical design references and may keep original mockup copy.

Do not add Portuguese (or other non-English) text to docs or code unless it is inside an explicit i18n locale file.

## Naming

Do **not** use em dashes (`—`) in product names, titles, labels, or other naming strings. This includes page `<title>` metadata, app names, workflow names, PR comment headings, package descriptions, and shared brand constants.

| Prefer                     | Avoid                     |
| -------------------------- | ------------------------- |
| `Freshy \| Cooling Map`    | `Freshy — Cooling Map`    |
| `Release \| Mobile builds` | `Release — Mobile builds` |
| `Freshy \| Page previews`  | `Freshy — Page previews`  |

Use a **vertical pipe** (`|`) to separate title parts (brand | subtitle), a **hyphen** (`-`) for compound technical names, or a **comma** when joining short phrases in a description.

Shared brand strings live in `packages/ui/src/tokens.ts` (`BRAND_NAME`, `BRAND_TITLE`). Import them instead of duplicating titles in apps.

This rule targets **names and titles**, not every sentence in long-form docs. Body copy and section prose may use commas or hyphens as needed.

## Languages in this project

Freshy is a **pnpm + Turborepo** monorepo. Every language has enforced quality rules. See [docs/quality-standards.md](docs/quality-standards.md) for the full reference list.

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
- [ ] **PR is mergeable into `main`** (no conflicts; rebases cleanly if required)

**Definition of done:** A branch or agent task is **not complete** until the pull request shows as mergeable on GitHub (or the maintainer confirms a clean rebase onto current `main`). Resolve conflicts with `git fetch origin && git rebase origin/main`, fix files, run validation, then `git push --force-with-lease`.

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
