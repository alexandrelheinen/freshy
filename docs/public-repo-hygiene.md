# Freshy | Public repository hygiene

> **Purpose:** A short checklist after making [alexandrelheinen/freshy](https://github.com/alexandrelheinen/freshy) public. The repo can stay public. This list covers the few items that are too personal or look like production snapshots, plus habits so new commits stay that way.

An August 2026 review found **no live secrets** in the tree or in obvious git history. Clerk, Mapbox, Cloudflare, R2, and Expo tokens live in GitHub Actions secrets and local `.env` files, which are gitignored. Making the repository private again would not unsay clones or search indexes. Rewriting git history is not needed unless a real credential is committed later.

Production resource names (`freshy-25e`, `freshy-api`, D1 and R2 ids) stay in the repo. Deploy config and CI need them. They are identifiers, not passwords.

---

## One-time GitHub settings (not in git)

Do these in the GitHub UI. They are not source files, so they do not need a history rewrite.

- [ ] Change the repository **Description** away from a private nickname. It is still `Lulu's app` in GitHub settings. Use a product line such as `Mobile-first cooling map` or `Find air-conditioned refuges in hot cities`.
- [ ] Confirm **About → Website** points at the public app (`https://freshy-25e.pages.dev` or the later custom domain), not a private note.
- [ ] Enable **Secret scanning** and **Push protection**: Settings → Code security → Secret scanning. Reject pushes that look like API keys.
- [ ] Leave **Issues** off, or turn them on only when you want public bug reports. Do not paste restore bookmarks, Clerk user ids, or real emails into issues or PR comments.

---

## In-repo redactions (this change)

These replace examples that looked like real production or personal records. Authorship in `LICENSE` and `python/pyproject.toml` stays. That is normal for a public project.

- [x] Studio contributor tests use a generic fixture (`user_fixture_01`, `Ada Example`), not a real display name or CUID-shaped id.
- [x] D1 Time Travel examples use an obviously fake bookmark (`exampleonlynotaproductionbookmark`), not a production-shaped id.

---

## Keep doing

- [ ] Never commit `.env`, `.dev.vars`, `*.p8`, keystores, or wrangler login state (see [`.gitignore`](../.gitignore)).
- [ ] In docs and tests, use `@example.com`, `sk_test_...`, and `eyJ...` placeholders. Do not paste real JWTs, Clerk secret keys, or Time Travel bookmarks from a live `wrangler` run.
- [ ] Keep operator runbooks in `docs/` (and this repo). Do not copy them onto the live map or the [portfolio project page](https://alexandrelheinen.pages.dev/projects/freshy). That page is a product intro, not a hosting guide.
- [ ] If a real secret is committed: rotate it at the provider first, then decide whether history rewrite is worth it. Private-again does not rotate the secret.

---

## Out of scope (leave as-is)

| Item                                            | Why it can stay public                                           |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| Pages, Worker, D1, and R2 names and public URLs | Needed to deploy this project; not credentials                   |
| Expo project id in `apps/mobile/app.config.ts`  | Normal EAS config                                                |
| Clichy 92110 and map center                     | Pilot city, not a home address                                   |
| `docs/studio.md` and D1 backup steps            | Operator docs; they still require your Clerk or Cloudflare login |
| Copyright and package author name               | Public authorship                                                |

---

## Related docs

| Doc                                                          | Why it matters                        |
| ------------------------------------------------------------ | ------------------------------------- |
| [platforms.md](platforms.md)                                 | Where secrets are _named_, not stored |
| [d1-backup-and-maintenance.md](d1-backup-and-maintenance.md) | Production D1 backup (fake bookmark)  |
| [git-rules.md](git-rules.md)                                 | What not to commit                    |
| [CONTRIBUTING.md](../CONTRIBUTING.md)                        | PR checklist, no secrets in the diff  |
