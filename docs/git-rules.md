# Git & Repository Rules — Freshy

> Full contributor guide: [CONTRIBUTING.md](../CONTRIBUTING.md)  
> Local setup: [local-development.md](local-development.md)  
> Quality standards: [quality-standards.md](quality-standards.md)  
> Shared branching, commit, and review rules: [.guidelines/workflow/branching.md](../.guidelines/workflow/branching.md), [commits.md](../.guidelines/workflow/commits.md), [review.md](../.guidelines/workflow/review.md)

This file covers only what's specific to Freshy: the branch-prefix table, release process, and file layout. General rules (never force-push to `main`, PRs required and must pass CI, atomic commits, imperative English commit messages) live in `.guidelines/` linked above. Freshy's stricter mergeability bar is in [CONTRIBUTING.md's Definition of done](../CONTRIBUTING.md#pull-request-requirements).

## Branching

| Branch                  | Purpose                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `main`                  | Production-ready code; protected                            |
| `cursor/<feature>-e20f` | Agent / feature branches (required prefix for cloud agents) |
| `feat/<name>`           | Human feature branches                                      |
| `fix/<name>`            | Bug fixes                                                   |

## What not to commit

See [.guidelines/workflow/commits.md](../.guidelines/workflow/commits.md) for
the general rule (no secrets, no build output). Freshy-specific additions:

- Local database volumes
- IDE-specific files (except shared `.vscode/settings.json`)

See [`.gitignore`](../.gitignore) for the full list.

## File organization

```
apps/web/          → Next.js PWA (4 main screens)
apps/mobile/       → Expo (Android + iOS)
packages/api/      → REST API + R2 integration
packages/db/       → Drizzle schema & D1 migrations
packages/ui/       → Shared React components
packages/config/   → ESLint, Tailwind tokens
infrastructure/    → Docker (local), Cloudflare docs
scripts/           → build.sh, validation.sh
docs/              → platforms, architecture, stitch designs
```

## Pull request checklist

See [CONTRIBUTING.md's Pull request requirements](../CONTRIBUTING.md#pull-request-requirements)
for the full checklist. One CI behavior worth knowing here: screenshots for UI
changes are posted to the PR automatically, not something you attach by hand.

## Releases

- Tag format: `v0.1.0`, `v1.0.0` (semver)
- Publishing a GitHub **Release** runs `.github/workflows/release.yml`: EAS builds a signed Android APK and attaches it to the release assets. iOS and store publishing: [mobile-publishing.md](mobile-publishing.md).
- Local builds: `pnpm mobile:build:android`, `pnpm mobile:build:ios` (see [platforms.md](platforms.md))
- Release notes should list user-facing changes

## Code style

See [CONTRIBUTING.md's Code style section](../CONTRIBUTING.md#code-style-all-typescript).
