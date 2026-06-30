Here is the complete technical specification to migrate your entire backend infrastructure to the Cloudflare ecosystem, achieving zero cost and zero cold starts.

---

## Part 1: Migration Specification (Render to Cloudflare Workers)

Cloudflare Workers do not run on a standard Node.js runtime; they operate on the V8 isolate engine. This requires adapting the routing layer and how the Prisma client connects to the database.

### 1. Architectural Blueprint

The API layer shifts from a centralized server instance to a globally distributed edge architecture.

```mermaid
flowchart TD
    User[User Browser] --> Pages[Cloudflare Pages<br/>freshy-25e.pages.dev]
    Pages -->|HTTPS| Workers[Cloudflare Workers<br/>freshy-api.workers.dev]
    Workers -->|D1 Driver / Hyperdrive| DB[(Database Layer)]

```

### 2. Step-by-Step Implementation

#### Step 2.1: Adapt the Routing Layer (Express to Hono)

Express relies heavily on Node.js networking APIs (`net`, `http`) which are incompatible with V8 isolates. **Hono** is a minimalist web framework designed specifically for Cloudflare Workers with an Express-like syntax.

1. Install Hono in `packages/api`:

```bash
pnpm --filter @freshy/api add hono

```

2. Rewrite the entry point (`packages/api/src/server.ts` or `index.ts`):

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Middleware
app.use('*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'freshy-api-worker',
    db: 'ok', // Updated via binding check
  });
});

// Export the worker handler
export default app;
```

#### Step 2.2: Configure Wrangler (Worker Deployment)

Wrangler is the Cloudflare Developer Platform CLI.

1. Install Wrangler as a dev dependency in the monorepo root or `packages/api`:

```bash
pnpm add -D wrangler

```

2. Create a `wrangler.toml` file in `packages/api/`:

```toml
name = "freshy-api"
main = "src/index.ts" # Path to your Hono entry point
compatibility_date = "2026-06-30"

[vars]
# Environment variables go here
CLERK_API_URL = "https://api.clerk.com/v1"

```

#### Step 2.3: Modify the Prisma Client for Edge Compatibility

Standard Prisma engines use native binaries that cannot execute inside a Worker. You must swap to the WebAssembly (Wasm) client or utilize the Cloudflare Driver Adapters.

1. Update the Prisma configuration in `packages/db/prisma/schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

```

2. Regenerate the client:

```bash
pnpm --filter @freshy/db exec prisma generate

```

---

## Part 2: Database Migration Specification (Neon to Cloudflare D1)

Cloudflare **cannot** natively host or run a PostgreSQL server instance inside its infrastructure. Instead, Cloudflare provides **Cloudflare D1**, which is a fully managed, globally distributed **SQLITE** database engine built natively for Workers.

### The Trade-off: PostgreSQL vs. D1 (SQLite)

Because your project uses **PostGIS** (`Neon (Postgres 16 + PostGIS)`), migrating to Cloudflare D1 requires careful consideration:

- **D1 (SQLite) does not support PostGIS.** SQLite uses the `SpatiaLite` extension for geospatial queries, but Cloudflare D1 does not currently support native SpatiaLite extensions.
- If your cooling map relies heavily on advanced PostgreSQL spatial functions (such as `ST_DWithin`, `ST_DistanceSphere`), migrating to D1 will break those queries. You would have to calculate distances mathematically via mathematical formulas (Haversine formula) directly in the TypeScript Worker code.

### Option A: Stay on Neon but use Cloudflare Hyperdrive (Recommended for PostGIS)

Keep the database on Neon to preserve PostGIS, but route all queries through **Cloudflare Hyperdrive**. Hyperdrive runs inside the Cloudflare network, keeps a pool of open connections to Neon, and caches queries. This eliminates the 15-second database cold start entirely at zero cost.

1. Create a Hyperdrive configuration via Wrangler:

```bash
wrangler hyperdrive create freshy-db-pool --connection-string="postgres://user:password@ep-divine-breeze-pooler.neon.tech/neondb"

```

2. Add the binding to `wrangler.toml`:

```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "your-hyperdrive-id-from-terminal"

```

3. Initialize Prisma inside the Worker using the Hyperdrive connection string dynamically.

### Option B: Complete Migration to Cloudflare D1 (Pure SQLite, No Postgres)

If you prefer to eliminate Neon completely and handle geospatial logic inside the application code, follow these steps to adopt D1:

#### Step 1: Create the D1 Database

Execute the following command via the terminal to initialize the database inside your Cloudflare account:

```bash
wrangler d1 create freshy-db

```

This output will provide a configuration snippet containing a unique `database_id`.

#### Step 2: Bind D1 to the Worker

Add the generated block to `packages/api/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB" # Accessible in your code via env.DB
database_name = "freshy-db"
database_id = "xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

```

#### Step 3: Rewrite Prisma Configuration for SQLite

SQLite uses different data types and does not support schemas or PostGIS types.

1. Modify `packages/db/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db" // Used for local development only
}

```

2. Change coordinate storage from PostGIS geometry types to standard floating-point fields:

```prisma
model Place {
  id        String   @id @default(uuid())
  name      String
  latitude  Float
  longitude Float
}

```

#### Step 4: Execute Migrations on D1

Since Prisma cannot directly execute migrations on a production D1 instance via standard native drivers, use the Prisma D1 adapter workflow:

1. Generate the SQL migration files locally using Prisma:

```bash
pnpm --filter @freshy/db exec prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migration.sql

```

2. Apply the SQL file directly to your live production Cloudflare D1 instance:

```bash
wrangler d1 execute freshy-db --remote --file=./migration.sql

```

---

## Part 3: Verification and Deployment Checklist

1. **Local Emulation:** Run `wrangler dev` inside `packages/api` to test the Hono server locally. It accurately emulates the production Cloudflare edge environment.
2. **CI/CD Integration:** Update the GitHub Actions workflow (`.github/workflows/ci.yml`). Replace any Render deployment webhooks with the Cloudflare Wrangler Action:

```yaml
- name: Deploy Worker
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    workingDirectory: 'packages/api'
```

3. **Environment Updates:** Update the `NEXT_PUBLIC_API_URL` secret variable in Cloudflare Pages to point to your new `*.workers.dev` domain instead of Render.
