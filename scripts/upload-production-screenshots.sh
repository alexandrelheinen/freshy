#!/usr/bin/env bash
# Upload production page screenshots to Cloudflare R2 (ci/main/latest/ and ci/main/<sha>/).
set -euo pipefail

SCREENSHOTS_DIR="${1:-screenshots}"
GIT_SHA="${2:-unknown}"

ACCOUNT_ID="${R2_ACCOUNT_ID:-}"
ACCESS_KEY="${R2_ACCESS_KEY_ID:-}"
SECRET_KEY="${R2_SECRET_ACCESS_KEY:-}"
BUCKET="${R2_BUCKET_NAME:-}"
PUBLIC_URL="${R2_PUBLIC_URL:-}"

PAGES=(
  "explore:Freshy Map (Explore)"
  "cooling:Categories (Cooling)"
  "place-detail:Place Details"
  "profile:My Profile"
)

r2_configured() {
  [ -n "${ACCOUNT_ID}" ] && [ -n "${ACCESS_KEY}" ] && [ -n "${SECRET_KEY}" ] && [ -n "${BUCKET}" ] && [ -n "${PUBLIC_URL}" ]
}

if ! r2_configured; then
  echo "::warning::R2 not configured — screenshots saved as workflow artifacts only."
  exit 0
fi

ENDPOINT="https://${ACCOUNT_ID}.r2.cloudflarestorage.com"
export AWS_ACCESS_KEY_ID="${ACCESS_KEY}"
export AWS_SECRET_ACCESS_KEY="${SECRET_KEY}"
export AWS_DEFAULT_REGION="auto"

upload_dest() {
  local dest_prefix="$1"
  echo "Uploading screenshots to R2 bucket ${BUCKET}/${dest_prefix}/"
  for entry in "${PAGES[@]}"; do
    file="${entry%%:*}"
    src="${SCREENSHOTS_DIR}/${file}.png"
    if [ -f "${src}" ]; then
      dest="${dest_prefix}/${file}.png"
      aws s3 cp "${src}" "s3://${BUCKET}/${dest}" \
        --endpoint-url "${ENDPOINT}" \
        --content-type "image/png" \
        --cache-control "public, max-age=3600" \
        --quiet
      echo "${PUBLIC_URL%/}/${dest}"
    fi
  done
}

SHORT_SHA="${GIT_SHA:0:7}"
upload_dest "ci/main/latest"
upload_dest "ci/main/${SHORT_SHA}"

echo "Production screenshots published under ${PUBLIC_URL%/}/ci/main/latest/"
