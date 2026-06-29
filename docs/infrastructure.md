# Freshy — Infrastructure & Cloud Providers

Freshy is **Cloudflare-first**: hosting, CDN, object storage, edge API, and DNS run on Cloudflare wherever the platform supports them. Services Cloudflare does not offer (PostGIS, native mobile builds, map tiles) stay on specialized providers.

> Setup guides: [`infrastructure/cloudflare/`](../infrastructure/cloudflare/README.md)  
> Local database: [`infrastructure/docker/`](../infrastructure/docker/docker-compose.yml)

---

## 1. What runs on Cloudflare

| Service | Cloudflare product | Freshy usage | Phase |
| ------- | ------------------ | ------------ | ----- |
| **Web app (PWA)** | **Pages** (+ OpenNext adapter) | Next.js SSR/RSC, PR previews, production | 0 |
| **REST API** | **Workers** (Hono or Express via node compat) | `/places`, `/health`, write endpoints | 1–7 |
| **DB connection pooling** | **Hyperdrive** | Pool connections from Workers → external Postgres | 1+ |
| **Object storage** | **R2** | Place photos, avatars, CI screenshots, release mirrors | 0 |
| **CDN / edge cache** | **CDN** (built into Pages & R2) | Static assets, public images | 0 |
| **DNS** | **DNS** | `freshy.app`, R2 custom domains | 0 |
| **Image transforms** | **Images** (optional) | Thumbnails for place photos | 7 |
| **Background jobs** | **Queues** (optional) | Review score aggregation, notifications | 5+ |
| **Edge cache / config** | **KV** (optional) | Category counts, feature flags | 3+ |
| **Bot protection** | **Turnstile** (optional) | Review submission, place suggestions | 5+ |
| **Web analytics** | **Web Analytics** | Privacy-friendly page views (LGPD-friendly) | 7 |
| **Admin access** | **Access** (optional) | Protect `/admin` routes | 7 |
| **Email forwarding** | **Email Routing** (optional) | `hello@freshy.app` → inbox | 7 |

### R2 bucket layout

| Prefix | Content | Public read |
| ------ | ------- | ----------- |
| `places/` | Venue photos | Yes (via custom domain or `r2.dev`) |
| `avatars/` | User profile images | Yes |
| `ci/` | PR screenshot previews | Yes (for GitHub PR comments) |
| `releases/` | Mobile build mirrors (optional) | No |

---

## 2. What must stay elsewhere

Cloudflare **D1** is SQLite-only and does **not** support PostGIS. Map rendering and mobile store builds also require external vendors.

| Concern | Provider | Why not Cloudflare |
| ------- | -------- | ------------------ |
| **Primary database** | **Neon** or **Supabase** (PostgreSQL 16 + PostGIS) | PostGIS geo queries (`ST_DWithin`, GIST indexes) |
| **Maps & geocoding** | **Mapbox GL JS** | No first-party map tile / geocoding product |
| **Mobile builds** | **Expo EAS** | Apple App Store & Google Play toolchain |
| **CI pipeline** | **GitHub Actions** | Lint, test, build, screenshot upload to R2 |
| **End-user auth** | **Clerk** or **Supabase Auth** | OAuth / social login (Cloudflare Access is for internal/admin) |
| **Error monitoring** | **Sentry** (optional) | Full-stack error grouping & alerts |
| **Transactional email** | **Resend** or **SendGrid** (optional) | Welcome emails, review reminders |

### How external services connect to Cloudflare

```mermaid
flowchart TB
    subgraph clients [Clients]
        Web[Next.js PWA]
        Mobile[Expo app]
    end

    subgraph cf [Cloudflare]
        Pages[Pages — web]
        Workers[Workers — API]
        Hyperdrive[Hyperdrive]
        R2[(R2)]
        DNS[DNS]
    end

    subgraph external [External — required]
        PG[(Neon / Supabase Postgres + PostGIS)]
        Mapbox[Mapbox]
        EAS[Expo EAS]
        Auth[Clerk / Supabase Auth]
    end

    subgraph ci [GitHub Actions]
        GHA[CI workflow]
    end

    Web --> Pages
    Mobile --> Workers
    Pages --> Workers
    Workers --> Hyperdrive --> PG
    Workers --> R2
    Web --> Mapbox
    Workers --> Auth
    GHA --> R2
    EAS -.-> Mobile
    DNS --> Pages
```

---

## 3. Environment variables

See root [`.env.example`](../.env.example). Summary:

| Variable | Where set | Purpose |
| -------- | --------- | ------- |
| `DATABASE_URL` | Local `.env`, Neon/Supabase, Workers secrets | Prisma → Postgres |
| `R2_*` | Local `.env`, GitHub Actions secrets, Workers secrets | Object storage |
| `NEXT_PUBLIC_API_URL` | Pages env | Web → API base URL |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Pages env | Map tiles |
| `EXPO_TOKEN` | GitHub Actions secrets | EAS mobile builds |

### GitHub Actions secrets (CI screenshots → R2)

| Secret | Description |
| ------ | ----------- |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | e.g. `freshy-assets` |
| `R2_PUBLIC_URL` | Public base URL for objects (custom domain or `*.r2.dev`) |
| `EXPO_TOKEN` | Expo access token for mobile releases |

---

## 4. Repository layout (infrastructure)

```
freshy/
├── apps/
│   ├── web/                    # Next.js → deploy to Cloudflare Pages
│   └── mobile/                 # Expo → EAS (external)
├── packages/
│   ├── api/                    # Express (local dev) + R2 adapter; Workers target
│   └── db/                     # Prisma → Neon/Supabase via Hyperdrive in prod
├── infrastructure/
│   ├── docker/                 # Local PostGIS only
│   └── cloudflare/             # R2, Pages, Workers, wrangler config
│       ├── README.md           # Step-by-step Cloudflare setup
│       └── wrangler.toml.example
└── .github/workflows/          # CI → R2 upload for PR screenshots
```

---

## 5. Deployment targets by phase

| Phase | Cloudflare | External |
| ----- | ---------- | -------- |
| **0 — Foundation** | Pages ? Pages (shell), R2 (CI screenshots) | Neon/Supabase (remote DB), Mapbox token |
| **1 — Map** | Workers API + Hyperdrive | Mapbox GL JS |
| **4 — Auth** | Workers validates JWT | Clerk or Supabase Auth |
| **5 — Reviews** | Queues (optional) for aggregation | — |
| **7 — Launch** | Images, Turnstile, Web Analytics, Access | Sentry |

---

## 6. Local development (unchanged)

Cloudflare services are **optional locally**. Developers use:

- **Docker PostGIS** for the database (`bash scripts/setup-local-db.sh`)
- **Express API** on port 4000 (`pnpm dev`)
- **Next.js** on port 3000
- **R2** skipped unless `R2_*` env vars are set (same pattern as before with GCS)

---

## 7. Migration from Google Cloud

| Before (GCP) | After (Cloudflare) |
| ------------ | ------------------ |
| Google Cloud Storage | **R2** |
| `GCP_PROJECT_ID`, `GCS_BUCKET_NAME`, `GCP_SA_KEY` | `R2_ACCOUNT_ID`, `R2_*` keys |
| `gcloud storage cp` in CI | AWS CLI / SDK → R2 S3-compatible endpoint |
| Vercel (planned) | **Cloudflare Pages** |

Remove old GCP secrets from GitHub once R2 is configured.

---

## References

- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Hyperdrive](https://developers.cloudflare.com/hyperdrive/)
- [OpenNext for Cloudflare](https://opennext.js.org/cloudflare)

_Last updated: June 2026_
