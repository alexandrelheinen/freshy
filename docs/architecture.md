# Freshy — Architecture & Repository Layout

## Overview

Freshy is a **pnpm monorepo** managed with **Turborepo**. Each sub-project lives in its own folder with independent `package.json`, scripts, and CI integration.

**Hosting strategy:** Cloudflare-first (Pages, Workers, R2). PostgreSQL + PostGIS runs on Neon or Supabase; Mapbox and Expo EAS remain external.

```
freshy/
├── apps/
│   ├── web/                 # @freshy/web — Next.js PWA → Cloudflare Pages
│   └── mobile/              # @freshy/mobile — Expo (Android/iOS) → EAS
├── packages/
│   ├── api/                 # @freshy/api — Express (local) + R2; Workers in prod
│   ├── db/                  # @freshy/db — Prisma + PostgreSQL
│   ├── ui/                  # @freshy/ui — Shared React components
│   └── config/              # @freshy/config — ESLint + Tailwind preset
├── infrastructure/
│   ├── docker/              # Local PostGIS via Docker Compose
│   └── cloudflare/          # R2, Pages, Workers setup + wrangler template
├── scripts/
│   ├── validation.sh        # Full local validation pipeline
│   ├── build.sh             # Compile all packages
│   ├── setup-local-db.sh    # Start local PostgreSQL
│   └── post-pr-screenshots.sh
├── docs/
│   ├── stitch/              # Stitch design export (reference)
│   ├── database.md          # Schema, seed, migrations, env vars
│   ├── deploy-api.md        # Connect Pages → API → Neon (production)
│   ├── infrastructure.md    # Cloudflare vs external providers
│   ├── roadmap.md           # Product & phase plan
│   ├── architecture.md      # This file
│   ├── development-cycle.md # TDD workflow (mandatory)
│   ├── quality-standards.md # Per-language quality rules
│   ├── git-rules.md         # Branching & PR rules
│   └── milestones/          # Operational checklists per roadmap phase
│       ├── README.md        # Milestone index
│       └── phase-0-bootstrap.md
└── screenshots/             # CI-generated page previews (gitignored)
```

## Sub-projects mapped to roadmap phases

| Phase              | Folder(s)                                      | Deliverable                    |
| ------------------ | ---------------------------------------------- | ------------------------------ |
| 0 — Foundation     | `packages/config`, `packages/ui`, root tooling | Design tokens, shared shell    |
| 1 — Map            | `apps/web` `/explore`, `packages/db`           | Geo places, map UI             |
| 2 — Place detail   | `apps/web` `/places/[slug]`                    | Detail page + API              |
| 3 — Categories     | `apps/web` `/cooling`                          | Category browser               |
| 4 — Auth & profile | `apps/web` `/profile`, `packages/api`          | User accounts, saved places    |
| 5 — Reviews        | `packages/db` `Review`, `packages/api`         | Climate reviews, points        |
| 6 — PWA            | `apps/web`                                     | Service worker, install prompt |
| 7 — Launch         | `infrastructure/cloudflare`, CI/CD             | R2 assets, production deploy   |
| Mobile             | `apps/mobile`                                  | Android + iOS via Expo EAS     |

## Data flow

```mermaid
flowchart LR
    Web[apps/web] --> API[packages/api]
    Mobile[apps/mobile] --> API
    API --> DB[(PostgreSQL via Hyperdrive)]
    API --> R2[(Cloudflare R2)]
    Web --> UI[packages/ui]
    Mobile --> UI
    DB --> Prisma[packages/db]
```

## Storage (Cloudflare R2)

All binary assets (place photos, avatars, CI screenshots) use **Cloudflare R2**. See [`infrastructure/cloudflare/README.md`](../infrastructure/cloudflare/README.md) and [`docs/infrastructure.md`](infrastructure.md).

## Local development

```bash
# 1. Start database
bash scripts/setup-local-db.sh

# 2. Install & migrate
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 3. Run everything
pnpm dev
```

| Service  | URL                   |
| -------- | --------------------- |
| Web      | http://localhost:3000 |
| API      | http://localhost:4000 |
| Postgres | localhost:5432        |

R2 is optional locally — set `R2_*` env vars to test uploads.

## CI/CD

| Workflow      | Trigger             | Actions                                                      |
| ------------- | ------------------- | ------------------------------------------------------------ |
| `ci.yml`      | Pull request        | Lint, typecheck, test, build, 4-page screenshots → R2, PR comment |
| `release.yml` | GitHub Release `v*` | EAS build Android + iOS                                      |

## Scripts reference

| Script                      | Description                               |
| --------------------------- | ----------------------------------------- |
| `scripts/validation.sh`     | Full pipeline — use before opening a PR   |
| `scripts/build.sh`          | Compile all TypeScript / Next.js / API    |
| `scripts/setup-local-db.sh` | Docker PostGIS for simulators & local API |

Environment flags for `validation.sh`:

- `SKIP_DB=1` — skip Docker database
- `SKIP_SCREENSHOTS=1` — skip Playwright
- `SKIP_INSTALL=1` — skip `pnpm install`
