#!/usr/bin/env bash
# Verify the production API Worker starts after build:api (Cloudflare Workers parity).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

PORT="${API_SMOKE_PORT:-4099}"

step() { echo "==> $1"; }

step "Build API (Worker bundle inputs)"
pnpm build:api

step "Apply local D1 migrations"
rm -rf packages/api/.wrangler/state/v3/d1
pnpm --filter @freshy/db migrate:local

step "Start Worker via wrangler dev and probe /health"
cd packages/api

pnpm exec wrangler dev --port "${PORT}" --local --ip 127.0.0.1 &
API_PID=$!

cleanup() {
  kill "${API_PID}" 2>/dev/null || true
  wait "${API_PID}" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:${PORT}/health" | grep -q '"status":"ok"'; then
  echo "Worker /health responded OK on port ${PORT}"
  break
  fi
  if ! kill -0 "${API_PID}" 2>/dev/null; then
    echo "ERROR: wrangler dev exited before /health responded" >&2
    wait "${API_PID}" || true
    exit 1
  fi
  sleep 0.25
done

if ! curl -sf "http://127.0.0.1:${PORT}/health" | grep -q '"status":"ok"'; then
  echo "ERROR: Worker did not respond on /health within timeout" >&2
  exit 1
fi

route_not_missing() {
  local method="$1"
  local path="$2"
  shift 2
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 -X "${method}" "http://127.0.0.1:${PORT}${path}" "$@")"
  if [ "$code" = "404" ]; then
    echo "ERROR: Route missing: ${method} ${path} (got 404)" >&2
    exit 1
  fi
}

step "Verify critical API routes"
route_not_missing POST /contributions/places -H "Content-Type: application/json" -d '{}'
route_not_missing GET /users/me/contributor-secret
route_not_missing GET "/places/drafts?lat=48.9&lng=2.3&radius=3"
route_not_missing POST /users/me/places -H "Content-Type: application/json" -d '{}'
echo "Critical API routes registered"
