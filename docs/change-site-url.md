# Freshy | Change the public site URL

> **Purpose:** How the live web URL is chosen, which names are realistic, and the exact steps to replace `https://freshy-25e.pages.dev` without touching the API database or storage.

The public site is a **Cloudflare Pages** project named `freshy-25e`. That project name **is** the hostname: `https://freshy-25e.pages.dev`. Cloudflare [does not let you rename](https://developers.cloudflare.com/pages/platform/known-issues/#build-configuration) a `*.pages.dev` subdomain in place. To get a different `*.pages.dev` URL you create a **new Pages project** with the name you want, then delete the old one.

You do **not** delete the API Worker, D1 database, or R2 bucket to change the website URL. Those are separate resources.

---

## What each URL is

| Surface      | Resource            | Current URL                                     | Changes when you...                          |
| ------------ | ------------------- | ----------------------------------------------- | -------------------------------------------- |
| **Website**  | Pages `freshy-25e`  | https://freshy-25e.pages.dev                    | Create a new Pages project with a new name   |
| **API**      | Worker `freshy-api` | https://freshy-api.alexandrelheinen.workers.dev | Rename the Worker, or add a custom API host  |
| **Database** | D1 `freshy-db`      | No public URL                                   | Never, for a site rename                     |
| **Storage**  | R2 `freshy-assets`  | `pub-….r2.dev`                                  | Only if you later attach a custom asset host |

The `25e` suffix is leftover from the original Pages project name. It is not a Cloudflare requirement.

---

## Do I need to delete the Worker?

No. Deleting `freshy-api` would take the API offline and would **not** change `freshy-25e.pages.dev`.

Keep these as they are:

- Worker `freshy-api` and its secrets (`CLERK_SECRET_KEY`, `CLERK_AUTHORIZED_PARTIES`, `MAPBOX_ACCESS_TOKEN`)
- D1 `freshy-db` and binding `FRESHY_DB`
- R2 `freshy-assets` and binding `FRESHY_ASSETS`

After the new site URL is live, you only **update** `CLERK_AUTHORIZED_PARTIES` so it includes the new origin. You do not recreate the Worker.

---

## Pick an approach

| Approach                                          | Resulting URL                        | Delete Pages? | Buy a domain? | Recommendation                         |
| ------------------------------------------------- | ------------------------------------ | ------------- | ------------- | -------------------------------------- |
| **A. New Pages project**                          | `https://<name>.pages.dev`           | Yes, after    | No            | Fastest way to drop `freshy-25e`       |
| **B. Custom domain on the current Pages project** | `https://freshy.app` (example)       | No            | Yes           | Best long-term public URL              |
| **C. Both**                                       | Custom domain plus a nicer pages.dev | Optional      | Yes           | Use A for now, B when you own a domain |

`fresh.pages.dev` is almost certainly taken. Cloudflare Pages names are **global**: every account shares the same `*.pages.dev` namespace. Short words such as `fresh`, `cool`, or `map` are usually already claimed.

`go-fresh` (or `gofresh`, all one word) is a realistic Pages name. A purchased domain such as `freshy.app` will always look cleaner than any `*.pages.dev` host.

---

## Name proposals

Use lowercase letters, digits, and hyphens. The project name becomes `<name>.pages.dev`.

### Recommended Pages names (free)

Try these in order. The first one Cloudflare accepts is yours.

| Preference | Project name | Public URL                   | Why it is a good fit                                      |
| ---------- | ------------ | ---------------------------- | --------------------------------------------------------- |
| 1          | `gofresh`    | https://gofresh.pages.dev    | Matches "go-fresh, all together"; short and readable      |
| 2          | `go-fresh`   | https://go-fresh.pages.dev   | Same idea with a hyphen                                   |
| 3          | `freshy-app` | https://freshy-app.pages.dev | Keeps the **Freshy** brand in the host                    |
| 4          | `freshy-map` | https://freshy-map.pages.dev | Describes the product (cooling map)                       |
| 5          | `getfreshy`  | https://getfreshy.pages.dev  | Call to action, one word                                  |
| 6          | `try-freshy` | https://try-freshy.pages.dev | Clear that this is the app, not a random Pages sandbox    |
| 7          | `freshy`     | https://freshy.pages.dev     | Best brand match; try it, but expect "name already taken" |

Skip `fresh`. It will almost certainly fail, and it drops the product name.

### Custom domains to buy later (optional)

These are independent of Pages project names. The repo already treats `freshy.app` as the intended production host.

| Domain           | Use                                          |
| ---------------- | -------------------------------------------- |
| `freshy.app`     | Canonical public site                        |
| `gofresh.app`    | Alternate if `freshy.app` is taken           |
| `gofreshy.app`   | Brand + verb in one label                    |
| `api.freshy.app` | Later, nicer API host (Worker custom domain) |

A custom domain does **not** require deleting Pages. You attach it to the existing project (Approach B).

---

## How to check that a Pages name is free

Visiting `https://<name>.pages.dev` is not a reliable check. Unused names can 404 even when the name is reserved.

The reliable check is to **create** a Pages project with that name:

1. Open https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages**.
2. Choose **Connect to Git** (or start the create flow).
3. Set **Project name** to the candidate (`gofresh`, `go-fresh`, …).
4. If Cloudflare accepts it, the name is free. Continue with Approach A below.
5. If it says the name is taken, try the next row in the table.

Do not finish the create flow until you have copied the current Pages settings (step 1 of Approach A). You can abandon the wizard and start again.

---

## Approach A | New `*.pages.dev` URL (recreate Pages)

Create the **new** project first, switch traffic, then delete `freshy-25e`. That keeps the current site online until the new URL works.

### 1. Copy the current Pages settings

Open **Workers & Pages** → **freshy-25e** → **Settings**. Write down or screenshot:

| Setting                                  | Current value to copy                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| Production branch                        | `main`                                                                             |
| Framework preset                         | Next.js                                                                            |
| Build command                            | `cd ../.. && pnpm install && pnpm --filter @freshy/web build`                      |
| Build output directory                   | `out`                                                                              |
| Root / project directory                 | Whatever the current project uses (often `apps/web` or repo root; copy it exactly) |
| Node.js version                          | `20` (`NODE_VERSION` env var)                                                      |
| Env: `NEXT_PUBLIC_API_URL`               | `https://freshy-api.alexandrelheinen.workers.dev` (no trailing slash)              |
| Env: `NEXT_PUBLIC_MAPBOX_TOKEN`          | Same Mapbox public token                                                           |
| Env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Same Clerk publishable key                                                         |
| Env: `NEXT_PUBLIC_R2_PUBLIC_URL`         | Same R2 public base as the Worker                                                  |

Copy **Production** and **Preview** environment variables. After a recreate they are gone from the old project.

Leave the Worker, D1, and R2 untouched.

### 2. Create the new Pages project

1. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select the `freshy` GitHub repository (same repo as today).
3. Set **Project name** to the name you chose (`gofresh`, `freshy-app`, …). This becomes `<name>.pages.dev`.
4. Production branch: `main`.
5. Paste the build settings from step 1.
6. Add the same environment variables for **Production** and **Preview**.
7. Save and deploy.

Two Pages projects can point at the same GitHub repo. That is expected during the switch.

### 3. Confirm the new site

When the first deploy finishes:

```bash
# Replace gofresh with your project name
curl -sI https://gofresh.pages.dev/explore
```

Open the new `/explore`, `/profile`, and `/studio` URLs in a browser. The map should load because `NEXT_PUBLIC_API_URL` still points at the existing Worker.

If the first build fails, compare the new project's build command, output directory, and `NODE_VERSION` with `freshy-25e`. Do not delete the old project yet.

### 4. Allow the new origin in Clerk and on the Worker

Sign-in and saved places break if the new origin is missing from Clerk.

**Clerk dashboard** (https://dashboard.clerk.com → Freshy application):

1. Add the new origin to allowed / authorized parties, for example `https://gofresh.pages.dev`.
2. Keep `https://freshy-25e.pages.dev` and `http://localhost:3000` until you retire the old URL.
3. Add the new origin to redirect URLs if Clerk lists them separately.

**Worker secret** (does not require a new Worker):

```text
https://gofresh.pages.dev,https://freshy-25e.pages.dev,http://localhost:3000
```

Dashboard: **Workers & Pages** → **freshy-api** → **Settings** → **Variables and Secrets** → edit `CLERK_AUTHORIZED_PARTIES`.

Or from the repo:

```bash
cd packages/api
pnpm exec wrangler secret put CLERK_AUTHORIZED_PARTIES
```

Paste the comma-separated list, then:

```bash
pnpm build:api
pnpm deploy:api
```

### 5. Update this repository

Replace `freshy-25e` and `https://freshy-25e.pages.dev` with the new project name and URL. Search the repo for `freshy-25e`.

| Area               | Files to update                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| Docs and README    | `README.md`, `docs/platforms.md`, `docs/infrastructure.md`, `docs/local-development.md`, this file |
| Mobile default URL | `apps/mobile/src/web-app-url.ts`, `apps/mobile/app.config.ts`, `apps/mobile/eas.json`              |
| Mobile tests       | `apps/mobile/src/web-app-url.test.ts`, `apps/mobile/src/oauth-external-browser.test.ts`            |
| Web tests          | `apps/web/src/lib/api-base.test.ts`                                                                |
| CI                 | `.github/workflows/smoke-production.yml`, `production-screenshots.yml`, `release.yml`              |
| Env example        | `.env.example` (`CLERK_AUTHORIZED_PARTIES`, `EXPO_PUBLIC_WEB_APP_URL`)                             |
| Python metadata    | `python/pyproject.toml`                                                                            |
| Cloudflare notes   | `infrastructure/cloudflare/README.md`                                                              |

If you later use a host that is not `*.pages.dev` (for example `freshy.app`), add that hostname to `isProductionWebHost` in `apps/web/src/lib/api-base.ts`. `freshy.app` is already listed.

Merge that PR **after** the new Pages project is serving `/explore`. CI smoke tests still hit `freshy-25e` until the workflow files change.

### 6. Delete the old Pages project

Only after the new URL works, Clerk accepts the new origin, and the repo PR has updated the hardcoded links:

1. **Workers & Pages** → **freshy-25e** → **Settings** → **Delete project**.
2. Type the project name to confirm.
3. Remove `https://freshy-25e.pages.dev` from Clerk and from `CLERK_AUTHORIZED_PARTIES`.
4. Redeploy the Worker if you changed that secret.

`https://freshy-25e.pages.dev` stops working immediately. Cloudflare does not redirect the old host to the new one. Bookmarks and shared links need the new URL (or a custom domain from Approach B).

If delete fails because the project has many deployments, see [Cloudflare's delete workaround](https://developers.cloudflare.com/pages/platform/known-issues/#delete-a-project-with-a-high-number-of-deployments).

---

## Approach B | Custom domain (no Pages delete)

Use this when you own a domain (or after you buy `freshy.app`). The current `freshy-25e.pages.dev` host can stay as a fallback.

Official steps: [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).

### Apex domain (`freshy.app`)

1. Add the domain as a **zone** on the same Cloudflare account that owns Pages.
2. Point the domain's nameservers to Cloudflare.
3. **Workers & Pages** → **freshy-25e** (or the renamed project) → **Custom domains** → **Set up a domain**.
4. Enter `freshy.app` and continue. Cloudflare creates the DNS record.

### Subdomain (`www.freshy.app` or `app.example.com`)

If the zone is already on Cloudflare, Pages adds the CNAME for you. If the DNS lives elsewhere, add:

| Type  | Name (example) | Content                |
| ----- | -------------- | ---------------------- |
| CNAME | `www`          | `freshy-25e.pages.dev` |

Use the current Pages host as the CNAME target. After a Pages recreate, change the target to the new `<name>.pages.dev`.

### After the custom domain is Active

1. Add `https://freshy.app` (and `https://www.freshy.app` if you use www) to Clerk and to `CLERK_AUTHORIZED_PARTIES`.
2. Point docs, README badges, mobile `EXPO_PUBLIC_WEB_APP_URL`, and CI `WEB_URL` at the custom domain.
3. Keep or hide `*.pages.dev` as you prefer. Cloudflare can [redirect the pages.dev host](https://developers.cloudflare.com/pages/configuration/custom-domains/#disable-access-to-pagesdev-subdomain) to the custom domain later.

You still do **not** delete the Worker.

---

## Optional | Nicer API URL later

This is independent of the website URL.

| Goal                      | What to change                                                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep today's API          | Nothing. `freshy-api.alexandrelheinen.workers.dev` can stay.                                                                                                            |
| `api.freshy.app`          | Worker → **Settings** → **Domains & Routes** → **Custom Domain** (zone required)                                                                                        |
| Different `*.workers.dev` | Change `name` in `packages/api/wrangler.toml` and deploy. That creates a **new** Worker script name. Copy secrets and bindings. Then delete the old script if you want. |

Do not delete `freshy-api` unless you have already deployed the replacement and updated `NEXT_PUBLIC_API_URL` on Pages.

---

## Verify after the switch

- [ ] New site URL loads `/explore` and shows the map
- [ ] `GET https://freshy-api.alexandrelheinen.workers.dev/health` still returns `"db":"ok"` and `"auth":"configured"`
- [ ] Sign-in on `/profile` works on the **new** origin
- [ ] Saving a place still works
- [ ] `/studio` loads for an admin account
- [ ] Clerk authorized parties include the new origin
- [ ] Repo, CI, and mobile defaults no longer advertise `freshy-25e` (unless you kept it on purpose)
- [ ] Old Pages project deleted only after the new URL is the one you share

---

## Related docs

| Doc                                                                           | Why it matters                                |
| ----------------------------------------------------------------------------- | --------------------------------------------- |
| [platforms.md](platforms.md)                                                  | Current production URLs and env vars          |
| [infrastructure.md](infrastructure.md)                                        | How Pages, Worker, D1, and R2 connect         |
| [infrastructure/cloudflare/README.md](../infrastructure/cloudflare/README.md) | Pages build settings and DNS examples         |
| [mobile-setup.md](mobile-setup.md)                                            | Mobile WebView loads the public site URL      |
| [local-development.md](local-development.md)                                  | Localhost is unchanged by a production rename |
