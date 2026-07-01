# Scripts

| Script                              | Usage                                                          |
| ----------------------------------- | -------------------------------------------------------------- |
| `migrate-deploy.sh`                 | Production D1 migrate (CI, manual deploy)                      |
| `validation.sh`                     | Full CI pipeline locally; run before every PR                  |
| `build.sh`                          | Compile all packages                                           |
| `post-pr-screenshots.sh`            | Upload PR screenshots to R2 and build PR comment markdown      |
| `upload-place-defaults.ts`          | Upload bundled default place photos to R2 (`places/defaults/`) |
| `capture-production-screenshots.sh` | Wait for live web, capture Playwright screenshots              |
| `upload-production-screenshots.sh`  | Upload production screenshots to R2 (`ci/main/latest/`)        |
| `smoke-production.sh`               | Post-deploy checks against live Worker and Pages               |
| `smoke-api-start.sh`                | Build API and verify Worker `/health` locally                  |

## CD on `main` (GitHub Actions)

| Workflow                                                                      | Trigger                            | Command / action                          |
| ----------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------- |
| [migrate-database.yml](../.github/workflows/migrate-database.yml)             | D1 schema or migrations change     | `d1 migrations apply --remote`            |
| [deploy-api.yml](../.github/workflows/deploy-api.yml)                         | API / db package changes on `main` | Wrangler deploy + D1 migrations           |
| [sync-place-defaults.yml](../.github/workflows/sync-place-defaults.yml)       | Default place images change        | `pnpm upload:place-defaults`              |
| [production-screenshots.yml](../.github/workflows/production-screenshots.yml) | Web or UI change                   | Playwright against live Pages + R2 upload |
| [smoke-production.yml](../.github/workflows/smoke-production.yml)             | Every push to `main`               | `bash scripts/smoke-production.sh`        |

**Secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (required for API CD); `R2_*` (optional, for asset and screenshot uploads).

```bash
# Production smoke test (same as CD on main)
bash scripts/smoke-production.sh

# Upload default place images to R2 (requires .env R2_* vars)
pnpm upload:place-defaults

# Quick validation (no D1, no screenshots)
SKIP_DB=1 SKIP_SCREENSHOTS=1 bash scripts/validation.sh

# Full validation
bash scripts/validation.sh
```
