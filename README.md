# Freshy

**Freshy** is a mobile-first cooling map — find air-conditioned refuges in hot cities.

## Repository structure

| Path              | Package          | Description                     |
| ----------------- | ---------------- | ------------------------------- |
| `apps/web`        | `@freshy/web`    | Next.js PWA — 4 main screens    |
| `apps/mobile`     | `@freshy/mobile` | Expo — Android & iOS            |
| `packages/api`    | `@freshy/api`    | REST API + Google Cloud Storage |
| `packages/db`     | `@freshy/db`     | Prisma + PostgreSQL             |
| `packages/ui`     | `@freshy/ui`     | Shared React components         |
| `packages/config` | `@freshy/config` | ESLint + Tailwind tokens        |

See [docs/architecture.md](docs/architecture.md) and [docs/roadmap.md](docs/roadmap.md).

## Quick start

```bash
# Prerequisites: Node 20+, pnpm 9+, Docker (optional, for local DB)

bash scripts/setup-local-db.sh   # start PostGIS
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev                         # web :3000 + api :4000
```

## Scripts

| Command                          | Description                                      |
| -------------------------------- | ------------------------------------------------ |
| `bash scripts/validation.sh`     | Full validation (lint, test, build, screenshots) |
| `bash scripts/build.sh`          | Compile all packages                             |
| `bash scripts/setup-local-db.sh` | Local PostgreSQL via Docker                      |

## CI/CD

- **Pull requests** — lint, typecheck, tests, build, and **4-page screenshot preview** posted as a PR comment
- **Releases** (`v*`) — Expo EAS builds for **Android** and **iOS**

Configure GitHub secrets: `GCP_PROJECT_ID`, `GCS_BUCKET_NAME`, `GCP_SA_KEY`, `EXPO_TOKEN`.  
See [infrastructure/gcp/README.md](infrastructure/gcp/README.md).

## Design reference

Stitch export: [docs/stitch/](docs/stitch/)

## Git rules

[docs/git-rules.md](docs/git-rules.md)
