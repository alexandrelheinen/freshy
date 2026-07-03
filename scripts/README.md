# Scripts

| Script (Shell)                      | Usage                                                        |
| ----------------------------------- | ------------------------------------------------------------ |
| `migrate-deploy.sh`                 | Production D1 migrate (CI, manual deploy)                    |
| `validation.sh`                     | Full CI pipeline locally; run before every PR                |
| `build.sh`                          | Compile all packages                                         |
| `post-pr-screenshots.sh`            | Upload PR screenshots to R2 and build PR comment markdown    |
| `upload-place-defaults.ts`          | Upload bundled default place photos and low-res thumbs to R2 |
| `capture-production-screenshots.sh` | Wait for live web, capture Playwright screenshots            |
| `upload-production-screenshots.sh`  | Upload production screenshots to R2 (`ci/main/latest/`)      |
| `smoke-production.sh`               | Post-deploy checks against live Worker and Pages             |
| `smoke-api-start.sh`                | Build API and verify Worker `/health` locally                |

| Script (Python)    | Usage                                                        |
| ------------------ | ------------------------------------------------------------ |
| `freshy_seeder.py` | Scrape French cooling places (OSM, data.gouv) and sync to D1 |

## freshy-seeder (Python)

Scrapes France-specific cooling-place data into local SQLite, then syncs to Cloudflare D1 via wrangler.

```bash
# One-time setup
python3 -m venv scripts/.venv
source scripts/.venv/bin/activate
pip install -r scripts/requirements-seeder.txt

# Step 1: scrape into freshy_local.db (repo root, gitignored)
python scripts/freshy_seeder.py scrape --region="Île-de-France"

# Step 2: sync to local D1 (wrangler from packages/api)
python scripts/freshy_seeder.py sync --database="freshy-db"

# Production remote sync (requires wrangler login or CLOUDFLARE_API_TOKEN)
python scripts/freshy_seeder.py sync --database="freshy-db" --remote
```

Options: `--providers {all,osm,datagouv}`, `--dry-run`, `-v`. Library code lives in `scripts/seeder/`.

`freshy_local.db` uses the same `Place` table shape as D1. Scraped rows get `status=IMPORTED` and `createdById` set to the provider id (`osm`, `datagouv`). Create matching dummy `User` rows on remote D1 before `--remote` sync.

Remote sync uses `packages/api/node_modules/.bin/wrangler` directly (not `pnpm exec`). If remote sync fails, run `wrangler login` from `packages/api` or export `CLOUDFLARE_API_TOKEN`.

If you have an older `places` staging table, re-run `scrape` after pulling this change; `initialize` drops the legacy table automatically.

## CD on `main` (GitHub Actions)

| Workflow                                                                      | Trigger                      | Command / action                           |
| ----------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------ |
| [migrate-database.yml](../.github/workflows/migrate-database.yml)             | Manual (`workflow_dispatch`) | `d1 migrations apply --remote` (no deploy) |
| [sync-place-defaults.yml](../.github/workflows/sync-place-defaults.yml)       | Default place images change  | `pnpm upload:place-defaults`               |
| [production-screenshots.yml](../.github/workflows/production-screenshots.yml) | Web or UI change             | Playwright against live Pages + R2 upload  |
| [smoke-production.yml](../.github/workflows/smoke-production.yml)             | Every push to `main`         | `bash scripts/smoke-production.sh`         |

**Secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (required for API CD); `R2_*` (optional, for asset and screenshot uploads).

```bash
# Production smoke test (same as CD on main)
bash scripts/smoke-production.sh

# Upload default place images to R2 (requires .env R2_* vars)
pnpm upload:place-defaults

# Generate local WebP thumbs only (mobile cooling cards, no R2 upload)
pnpm generate:place-default-thumbs

# Quick validation (no D1, no screenshots)
SKIP_DB=1 SKIP_SCREENSHOTS=1 bash scripts/validation.sh

# Full validation
bash scripts/validation.sh
```
