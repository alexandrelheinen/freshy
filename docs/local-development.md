# Freshy | Local development

> **Platforms and production config:** [platforms.md](platforms.md)  
> **Database schema:** [database.md](database.md)

This guide covers running Freshy locally with the same stack as production: **Next.js** (web), **Hono on wrangler dev** (API), and **local D1** (database).

---

## Prerequisites

| Tool     | Version    | Purpose                     |
| -------- | ---------- | --------------------------- |
| Node.js  | 20+        | Runtime                     |
| pnpm     | 9+         | Monorepo package manager    |
| Wrangler | via `pnpm` | Local Worker + D1 emulation |

No Docker or external database is required. D1 runs locally inside wrangler.

---

## First-time setup

```bash
git clone https://github.com/alexandrelheinen/freshy.git
cd freshy
pnpm install

# Apply D1 migrations to local SQLite
pnpm --filter @freshy/db migrate:local

# Copy env template and add keys
cp .env.example .env
```

Edit `.env` with at least:

| Variable                            | Purpose                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_MAPBOX_TOKEN`          | Map on `/explore`                                             |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Sign-in UI                                                    |
| `CLERK_SECRET_KEY`                  | API JWT verification (wrangler reads from `.dev.vars` or env) |
| `CLERK_AUTHORIZED_PARTIES`          | `http://localhost:3000`                                       |

For Worker secrets locally, create `packages/api/.dev.vars`:

```env
CLERK_SECRET_KEY=sk_test_...
CLERK_AUTHORIZED_PARTIES=http://localhost:3000
MAPBOX_ACCESS_TOKEN=pk....
```

Wrangler loads `.dev.vars` automatically during `wrangler dev`. Do not commit this file.

---

## Run the app

```bash
pnpm dev
```

This starts:

| Service | URL                   | Command                          |
| ------- | --------------------- | -------------------------------- |
| Web     | http://localhost:3000 | Next.js dev server               |
| API     | http://localhost:8787 | `wrangler dev` in `packages/api` |

Verify the API:

```bash
curl -s http://localhost:8787/health | jq
```

Expected: `"status":"ok"`, `"service":"freshy-api-worker"`, `"db":"ok"`.

---

## Database (local D1)

Local D1 state is stored under `packages/api/.wrangler/state/v3/d1/`.

| Task             | Command                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| Apply migrations | `pnpm --filter @freshy/db migrate:local`                                                                    |
| Reset local DB   | `rm -rf packages/api/.wrangler/state/v3/d1 && pnpm --filter @freshy/db migrate:local`                       |
| Execute SQL      | `cd packages/api && pnpm exec wrangler d1 execute freshy-db --local --command "SELECT COUNT(*) FROM Place"` |

After schema changes, generate a new migration:

```bash
pnpm --filter @freshy/db generate
pnpm --filter @freshy/db migrate:local
```

---

## R2 (optional locally)

Wrangler emulates R2 during `wrangler dev`. Set `R2_PUBLIC_URL` in `wrangler.toml` vars for public URL construction. Photo uploads work without separate S3 credentials when using the native binding.

For CI-style uploads from your machine, set `R2_*` in root `.env` (see [infrastructure/cloudflare/README.md](../infrastructure/cloudflare/README.md)).

---

## Validation before a PR

```bash
# Full pipeline (includes local D1 + Worker smoke)
bash scripts/validation.sh

# Quick pass (skip D1 and screenshots)
SKIP_DB=1 SKIP_SCREENSHOTS=1 bash scripts/validation.sh
```

---

## Troubleshooting

| Symptom                                | Fix                                                               |
| -------------------------------------- | ----------------------------------------------------------------- |
| `/health` returns `"db":"unavailable"` | Run `pnpm --filter @freshy/db migrate:local`                      |
| Clerk sign-in fails locally            | Check `CLERK_AUTHORIZED_PARTIES` includes `http://localhost:3000` |
| Map blank on `/explore`                | Set `NEXT_PUBLIC_MAPBOX_TOKEN` in root `.env`                     |
| Web cannot reach API                   | Confirm `NEXT_PUBLIC_API_URL=http://localhost:8787` in `.env`     |
| Stale Worker bundle                    | Run `pnpm build:api` before deploy or smoke test                  |

---

## Deploy parity

Local development mirrors production bindings:

| Production          | Local                                            |
| ------------------- | ------------------------------------------------ |
| Worker `freshy-api` | `wrangler dev`                                   |
| D1 `freshy-db`      | Local D1 SQLite                                  |
| R2 `freshy-assets`  | Wrangler R2 emulation                            |
| Pages `getfreshy`   | Next.js dev or `pnpm --filter @freshy/web build` |

Deploy steps: [platforms.md](platforms.md).

---

## Mobile shell (optional)

The native apps in `apps/mobile` are a **WebView wrapper** around the deployed web app (default: `https://getfreshy.pages.dev`). No separate mobile UI to maintain.

**Preview in Expo Go or a simulator:**

```bash
pnpm mobile:dev
```

**Build installable files locally** (requires [EAS setup](platforms.md#8-expo-eas--mobile-webview-shell); continuation guide: [mobile-setup.md](mobile-setup.md)):

```bash
pnpm mobile:build:android   # signed APK
pnpm mobile:build:ios       # signed IPA (registered test devices)
pnpm mobile:download:android
pnpm mobile:download:ios    # saves under dist/mobile/
```

GitHub **Release published** events attach the Android APK to the release automatically when `EXPO_TOKEN` is configured. iOS and store paths: [mobile-publishing.md](mobile-publishing.md).

---

_Last updated: June 2026_
