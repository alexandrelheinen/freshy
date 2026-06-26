# Scripts

| Script | Usage |
|--------|-------|
| `validation.sh` | Full CI pipeline locally — run before every PR |
| `build.sh` | Compile all packages |
| `setup-local-db.sh` | Start Docker PostGIS + create `.env` |
| `post-pr-screenshots.sh` | Upload screenshots to GCS and build PR comment markdown |

```bash
# Quick validation (no Docker, no screenshots)
SKIP_DB=1 SKIP_SCREENSHOTS=1 bash scripts/validation.sh

# Full validation
bash scripts/validation.sh
```
