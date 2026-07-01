# Infrastructure

| Path          | Description                                          |
| ------------- | ---------------------------------------------------- |
| `cloudflare/` | R2, Pages, Workers setup guide and wrangler template |

**All platforms (Pages, Worker, D1, R2, Clerk, …):** [docs/platforms.md](../docs/platforms.md)

**Local development:**

```bash
pnpm install
pnpm --filter @freshy/db migrate:local
pnpm dev
```

See [docs/local-development.md](../docs/local-development.md).

**Cloudflare setup:** [cloudflare/README.md](cloudflare/README.md)

**Architecture overview:** [docs/infrastructure.md](../docs/infrastructure.md)
