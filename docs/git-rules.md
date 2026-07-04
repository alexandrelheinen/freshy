# Git & Repository Rules — Freshy

> Full contributor guide: [CONTRIBUTING.md](../CONTRIBUTING.md)  
> Local setup: [local-development.md](local-development.md)  
> Quality standards: [quality-standards.md](quality-standards.md)

## Branching

| Branch                  | Purpose                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `main`                  | Production-ready code; protected                            |
| `cursor/<feature>-e20f` | Agent / feature branches (required prefix for cloud agents) |
| `feat/<name>`           | Human feature branches                                      |
| `fix/<name>`            | Bug fixes                                                   |

### Rules

1. **Never force-push to `main`.**
2. All changes to `main` go through a **pull request**.
3. PRs must pass CI (lint, typecheck, tests, build, page screenshots).
4. PRs must be **mergeable** into `main` (no conflicts; rebase cleanly when required).
5. Keep commits focused — one logical change per commit.
6. Write commit messages in English, imperative mood (`Add`, `Fix`, `Update`).

## What not to commit

- `.env` files and secrets (`*.json` service account keys)
- `node_modules/`, build artifacts (`.next/`, `dist/`)
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

- [ ] `bash scripts/validation.sh` passes locally
- [ ] No secrets in diff
- [ ] Screenshots appear in PR comment (CI)
- [ ] Database migrations included if schema changed
- [ ] `.env.example` updated if new env vars added
- [ ] **PR is mergeable into `main`** (rebase onto latest `main` if needed)

**Done means mergeable:** Do not treat a task as finished until GitHub reports the PR as mergeable, or you have rebased onto current `main` and pushed without conflicts.

## Releases

- Tag format: `v0.1.0`, `v1.0.0` (semver)
- Publishing a GitHub **Release** runs `.github/workflows/release.yml`: EAS builds a signed Android APK and attaches it to the release assets. iOS and store publishing: [mobile-publishing.md](mobile-publishing.md).
- Local builds: `pnpm mobile:build:android`, `pnpm mobile:build:ios` (see [platforms.md](platforms.md))
- Release notes should list user-facing changes

## Code style

- TypeScript strict mode
- Prettier for formatting (`pnpm format`)
- ESLint flat config from `@freshy/config`
- English for all documentation and source code; locale translations via i18n when adopted
