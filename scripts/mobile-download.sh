#!/usr/bin/env bash
# Download the latest EAS build artifact for sideloading on a device.
# Usage: mobile-download.sh android|ios [output-tag]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLATFORM="${1:?Usage: mobile-download.sh android|ios [tag]}"
TAG="${2:-latest}"
OUT_DIR="${ROOT_DIR}/dist/mobile"

if [ "${PLATFORM}" != "android" ] && [ "${PLATFORM}" != "ios" ]; then
  echo "ERROR: platform must be android or ios" >&2
  exit 1
fi

mkdir -p "${OUT_DIR}"

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

cd "${ROOT_DIR}/apps/mobile"

EXT="apk"
if [ "${PLATFORM}" = "ios" ]; then
  EXT="ipa"
fi

OUTPUT="${OUT_DIR}/freshy-${TAG}-${PLATFORM}.${EXT}"

pnpm exec eas build:download --platform "${PLATFORM}" --latest --output "${OUTPUT}"

echo "Saved ${OUTPUT}"
