# Freshy Python tooling

Installable Python package for seeding, mapping, and cleaning cooling-place data in Cloudflare D1.

| CLI              | Package module   | Purpose                                                               |
| ---------------- | ---------------- | --------------------------------------------------------------------- |
| `freshy-seeder`  | `freshy.seeder`  | Scrape French cooling places (OSM, data.gouv) and sync to D1          |
| `freshy-cleaner` | `freshy.cleaner` | Remove junk imports and fix supermarket or hotel classification in D1 |

## Setup

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## D1 safety: Read before sync or apply

> ### WARNING
>
> **These Python tools change live database data. Treat every `freshy-seeder sync` and `freshy-cleaner apply` as production-risky until you prove otherwise.**
>
> - **`freshy-seeder sync --remote`** inserts or updates rows in Cloudflare D1. Duplicates are skipped, but bad staging data still reaches production.
> - **`freshy-cleaner apply`** can **delete** places and **reclassify** categories. There is no undo inside the Python CLI.
> - Always **preview first** (`plan`, `--dry-run`) on the same target (local vs remote) you intend to write to.
> - On **remote** D1, capture a **Time Travel bookmark** before any write. Without it, rollback depends on Cloudflare retention (7 days on Free, 30 days on Paid).
>
> Full checklist, export options, and verification steps: **[docs/d1-backup-and-maintenance.md](../docs/d1-backup-and-maintenance.md)**.

### Quick restore point (remote production)

Run from `packages/api` with `wrangler login` or `CLOUDFLARE_API_TOKEN` set.

1. Capture the current bookmark (save this id before you touch anything):

```bash
cd packages/api
npx wrangler d1 time-travel info freshy-db
```

This command always targets **remote** production D1 (no `--remote` flag).

2. Copy the bookmark from the output, for example:

```text
00000085-0000024c-00004c6d-8e61117bf38d7adb71b934ebbf891683
```

3. Store it in your notes or ticket. Optionally note the Unix timestamp as a backup reference:

```bash
date +%s
```

4. Preview, then run your Python command (same `--remote` flag if targeting production):

```bash
freshy-cleaner plan --database="freshy-db" --remote
freshy-cleaner apply --database="freshy-db" --remote --dry-run
# when the plan looks correct:
freshy-cleaner apply --database="freshy-db" --remote
```

5. Roll back if the result is wrong (restore overwrites live D1; wrangler asks for confirmation):

```bash
cd packages/api
npx wrangler d1 time-travel restore freshy-db \
  --bookmark=YOUR_SAVED_BOOKMARK
```

Time Travel is **remote only**. For local wrangler D1, use `--local` on the Python CLI (`freshy-seeder`, `freshy-cleaner`) only; there is no Time Travel rollback for local databases.

## freshy-seeder

Scrapes France-specific cooling-place data into local SQLite, then syncs to Cloudflare D1 via wrangler.

```bash
# Step 1: scrape into freshy_local.db (repo root, gitignored)
freshy-seeder scrape --region="Île-de-France"

# Step 2: sync to local D1 (wrangler from packages/api)
freshy-seeder sync --database="freshy-db"

# Production remote sync (requires wrangler login or CLOUDFLARE_API_TOKEN)
freshy-seeder sync --database="freshy-db" --remote
```

Options: `--providers {all,osm,datagouv}`, `--dry-run`, `-v`. Library code lives under `src/freshy/seeder/`.

`freshy_local.db` uses the same `Place` table shape as D1. Scraped rows get `status=IMPORTED` and `createdById` set to the provider id (`osm`, `datagouv`). Create matching dummy `User` rows on remote D1 before `--remote` sync.

Remote sync uses `packages/api/node_modules/.bin/wrangler` directly (not `pnpm exec`). If remote sync fails, run `wrangler login` from `packages/api` or export `CLOUDFLARE_API_TOKEN`.

If you have an older `places` staging table, re-run `scrape` after pulling this change; `initialize` drops the legacy table automatically.

## freshy-cleaner

Removes useless imported rows and fixes misclassified supermarkets and hotels in Cloudflare D1. Uses the same wrangler setup as `freshy-seeder`. See [D1 safety](#d1-safety--read-before-sync-or-apply) before any `apply` or remote `sync`.

**Rules:**

1. **Delete** places whose English name is unknown-style (`Unknown`, `Unknown Facility`, `Unnamed`, and similar) and that have no address.
2. **Reclassify** major French supermarket and grocery chains from `PUBLIC_SPACE` (or any non-`MALL` category) to `MALL`.
3. **Reclassify** hotels to `RESTAURANT`. Freshy has no `HOTEL` category; hotel lobbies and dining areas fit Restaurants better than Public Spaces. Pass `--skip-hotels` to leave hotel rows unchanged.

```bash
# Preview actions against local D1
freshy-cleaner plan --database="freshy-db"

# Dry run apply (no writes)
freshy-cleaner apply --database="freshy-db" --dry-run

# Apply to local D1
freshy-cleaner apply --database="freshy-db"

# Apply to production remote D1 (save a Time Travel bookmark first)
freshy-cleaner apply --database="freshy-db" --remote
```

Options: `--skip-hotels`, `--json`, `-v`. Cleanup rules live in `freshy.cleaner`; import-time category mapping lives in `freshy.mapper`.

## Tests

```bash
cd python
pytest
```

## Package layout

```
python/
├── pyproject.toml
├── src/freshy/
│   ├── config.py          # monorepo paths, France regions, D1 defaults
│   ├── models.py          # StagedPlace
│   ├── geo.py             # coordinates and deduplication
│   ├── logging.py         # CLI log setup
│   ├── d1/                # shared wrangler helpers
│   ├── mapper/            # freshy.mapper: category inference
│   ├── seeder/            # freshy.seeder: scrape and sync
│   └── cleaner/           # freshy.cleaner: D1 cleanup
└── tests/
    ├── mapper/
    ├── seeder/
    └── cleaner/
```
