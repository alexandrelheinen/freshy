# Freshy

[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)](https://github.com/alexandrelheinen/freshy/actions/workflows/ci.yml)
[![Web | Cloudflare Pages](https://img.shields.io/website?url=https%3A%2F%2Ffreshy-25e.pages.dev%2Fexplore&label=Web%20%7C%20Pages&logo=cloudflare&logoColor=white&color=F38020)](https://freshy-25e.pages.dev/explore)
[![API | Cloudflare Worker](https://img.shields.io/website?url=https%3A%2F%2Ffreshy-api.alexandrelheinen.workers.dev%2Fhealth&label=API%20%7C%20Worker&logo=cloudflare&color=F38020)](https://freshy-api.alexandrelheinen.workers.dev/health)
[![Database | D1](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Ffreshy-api.alexandrelheinen.workers.dev%2Fhealth&query=%24.db&label=D1&color=00E599&logo=cloudflare)](https://dash.cloudflare.com/?to=/:account/workers/d1)

**Freshy** is a mobile-first cooling map: find air-conditioned refuges in hot cities.

| Surface                | URL                                             |
| ---------------------- | ----------------------------------------------- |
| **Live app**           | https://freshy-25e.pages.dev/explore            |
| **Live API**           | https://freshy-api.alexandrelheinen.workers.dev |
| **Platform checklist** | [docs/platforms.md](docs/platforms.md)          |

---

## Production stack (June 2026)

Freshy runs on **Cloudflare** for web, API, database, and object storage. **Clerk** handles auth; **Mapbox** serves map tiles.

| Layer        | Provider          | Resource name   | Notes                       |
| ------------ | ----------------- | --------------- | --------------------------- |
| **Web**      | Cloudflare Pages  | `freshy-25e`    | Next.js static export       |
| **API**      | Cloudflare Worker | `freshy-api`    | Hono on Workers             |
| **Database** | Cloudflare D1     | `freshy-db`     | SQLite, binding `FRESHY_DB` |
| **Storage**  | Cloudflare R2     | `freshy-assets` | Binding `FRESHY_ASSETS`     |
| **Auth**     | Clerk             | Freshy app      | JWT verified on Worker      |
| **Maps**     | Mapbox            | —               | Token on Pages              |
| **CI/CD**    | GitHub Actions    | `freshy` repo   | Lint, test, deploy          |

External services are limited to auth (Clerk), maps (Mapbox), and mobile builds (Expo EAS, future).

---

## Architecture

```mermaid
flowchart TB
    User[User browser / PWA] --> Pages[Cloudflare Pages<br/>freshy-25e]
    Pages -->|NEXT_PUBLIC_API_URL| Worker[Cloudflare Worker<br/>freshy-api]
    Pages --> Mapbox[Mapbox tiles]
    Pages --> ClerkUI[Clerk sign-in UI]
    Worker -->|FRESHY_DB| D1[(Cloudflare D1<br/>freshy-db)]
    Worker -->|FRESHY_ASSETS| R2[(Cloudflare R2<br/>freshy-assets)]
    Worker -->|verify JWT| ClerkAPI[Clerk]
    User --> ClerkUI
    GH[GitHub Actions] -->|wrangler deploy| Worker
    GH -->|d1 migrations apply| D1
    GH --> Pages
```

Deep dives: [docs/infrastructure.md](docs/infrastructure.md) · [docs/architecture.md](docs/architecture.md) · [docs/database.md](docs/database.md)

---

## Deploy pipeline

Pushing to `main` triggers **Cloudflare Pages** (web) and **GitHub Actions** (Worker + D1 migrations).

```mermaid
sequenceDiagram
    participant GH as GitHub main
    participant Pages as Cloudflare Pages
    participant GHA as GitHub Actions
    participant Worker as freshy-api Worker
    participant D1 as freshy-db D1

    GH->>Pages: Build Next.js static export
    GH->>GHA: deploy-api.yml (api/db changes)
    GHA->>D1: d1 migrations apply --remote
    GHA->>Worker: wrangler deploy
    Pages->>Worker: HTTPS /places /users/me
    Worker->>D1: Drizzle queries
```

| Workflow                                                       | Trigger                       | Action                           |
| -------------------------------------------------------------- | ----------------------------- | -------------------------------- |
| Pages (Git integration)                                        | Push to `main`                | Build and deploy web shell       |
| [deploy-api.yml](.github/workflows/deploy-api.yml)             | Push to `main`                | Build, D1 migrate, Worker deploy |
| [migrate-database.yml](.github/workflows/migrate-database.yml) | Manual (`workflow_dispatch`)  | D1 migrate only (no deploy)      |
| [ci.yml](.github/workflows/ci.yml)                             | Pull requests                 | Lint, test, build, screenshots   |

Required GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. See [docs/platforms.md](docs/platforms.md).

---

## Repository structure

| Path              | Package          | Deploy target                    |
| ----------------- | ---------------- | -------------------------------- |
| `apps/web`        | `@freshy/web`    | Cloudflare Pages                 |
| `apps/mobile`     | `@freshy/mobile` | Expo EAS (future)                |
| `packages/api`    | `@freshy/api`    | Cloudflare Worker (`freshy-api`) |
| `packages/db`     | `@freshy/db`     | Drizzle schema + D1 migrations   |
| `packages/ui`     | `@freshy/ui`     | Shared React components          |
| `packages/config` | `@freshy/config` | ESLint + Tailwind tokens         |
| `packages/theme`  | `@freshy/theme`  | YAML themes, CSS variables       |

Full layout: [docs/architecture.md](docs/architecture.md).

---

## Documentation index

| Doc                                                          | When to read it                                         |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| **[docs/platforms.md](docs/platforms.md)**                   | **All platforms, resource names, env vars, dashboards** |
| [docs/local-development.md](docs/local-development.md)       | First-time setup, `wrangler dev`, local D1              |
| [docs/infrastructure.md](docs/infrastructure.md)             | Cloudflare services, bindings, R2 layout                |
| [docs/database.md](docs/database.md)                         | D1 schema, migrations, Drizzle                          |
| [docs/architecture.md](docs/architecture.md)                 | Monorepo layout, data flow, CI                          |
| [docs/studio.md](docs/studio.md)                             | Admin Studio: Clerk role, moderation API                |
| [docs/place-classification.md](docs/place-classification.md) | Tags and freshness level catalogs                       |
| [docs/quality-standards.md](docs/quality-standards.md)       | Per-language quality rules                              |
| [CONTRIBUTING.md](CONTRIBUTING.md)                           | TDD, PR rules, validation                               |

---

## Quick start (local)

```bash
# Prerequisites: Node 20+, pnpm 9+

pnpm install
pnpm --filter @freshy/db migrate:local   # local D1 via wrangler
pnpm dev                                 # web :3000 + Worker API via wrangler dev
```

Copy [`.env.example`](.env.example) → `.env` and add Mapbox + Clerk keys for full local auth.

| Service      | URL                                      |
| ------------ | ---------------------------------------- |
| Web          | http://localhost:3000                    |
| API (Worker) | http://localhost:8787 (wrangler default) |

Details: [docs/local-development.md](docs/local-development.md).

---

## Scripts

| Command                            | Description                                           |
| ---------------------------------- | ----------------------------------------------------- |
| `pnpm dev`                         | Web + API in parallel                                 |
| `pnpm build:api`                   | Build Worker bundle inputs (config, db, api)          |
| `pnpm smoke:api`                   | Build API and verify Worker `/health` locally         |
| `pnpm smoke:web`                   | Build web without prebuilt config dist (Pages parity) |
| `bash scripts/validation.sh`       | Full validation before PR                             |
| `bash scripts/smoke-production.sh` | Smoke test live Worker + Pages                        |

---

## CI/CD (pull requests)

```mermaid
flowchart LR
    PR[Pull request] --> CI[GitHub Actions]
    CI --> Lint[lint / typecheck / test]
    CI --> Build[build]
    CI --> SS[screenshots]
    SS --> R2[(R2 optional)]
    Release[Git tag v*] --> EAS[Expo EAS mobile]
```

Optional R2 secrets for PR screenshot comments: [infrastructure/cloudflare/README.md](infrastructure/cloudflare/README.md).

---

## Product status (June 2026)

| Version             | Status                                              |
| ------------------- | --------------------------------------------------- |
| **Public v0**       | Live: explore, cooling, place detail, map           |
| **Full v0 minimal** | Live: Clerk sign-in, saved places, profile from API |
| **Next**            | Climate reviews, relief points, custom domain       |

Pilot city: **Clichy, France** (92110).

---

## Design reference

Stitch export: [docs/stitch/freshy/DESIGN.md](docs/stitch/freshy/DESIGN.md)

---

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) · [docs/quality-standards.md](docs/quality-standards.md) · [docs/git-rules.md](docs/git-rules.md)
