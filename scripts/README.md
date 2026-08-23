# Scripts

| Script (Shell)                      | Usage                                                         |
| ----------------------------------- | ------------------------------------------------------------- |
| `migrate-deploy.sh`                 | Production D1 migrate (CI, manual deploy)                     |
| `validation.sh`                     | Full CI pipeline locally; run before every PR                 |
| `build.sh`                          | Compile all packages                                          |
| `post-pr-screenshots.sh`            | Upload PR screenshots to R2 and build PR comment markdown     |
| `upload-place-defaults.ts`          | Upload bundled default place photos and low-res thumbs to R2  |
| `generate-app-icons.mjs`            | Rasterize `favicon.svg` (`nest_farsight_cool`) to PNG and ICO |
| `capture-production-screenshots.sh` | Wait for live web, capture Playwright screenshots             |
| `upload-production-screenshots.sh`  | Upload production screenshots to R2 (`ci/main/latest/`)       |
| `smoke-production.sh`               | Post-deploy checks against live Worker and Pages              |
| `smoke-api-start.sh`                | Build API and verify Worker `/health` locally                 |
| `mobile-build.sh`                   | EAS build for Android/iOS/all (`release` profile)             |
| `mobile-download.sh`                | Download latest APK/IPA from EAS to `dist/mobile/`            |

## Python tooling

Python CLIs (`freshy-seeder`, `freshy-cleaner`) live in the [`python/`](../python/) package. See [python/README.md](../python/README.md) for setup and usage.

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
