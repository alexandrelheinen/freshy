# Contributing to Freshy

Thank you for contributing to **Freshy**, the mobile-first cooling map. This document covers Freshy's own policy and tooling. Generic engineering practice (TDD, git workflow, commit format, review, naming, language style) lives in the shared [.guidelines/](.guidelines/) submodule — see [AGENTS.md](AGENTS.md) for the index. This document does not repeat that content; it only covers what is specific to this repo.

## Before you start

| Resource                                                                                 | Purpose                                                   |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [.guidelines/](.guidelines/)                                                             | Shared TDD, git workflow, naming, language style          |
| [.cursor/rules/contributing-and-writing.mdc](.cursor/rules/contributing-and-writing.mdc) | Cursor agent: thin bridge to this file and `.guidelines/` |
| [docs/local-development.md](docs/local-development.md)                                   | **Start here**: local setup with wrangler dev             |
| [docs/platforms.md](docs/platforms.md)                                                   | Production platforms, resource names, env vars            |
| [docs/quality-standards.md](docs/quality-standards.md)                                   | Quality rules per language                                |
| [docs/architecture.md](docs/architecture.md)                                             | Monorepo layout and data flow                             |
| [docs/studio.md](docs/studio.md)                                                         | Admin Studio: Clerk role, moderation API                  |
| [docs/infrastructure.md](docs/infrastructure.md)                                         | Cloudflare services and bindings                          |
| [docs/public-repo-hygiene.md](docs/public-repo-hygiene.md)                               | Public-repo checklist (secrets, personal examples)        |
| [docs/git-rules.md](docs/git-rules.md)                                                   | Freshy-specific branching and release notes               |
| [docs/stitch/freshy/DESIGN.md](docs/stitch/freshy/DESIGN.md)                             | Design tokens and UI reference                            |

## Core principles

1. **Test-driven development (TDD) is the default**, per [.guidelines/workflow/tdd.md](.guidelines/workflow/tdd.md). Do not land behavior without a test that proves it.
2. **Validate before opening a PR.** Run `bash scripts/validation.sh` (or targeted commands) before pushing.
3. **English everywhere in the repo.** All documentation and source code must be in English. See [Language](#language) below.
4. **No em dashes in names or titles.** Use pipes, hyphens, or commas instead. See [Naming](#naming) below.
5. **A task is done only when its PR is mergeable.** Green CI is not enough. The branch must rebase cleanly onto `main` with no conflicts.

## Language

**English only** for documentation and source code in this repository:

| Area                                                | Rule    |
| --------------------------------------------------- | ------- |
| `docs/`, README, architecture                       | English |
| Code: identifiers, comments, logs, tests            | English |
| Commit messages and PR titles/descriptions          | English |
| Seed data, fixtures, placeholder UI strings in apps | English |

Locale-specific copy belongs in **i18n message catalogs** when adopted, not hardcoded in other languages in source files.

**Exception:** Stitch exports under `docs/stitch/` are historical design references and may keep original mockup copy.

## Naming

Do **not** use em dashes (`—`) in product names, titles, labels, or other naming strings.

| Prefer                     | Avoid                     |
| -------------------------- | ------------------------- |
| `Freshy \| Cooling Map`    | `Freshy — Cooling Map`    |
| `Release \| Mobile builds` | `Release — Mobile builds` |

Use a **vertical pipe** (`|`) to separate title parts, a **hyphen** (`-`) for compound technical names, or a **comma** when joining short phrases.

Shared brand strings live in `packages/ui/src/tokens.ts` (`BRAND_NAME`, `BRAND_TITLE`). Import them instead of duplicating titles in apps.

## Languages in this project

Freshy is a **pnpm + Turborepo** monorepo. See [docs/quality-standards.md](docs/quality-standards.md) for the full reference list.

| Language / format  | Where it lives                               | Primary tooling                                   |
| ------------------ | -------------------------------------------- | ------------------------------------------------- |
| **TypeScript**     | `apps/`, `packages/`                         | ESLint, TypeScript strict, Prettier, `tsx --test` |
| **SQL**            | `packages/db/migrations/`                    | Drizzle schema, D1 SQLite                         |
| **CSS (Tailwind)** | `apps/web`, `packages/ui`, `packages/config` | Tailwind CSS 4, design tokens                     |
| **YAML**           | `.github/workflows/`, `packages/theme/`      | Prettier, CI validation                           |
| **Bash**           | `scripts/`                                   | `set -euo pipefail`, reviewed in PR               |
| **JSON**           | `package.json`, configs                      | Prettier, valid schemas                           |
| **Markdown**       | `docs/`, `README.md`                         | Prettier                                          |

## Development cycle

Every change follows the shared branch → red → green → refactor → validate →
commit → PR → review loop described in
[.guidelines/workflow/tdd.md](.guidelines/workflow/tdd.md) and
[.guidelines/workflow/integration.md](.guidelines/workflow/integration.md).

**Branch naming:** cloud agents must prefix branches `cursor/<feature>-<hash>`
(e.g. `cursor/dark-mode-5a14`); humans use `feat/<name>` or `fix/<name>`. See
[Branch naming](#branch-naming) below for the full table.

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

- `SKIP_DB=1` — skip local D1 migrations
- `SKIP_SCREENSHOTS=1` — skip Playwright page captures
- `SKIP_INSTALL=1` — skip `pnpm install`

## Testing strategy

| Layer            | Tool                              | Location                      | When to add                                        |
| ---------------- | --------------------------------- | ----------------------------- | -------------------------------------------------- |
| **Unit**         | Node `node:test` via `tsx --test` | `**/*.test.ts` next to source | All business logic, tokens, helpers, API utilities |
| **Integration**  | Same runner + D1/wrangler         | `packages/db`, `packages/api` | DB queries, storage adapters                       |
| **Visual / E2E** | Playwright                        | `apps/web/e2e/`               | Page renders, `data-page` markers, screenshot CI   |

**Rule:** If you add or change behavior, add or update a test in the same commit series. CI runs `pnpm test` on every pull request.

## Code style (all TypeScript)

- **Strict mode** — inherited from `tsconfig.base.json` (`strict: true`)
- **Formatting** — Prettier (`.prettierrc`): single quotes, semicolons, trailing commas, 100-char width
- **Linting** — ESLint flat config from `@freshy/config` (root `eslint.config.mjs`)
- **Unused vars** — prefix with `_` if intentionally unused
- **React** — no `react-in-jsx-scope`; hooks rules enforced
- **Auth on web** — use `@clerk/clerk-react`, not `@clerk/nextjs`: `apps/web` is a static export and cannot use Next.js middleware-based Clerk
- **Imports** — prefer workspace packages (`@freshy/ui`, `@freshy/db`, etc.)

## Pull request requirements

Generic PR hygiene (tests cover changed behavior, no secrets in the diff,
docs updated when behavior changes) is covered in
[.guidelines/workflow/review.md](.guidelines/workflow/review.md) and the
[PR template](.guidelines/templates/pr.md). Freshy-specific additions:

- [ ] `bash scripts/validation.sh` passes locally (or document why a step was skipped)
- [ ] `.env.example` updated if new environment variables are introduced
- [ ] D1 migrations included if the schema changed
- [ ] **PR is mergeable into `main`** (no conflicts; rebases cleanly if required)

**Definition of done:** A branch or agent task is **not complete** until the pull request shows as mergeable on GitHub. Resolve conflicts with `git fetch origin && git rebase origin/main`, fix files, run validation, then `git push --force-with-lease`.

Use the [pull request template](.github/pull_request_template.md). CI posts a quality summary and page screenshots for UI changes.

## Branch naming

| Pattern                 | Use                         |
| ----------------------- | --------------------------- |
| `main`                  | Production-ready; protected |
| `feat/<name>`           | Human feature branches      |
| `fix/<name>`            | Bug fixes                   |
| `cursor/<feature>-5a14` | Cloud agent branches        |

Never force-push to `main`. All changes merge via pull request.

## Local setup

```bash
pnpm install
pnpm --filter @freshy/db migrate:local
pnpm dev    # web :3000, Worker API :8787
```

See [docs/local-development.md](docs/local-development.md) for env vars and troubleshooting.

## Where to put new code

| Change                   | Location                                                |
| ------------------------ | ------------------------------------------------------- |
| Web screens (PWA)        | `apps/web/src/app/`                                     |
| Mobile screens           | `apps/mobile/app/`                                      |
| Shared UI components     | `packages/ui/src/`                                      |
| REST API / R2 / D1       | `packages/api/src/`                                     |
| Database schema          | `packages/db/src/schema.ts` + `packages/db/migrations/` |
| ESLint / Tailwind tokens | `packages/config/`                                      |
| CI / scripts             | `.github/workflows/`, `scripts/`                        |

## Questions?

Open a discussion or issue on GitHub. For design decisions, cite [docs/stitch/](docs/stitch/) and [DESIGN.md](docs/stitch/freshy/DESIGN.md).
