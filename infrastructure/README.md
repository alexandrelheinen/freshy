# Infrastructure

| Path          | Description                                             |
| ------------- | ------------------------------------------------------- |
| `docker/`     | Local PostgreSQL + PostGIS (`docker-compose.yml`)       |
| `cloudflare/` | R2, Pages, Workers: setup guide and `wrangler` template |
| `render/`     | Render blueprint for production API (`render.yaml`)     |

**All platforms (Neon, Render, Pages, Clerk, …):** [docs/platforms.md](../docs/platforms.md)

**Local database:**

```bash
bash scripts/setup-local-db.sh
```

**Deploy API + connect Pages:** [docs/deploy-api.md](../docs/deploy-api.md)

**Cloudflare (R2, Pages):** [cloudflare/README.md](cloudflare/README.md)

**Architecture overview:** [docs/infrastructure.md](../docs/infrastructure.md)
