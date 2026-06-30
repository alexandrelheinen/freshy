# Freshy — Setup Guide (step-by-step)

> **Already deployed?** Use [platforms.md](platforms.md) for dashboards, env vars, and recovery — this guide is for **first-time** setup.  
> **Who is this for?** You, before Phase 1 coding can go live.  
> **Working language:** English (docs and code in this repo).  
> **Time:** About 2–4 hours the first time.  
> **Checklist version:** [Milestone 0 — Bootstrap](milestones/phase-0-bootstrap.md) (same steps, checkbox format).

Do sections **in order**. Skip nothing unless marked optional.

---

## Before you start

| You need | Why |
| -------- | --- |
| Computer with admin rights | Install Node, Docker, browsers |
| GitHub account | Repo + Actions secrets |
| Credit card (usually not charged on free tiers) | Mapbox, Neon, Cloudflare may ask for verification |

---

## Part A — Your computer (30 minutes)

### A1. Install Node.js 20+

1. Open [https://nodejs.org/](https://nodejs.org/)
2. Download the **LTS** installer (20.x or 22.x)
3. Run the installer → accept defaults → finish
4. Open a **new** terminal and run:

```bash
node -v    # should print v20.x or higher
```

### A2. Install pnpm

In terminal:

```bash
npm install -g pnpm
pnpm -v    # should print 9.x or higher
```

### A3. Install Git

1. [https://git-scm.com/downloads](https://git-scm.com/downloads) → download for your OS
2. Install with defaults
3. Verify: `git --version`

### A4. Install Docker Desktop

1. [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Install and **start** Docker Desktop
3. Wait until the whale icon shows **Running**
4. Verify: `docker --version`

### A5. Clone Freshy and run locally

```bash
git clone https://github.com/alexandrelheinen/freshy.git
cd freshy
bash scripts/setup-local-db.sh
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000/explore](http://localhost:3000/explore) — you should see the Freshy shell.

Stop dev server: `Ctrl + C`.

Full check:

```bash
bash scripts/validation.sh
```

Expected last line: `All validation checks passed.`

---

## Part B — Pilot city (5 minutes)

Pick **one** city for seed data (default in repo: **São Paulo**).

Write this in a GitHub Issue or notes file:

```
Pilot city: São Paulo
Center: -23.5505, -46.6333
Search radius: 2 km
```

---

## Part C — Mapbox (10 minutes)

Mapbox powers the map on `/explore`.

### C1. Create account

1. Go to [https://account.mapbox.com/auth/signup/](https://account.mapbox.com/auth/signup/)
2. Sign up (email or GitHub)
3. Confirm email if asked

### C2. Copy your public token

1. Log in → [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
2. Find **Default public token**
3. Click **Copy** (starts with `pk.`)

### C3. Add to local `.env`

```bash
cd freshy   # repo root
cp .env.example .env   # skip if .env already exists
```

Edit `.env`:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.paste_your_token_here
```

Save. **Do not commit `.env`.**

### C4. (Optional) Custom map style

1. [https://studio.mapbox.com/](https://studio.mapbox.com/) → **New style**
2. Pick a light base map → tweak colors to cool blues (see [DESIGN.md](stitch/freshy/DESIGN.md))
3. **Publish** → copy Style URL (`mapbox://styles/...`)

You can add later as `NEXT_PUBLIC_MAPBOX_STYLE=...`

---

## Part D — Cloud database — Neon (15 minutes)

Local Docker Postgres is for development only. Production and team sharing need a cloud DB.

### D1. Create Neon project

1. [https://neon.tech/](https://neon.tech/) → **Sign up** (GitHub is fastest)
2. **New Project**
   - Name: `freshy`
   - Postgres version: **16**
   - Region: **AWS South America (São Paulo)** if pilot city is SP, else closest to users
3. **Create project**

### D2. Copy connection string

1. On project dashboard → **Connect**
2. Select **connection string** → **URI**
3. Copy the full URL (includes `?sslmode=require`)

Example shape:

```
postgresql://neondb_owner:xxxx@ep-xxxx.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

### D3. Enable PostGIS

1. Left menu → **SQL Editor**
2. Paste and **Run**:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Success message: `CREATE EXTENSION`

### D4. Run Freshy migrations on Neon

In your terminal (replace with your URL):

```bash
cd freshy
DATABASE_URL="postgresql://..." pnpm db:migrate
DATABASE_URL="postgresql://..." pnpm db:seed
```

Store `DATABASE_URL` in a password manager — you will need it for Cloudflare Workers/Hyperdrive later.

### D5. Alternative: Supabase

If you prefer Supabase:

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Wait until status is **Active**
3. **Project Settings** → **Database** → **URI** connection string
4. SQL Editor → run `CREATE EXTENSION IF NOT EXISTS postgis;`
5. Same `pnpm db:migrate` / `pnpm db:seed` with that URL

---

## Part E — Cloudflare Pages — web app (20 minutes)

Hosts the Next.js app at a URL like `freshy.pages.dev`.

### E1. Cloudflare account + connect GitHub

1. [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Left sidebar → **Workers & Pages**
3. **Create** → **Pages** → **Connect to Git**
4. **Connect GitHub** → authorize Cloudflare
5. Select repository **`alexandrelheinen/freshy`** (or your fork)

### E2. Build settings

On **Set up builds and deployments**:

| Field | Value |
| ----- | ----- |
| Project name | `freshy` |
| Production branch | `main` |
| Framework preset | Next.js |
| Root directory | `apps/web` |
| Build command | `cd ../.. && pnpm install && pnpm --filter @freshy/web build` |
| Build output directory | `out` |

Click **Environment variables (advanced)** before first deploy:

| Variable name | Value | Environments |
| ------------- | ----- | ------------ |
| `NODE_VERSION` | `20` | Production + Preview |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | your `pk....` | Production + Preview |
| `NEXT_PUBLIC_API_URL` | `https://api.freshy.app` or temp `http://localhost:4000` until API is deployed | Production + Preview |

### E3. Deploy

1. Click **Save and Deploy**
2. Wait for build log to finish (green ✓)
3. Click **Visit site** → test `/explore`, `/cooling`, `/places/ice-coffee-central`, `/profile`

### E4. PR previews

Every pull request gets a preview URL automatically under **Workers & Pages** → your project → **Deployments**.

### E5. Custom domain (optional)

1. **Workers & Pages** → `freshy` → **Custom domains**
2. **Set up a domain** → e.g. `freshy.app`
3. If domain is on Cloudflare DNS, records are added automatically
4. Wait a few minutes → HTTPS active

---

## Part F — Cloudflare R2 — file storage + CI screenshots (15 minutes)

### F1. Create bucket

1. Dashboard → **R2 Object Storage**
2. **Create bucket**
   - Name: `freshy-assets`
   - Location: Automatic
3. **Create bucket**

### F2. API token for uploads

1. R2 overview → **Manage R2 API Tokens**
2. **Create API token**
   - Permission: **Object Read & Write**
   - Specify bucket: `freshy-assets`
3. **Create token** → copy **Access Key ID** and **Secret Access Key** (shown once)
4. Note **Account ID** (right column on dashboard home)

### F3. Public URL for CI screenshots

**Option A — quick (`r2.dev`):**

1. Open bucket `freshy-assets` → **Settings**
2. **Public access** → Allow Access → note URL like `https://pub-xxxxx.r2.dev`

**Option B — production (`assets.yourdomain.com`):**

1. Bucket **Settings** → **Connect Domain**
2. Enter `assets.freshy.app` → follow DNS instructions

Your public base URL (no trailing slash): e.g. `https://pub-xxxxx.r2.dev`

### F4. GitHub Actions secrets

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** for each:

| Secret name | Where to get it |
| ----------- | --------------- |
| `R2_ACCOUNT_ID` | Cloudflare dashboard sidebar |
| `R2_ACCESS_KEY_ID` | R2 API token creation |
| `R2_SECRET_ACCESS_KEY` | R2 API token creation |
| `R2_BUCKET_NAME` | `freshy-assets` |
| `R2_PUBLIC_URL` | Public bucket URL from F3 |
| `EXPO_TOKEN` | [expo.dev](https://expo.dev) → Account → Access tokens (mobile releases only) |

### F5. Test CI screenshots

1. Open any PR (or push a branch and open PR)
2. Wait for **CI** workflow
3. Bot comment should show 4 page screenshots (if R2 secrets are set)

---

## Part G — Cloudflare Workers + Hyperdrive — API (when ready)

The API runs on Express locally (`pnpm dev` → port 4000). Production target is **Workers**.

### G1. Hyperdrive (database pool)

1. Dashboard → **Workers & Pages** → **Hyperdrive**
2. **Create configuration**
   - Name: `freshy-postgres`
   - **Connect to PostgreSQL** → paste your Neon `DATABASE_URL`
3. Copy the **Hyperdrive ID**

### G2. Wrangler (later deploy step)

Copy `infrastructure/cloudflare/wrangler.toml.example` → configure bindings.  
Full details: [infrastructure/cloudflare/README.md](../infrastructure/cloudflare/README.md)

Until Workers deploy exists, run API locally or on any Node host with `DATABASE_URL` set.

---

## Part H — Expo EAS — mobile (optional, for releases)

Only needed when cutting a mobile release.

1. [https://expo.dev/signup](https://expo.dev/signup)
2. **Account settings** → **Access tokens** → **Create token**
3. Add `EXPO_TOKEN` to GitHub secrets (Part F4)
4. In repo: configure `apps/mobile/app.json` / EAS project ID per [Expo docs](https://docs.expo.dev/build/setup/)

Creating a GitHub **Release** tag `v0.1.0` triggers Android/iOS builds in CI.

---

## Part I — Product decisions (10 minutes)

Record answers (GitHub Issue is fine):

| Question | Default |
| -------- | ------- |
| Pilot city | São Paulo |
| Auth provider (Phase 4) | Clerk or Supabase Auth |
| First launch locale (i18n) | pt-BR via locale files when i18n ships |

---

## Final gate — ready for Phase 1?

| # | Done? |
| - | ----- |
| Local `validation.sh` passes | [ ] |
| Mapbox token in `.env` and Cloudflare Pages | [ ] |
| Neon/Supabase DB + PostGIS + migrate + seed | [ ] |
| Cloudflare Pages shows 4 screens | [ ] |
| (Recommended) R2 secrets + PR screenshots work | [ ] |

When all checked → start Phase 1 on [roadmap.md](roadmap.md).

---

## Quick links

| Platform | URL |
| -------- | --- |
| Cloudflare dashboard | [dash.cloudflare.com](https://dash.cloudflare.com/) |
| Neon | [console.neon.tech](https://console.neon.tech/) |
| Mapbox tokens | [account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/) |
| GitHub Actions secrets | `https://github.com/YOUR_USER/freshy/settings/secrets/actions` |
| Freshy architecture | [infrastructure.md](infrastructure.md) |

---

_Last updated: June 2026_
