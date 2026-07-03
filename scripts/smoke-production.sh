#!/usr/bin/env bash
# Production smoke test: API Worker + Cloudflare Pages.
set -euo pipefail

API_URL="${API_URL:-https://freshy-api.alexandrelheinen.workers.dev}"
WEB_URL="${WEB_URL:-https://freshy-25e.pages.dev}"
R2_PUBLIC_URL="${R2_PUBLIC_URL:-}"
MAX_ATTEMPTS="${SMOKE_MAX_ATTEMPTS:-30}"
SLEEP_SECONDS="${SMOKE_SLEEP_SECONDS:-20}"

PILOT_LAT="48.9042"
PILOT_LNG="2.3064"

step() { echo "==> $1"; }
fail() { echo "ERROR: $1" >&2; exit 1; }

curl_ok() {
  local url="$1"
  curl -fsS --max-time 30 "$url"
}

retry() {
  local label="$1"
  shift
  local attempt=1
  while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
    if "$@"; then
      echo "OK: ${label} (attempt ${attempt})"
      return 0
    fi
    echo "Retry ${attempt}/${MAX_ATTEMPTS}: ${label} not ready yet..."
    attempt=$((attempt + 1))
    sleep "$SLEEP_SECONDS"
  done
  fail "${label} failed after ${MAX_ATTEMPTS} attempts"
}

check_api_health() {
  local body
  body="$(curl_ok "${API_URL}/health")"
  echo "$body" | grep -q '"status":"ok"' || return 1
  echo "$body" | grep -q '"service":"freshy-api-worker"' || return 1
  echo "$body" | grep -q '"db":"ok"' || return 1
}

check_api_places() {
  local body count
  body="$(curl_ok "${API_URL}/places?lat=${PILOT_LAT}&lng=${PILOT_LNG}&radius=3")"
  count="$(printf '%s' "$body" | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(String((j.data||[]).length));")"
  [ "${count}" -gt 0 ] || return 1
  echo "Places returned: ${count}"
}

check_api_categories() {
  local body
  body="$(curl_ok "${API_URL}/places/meta/categories")"
  echo "$body" | grep -q '"categories"' || return 1
}

route_not_missing() {
  local method="$1"
  local path="$2"
  local expected_status="$3"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 -X "${method}" "${API_URL}${path}" \
    ${4:+-H "$4"} \
    ${5:+-d "$5"})"
  if [ "$code" = "404" ]; then
    echo "Route missing: ${method} ${path} (got 404)"
    return 1
  fi
  [ "$code" = "$expected_status" ] || {
    echo "Unexpected status for ${method} ${path}: expected ${expected_status}, got ${code}"
    return 1
  }
}

check_contributor_secret_route() {
  route_not_missing GET /users/me/contributor-secret 401
}

check_contributions_route() {
  route_not_missing POST /contributions/places 400 "Content-Type: application/json" '{}'
}

check_authed_places_route() {
  route_not_missing POST /users/me/places 401 "Content-Type: application/json" '{}'
}

check_web_page() {
  local path="$1"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "${WEB_URL}${path}")"
  [ "$code" = "200" ] || return 1
}

image_url_ok() {
  local url="$1"
  local code content_type
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "$url")"
  [ "$code" = "200" ] || return 1
  content_type="$(curl -sS -I --max-time 30 "$url" | tr -d '\r' | awk -F': ' 'tolower($1)=="content-type" {print tolower($2); exit}')"
  echo "$content_type" | grep -q 'image/' || return 1
}

check_default_place_photo() {
  local body api_photo_url url
  body="$(curl_ok "${API_URL}/places?lat=${PILOT_LAT}&lng=${PILOT_LNG}&radius=3")"
  api_photo_url="$(printf '%s' "$body" | node -e "
    const j = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    const place = (j.data || []).find((p) => p.photoUrl);
    process.stdout.write(place?.photoUrl || '');
  ")"

  for url in \
    "$api_photo_url" \
    "${WEB_URL}/place-defaults/default-cafe.png" \
    ${R2_PUBLIC_URL:+"${R2_PUBLIC_URL%/}/places/defaults/default-cafe.png"}; do
    [ -n "$url" ] || continue
    if image_url_ok "$url"; then
      echo "Default place photo OK: ${url}"
      return 0
    fi
    echo "Not ready: ${url}"
  done
  return 1
}

check_r2_default_photo() {
  [ -n "$R2_PUBLIC_URL" ] || return 0
  image_url_ok "${R2_PUBLIC_URL%/}/places/defaults/default-cafe.png"
}

step "API health (${API_URL})"
retry "API /health" check_api_health

step "API places near pilot city"
retry "API /places" check_api_places

step "API category metadata"
retry "API /places/meta/categories" check_api_categories

step "Contributor and place submission routes"
retry "API /users/me/contributor-secret" check_contributor_secret_route
retry "API /contributions/places" check_contributions_route
retry "API /users/me/places" check_authed_places_route

step "Default place photos"
retry "default place photo" check_default_place_photo

if [ -n "$R2_PUBLIC_URL" ]; then
  step "R2 default place photos (optional)"
  if check_r2_default_photo; then
    echo "R2 default photo OK"
  else
    echo "::warning::R2 default photo not reachable yet. Run sync-place-defaults workflow or check bucket public access."
  fi
fi

step "Web app pages (${WEB_URL})"
retry "Web /explore" check_web_page "/explore"
retry "Web /cooling" check_web_page "/cooling"
retry "Web dynamic place detail" check_web_page "/places/demo-place"

echo ""
echo "Production smoke test passed."
