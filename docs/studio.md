# Freshy | Place Management Studio

> **Route:** `/studio` (web) · **API prefix:** `/studio/*`  
> **Design reference:** [`docs/stitch/freshy_studio_desktop/`](stitch/freshy_studio_desktop/), [`freshy_studio_mobile/`](stitch/freshy_studio_mobile/)  
> **Auth:** Clerk `publicMetadata.role === "admin"`

Freshy Studio is the **internal moderation console** for the place database. Admins validate user submissions, edit listings, merge GPS duplicates, and delete false entries. The console is hidden from normal users: anyone without the admin role sees a **404-style page**, not an access-denied screen.

---

## Who can access Studio

| User                                                | Web (`/studio`) | API (`/studio/*`) |
| --------------------------------------------------- | --------------- | ----------------- |
| Signed out                                          | 404 page        | `404 Not found`   |
| Signed in, no admin role                            | 404 page        | `404 Not found`   |
| Signed in, `role: "admin"` in Clerk public metadata | Full Studio UI  | `200` + JSON data |

There is only one privileged role today: **`admin`**. Missing metadata or any other value is treated as a regular user.

Studio is **not linked** from the bottom navigation. Admins open it directly at `/studio`.

---

## Clerk setup (required)

Admin rights are granted in the [Clerk Dashboard](https://dashboard.clerk.com), not in the Freshy database.

### 1. Grant admin to a user

1. Open **Users** in the left sidebar (there is no top-level **Metadata** menu).
2. Click the user who should operate Studio.
3. Scroll to **User metadata**.
4. Next to **Public**, click **Edit**.
5. Save this JSON:

```json
{
  "role": "admin"
}
```

6. To revoke admin access, remove the `role` key or set `"role": null`.

### 2. Expose role in the session token (recommended)

Without this step the API still works (it falls back to `clerk.users.getUser()`), but adding the claim avoids an extra Clerk API call on every Studio request.

1. In Clerk, open **Sessions**.
2. Under **Customize session token**, add to the claims editor:

```json
{
  "role": "{{user.public_metadata.role}}"
}
```

3. Click **Save**.

### 3. Refresh the session

Sign out of Freshy and sign in again so the new metadata and session claims apply.

### Fallback: set metadata via API

If the Dashboard UI does not show **Edit** on Public metadata, use the [Clerk Backend API](https://clerk.com/docs/reference/backend/user/update-user-metadata):

```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"public_metadata": {"role": "admin"}}' \
  "https://api.clerk.com/v1/users/USER_ID/metadata"
```

---

## Place lifecycle and public visibility

Studio moderation is built on the existing `PlaceStatus` enum in the Drizzle schema:

| Status      | Meaning in Studio                 | Visible on map / public API |
| ----------- | --------------------------------- | --------------------------- |
| `DRAFT`     | **Pending** (awaiting validation) | No                          |
| `PUBLISHED` | **Verified**                      | Yes                         |

### User submissions

When a signed-in user submits a place at `/profile/places/new`, the API **always** saves it as `DRAFT` and sets `createdById` to the contributor's Freshy `User.id`.

### Anonymous submissions

Visitors who are not signed in can contribute at `/profile/places/new?anonymous=1`. They must include a **secret** that matches an existing `User.id` in the database. The API route is `POST /contributions/places` (no Clerk JWT). Invalid secrets return `UNKNOWN_SECRET` or `MISSING_SECRET` with a user-facing message.

Signed-out visitors can also start from `/profile`, which offers **Connect or register**, **Contribute**, and **Explore**.

### Contributor attribution in Studio

Studio place rows include an **Added by** column:

| `createdById` | Studio display                                                     |
| ------------- | ------------------------------------------------------------------ |
| Set           | Contributor email with hover summary (name, email, submitted date) |
| `null`        | **Unknown** (legacy or admin-seeded places)                        |

Admins see a **My secret** bar below the Studio header with their own contributor secret (`User.id`). Copy it to share offline with trusted contributors who submit without signing in.

### Public reads

These endpoints return **published places only**:

- `GET /places`
- `GET /places/:slug`
- `GET /places/meta/categories` (counts)

Draft and rejected listings are visible only through Studio (`GET /studio/places`).

---

## Studio status labels (UI)

The API enriches each place with a `studioStatus` field for the admin table. This is separate from `PlaceStatus` in the database.

| Label                | `studioStatus` | Condition                                                       |
| -------------------- | -------------- | --------------------------------------------------------------- |
| **Verified** (green) | `verified`     | `status === PUBLISHED`                                            |
| **Pending**          | `pending`      | `status === DRAFT` or `IMPORTED`                                  |
| **Duplicate** (red)  | `duplicate`    | Another place exists within **50 meters** (newer entry flagged)   |

Duplicate detection uses great-circle distance (`haversineDistanceKm` in `@freshy/db`). When two places are within 50 m, the **older** record is kept as the canonical entry; the newer one is marked duplicate and offers a **Merge** action.

Duplicate scans are **on demand** only (not on every Studio load). Use **Check for duplicates** in the dashboard or open **Conflicts (Merge)** and run a scan before reviewing results.

---

## Web UI (`/studio`)

Implemented in `apps/web/src/components/StudioClient.tsx`, loaded client-only via `StudioPageShell` (static export + Clerk).

| Area         | Behavior                                                                      |
| ------------ | ----------------------------------------------------------------------------- |
| Sidebar      | Filters: **Places** (all), **Pending Validation**, **Conflicts (Merge)**      |
| Stats cards  | Total verified, pending count, active conflicts (after scan), freshness         |
| Duplicate scan | **Check for duplicates** runs `GET /studio/duplicates` on demand              |
| Table        | Name, location, coolness bar, status badge, **Added by**, row actions         |
| **Validate** | Publishes a pending place (`DRAFT` → `PUBLISHED`)                             |
| **Edit**     | Modal to change name, address, category, freshness level, status, description |
| **Merge**    | Merges a duplicate into the older nearby place (see API below)                |
| **Delete**   | Permanently removes a place (with browser confirm dialog)                     |

Access guard: `StudioPageClient` checks `user.publicMetadata.role === 'admin'` via `isStudioAdmin()` in `apps/web/src/lib/studio-api.ts`. Non-admins render `StudioNotFound`.

---

## API reference (`/studio/*`)

All routes require `Authorization: Bearer <clerk_session_jwt>` and admin role. Non-admins receive **`404`** (not `403`) so the admin surface does not leak.

Middleware: `requireAdmin` in `packages/api/src/auth.ts`.

| Method   | Path                                       | Description                               |
| -------- | ------------------------------------------ | ----------------------------------------- |
| `GET`    | `/users/me/contributor-secret`             | Current user's contributor secret         |
| `GET`    | `/studio/users`                            | Search users and list contributor secrets |
| `GET`    | `/studio/users/:userId/contributor-secret` | Single user contributor secret (admin)    |
| `GET`    | `/studio/stats`                            | Dashboard metrics (verified and pending counts) |
| `GET`    | `/studio/places`                           | Paginated place list                      |
| `GET`    | `/studio/duplicates`                       | On-demand duplicate scan (paginated)      |
| `GET`    | `/studio/places/:placeId`                  | Single place with `studioStatus`          |
| `PATCH`  | `/studio/places/:placeId`                  | Update any editable field                 |
| `POST`   | `/studio/places/:placeId/approve`          | Set `status` to `PUBLISHED`               |
| `DELETE` | `/studio/places/:placeId`                  | Delete place and cascaded reviews/saves   |
| `POST`   | `/studio/places/merge`                     | Merge source into target                  |

Public place responses omit `createdById`. Contributor email is returned only on `/studio/*` routes.

### `GET /studio/places` query parameters

| Param    | Values                                    | Default |
| -------- | ----------------------------------------- | ------- |
| `status` | `all`, `verified`, `pending`              | `all`   |
| `q`      | Search string (name, address, slug)       | —       |
| `page`   | Page number                               | `1`     |
| `limit`  | Page size (max 100)                       | `25`    |

### `GET /studio/duplicates` query parameters

Runs a full duplicate scan, then returns paginated conflict rows. Same params as `/studio/places` except `status`.

| Param   | Description                         | Default |
| ------- | ----------------------------------- | ------- |
| `q`     | Search string (name, address, slug) | —       |
| `page`  | Page number                         | `1`     |
| `limit` | Page size (max 100)                 | `25`    |

### `POST /studio/places/merge` body

```json
{
  "targetPlaceId": "cuid_of_canonical_place",
  "sourcePlaceId": "cuid_of_duplicate_to_remove"
}
```

Merge behavior (transaction):

1. Move reviews from source to target (skip if the same user already reviewed the target).
2. Move saved-place rows to target (upsert; duplicates skipped).
3. Delete the source place.

### Example: local smoke test with curl

After signing in as admin, copy a session token from browser devtools (Network tab → API request → `Authorization` header).

```bash
export API=http://localhost:4000
export TOKEN="eyJ..."

# Stats
curl -s -H "Authorization: Bearer $TOKEN" "$API/studio/stats" | jq

# List pending places
curl -s -H "Authorization: Bearer $TOKEN" "$API/studio/places?status=pending" | jq

# Validate (publish) a place
curl -X POST -H "Authorization: Bearer $TOKEN" "$API/studio/places/PLACE_ID/approve"

# Delete
curl -X DELETE -H "Authorization: Bearer $TOKEN" "$API/studio/places/PLACE_ID"
```

Non-admin token:

```bash
curl -i -H "Authorization: Bearer $NON_ADMIN_TOKEN" "$API/studio/places"
# HTTP/1.1 404 Not Found
```

---

## Security model

```mermaid
flowchart LR
    Clerk[Clerk publicMetadata role admin] --> JWT[Session JWT optional role claim]
    JWT --> WebGuard[StudioPageClient isStudioAdmin]
    JWT --> API[requireAdmin middleware]
    API --> DB[(Cloudflare D1)]
    WebGuard --> UI[Studio UI or 404 page]
```

| Layer              | Responsibility                                                          |
| ------------------ | ----------------------------------------------------------------------- |
| Clerk metadata     | Assign and revoke admin                                                 |
| API `requireAdmin` | **Authoritative** enforcement on all mutations                          |
| Web guard          | UX only; mirrors 404 for non-admins                                     |
| Static export      | `/studio` HTML exists in the build; do not rely on hiding the URL alone |

Optional hardening (not implemented): [Cloudflare Access](infrastructure.md) on `/studio*` at the edge.

---

## Code map

| Path                                           | Role                                               |
| ---------------------------------------------- | -------------------------------------------------- |
| `apps/web/src/app/studio/page.tsx`             | Next.js route                                      |
| `apps/web/src/components/StudioPageShell.tsx`  | Client-only dynamic import (Clerk + static export) |
| `apps/web/src/components/StudioPageClient.tsx` | Admin guard                                        |
| `apps/web/src/components/StudioClient.tsx`     | Studio UI                                          |
| `apps/web/src/lib/studio-api.ts`               | Browser API client + `isStudioAdmin()`             |
| `packages/api/src/auth.ts`                     | `requireAdmin`, role claim helpers                 |
| `packages/api/src/studio-places.ts`            | List, stats, merge, duplicate detection            |
| `packages/api/src/studio-routes.ts`            | Hono route registration                            |
| `packages/api/src/user-routes.ts`              | Forces `DRAFT` on user place create                |
| `packages/ui/src/tokens.ts`                    | `ROUTES.studio`                                    |

### Tests

| File                                     | Covers                                         |
| ---------------------------------------- | ---------------------------------------------- |
| `packages/api/src/auth.test.ts`          | Role claim parsing                             |
| `packages/api/src/studio-places.test.ts` | Schemas, duplicate detection, merge validation |
| `apps/web/src/lib/studio-api.test.ts`    | `isStudioAdmin()`                              |

Run:

```bash
pnpm --filter @freshy/api test
pnpm --filter @freshy/web test
```

---

## Local end-to-end verification

1. Apply local D1 migrations: `pnpm --filter @freshy/db migrate:local`
2. Configure `.env` and `packages/api/.dev.vars` with Clerk keys (see [local-development.md](local-development.md))
3. Set `NEXT_PUBLIC_API_URL=http://localhost:8787`
4. Grant yourself `role: "admin"` in Clerk (see above) and sign in again.
5. Run `pnpm dev`
6. **Non-admin check:** open `/studio` as a normal user → 404 page.
7. **Admin check:** open `/studio` → stats and table load.
8. **Pending flow:** submit a place at `/profile/places/new` → appears as Pending in Studio → **Validate** → place appears on `/explore`.
9. **Delete:** remove a test entry → gone from Studio and public API.
10. **Merge:** create two places within 50 m → newer row shows Duplicate → **Merge** → one place remains.

Full pipeline before a PR:

```bash
bash scripts/validation.sh
```

Use `SKIP_SCREENSHOTS=1` to skip Playwright if needed.

---

## Production checklist

| Step                                       | Where                                 |
| ------------------------------------------ | ------------------------------------- |
| Admin metadata on operator accounts        | Clerk Dashboard (production instance) |
| Session token claim `role`                 | Clerk → Sessions                      |
| `CLERK_SECRET_KEY` on API                  | Cloudflare Worker secrets             |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` on web | Cloudflare Pages                      |
| Deploy API + web after merge               | GitHub → CI/CD                        |
| Verify `/studio` as admin                  | `https://freshy-25e.pages.dev/studio` |
| Verify non-admin gets 404                  | Second test account without metadata  |

---

## Related docs

| Document                                     | Topic                            |
| -------------------------------------------- | -------------------------------- |
| [local-development.md](local-development.md) | Clerk keys, local wrangler dev   |
| [platforms.md](platforms.md)                 | Platform dashboards and env vars |
| [database.md](database.md)                   | `PlaceStatus`, Drizzle schema    |
| [architecture.md](architecture.md)           | Monorepo layout                  |

---

## Future work (backlog)

| Item                        | Notes                                           |
| --------------------------- | ----------------------------------------------- |
| Audit log                   | Record who approved, merged, or deleted         |
| `REJECTED` status           | Explicit rejection reason vs staying in `DRAFT` |
| Featured place ("Destaque") | Pin highlight from Studio                       |
| Bulk actions                | Multi-select validate or delete                 |
| Cloudflare Access           | Edge lock on `/studio`                          |
| Playwright E2E              | Admin vs non-admin `/studio` in CI              |
| PR screenshots              | Optional Studio page in screenshot workflow     |

---

_Last updated: June 2026_
