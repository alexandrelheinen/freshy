# Freshy — Migration Tutorial: Render + Neon → Cloudflare (For Dummies 🎓)

> **Goal**: Get rid of Render (API host) and Neon (PostgreSQL), and run everything on Cloudflare.
> After this migration, your only external vendors will be **Cloudflare** + **Clerk**.

---

## 🗺️ What's changing and why

| Today | After migration |
|---|---|
| API = Express on **Render** (Node.js server) | API = **Cloudflare Worker** (edge, globally distributed) |
| Database = **Neon** (PostgreSQL via Prisma) | Database = **Cloudflare D1** (SQLite at the edge) |
| ORM = Prisma (PostgreSQL dialect) | ORM = **Drizzle** (or raw SQL via D1 binding) |
| Migrations = `prisma migrate deploy` in CI | Migrations = `wrangler d1 migrations apply` |

> [!IMPORTANT]
> D1 is **SQLite**, not PostgreSQL. This means Prisma with its PostgreSQL dialect won't work as-is.
> The `packages/db` and `packages/api` packages need refactoring. That's the bulk of the PR work.

---

## Part 1 — Replace Render with a Cloudflare Worker

### What Render was doing

Looking at [`render.yaml`](file:///home/alexandre/Workspace/freshy/infrastructure/render/render.yaml):
- It ran `node packages/api/dist/server.js` — a plain **Express** HTTP server
- It set env vars: `DATABASE_URL`, `DIRECT_DATABASE_URL`, `MAPBOX_ACCESS_TOKEN`

### What a Cloudflare Worker does instead

A Worker is a small JS/TS function that handles HTTP requests — no Node.js process, no `express`, no `listen()`.
Instead of `app.listen(4000)`, you `export default { fetch(request, env) { ... } }`.

### Step-by-step: Create the Worker

#### 1. Go to your Cloudflare dashboard

1. Log in at [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Workers & Pages** in the left sidebar
3. Click **Create** → **Worker**
4. Name it `freshy-api`
5. Click **Deploy** (this creates a blank "Hello World" worker you'll replace with real code)

#### 2. Set the Worker's environment variables (secrets)

In the Worker you just created:

1. Click **Settings** → **Variables and Secrets**
2. Add these (all as **Secrets**, not plain text):

| Variable name | Where to get the value |
|---|---|
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
| `MAPBOX_ACCESS_TOKEN` | Your Mapbox account |
| `CLERK_AUTHORIZED_PARTIES` | Same as now: `https://freshy.app,https://freshy-25e.pages.dev` |

> [!NOTE]
> No `DATABASE_URL` here — D1 is injected as a **binding**, not a connection string. See Part 2.

#### 3. Bind the D1 database to the Worker

After creating D1 (Part 2), come back here:

1. Worker → **Settings** → **Bindings** → **Add** → **D1 Database**
2. Variable name: `DB`
3. D1 database: `freshy-db`

#### 4. Bind the R2 bucket to the Worker

(You already have R2 set up per the existing Cloudflare README)

1. Worker → **Settings** → **Bindings** → **Add** → **R2 Bucket**
2. Variable name: `ASSETS`
3. Bucket name: `freshy-assets`

#### 5. Add a custom domain for the Worker

So the web app can still call `https://api.freshy.app`:

1. Worker → **Settings** → **Domains & Routes** → **Add Custom Domain**
2. Enter `api.freshy.app` (your domain must be on Cloudflare DNS)
3. Cloudflare auto-creates the DNS record — no manual step needed

> [!TIP]
> Until you flip DNS, you can point `NEXT_PUBLIC_API_URL` at the default Worker URL like
> `https://freshy-api.your-subdomain.workers.dev` to test without breaking production.

#### 6. Update `wrangler.toml` in the repo

Your current [`packages/api/wrangler.toml`](file:///home/alexandre/Workspace/freshy/packages/api/wrangler.toml) already has the skeleton.
Once you have real IDs, fill them in:

```toml
name = "freshy-api"
main = "src/worker.ts"           # ← new Worker entry point (not server.ts)
compatibility_date = "2026-06-30"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "freshy-db"
database_id = "your-real-d1-id-here"   # ← paste from dashboard
migrations_dir = "../db/migrations"

[[r2_buckets]]
binding = "ASSETS"
bucket_name = "freshy-assets"

[vars]
R2_PUBLIC_URL = "https://assets.freshy.app"

[env.production]
routes = [{ pattern = "api.freshy.app", custom_domain = true }]
```

#### 7. Deploy the Worker from the CLI

```bash
# From repo root
cd packages/api
npx wrangler deploy
```

Or let CI do it (see Part 3).

---

## Part 2 — Replace Neon with Cloudflare D1

### What Neon was doing

Neon was a hosted **PostgreSQL** database. Your app connected to it via `DATABASE_URL` (a Postgres connection string), and Prisma managed the schema and migrations.

### What D1 does instead

**D1** is Cloudflare's managed **SQLite** database. It lives inside Cloudflare — no external connection string, no `DATABASE_URL`. The Worker accesses it via a binding: `env.DB`.

> [!WARNING]
> **SQLite ≠ PostgreSQL**. A few things in your current schema will need small adjustments:
> - `String[]` (arrays) — SQLite doesn't have native arrays. Store as JSON text, or use a join table.
> - `tags String[] @default([])` on `Place` model — this needs to become `tags TEXT DEFAULT '[]'` and be parsed in code.
> - Prisma uses `postgresql` dialect — you'll need to switch to Drizzle ORM or use Prisma's D1 preview (experimental). **Drizzle is recommended** as it has first-class D1 support.

### Step-by-step: Set up D1

#### 1. Create the D1 database in the dashboard

1. Cloudflare dashboard → **D1** (in the left sidebar under "Storage & Databases")
2. Click **Create database**
3. Name: `freshy-db`
4. Location: **Europe West** (closest to your users)
5. Click **Create**
6. **Copy the Database ID** — you'll need it for `wrangler.toml`

#### 2. (Alternative) Create via CLI

```bash
npx wrangler d1 create freshy-db
```

This prints the `database_id` to paste into `wrangler.toml`.

#### 3. Run migrations against D1

Your existing migration file is at [`packages/db/migrations/0001_init.sql`](file:///home/alexandre/Workspace/freshy/packages/db/migrations/0001_init.sql).
It's already valid SQLite syntax (DATETIME, TEXT, BOOLEAN — perfect).

```bash
# Apply migrations to the remote D1 database
npx wrangler d1 migrations apply freshy-db --remote

# Or for local development (uses a local SQLite file):
npx wrangler d1 migrations apply freshy-db --local
```

> [!TIP]
> `--local` spins up a local D1 that `wrangler dev` uses. You don't need Docker/Postgres locally anymore!

#### 4. Seed the database (optional)

If you have existing data in Neon to migrate:

1. Export from Neon: Neon dashboard → your project → **Backups** → export as SQL
2. Convert Postgres-specific SQL to SQLite if needed (mostly `SERIAL` → `TEXT`, etc.)
3. Import into D1:
   ```bash
   npx wrangler d1 execute freshy-db --remote --file=./seed.sql
   ```

Or re-seed from scratch using your [`seed.ts`](file:///home/alexandre/Workspace/freshy/packages/db/prisma/seed.ts).

#### 5. Switch the ORM from Prisma (PostgreSQL) to Drizzle (D1-native)

> [!IMPORTANT]
> This is the biggest code change in the PR. The `@freshy/db` package needs to be rewritten.

**Why Drizzle?** Drizzle has first-class D1 support and generates SQL that works with SQLite.
Prisma has an experimental D1 adapter but it's not production-ready.

Here's what the new `packages/db/src/index.ts` would look like conceptually:

```typescript
// NEW: packages/db/src/index.ts (Drizzle + D1)
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export * from './schema';
```

And in the Worker entry point:

```typescript
// NEW: packages/api/src/worker.ts
import { createDb } from '@freshy/db';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const db = createDb(env.DB);
    // ... route handling
  }
}
```

This replaces `new PrismaClient()` which used `DATABASE_URL` to connect over the network.

---

## Part 3 — Update GitHub Actions CI/CD

Your CI workflows reference Neon's `DATABASE_URL` and Render deployment. Here's what to update:

### GitHub Secrets to remove

Go to: **GitHub repo → Settings → Secrets and variables → Actions**

| Secret to **remove** | Reason |
|---|---|
| `DATABASE_URL` | No longer needed (D1 doesn't use connection strings) |
| `DIRECT_DATABASE_URL` | Neon-specific, remove |

### GitHub Secrets to add

| Secret to **add** | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | From Cloudflare → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template |
| `CLOUDFLARE_ACCOUNT_ID` | From Cloudflare dashboard right sidebar |

### Replace the deploy workflow

Replace the old Render deploy step with Wrangler:

```yaml
# .github/workflows/deploy-api.yml (new or updated)
- name: Deploy Worker
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    workingDirectory: packages/api
    command: deploy
```

### Replace the migrate workflow

Replace `prisma migrate deploy` with:

```yaml
# In migrate-database.yml
- name: Apply D1 migrations
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: d1 migrations apply freshy-db --remote
```

### Update Cloudflare Pages env vars

In **Cloudflare Pages** → your project → **Settings → Environment variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.freshy.app` (your Worker domain) |
| Remove any `DATABASE_URL` reference | N/A |

---

## Part 4 — Delete Render and Neon

### Delete Render

> [!CAUTION]
> Only do this **after** verifying your Worker is live and healthy at `api.freshy.app`.

1. Go to [render.com/dashboard](https://dashboard.render.com)
2. Click on your **freshy-api** service
3. Click **Settings** (bottom of sidebar) → scroll to **Delete Service** → confirm
4. **Do you need to delete the whole account?** Only if you want. Deleting the service is enough to stop all billing. Deleting the account also removes saved cards etc — up to you.

### Delete Neon

> [!CAUTION]
> Only do this **after** verifying D1 has all your data and the Worker is working correctly.

1. Go to [console.neon.tech](https://console.neon.tech)
2. Select your project (the one freshy was using)
3. **Settings** → **Delete project** → type the project name to confirm
4. **Do you need to delete the whole account?** Deleting the project removes all databases and stops billing. Deleting the Neon account is optional — it's free either way once the project is gone.

---

## 🧭 Summary: Migration Checklist

```
[ ] 1. Create D1 database "freshy-db" in Cloudflare
[ ] 2. Fill in database_id in packages/api/wrangler.toml
[ ] 3. Switch @freshy/db from Prisma (PostgreSQL) → Drizzle (D1/SQLite)
[ ] 4. Write packages/api/src/worker.ts (replace Express server.ts)
[ ] 5. Test locally with `wrangler dev`
[ ] 6. Apply migrations: `wrangler d1 migrations apply freshy-db --local`
[ ] 7. Set Worker bindings: D1 "DB" + R2 "ASSETS" + secrets
[ ] 8. Deploy: `wrangler deploy` (or via CI)
[ ] 9. Point api.freshy.app custom domain to Worker
[ ] 10. Update NEXT_PUBLIC_API_URL in Cloudflare Pages
[ ] 11. Add CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID to GitHub Secrets
[ ] 12. Remove DATABASE_URL / DIRECT_DATABASE_URL from GitHub Secrets
[ ] 13. Update CI workflows (replace Render deploy + prisma migrate with Wrangler)
[ ] 14. Run smoke tests: GET /health, GET /places — verify 200 responses
[ ] 15. Delete Render service
[ ] 16. Delete Neon project
```

---

## 💡 FAQ

**Q: Will local development still work?**
Yes! `wrangler dev` replaces `tsx watch src/server.ts`. It spins up a local Worker runtime with a local D1 SQLite file. No Docker, no Postgres needed locally anymore.

**Q: What about PostGIS? The old code had `geo.ts`.**
D1/SQLite doesn't have PostGIS. Looking at your [`packages/db/src/geo.ts`](file:///home/alexandre/Workspace/freshy/packages/db/src/geo.ts) — you'll need to implement the geo queries in pure math (Haversine formula) in TypeScript instead of `ST_Distance`. This is straightforward and actually faster at the edge.

**Q: Does Drizzle have migrations like Prisma?**
Yes. `drizzle-kit generate` creates SQL migration files, and `wrangler d1 migrations apply` runs them. Similar workflow.

**Q: What about `prisma/dev.db`?**
That's your local development SQLite file used by Prisma. Once you switch to Drizzle + `wrangler dev`, it's no longer needed and can be deleted.

**Q: Is there a cost?**
- D1: **Free** up to 5 million reads/day, 100k writes/day, 5 GB storage — more than enough
- Workers: **Free** up to 100k requests/day — more than enough for early stage
