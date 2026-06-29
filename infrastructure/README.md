# Infrastructure

| Path           | Description                                              |
| -------------- | -------------------------------------------------------- |
| `docker/`      | Local PostgreSQL + PostGIS (`docker-compose.yml`)        |
| `cloudflare/`  | R2, Pages, Workers — setup guide and `wrangler` template |

**Local database:**

```bash
bash scripts/setup-local-db.sh
```

**Cloudflare (R2, Pages, CI screenshots):** [cloudflare/README.md](cloudflare/README.md)

**Architecture overview (what runs where):** [docs/infrastructure.md](../docs/infrastructure.md)
