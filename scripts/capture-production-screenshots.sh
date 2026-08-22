#!/usr/bin/env bash
# Wait for production web, then capture mobile screenshots with Playwright.
set -euo pipefail

WEB_URL="${WEB_URL:-https://getfreshy.pages.dev}"
SCREENSHOTS_DIR="${SCREENSHOTS_DIR:-screenshots}"
MAX_ATTEMPTS="${SCREENSHOT_MAX_ATTEMPTS:-30}"
SLEEP_SECONDS="${SCREENSHOT_SLEEP_SECONDS:-20}"

step() { echo "==> $1"; }

step "Waiting for production web (${WEB_URL})"
attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "${WEB_URL}/explore" || true)"
  if [ "$code" = "200" ]; then
    echo "Production web ready (attempt ${attempt})"
    break
  fi
  echo "Retry ${attempt}/${MAX_ATTEMPTS}: /explore returned ${code:-000}"
  attempt=$((attempt + 1))
  sleep "$SLEEP_SECONDS"
done

if [ "$attempt" -gt "$MAX_ATTEMPTS" ]; then
  echo "ERROR: production web not ready" >&2
  exit 1
fi

mkdir -p "${SCREENSHOTS_DIR}"
step "Capturing screenshots"
PLAYWRIGHT_BASE_URL="${WEB_URL}" pnpm --filter @freshy/web screenshots

step "Screenshots saved"
ls -la "${SCREENSHOTS_DIR}/"
