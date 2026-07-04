#!/usr/bin/env bash
# Mobile unit tests with expo-constants stubbed for Node (no react-native bundle).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

shopt -s globstar nullglob
mapfile -t test_files < <(compgen -G "src/**/*.test.ts" || true)

if [ "${#test_files[@]}" -eq 0 ]; then
  echo "No test files under src/**/*.test.ts"
  exit 0
fi

pnpm exec tsx --tsconfig tsconfig.test.json --test "${test_files[@]}"
