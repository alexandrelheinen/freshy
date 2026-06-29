# Cloudflare — Freshy

Freshy uses **Cloudflare** for hosting, CDN, object storage, and (in production) the edge API. This guide covers account setup for **R2**, **Pages**, and CI screenshot uploads.

> Full architecture split (Cloudflare vs external): [docs/infrastructure.md](../../docs/infrastructure.md)

---

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (optional, for Workers/Pages deploys)
- Domain on Cloudflare DNS (optional; recommended for production)

---

## 1. Create R2 bucket

1. Dashboard → **R2** → **Create bucket**
2. Name: `freshy-assets`
3. Location: **Automatic** (or pick region closest to pilot city)

### Bucket prefixes

| Prefix | Purpose |
| ------ | ------- |
| `places/` | Venue photos |
| `avatars/` | User avatars |
| `ci/` | PR screenshot previews (public read) |
| `releases/` | Optional mobile build mirrors |

---

## 2. R2 API token (for API + CI)

1. **R2** → **Manage R2 API Tokens** → **Create API token**
2. Permissions: **Object Read & Write** on `freshy-assets`
3. Save **Access Key ID** and **Secret Access Key**

Note your **Account ID** (right sidebar on any Cloudflare dashboard page).

---

## 3. Public access for `ci/` (PR screenshots)

PR comments embed image URLs. Choose one:

### Option A — R2 public bucket (`*.r2.dev`)

1. Bucket → **Settings** → enable **Public access** (r2.dev subdomain)
2. Set `R2_PUBLIC_URL=https://pub-<hash>.r2.dev`

### Option B — Custom domain (recommended for production)

1. Bucket → **Settings** → **Connect Domain** → e.g. `assets.freshy.app`
2. Add the CNAME Cloudflare provides
3. Set `R2_PUBLIC_URL=https://assets.freshy.app`

Objects are public at: `{R2_PUBLIC_URL}/{key}` — e.g. `https://assets.freshy.app/ci/pr-42/explore.png`

---

## 4. CORS (web uploads)

For browser-direct uploads to R2 (Phase 7), add CORS rules on the bucket:

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

## 5. Local & API environment variables

Copy root `.env.example` → `.env`:

```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=freshy-assets
R2_PUBLIC_URL=https://assets.freshy.app
```

The `@freshy/api` package uses the S3-compatible API (`@aws-sdk/client-s3`).

---

## 6. GitHub Actions secrets

Repository → **Settings → Secrets and variables → Actions**:

| Secret | Value |
| ------ | ----- |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 token access key |
| `R2_SECRET_ACCESS_KEY` | R2 token secret |
| `R2_BUCKET_NAME` | `freshy-assets` |
| `R2_PUBLIC_URL` | Public base URL (no trailing slash) |
| `EXPO_TOKEN` | Expo token (mobile releases — unchanged) |

After configuring, open a test PR — the bot should post screenshots hosted on R2.

---

## 7. Cloudflare Pages (web app)

### Connect GitHub

1. Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select the `freshy` repository
3. **Root directory:** `apps/web` (or monorepo build — see below)

### Build settings (monorepo)

| Setting | Value |
| ------- | ----- |
| **Framework preset** | Next.js |
| **Build command** | `cd ../.. && pnpm install && pnpm --filter @freshy/web build` |
| **Build output directory** | `apps/web/.next` (or per OpenNext adapter docs) |
| **Node.js version** | 20 |

For full Next.js 15 SSR on Pages, use the [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare) when moving beyond static shell deploy.

### Environment variables (Pages)

| Name | Example |
| ---- | ------- |
| `NEXT_PUBLIC_API_URL` | `https://api.freshy.app` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `pk.xxx` |

Preview deployments are created automatically for each pull request.

---

## 8. Cloudflare Workers (API — production target)

Local development uses **Express** (`packages/api`). Production deploys to **Workers** with **Hyperdrive** pointing at Neon/Supabase.

1. Copy `wrangler.toml.example` → `wrangler.toml` (do not commit secrets)
2. Create a **Hyperdrive** config in the dashboard linked to your `DATABASE_URL`
3. Bind R2 bucket and Hyperdrive in `wrangler.toml`
4. Deploy: `wrangler deploy` (from `infrastructure/cloudflare/` or a future `apps/api-worker/`)

See [Hyperdrive docs](https://developers.cloudflare.com/hyperdrive/) for connection string setup.

---

## 9. DNS (optional)

If your domain is on Cloudflare:

| Record | Target |
| ------ | ------ |
| `@` or `www` | Cloudflare Pages project |
| `api` | Workers custom domain |
| `assets` | R2 custom domain |

---

## SDK usage

`@freshy/api` → `src/storage/r2.ts`:

- `uploadAsset(path, buffer, contentType)` — upload file
- `getSignedUrl(path)` — temporary read URL
- `isR2Configured()` — health check (`GET /health` reports `r2` status)

---

## Remove Google Cloud (if migrating)

1. Delete GitHub secrets: `GCP_PROJECT_ID`, `GCS_BUCKET_NAME`, `GCP_SA_KEY`
2. Remove local `GOOGLE_APPLICATION_CREDENTIALS` from `.env`
3. Decommission GCS bucket when R2 is verified
