#!/usr/bin/env bash
# Build all Freshy packages and applications.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

echo "==> Generating Prisma client..."
pnpm db:generate

echo "==> Building monorepo (turbo)..."
pnpm build

echo "==> Build complete."
echo "  Web:    apps/web/.next"
echo "  API:    packages/api/dist"
echo "  Mobile: run 'pnpm --filter @freshy/mobile build' for Expo export"
