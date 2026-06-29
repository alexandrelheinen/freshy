# AGENTS.md

## Cursor Cloud specific instructions

Freshy is a pnpm + Turborepo monorepo: `@freshy/web` (Next.js PWA, port 3000), `@freshy/api`
(Express, port 4000), `@freshy/db` (Prisma + PostgreSQL), `@freshy/mobile` (Expo), and shared
`@freshy/ui` / `@freshy/config`. Standard commands live in the root `package.json` and `README.md`.

### Local database (non-obvious)
- Docker is **not** installed, so `scripts/setup-local-db.sh` (and `docker compose`) will **not**
  work here. A local PostgreSQL 16 + PostGIS cluster is installed via system packages instead.
- Start it with `sudo pg_ctlcluster 16 main start` (check with `pg_lsclusters`). The `freshy` role
  (password `freshy_dev`) and `freshy` database already exist and match `DATABASE_URL` in `.env.example`.
- There are **no Prisma migrations** in the repo. Sync the schema with
  `pnpm --filter @freshy/db exec prisma db push` (do **not** rely on `prisma migrate deploy`), then
  `pnpm db:seed`.

### Environment
- Copy `.env.example` to `.env` (the file is required). API/DB/seed commands read it; load it first
  with `set -a; . ./.env; set +a`. R2/Mapbox/Expo secrets are optional and can stay blank for local dev.
- Node 22 is installed; `.nvmrc` pins 20 but `engines` only requires `>=20`, so 22 works.

### Running / testing
- Dev servers: `pnpm --filter @freshy/web dev` (:3000) and `pnpm --filter @freshy/api dev` (:4000).
  `pnpm dev` also launches the Expo mobile dev server.
- The web pages are static Phase-0 shells and do **not** call the API; Postgres + the API are only
  needed to exercise the `/places` and `/places/:slug` endpoints.
- Checks: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. The
  `no output files found for task @freshy/mobile#build` turbo warning is benign (it is a
  `tsc --noEmit` task).
