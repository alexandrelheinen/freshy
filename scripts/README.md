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
| `mobile-build.sh`                   | EAS build for Android/iOS/all (`release` profile)            |
| `mobile-download.sh`                | Download latest APK/IPA from EAS to `dist/mobile/`           |

| Script (Python)         | Usage                                                        |
| ----------------------- | ------------------------------------------------------------ |
| `freshy_seeder.py`      | Scrape French cooling places (OSM, data.gouv) and sync to D1 |
| `freshy_place_cleaner.py` | Remove junk imports and fix supermarket classification in D1 |

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

## freshy-place-cleaner (Python)

Removes useless imported rows and fixes misclassified supermarkets in Cloudflare D1. Uses the same wrangler setup as `freshy_seeder.py`.

**Rules:**

1. **Delete** places whose English name is unknown-style (`Unknown`, `Unknown Facility`, `Unnamed`, and similar) and that have no address.
2. **Reclassify** major French supermarket and grocery chains from `PUBLIC_SPACE` (or any non-`MALL` category) to `MALL`.
3. **Delete hotels** by default. Freshy has no `HOTEL` category yet; hotel rows imported via `air_conditioning=yes` would otherwise stay mislabeled. Pass `--keep-hotels` to leave them untouched.

```bash
# Preview actions against local D1
python scripts/freshy_place_cleaner.py plan --database="freshy-db"

# Dry run apply (no writes)
python scripts/freshy_place_cleaner.py apply --database="freshy-db" --dry-run

# Apply to local D1
python scripts/freshy_place_cleaner.py apply --database="freshy-db"

# Apply to production remote D1
python scripts/freshy_place_cleaner.py apply --database="freshy-db" --remote
```

Options: `--keep-hotels`, `--json`, `-v`. Logic lives in `scripts/seeder/place_cleaner.py`; import-time supermarket fixes also live in `scripts/seeder/category_mapper.py`.

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
