# Scripts

| Script                   | Usage                                                   |
| ------------------------ | ------------------------------------------------------- |
| `validation.sh`          | Full CI pipeline locally; run before every PR          |
| `build.sh`               | Compile all packages                                    |
| `setup-local-db.sh`      | Start Docker PostGIS + create `.env`                    |
| `post-pr-screenshots.sh` | Upload screenshots to Cloudflare R2 and build PR comment markdown |
| `upload-place-defaults.ts` | Upload bundled default place photos to R2 (`places/defaults/`) |

**CI:** pushes to `main` that change `apps/web/public/place-defaults/` run [`.github/workflows/sync-place-defaults.yml`](../.github/workflows/sync-place-defaults.yml) automatically (requires `R2_*` GitHub secrets).

```bash
# Upload default place images to R2 (requires .env R2_* vars)
pnpm upload:place-defaults
# Quick validation (no Docker, no screenshots)
SKIP_DB=1 SKIP_SCREENSHOTS=1 bash scripts/validation.sh

# Full validation
bash scripts/validation.sh
```
