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

step "Format check"
pnpm format:check

step "Generate Prisma client"
pnpm db:generate

step "Lint (all packages)"
pnpm lint

step "Typecheck (all packages)"
pnpm typecheck

step "Unit tests"
pnpm test

if [ "${SKIP_DB}" != "1" ] && command -v docker >/dev/null 2>&1; then
  step "Local database (Docker)"
  bash "${ROOT_DIR}/scripts/setup-local-db.sh"
  if [ -f "${ROOT_DIR}/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source "${ROOT_DIR}/.env"
    set +a
  fi
  step "Database migrate + seed"
  pnpm --filter @freshy/db migrate:deploy 2>/dev/null || pnpm --filter @freshy/db exec prisma db push --skip-generate
  pnpm db:seed || echo "WARN: seed skipped (DB may be empty)"
else
  echo "Skipping database setup (SKIP_DB=1 or Docker unavailable)."
fi

step "Build all packages"
pnpm build

if [ "${SKIP_SCREENSHOTS}" != "1" ]; then
  step "Playwright screenshots (4 app pages)"
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
