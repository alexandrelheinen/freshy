# Milestone 0 — Bootstrap (before Phase 1)

> **Type:** operational milestone · [Milestone index](README.md) · Roadmap phase: [0 — Foundation](../roadmap.md#phase-0--foundation)  
> **Audience:** You, before writing Phase 1 code.  
> **Goal:** Accounts, deploy, and environment ready for a map with real data.  
> **Time:** 2–4 hours the first time (accounts + deploy).  
> **Golden rule:** Do not start Phase 1 until the final gate table (“Ready for Phase 1?”) is fully checked.

**Phase 0 exit criteria:** The app is live on the internet with Freshy branding (colors, font, bottom nav) — still **without** a real map or places API.

---

## How to use this document

1. Follow sections **0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9** in order (do not skip).
2. Check each `- [ ]` when done.
3. If stuck, read the **“Troubleshooting”** box in that section.
4. Commands assume you are at the **repository root** (where `package.json` lives).

---

## 0. Install on your machine (one-time)

### 0.1 Required software

| Tool        | Minimum version | Install                                                        | Verify                                         |
| ----------- | --------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| **Node.js** | 20+             | [nodejs.org](https://nodejs.org/)                              | `node -v` → `v20.x` or higher                  |
| **pnpm**    | 9+              | `npm install -g pnpm`                                          | `pnpm -v` → `9.x` or higher                    |
| **Git**     | recent          | [git-scm.com](https://git-scm.com/)                            | `git --version`                                |
| **Docker**  | recent          | [docker.com](https://www.docker.com/products/docker-desktop/)  | `docker --version` and Docker Desktop **running** |

- [ ] Node 20+ installed
- [ ] pnpm 9+ installed
- [ ] Git installed
- [ ] Docker installed **and running**

**Troubleshooting:** If `docker` is not found, open Docker Desktop and wait until it shows “Running”.

---

## 1. Validate the project locally

Do this **before** creating cloud accounts. If it does not run locally, deploy will not help.

### 1.1 Clone and enter the repo

```bash
git clone https://github.com/alexandrelheinen/freshy.git
cd freshy
```

- [ ] Repository cloned
- [ ] Terminal is inside the `freshy` folder

### 1.2 Start local database (Docker)

```bash
bash scripts/setup-local-db.sh
```

**Expected:** Message `Database is ready.` and a `.env` file created if it did not exist.

- [ ] Script finished without error
- [ ] `.env` file exists at repository root

**Troubleshooting:**

- `Docker is required` → open Docker Desktop and run again.
- `port 5432 already in use` → another Postgres is using the port; stop it or change the port in `docker-compose.yml`.

### 1.3 Install dependencies and prepare the database

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

**Expected:** Each command finishes without `ERROR` or `ELIFECYCLE`.

- [ ] `pnpm install` OK
- [ ] `pnpm db:generate` OK
- [ ] `pnpm db:migrate` OK
- [ ] `pnpm db:seed` OK

### 1.4 Run the app locally

```bash
pnpm dev
```

Open in the browser:

| URL                                             | Expected screen                          |
| ----------------------------------------------- | ---------------------------------------- |
| http://localhost:3000/explore                   | Map placeholder, bottom nav              |
| http://localhost:3000/cooling                   | Categories                               |
| http://localhost:3000/places/ice-coffee-central | Place detail                             |
| http://localhost:3000/profile                   | Profile                                  |

- [ ] All 4 URLs open without an error page
- [ ] Bottom nav (Explore, Saved, Cooling, Profile) visible

Stop the server with `Ctrl + C` in the terminal.

### 1.5 Run full validation

```bash
bash scripts/validation.sh
```

May take a few minutes (install, test, build).

**Expected:** Final line `All validation checks passed.`

- [ ] `validation.sh` passed

**Troubleshooting:**

- No Docker: `SKIP_DB=1 bash scripts/validation.sh`
- Skip screenshots: `SKIP_SCREENSHOTS=1 bash scripts/validation.sh`
- Both: `SKIP_DB=1 SKIP_SCREENSHOTS=1 bash scripts/validation.sh`

---

## 2. Choose the pilot city (5 minutes)

Phase 1 will seed ~50 places in **one city only**. Choose now to avoid redoing seed and map work later.

### 2.1 Pick a city

Suggestions that work well:

| City          | Center (lat, lng)    | Why                              |
| ------------- | -------------------- | -------------------------------- |
| **São Paulo** | `-23.5505, -46.6333` | Hot climate, many cafés          |
| **Porto**     | `41.1579, -8.6291`   | Compact city, good for testing   |
| **Lisbon**    | `38.7223, -9.1393`   | Tourism + summer heat            |

### 2.2 Fill in and check off

- [ ] **Chosen city:** ************\_************
- [ ] **Center latitude:** ************\_************
- [ ] **Center longitude:** ************\_************
- [ ] **Initial search radius:** **\_\_\_** km (suggestion: `2`)

### 2.3 Record the decision

Note in an issue or doc:

```
Pilot city: [name]
Center: [lat], [lng]
Radius: [X] km
```

- [ ] Decision recorded (issue, Notion, PR comment, etc.)

---

## 3. Create a Mapbox account and token

The Phase 1 map uses Mapbox. The token is **public** (used in the front-end) but must not be committed — use `.env` and **Cloudflare Pages** env vars.

### 3.1 Create account

1. Go to [mapbox.com](https://www.mapbox.com/)
2. Click **Sign up** (Google/GitHub is fine)
3. Confirm email if prompted

- [ ] Mapbox account created

### 3.2 Copy the default token

1. Log in
2. Open **[Account → Tokens](https://account.mapbox.com/access-tokens/)**
3. Copy **Default public token** (starts with `pk.`)

- [ ] Token copied (starts with `pk.`)

Do not post this token on social media. Using it in `.env` and Cloudflare Pages is normal for Freshy.

### 3.3 Add token to local project

1. At repo root, open `.env` (or `cp .env.example .env`)
2. Set `NEXT_PUBLIC_MAPBOX_TOKEN=`
3. Paste the token:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
```

4. Save

- [ ] Token in local `.env`

### 3.4 Test (optional now, required in Phase 1)

The current shell does not render Mapbox yet — that is Phase 1 code. For now, saving the token is enough.

- [ ] Token saved for Cloudflare Pages (section 5)

### 3.5 (Optional) Custom map style

Can wait for Phase 1. To prepare early:

1. [Mapbox Studio](https://studio.mapbox.com/) → **New style**
2. Tune cool-toned colors ([DESIGN.md](../stitch/freshy/DESIGN.md))
3. Note style ID (`mapbox://styles/your-user/xxxxx`)

- [ ] (Optional) Custom style created and ID recorded

---

## 4. Cloud database (Postgres + PostGIS)

Docker provides local Postgres. For deploy and Phase 1 you need a database **on the internet**.

**We recommend Neon** (free tier, modern Postgres). Alternative: Supabase.

---

### Option A — Neon (recommended)

#### 4A.1 Create account and project

1. Go to [neon.tech](https://neon.tech/)
2. **Sign up** (GitHub is fastest)
3. **New Project**
   - Name: `freshy`
   - Region: closest to pilot city (e.g. `South America` for São Paulo)
4. **Create project**

- [ ] Neon project created

#### 4A.2 Copy connection string

1. In project dashboard, find **Connection string**
2. Select **URI**
3. Copy URL (e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)

- [ ] `DATABASE_URL` copied

#### 4A.3 Enable PostGIS

1. In Neon, open **SQL Editor**
2. Run:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

3. Should return `CREATE EXTENSION` without error

- [ ] PostGIS enabled on Neon

#### 4A.4 Run Freshy migrations on remote DB

From repo root (replace with your URL):

```bash
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require" pnpm db:migrate
```

**Expected:** Prisma applies migrations without error.

- [ ] Migrations applied on remote database

**Troubleshooting:**

- `connection refused` → check full URL includes `?sslmode=require`
- `permission denied` → use primary Neon user URL, not read-only

#### 4A.5 Store the URL

Save `DATABASE_URL` in a password manager. You will add it to Cloudflare (Workers/Hyperdrive) when the API goes live.

- [ ] URL stored securely (1Password, Bitwarden, etc.)

---

### Option B — Supabase (alternative)

#### 4B.1 Create project

1. [supabase.com](https://supabase.com/) → **Start your project**
2. **New project** → name `freshy`, strong password, nearby region
3. Wait ~2 min until **Active**

#### 4B.2 Get connection string

1. **Project Settings** → **Database**
2. **Connection string** → **URI**, **Session** mode
3. Replace `[YOUR-PASSWORD]` with project password

#### 4B.3 PostGIS

In **SQL Editor**:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

#### 4B.4 Migrate

Same as Neon:

```bash
DATABASE_URL="your_supabase_url" pnpm db:migrate
```

- [ ] (If Supabase) Project created, PostGIS OK, migrations OK

---

## 5. Deploy to Cloudflare Pages

### 5.1 Create account and connect GitHub

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/) and sign up if needed
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Authorize Cloudflare and select the **`freshy`** repository

- [ ] Cloudflare account created and GitHub connected

### 5.2 Configure Pages project

| Field                 | Value                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------ |
| **Project name**      | `freshy` (or your choice)                                                                  |
| **Production branch** | `main`                                                                                     |
| **Framework preset**  | Next.js                                                                                    |
| **Build command**     | `cd ../.. && pnpm install && pnpm --filter @freshy/web build`                              |
| **Build output**      | `apps/web/.next` (adjust per [OpenNext Cloudflare](https://opennext.js.org/cloudflare) for full SSR) |
| **Root directory**    | `apps/web`                                                                                 |

If monorepo build fails, try empty **Root directory** and:

```bash
pnpm install && pnpm --filter @freshy/web build
```

- [ ] Pages project created
- [ ] Build settings configured

### 5.3 Environment variables (before first deploy)

In **Settings → Environment variables**:

| Name                       | Value                                                       | Environments        |
| -------------------------- | ----------------------------------------------------------- | ------------------- |
| `NEXT_PUBLIC_API_URL`      | `http://localhost:4000` for now (update when API is live)   | Production, Preview |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | your `pk.xxx` from section 3                                | Production, Preview |

- [ ] `NEXT_PUBLIC_API_URL` set on Cloudflare Pages
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN` set on Cloudflare Pages

### 5.4 Deploy

1. Save settings — Cloudflare starts the first build
2. Wait 2–5 minutes
3. Open the URL (e.g. `freshy.pages.dev`)

- [ ] First deploy succeeded

**Troubleshooting:**

- `pnpm not found` → set `NODE_VERSION=20` and build with `npm i -g pnpm && ...`
- `Cannot find module @freshy/ui` → install must run from **monorepo root**
- Build failed → copy log and open an issue; validate locally with `pnpm build`

### 5.5 Test all 4 screens in production

Replace `YOUR-DOMAIN` with Cloudflare URL (e.g. `freshy.pages.dev`):

- [ ] `https://YOUR-DOMAIN/explore` — OK
- [ ] `https://YOUR-DOMAIN/cooling` — OK
- [ ] `https://YOUR-DOMAIN/places/ice-coffee-central` — OK
- [ ] `https://YOUR-DOMAIN/profile` — OK

### 5.6 Test on mobile

1. Open `/explore` in phone Chrome/Safari
2. Check: readable font, cool blue palette, fixed bottom nav

- [ ] App works well on mobile

### 5.7 Pull request preview (automatic)

1. Open any GitHub PR
2. Cloudflare Pages creates a **Preview deployment** (PR check or bot comment)
3. Confirm `/explore` loads

- [ ] PR preview tested

### 5.8 Record URLs

```
Production: https://__________.pages.dev
Preview:    (auto-generated per PR)
```

- [ ] Production URL recorded

---

## 6. (Recommended) CI screenshots on GitHub + Cloudflare R2

Without this, CI still passes (lint, test, build) but the bot **will not** embed page images in PR comments.

Full guide: [infrastructure/cloudflare/README.md](../../infrastructure/cloudflare/README.md)

### 6.1 Quick setup

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **R2** → create bucket `freshy-assets`
2. Create **R2 API token** (Object Read & Write)
3. Enable public access for `ci/` prefix (custom domain or `*.r2.dev`)
4. GitHub → **Settings → Secrets and variables → Actions → New repository secret**

| Secret                 | Value                              |
| ---------------------- | ---------------------------------- |
| `R2_ACCOUNT_ID`        | Cloudflare account ID              |
| `R2_ACCESS_KEY_ID`     | R2 token access key                |
| `R2_SECRET_ACCESS_KEY` | R2 token secret key                |
| `R2_BUCKET_NAME`       | `freshy-assets`                    |
| `R2_PUBLIC_URL`        | Public base URL (no trailing slash)|

- [ ] (Recommended) R2 secrets configured on GitHub
- [ ] (Recommended) Test PR received screenshot comment

**Troubleshooting:** Skip R2 if you prefer — does not block Phase 1. Screenshots remain in workflow **Artifacts**.

### 6.2 (Optional) Configure R2 locally

To test asset uploads in local API:

```env
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=freshy-assets
R2_PUBLIC_URL=https://assets.your-domain.com
```

- [ ] (Optional) R2 configured in local `.env`

---

## 7. Quick product decisions (10 minutes)

No coding — decide and record.

| Question           | Default suggestion                                                                 | Your decision              |
| ------------------ | ---------------------------------------------------------------------------------- | -------------------------- |
| Place categories   | Keep Prisma enums: café, restaurant, library, mall, museum, coworking, public space | [ ] OK / [ ] change: \_\_\_ |
| AC strength scale  | 3 levels: Lightly Cooled → Comfortable → Frigid                                    | [ ] OK / [ ] change        |
| UI language (i18n) | English in source; pt-BR via locale files when i18n ships                          | [ ] OK                     |
| User auth (Phase 4)| Clerk (fastest) **or** Supabase (DB bundled)                                       | [ ] Clerk / [ ] Supabase   |

- [ ] Decisions recorded (same notes as pilot city)

---

## 8. Visual check against design (15 minutes)

Side by side: **deployed app** vs **Stitch reference** (mockups may use other locales).

| App screen                   | Stitch reference                                                     | OK? |
| ---------------------------- | -------------------------------------------------------------------- | --- |
| `/explore`                   | [mapa_freshy/screen.png](../stitch/mapa_freshy/screen.png)           | [ ] |
| `/cooling`                   | [categorias/screen.png](../stitch/categorias_de_lugares/screen.png)  | [ ] |
| `/places/ice-coffee-central` | [detalhes/screen.png](../stitch/detalhes_do_local/screen.png)        | [ ] |
| `/profile`                   | [perfil/screen.png](../stitch/meu_perfil/screen.png)                 | [ ] |

Note gaps for Phase 1 or a polish PR:

```
- Emoji icons instead of Material Symbols
- BottomNavBar not linked yet (visual only)
- Layout/spacing differences vs Stitch
```

- [ ] Comparison done
- [ ] Gap list recorded (issue or notes)

---

## 9. (Optional) Custom domain

If you own a domain (e.g. `freshy.app`). We recommend DNS on **Cloudflare**.

1. Add domain in **Cloudflare DNS** (or transfer)
2. **Workers & Pages** → Freshy project → **Custom domains** → **Set up a domain**
3. For R2 assets: bucket → **Connect Domain** → e.g. `assets.freshy.app`
4. Wait for propagation (usually minutes on Cloudflare)

- [ ] (Optional) Domain on Cloudflare Pages
- [ ] (Optional) R2 domain for public assets

---

## Ready for Phase 1?

Check **all** before requesting Phase 1 code:

| #   | Question                                                              | Done? |
| --- | --------------------------------------------------------------------- | ----- |
| 1   | `bash scripts/validation.sh` passed locally?                          | [ ]   |
| 2   | Pilot city + lat/lng + radius recorded?                               | [ ]   |
| 3   | Mapbox token in `.env` **and** Cloudflare Pages?                      | [ ]   |
| 4   | Remote DB (Neon/Supabase) with PostGIS + `pnpm db:migrate` OK?        | [ ]   |
| 5   | Cloudflare Pages opens all 4 screens on desktop **and** mobile?       | [ ]   |

### If all yes

Start **Phase 1** following [development-cycle.md](../development-cycle.md):

1. Write a failing test (e.g. seed with 50 places in pilot city)
2. Implement the minimum to pass
3. `bash scripts/validation.sh`
4. Open a PR

Suggested code order ([roadmap.md](../roadmap.md)):

1. Seed ~50 places in pilot city
2. Mapbox GL JS on `/explore`
3. API `GET /places?lat&lng&radius&category&q`
4. Markers + preview card

### If any no

Return to the matching section in this document. **Do not start Phase 1** with an incomplete environment — you will debug deploy instead of building the map.

---

## Command cheat sheet

```bash
# Local database
bash scripts/setup-local-db.sh

# Full local setup
pnpm install
pnpm db:generate && pnpm db:migrate && pnpm db:seed

# Dev
pnpm dev

# Validate everything
bash scripts/validation.sh

# Remote database migrate (replace URL)
DATABASE_URL="postgresql://..." pnpm db:migrate
```

---

## References

| Document                                                          | Purpose                         |
| ----------------------------------------------------------------- | ------------------------------- |
| [milestones/README.md](README.md)                                 | What a milestone is             |
| [roadmap.md](../roadmap.md)                                       | Phase breakdown                 |
| [development-cycle.md](../development-cycle.md)                   | How to code (TDD)               |
| [infrastructure.md](../infrastructure.md)                         | Cloudflare vs external services |
| [CONTRIBUTING.md](../../CONTRIBUTING.md)                          | PR rules and language policy    |
| [DESIGN.md](../stitch/freshy/DESIGN.md)                           | Colors and typography           |
| [cloudflare/README.md](../../infrastructure/cloudflare/README.md) | R2, Pages, CI screenshots       |

---

_Last updated: June 2026_
