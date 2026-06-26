# Git & Repository Rules — Freshy

## Branching

| Branch                  | Purpose                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `main`                  | Production-ready code; protected                            |
| `cursor/<feature>-301d` | Agent / feature branches (required prefix for cloud agents) |
| `feat/<name>`           | Human feature branches                                      |
| `fix/<name>`            | Bug fixes                                                   |

### Rules

1. **Never force-push to `main`.**
2. All changes to `main` go through a **pull request**.
3. PRs must pass CI (lint, typecheck, tests, build, page screenshots).
4. Keep commits focused — one logical change per commit.
5. Write commit messages in English, imperative mood (`Add`, `Fix`, `Update`).

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
packages/api/      → REST API + GCS integration
packages/db/       → Prisma schema & migrations
packages/ui/       → Shared React components
packages/config/   → ESLint, Tailwind tokens
infrastructure/    → Docker, GCP docs
scripts/           → build.sh, validation.sh
docs/              → roadmap, architecture, stitch designs
```

## Pull request checklist

- [ ] `bash scripts/validation.sh` passes locally
- [ ] No secrets in diff
- [ ] Screenshots appear in PR comment (CI)
- [ ] Database migrations included if schema changed
- [ ] `.env.example` updated if new env vars added

## Releases

- Tag format: `v0.1.0`, `v1.0.0` (semver)
- Creating a GitHub **Release** triggers mobile builds (Android APK/AAB + iOS)
- Release notes should list user-facing changes

## Code style

- TypeScript strict mode
- Prettier for formatting (`pnpm format`)
- ESLint flat config from `@freshy/config`
- Portuguese (pt-BR) for user-facing copy; English for code and docs
