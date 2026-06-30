#!/usr/bin/env bash
# Apply D1 migrations in production (CI, manual deploy).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

max_attempts=3
attempt=1

while [ "${attempt}" -le "${max_attempts}" ]; do
  if pnpm --filter @freshy/db migrate:remote; then
    exit 0
  fi

  if [ "${attempt}" -eq "${max_attempts}" ]; then
    echo "ERROR: D1 migrations failed after ${max_attempts} attempts." >&2
    exit 1
  fi

  sleep_seconds=$((attempt * 5))
  echo "migrate:remote failed (attempt ${attempt}/${max_attempts}), retrying in ${sleep_seconds}s..." >&2
  sleep "${sleep_seconds}"
  attempt=$((attempt + 1))
done
