#!/usr/bin/env bash
# Verify the production API entry starts after build:api (Render parity).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

PORT="${API_SMOKE_PORT:-4099}"
DATABASE_URL="${DATABASE_URL:-postgresql://smoke:smoke@127.0.0.1:5432/smoke}"

step() { echo "==> $1"; }

step "Build API (Render build:api)"
pnpm build:api

step "Start compiled API and probe /health"
export PORT
export DATABASE_URL

node packages/api/dist/server.js &
API_PID=$!

cleanup() {
  kill "${API_PID}" 2>/dev/null || true
  wait "${API_PID}" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -sf "http://127.0.0.1:${PORT}/health" | grep -q '"status":"ok"'; then
    echo "API /health responded OK on port ${PORT}"
    exit 0
  fi
  if ! kill -0 "${API_PID}" 2>/dev/null; then
    echo "ERROR: API process exited before /health responded" >&2
    wait "${API_PID}" || true
    exit 1
  fi
  sleep 0.25
done

echo "ERROR: API did not respond on /health within timeout" >&2
exit 1
