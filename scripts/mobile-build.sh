#!/usr/bin/env bash
# Build Freshy mobile shell (WebView wrapper) with EAS.
# Usage: mobile-build.sh [android|ios|all] [profile]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLATFORM="${1:-all}"
PROFILE="${2:-release}"

export EXPO_PUBLIC_WEB_APP_URL="${EXPO_PUBLIC_WEB_APP_URL:-https://freshy-25e.pages.dev}"

cd "${ROOT_DIR}/apps/mobile"

if ! pnpm exec eas --version >/dev/null 2>&1; then
  echo "ERROR: eas-cli is missing. Run pnpm install from the repository root." >&2
  exit 1
fi

echo "Building Freshy mobile (${PLATFORM}, profile=${PROFILE})"
echo "Web app URL: ${EXPO_PUBLIC_WEB_APP_URL}"

pnpm exec eas build --platform "${PLATFORM}" --profile "${PROFILE}" --non-interactive --wait

echo "Build finished. Download install files with:"
echo "  pnpm mobile:download:android"
echo "  pnpm mobile:download:ios"
