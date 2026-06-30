# Freshy | Cloudflare migration tutorial (Path B)

> **Goal:** Move the API from Render and the database from Neon onto Cloudflare. When you finish, production is **Pages + Worker + D1 + R2 + Clerk**. Render and Neon are no longer needed.

Technical reference: [cloudflare-migration.md](cloudflare-migration.md).

---

## What you are replacing

| Today                                         | After Path B                           |
| --------------------------------------------- | -------------------------------------- |
| API on **Render** (`freshy-api.onrender.com`) | **Cloudflare Worker** `freshy-api`     |
| **Neon** PostgreSQL + PostGIS                 | **Cloudflare D1** SQLite (`freshy-db`) |
| Prisma + `DATABASE_URL`                       | Drizzle + `FRESHY_DB` binding          |
| R2 via S3 API keys on Render                  | R2 via `FRESHY_ASSETS` binding         |
| Web on **Cloudflare Pages**                   | Same (no change)                       |

**Yes:** Path B removes Render and Neon from the stack. Clerk and Mapbox stay as external services.

---

## Resource map (from `wrangler.toml`)

| Cloudflare resource | Name in dashboard | Worker binding  |
| ------------------- | ----------------- | --------------- |
| Worker              | `freshy-api`      | n/a             |
| D1 database         | `freshy-db`       | `FRESHY_DB`     |
| R2 bucket           | `freshy-assets`   | `FRESHY_ASSETS` |
| Pages site          | `freshy-25e`      | n/a             |

Current Worker URL: `https://freshy-api.alexandrelheinen.workers.dev`  
D1 database ID is in [`packages/api/wrangler.toml`](../packages/api/wrangler.toml).

---

## Part 1 | D1 database

### Create (if not done)

Dashboard → **D1** → **Create database** → name `freshy-db` → region **Europe West**.

Or via CLI:

```bash
cd packages/api
npx wrangler d1 create freshy-db
```

Copy the `database_id` into `wrangler.toml` under `[[d1_databases]]`.

### Bind to the Worker

Dashboard → **Workers & Pages** → **freshy-api** → **Settings** → **Bindings** → **Add** → **D1 database**

| Field         | Value       |
| ------------- | ----------- |
| Variable name | `FRESHY_DB` |
| Database      | `freshy-db` |

### Run migrations

Schema SQL lives in [`packages/db/migrations/0001_init.sql`](../packages/db/migrations/0001_init.sql).

```bash
# Local (wrangler dev uses this SQLite file)
pnpm --filter @freshy/db migrate:local

# Production
pnpm --filter @freshy/db migrate:remote
```

### Seed data (optional)

Export from Neon before deleting it, convert Postgres-specific syntax to SQLite, then:

```bash
npx wrangler d1 execute freshy-db --remote --file=./seed.sql
```

Or adapt [`packages/db/prisma/seed.ts`](../packages/db/prisma/seed.ts) for Drizzle.

---

## Part 2 | R2 bucket

R2 is already used for assets. Bind it to the Worker so uploads do not need API keys inside the Worker code.

Dashboard → **freshy-api** → **Settings** → **Bindings** → **Add** → **R2 bucket**

| Field         | Value           |
| ------------- | --------------- |
| Variable name | `FRESHY_ASSETS` |
| Bucket        | `freshy-assets` |

`R2_PUBLIC_URL` is set in `wrangler.toml` under `[vars]`. Update it if you connect a custom domain like `assets.freshy.app`.

---

## Part 3 | Worker secrets

Dashboard → **freshy-api** → **Settings** → **Variables and Secrets**

Add as **Secrets**:

| Name                       | Source                                                 |
| -------------------------- | ------------------------------------------------------ |
| `CLERK_SECRET_KEY`         | Clerk dashboard → API Keys                             |
| `MAPBOX_ACCESS_TOKEN`      | Mapbox account                                         |
| `CLERK_AUTHORIZED_PARTIES` | e.g. `https://freshy.app,https://freshy-25e.pages.dev` |

There is no `DATABASE_URL`. D1 arrives through the `FRESHY_DB` binding.

---

## Part 4 | Deploy the Worker

### Local test

```bash
cd packages/api
npx wrangler dev
```

Smoke checks:

```bash
curl http://localhost:8787/health
curl "http://localhost:8787/places?lat=48.9045&lng=2.3064"
```

### Deploy to Cloudflare

```bash
cd packages/api
npx wrangler deploy
```

Or let CI deploy with the Wrangler GitHub Action (see [cloudflare-migration.md](cloudflare-migration.md)).

### Custom domain (optional)

Dashboard → **freshy-api** → **Settings** → **Domains & Routes** → add `api.freshy.app` when the zone is on Cloudflare DNS.

---

## Part 5 | Point Pages at the Worker

Dashboard → **Workers & Pages** → **freshy-25e** → **Settings** → **Environment variables**

| Variable              | Value                                                                         |
| --------------------- | ----------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `https://freshy-api.alexandrelheinen.workers.dev` (or your custom API domain) |

Redeploy Pages or wait for the next build. Open the explore map and confirm places load.

---

## Part 6 | Update GitHub Actions

### Secrets to add

| Secret                  | Where to get it                                                         |
| ----------------------- | ----------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare → My Profile → API Tokens → Edit Cloudflare Workers template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard right sidebar                                      |

### Secrets to remove (after cutover)

| Secret                | Reason                                   |
| --------------------- | ---------------------------------------- |
| `DATABASE_URL`        | D1 uses bindings, not connection strings |
| `DIRECT_DATABASE_URL` | Neon-only                                |

Replace Render deploy steps with Wrangler deploy and D1 migration apply (examples in the spec doc).

---

## Part 7 | Delete Render and Neon

Only after smoke tests pass against the Worker.

### Render

1. [dashboard.render.com](https://dashboard.render.com)
2. Open **freshy-api** → **Settings** → **Delete Service**

Deleting the service stops billing. Account deletion is optional.

### Neon

1. [console.neon.tech](https://console.neon.tech)
2. Open the Freshy project → **Settings** → **Delete project**

Back up or export data before deletion.

---

## Migration checklist

```
[ ] D1 database freshy-db exists; database_id in wrangler.toml
[ ] FRESHY_DB binding on freshy-api Worker
[ ] FRESHY_ASSETS binding on freshy-api Worker
[ ] Worker secrets: CLERK_SECRET_KEY, MAPBOX_ACCESS_TOKEN, CLERK_AUTHORIZED_PARTIES
[ ] D1 migrations applied (--remote)
[ ] wrangler deploy succeeds
[ ] GET /health returns db: ok
[ ] GET /places returns data
[ ] NEXT_PUBLIC_API_URL updated on Cloudflare Pages
[ ] GitHub secrets updated for Wrangler CI
[ ] Render service deleted
[ ] Neon project deleted
```

---

## FAQ

**Will local dev still work?**  
Yes. Run `wrangler dev` in `packages/api`. It emulates the Worker and spins up a local D1 SQLite file. No Docker Postgres required.

**What happened to PostGIS?**  
D1 is SQLite without PostGIS. Radius search uses the Haversine helpers in `packages/db/src/geo.ts`.

**Why Drizzle instead of Prisma?**  
Drizzle has first-class D1 support. Migrations are plain SQL files applied with `wrangler d1 migrations apply`.

**What does Path B cost?**  
D1 and Workers free tiers cover early-stage traffic (millions of reads, 100k Worker requests per day). R2 free tier covers storage for photos and CI assets.

**Does Pages change?**  
No. Only `NEXT_PUBLIC_API_URL` needs to point at the Worker instead of Render.
