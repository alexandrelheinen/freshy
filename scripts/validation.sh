#!/usr/bin/env bash
# Full validation: install, lint, typecheck, test, build, optional DB + screenshots.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

SKIP_DB="${SKIP_DB:-0}"
SKIP_SCREENSHOTS="${SKIP_SCREENSHOTS:-0}"
SKIP_INSTALL="${SKIP_INSTALL:-0}"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

step() { echo -e "\n${GREEN}==>${NC} $1"; }
fail() { echo -e "${RED}ERROR:${NC} $1" >&2; exit 1; }

command -v node >/dev/null 2>&1 || fail "Node.js is required (>= 20)."
command -v pnpm >/dev/null 2>&1 || fail "pnpm is required."

NODE_MAJOR=$(node -e "console.log(process.version.split('.')[0].replace('v',''))")
[ "${NODE_MAJOR}" -ge 20 ] || fail "Node.js 20+ required (found $(node -v))."

if [ "${SKIP_INSTALL}" != "1" ]; then
  step "Installing dependencies"
  pnpm install
fi

step "Theme build + validate"
pnpm theme:build
pnpm theme:validate
pnpm prettier --write packages/theme/generated/**/*.ts

step "Format check"
pnpm format:check

step "Lint (all packages)"
pnpm lint

step "Typecheck (all packages)"
pnpm typecheck

step "Unit tests"
pnpm test

if [ "${SKIP_DB}" != "1" ]; then
  step "Local D1 migrations"
  pnpm --filter @freshy/db migrate:local || echo "WARN: local D1 migrate skipped"
else
  echo "Skipping D1 migrations (SKIP_DB=1)."
fi

step "Build all packages"
pnpm build

step "API deploy smoke (Cloudflare Worker parity)"
pnpm smoke:api

step "Web deploy smoke (Cloudflare Pages parity)"
pnpm smoke:web

if [ "${SKIP_SCREENSHOTS}" != "1" ]; then
  step "Playwright screenshots (6 app pages)"
  mkdir -p "${ROOT_DIR}/screenshots"
  pnpm --filter @freshy/web exec playwright install chromium --with-deps 2>/dev/null || \
    pnpm --filter @freshy/web exec playwright install chromium
  pnpm screenshots
  step "Screenshots saved to screenshots/"
  ls -la "${ROOT_DIR}/screenshots/" || true
else
  echo "Skipping screenshots (SKIP_SCREENSHOTS=1)."
fi

echo ""
echo -e "${GREEN}All validation checks passed.${NC}"
