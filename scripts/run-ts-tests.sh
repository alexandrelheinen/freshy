#!/usr/bin/env bash
# Run co-located tsx tests with portable glob expansion (Linux CI + local dev).
set -euo pipefail

SEARCH_ROOT="${1:-src}"

shopt -s globstar nullglob
mapfile -t test_files < <(compgen -G "${SEARCH_ROOT}/**/*.test.ts" || true)

if [ "${#test_files[@]}" -eq 0 ]; then
  echo "No test files under ${SEARCH_ROOT}/**/*.test.ts"
  exit 0
fi

pnpm exec tsx --test "${test_files[@]}"
