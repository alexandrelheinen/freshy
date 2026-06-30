# Scripts

| Script                              | Usage                                                          |
| ----------------------------------- | -------------------------------------------------------------- |
| `validation.sh`                     | Full CI pipeline locally; run before every PR                  |
| `build.sh`                          | Compile all packages                                           |
| `setup-local-db.sh`                 | Start Docker PostGIS + create `.env`                           |
| `post-pr-screenshots.sh`            | Upload PR screenshots to R2 and build PR comment markdown      |
| `upload-place-defaults.ts`          | Upload bundled default place photos to R2 (`places/defaults/`) |
| `capture-production-screenshots.sh` | Wait for live web, capture Playwright screenshots              |
| `upload-production-screenshots.sh`  | Upload production screenshots to R2 (`ci/main/latest/`)        |
| `smoke-production.sh`               | Post-deploy checks against live API and web                    |

## CD on `main` (GitHub Actions)

| Workflow                                                                      | Trigger                            | Command / action                          |
| ----------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------- |
| [migrate-database.yml](../.github/workflows/migrate-database.yml)             | Prisma schema or migrations change | `pnpm --filter @freshy/db migrate:deploy` |
| [sync-place-defaults.yml](../.github/workflows/sync-place-defaults.yml)       | Default place images change        | `pnpm upload:place-defaults`              |
| [production-screenshots.yml](../.github/workflows/production-screenshots.yml) | Web or UI change                   | Playwright against live Pages + R2 upload |
| [smoke-production.yml](../.github/workflows/smoke-production.yml)             | Every push to `main`               | `bash scripts/smoke-production.sh`        |

**Secrets:** `DATABASE_URL` (Neon, for migrations); `R2_*` (for asset and screenshot uploads).

```bash
# Production smoke test (same as CD on main)
bash scripts/smoke-production.sh

# Upload default place images to R2 (requires .env R2_* vars)
pnpm upload:place-defaults

# Quick validation (no Docker, no screenshots)
SKIP_DB=1 SKIP_SCREENSHOTS=1 bash scripts/validation.sh

# Full validation
bash scripts/validation.sh
```
