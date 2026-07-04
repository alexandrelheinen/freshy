#!/usr/bin/env bash
# Build Freshy mobile shell (WebView wrapper) with EAS.
# Usage: mobile-build.sh [android|ios|all] [profile]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLATFORM="${1:-all}"
PROFILE="${2:-release}"

export EXPO_PUBLIC_WEB_APP_URL="${EXPO_PUBLIC_WEB_APP_URL:-https://freshy-25e.pages.dev}"

if [ -f "${ROOT_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
fi

if [ -f "${ROOT_DIR}/apps/mobile/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/apps/mobile/.env"
  set +a
fi

if [ -z "${EAS_PROJECT_ID:-}" ]; then
  echo "ERROR: EAS_PROJECT_ID is not set. Add it to .env after running eas init." >&2
  exit 1
fi

cd "${ROOT_DIR}/apps/mobile"

if ! pnpm exec eas --version >/dev/null 2>&1; then
  echo "ERROR: eas-cli is missing. Run pnpm install from the repository root." >&2
  exit 1
fi

echo "Building Freshy mobile (${PLATFORM}, profile=${PROFILE})"
echo "Web app URL: ${EXPO_PUBLIC_WEB_APP_URL}"

BUILD_ARGS=(--platform "${PLATFORM}" --profile "${PROFILE}" --wait)
if [ "${CI:-}" = "true" ] || [ "${MOBILE_BUILD_NON_INTERACTIVE:-}" = "1" ]; then
  BUILD_ARGS+=(--non-interactive)
else
  echo "Interactive mode: first Android or iOS build may prompt for signing credentials."
  echo "Choose \"Let Expo handle it\" when asked. Later builds can use CI (--non-interactive)."
fi

pnpm exec eas build "${BUILD_ARGS[@]}"

echo "Build finished. Download install files with:"
echo "  pnpm mobile:download:android"
echo "  pnpm mobile:download:ios"
