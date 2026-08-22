# D1 backup and maintenance | Freshy

Use this guide before any risky database work: cleaning scripts, bulk updates, migrations, or manual SQL. Freshy production data lives in Cloudflare D1 (`freshy-db`).

---

## When to follow this checklist

Run the backup steps below before:

- `freshy-cleaner apply`
- `freshy-seeder sync --remote`
- `pnpm --filter @freshy/db migrate:remote`
- Manual SQL in the D1 console or via `wrangler d1 execute`

---

## Safe maintenance workflow

```text
1. Save a Time Travel bookmark (restore point)
2. Optional: export a SQL file for your records
3. Preview the change (plan / dry-run)
4. Apply the change
5. Verify in Studio or with a query
6. If needed: restore to the saved bookmark
```

All wrangler commands below assume you are in `packages/api` and authenticated (`wrangler login` or `CLOUDFLARE_API_TOKEN`).

---

## Step 1 | Save a restore point (Time Travel)

D1 **Time Travel** is always on for production databases. It keeps point-in-time history for **7 days** (Free plan) or **30 days** (Paid plan). Seven days is enough for Freshy maintenance.

```bash
cd packages/api

# Capture the current bookmark before you change anything
npx wrangler d1 time-travel info freshy-db
```

This command always targets **remote** production D1 (no `--remote` flag).

Copy the bookmark from the output, for example:

```text
00000000-00000000-00000000-exampleonlynotaproductionbookmark
```

Store it in your notes or ticket. You can also note the Unix timestamp:

```bash
date +%s
```

**Dashboard:** Cloudflare → Workers & Pages → D1 → **freshy-db** → Time Travel.

---

## Step 2 | Optional SQL export

Time Travel is the fastest way to roll back. An SQL export is useful as an extra archive or for local inspection.

```bash
cd packages/api
mkdir -p ../../backups

npx wrangler d1 export freshy-db --remote \
  --output=../../backups/freshy-db-$(date +%Y%m%d-%H%M).sql
```

For local wrangler D1, drop `--remote` and add `--local`.

---

## Step 3 | Preview changes

Example for the place cleaner (install the package first: see [python/README.md](../python/README.md)):

```bash
cd ../..

freshy-cleaner plan --database="freshy-db" --remote
freshy-cleaner apply --database="freshy-db" --remote --dry-run
```

Review the JSON output. Confirm deletes and reclassifications look correct.

---

## Step 4 | Apply changes

```bash
freshy-cleaner apply --database="freshy-db" --remote
```

Spot-check a few rows in [Freshy Studio](studio.md) or with:

```bash
cd packages/api
npx wrangler d1 execute freshy-db --remote --command \
  'SELECT id, name, category FROM "Place" ORDER BY updatedAt DESC LIMIT 10;'
```

---

## Step 5 | Roll back if something went wrong

Restore **overwrites** the live database in place. Wrangler asks for confirmation.

### By bookmark (recommended)

```bash
cd packages/api

npx wrangler d1 time-travel restore freshy-db \
  --bookmark=YOUR_SAVED_BOOKMARK
```

### By timestamp

```bash
npx wrangler d1 time-travel restore freshy-db \
  --timestamp=1720612800
```

After restore, wrangler prints a `previous_bookmark`. You can use it to undo the restore if you went back too far.

---

## Example | full place-cleaner run

```bash
cd packages/api

# 1. Restore point
npx wrangler d1 time-travel info freshy-db
# → save bookmark

# 2. Optional export
mkdir -p ../../backups
npx wrangler d1 export freshy-db --remote \
  --output=../../backups/freshy-db-pre-clean.sql

cd ../..

# 3. Preview
freshy-cleaner plan --database="freshy-db" --remote
freshy-cleaner apply --database="freshy-db" --remote --dry-run

# 4. Apply
freshy-cleaner apply --database="freshy-db" --remote

# 5. Roll back only if needed
# cd packages/api
# npx wrangler d1 time-travel restore freshy-db --bookmark=...
```

---

## Notes

| Topic              | Detail                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| Retention          | 7 days on Free, 30 days on Paid. Sufficient for Freshy ops.                                                    |
| Cost               | Time Travel history and restore incur no extra D1 charge.                                                      |
| Scope              | Restores the whole `freshy-db` database, not single tables.                                                    |
| In-flight queries  | Restore cancels active queries briefly.                                                                        |
| SQL export restore | Re-importing a full `.sql` file into an existing DB is harder than Time Travel. Prefer bookmarks for rollback. |

---

## Related docs

- [Database schema](database.md)
- [Platforms | D1 section](platforms.md)
- [Python tooling | freshy-seeder and freshy-cleaner](../python/README.md)
- [Cloudflare D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)
- [Cloudflare D1 import and export](https://developers.cloudflare.com/d1/best-practices/import-export-data/)
