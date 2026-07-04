#!/usr/bin/env bash
# Download the latest EAS build artifact for sideloading on a device.
# Usage: mobile-download.sh android|ios [output-tag] [build-id]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE_DIR="${ROOT_DIR}/apps/mobile"
PLATFORM="${1:?Usage: mobile-download.sh android|ios [tag] [build-id]}"
TAG="${2:-latest}"
BUILD_ID="${3:-${EAS_BUILD_ID:-}}"
DEFAULT_EAS_PROJECT_ID="ff3b74f8-863b-41cd-a83a-1c9f37a1dd42"

if [ "${PLATFORM}" != "android" ] && [ "${PLATFORM}" != "ios" ]; then
  echo "ERROR: platform must be android or ios" >&2
  exit 1
fi

OUT_DIR="${ROOT_DIR}/dist/mobile"
mkdir -p "${OUT_DIR}"

if [ -f "${ROOT_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
fi

if [ -f "${MOBILE_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${MOBILE_DIR}/.env"
  set +a
fi

export EAS_PROJECT_ID="${EAS_PROJECT_ID:-${DEFAULT_EAS_PROJECT_ID}}"
export EXPO_TOKEN="${EXPO_TOKEN:-}"
export NO_UPDATE_NOTIFIER=1
export npm_config_update_notifier=false

EXT="apk"
if [ "${PLATFORM}" = "ios" ]; then
  EXT="ipa"
fi

OUTPUT="${OUT_DIR}/freshy-${TAG}-${PLATFORM}.${EXT}"

parse_eas_json() {
  node -e "
    const raw = require('fs').readFileSync(0, 'utf8');
    const start = raw.search(/[\[{]/);
    if (start === -1) {
      process.stderr.write(raw.trim() ? raw : 'No JSON found in EAS output.\n');
      process.exit(1);
    }
    const data = JSON.parse(raw.slice(start));
    ${1}
  "
}

run_eas() {
  pnpm --dir "${MOBILE_DIR}" exec eas "$@"
}

TMP_FILES=()
cleanup() {
  if [ "${#TMP_FILES[@]}" -gt 0 ]; then
    rm -f "${TMP_FILES[@]}"
  fi
}
trap cleanup EXIT

if [ -z "${BUILD_ID}" ]; then
  echo "Finding latest finished ${PLATFORM} release build on EAS..."
  LIST_JSON="$(mktemp)"
  TMP_FILES+=("${LIST_JSON}")
  if ! run_eas build:list \
    --platform "${PLATFORM}" \
    --status finished \
    --build-profile release \
    --limit 1 \
    --json \
    --non-interactive >"${LIST_JSON}" 2>&1; then
    cat "${LIST_JSON}" >&2
    echo "ERROR: eas build:list failed. Check EXPO_TOKEN or run 'pnpm --dir apps/mobile exec eas login'." >&2
    exit 1
  fi
  BUILD_ID="$(parse_eas_json "if (!Array.isArray(data) || !data[0]?.id) process.exit(1); process.stdout.write(data[0].id);" <"${LIST_JSON}")"
fi

if [ -z "${BUILD_ID}" ]; then
  echo "ERROR: No finished ${PLATFORM} release build found on EAS." >&2
  exit 1
fi

echo "Downloading build ${BUILD_ID}..."

VIEW_JSON="$(mktemp)"
TMP_FILES+=("${VIEW_JSON}")
if ! run_eas build:view "${BUILD_ID}" --json >"${VIEW_JSON}" 2>&1; then
  cat "${VIEW_JSON}" >&2
  echo "ERROR: eas build:view failed." >&2
  exit 1
fi

ARTIFACT_URL="$(parse_eas_json "
  const url = data.artifacts?.buildUrl ?? data.artifacts?.applicationArchiveUrl;
  if (!url) process.exit(1);
  process.stdout.write(url);
" <"${VIEW_JSON}")"

curl -fsSL "${ARTIFACT_URL}" -o "${OUTPUT}"

echo "Saved ${OUTPUT}"
