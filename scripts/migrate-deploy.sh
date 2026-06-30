#!/usr/bin/env bash
# Apply Prisma migrations in production (Render start, CI).
# Prefer DIRECT_DATABASE_URL: Neon pooler hosts can time out on advisory locks (P1002).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

if [ -n "${DIRECT_DATABASE_URL:-}" ]; then
  export DATABASE_URL="${DIRECT_DATABASE_URL}"
elif [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL (or DIRECT_DATABASE_URL) is not set." >&2
  exit 1
fi

export PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT="${PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT:-60000}"

max_attempts=3
attempt=1

while [ "${attempt}" -le "${max_attempts}" ]; do
  if pnpm --filter @freshy/db migrate:deploy; then
    exit 0
  fi

  if [ "${attempt}" -eq "${max_attempts}" ]; then
    echo "ERROR: prisma migrate deploy failed after ${max_attempts} attempts." >&2
    exit 1
  fi

  sleep_seconds=$((attempt * 5))
  echo "migrate:deploy failed (attempt ${attempt}/${max_attempts}), retrying in ${sleep_seconds}s..." >&2
  sleep "${sleep_seconds}"
  attempt=$((attempt + 1))
done
