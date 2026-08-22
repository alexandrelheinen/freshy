# Cloudflare | Freshy

Freshy uses **Cloudflare** for hosting, CDN, object storage, API (Workers), and database (D1). This guide covers account setup for **R2**, **Pages**, **Workers**, and **D1**.

> Full architecture: [docs/infrastructure.md](../../docs/infrastructure.md)  
> Production resource names: [docs/platforms.md](../../docs/platforms.md)

---

## Production resources

| Resource      | Name            | Config                                                           |
| ------------- | --------------- | ---------------------------------------------------------------- |
| Pages project | `getfreshy`     | Git integration                                                  |
| Worker        | `freshy-api`    | [`packages/api/wrangler.toml`](../../packages/api/wrangler.toml) |
| D1 database   | `freshy-db`     | Binding `FRESHY_DB`                                              |
| R2 bucket     | `freshy-assets` | Binding `FRESHY_ASSETS`                                          |

---

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (via `pnpm`, used in `packages/api`)
- Domain on Cloudflare DNS (optional; recommended for custom domain)

---

## 1. Create R2 bucket

1. Dashboard → **R2** → **Create bucket**
2. Name: `freshy-assets`
3. Location: **Automatic** (or pick region closest to pilot city)

### Bucket prefixes

| Prefix             | Purpose                                         |
| ------------------ | ----------------------------------------------- |
| `places/`          | Venue photos                                    |
| `places/defaults/` | Category default place photos                   |
| `avatars/`         | User avatars                                    |
| `ci/`              | PR screenshot previews (public read)            |
| `ci/main/latest/`  | Production page screenshots after `main` deploy |
| `releases/`        | Optional mobile build mirrors                   |

---

## 2. R2 API token (for CI uploads)

The Worker uses the native `FRESHY_ASSETS` binding. Separate R2 API tokens are needed for **GitHub Actions** (CI screenshots, place-default sync):

1. **R2** → **Manage R2 API Tokens** → **Create API token**
2. Permissions: **Object Read & Write** on `freshy-assets`
3. Save **Access Key ID** and **Secret Access Key**

Note your **Account ID** (right sidebar on any Cloudflare dashboard page).

---

## 3. Public access for objects

Place photos and CI screenshots need public URLs.

### Option A | R2 public bucket (`*.r2.dev`)

1. Bucket → **Settings** → enable **Public access** (r2.dev subdomain)
2. Set `R2_PUBLIC_URL=https://pub-<hash>.r2.dev` in `wrangler.toml` vars

### Option B | Custom domain (recommended for production)

1. Bucket → **Settings** → **Connect Domain** → e.g. `assets.freshy.app`
2. Add the CNAME Cloudflare provides
3. Set `R2_PUBLIC_URL=https://assets.freshy.app`

Objects are public at: `{R2_PUBLIC_URL}/{key}`

Set `NEXT_PUBLIC_R2_PUBLIC_URL` on Cloudflare Pages to the same base URL.

---

## 4. CORS (web uploads)

For browser-direct uploads to R2, add CORS rules on the bucket:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://freshy.app", "https://*.pages.dev"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

Dashboard → bucket → **Settings** → **CORS policy**.

---

## 5. Cloudflare Pages (web app)

### Connect GitHub

1. Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select the `freshy` repository

### Build settings (monorepo)

| Setting                    | Value                                                         |
| -------------------------- | ------------------------------------------------------------- |
| **Framework preset**       | Next.js                                                       |
| **Build command**          | `cd ../.. && pnpm install && pnpm --filter @freshy/web build` |
| **Build output directory** | `out` (static export)                                         |
| **Node.js version**        | 20                                                            |

### Environment variables (Pages)

| Name                                | Example                                           |
| ----------------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`               | `https://freshy-api.alexandrelheinen.workers.dev` |
| `NEXT_PUBLIC_MAPBOX_TOKEN`          | `pk.xxx`                                          |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_xxx`                                     |
| `NEXT_PUBLIC_R2_PUBLIC_URL`         | Same as Worker `R2_PUBLIC_URL`                    |

Preview deployments are created automatically for each pull request.

---

## 6. Cloudflare Worker (API)

Production config: [`packages/api/wrangler.toml`](../../packages/api/wrangler.toml).

### Bindings

| Binding         | Resource           |
| --------------- | ------------------ |
| `FRESHY_DB`     | D1 `freshy-db`     |
| `FRESHY_ASSETS` | R2 `freshy-assets` |

### Secrets (Worker dashboard or `wrangler secret put`)

| Secret                     | Purpose                   |
| -------------------------- | ------------------------- |
| `CLERK_SECRET_KEY`         | JWT verification          |
| `CLERK_AUTHORIZED_PARTIES` | Allowed frontend origins  |
| `MAPBOX_ACCESS_TOKEN`      | Geocoding on place submit |

### Deploy

```bash
pnpm build:api
pnpm db:migrate:remote
pnpm deploy:api
```

Or run `pnpm migrate:deploy:production` and `pnpm deploy:api` locally with Cloudflare credentials.

---

## 7. Cloudflare D1 (database)

1. Dashboard → **Workers & Pages** → **D1** → create `freshy-db`
2. Copy database ID into `wrangler.toml`
3. Apply migrations: `pnpm --filter @freshy/db migrate:remote`

Migrations: [`packages/db/migrations/`](../../packages/db/migrations/)

---

## 8. GitHub Actions secrets

Repository → **Settings → Secrets and variables → Actions**:

| Secret                  | Value                                   |
| ----------------------- | --------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | API token with Workers + D1 permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID                   |
| `R2_ACCOUNT_ID`         | For CI screenshot uploads (optional)    |
| `R2_ACCESS_KEY_ID`      | R2 token access key (optional)          |
| `R2_SECRET_ACCESS_KEY`  | R2 token secret (optional)              |
| `R2_BUCKET_NAME`        | `freshy-assets` (optional)              |
| `R2_PUBLIC_URL`         | Public base URL (optional)              |
| `EXPO_TOKEN`            | Expo token (mobile releases)            |

### CD workflows on `main`

| Workflow                                                                         | Trigger                      | Action                             |
| -------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------- |
| `pnpm deploy:api`                                                                | Local / CI                   | Build and deploy Worker            |
| [migrate-database.yml](../../.github/workflows/migrate-database.yml)             | Manual (`workflow_dispatch`) | Remote D1 migrations only          |
| [migrate-database.yml](../../.github/workflows/migrate-database.yml)             | Manual only                  | D1 migrate only (no Worker deploy) |
| [sync-place-defaults.yml](../../.github/workflows/sync-place-defaults.yml)       | Default place images change  | `pnpm upload:place-defaults`       |
| [production-screenshots.yml](../../.github/workflows/production-screenshots.yml) | Web or UI change             | Live Pages screenshots → R2        |
| [smoke-production.yml](../../.github/workflows/smoke-production.yml)             | Every `main` push            | API + web health checks            |

---

## 9. DNS (optional)

If your domain is on Cloudflare:

| Record       | Target                   |
| ------------ | ------------------------ |
| `@` or `www` | Cloudflare Pages project |
| `api`        | Workers custom domain    |
| `assets`     | R2 custom domain         |

---

## SDK usage

`@freshy/api` → `src/storage/r2.ts`:

- Native R2 binding via `FRESHY_ASSETS` on Worker
- `isR2Configured()` — health check (`GET /health` reports `r2` status)

---

## Local development

See [docs/local-development.md](../../docs/local-development.md). Wrangler emulates D1 and R2 locally during `wrangler dev`.
