#!/usr/bin/env bash
# Verify web build without prebuilt @freshy/config dist (Cloudflare Pages parity).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

step() { echo "==> $1"; }

step "Remove prebuilt config dist (simulates fresh Cloudflare install)"
rm -rf packages/config/dist

step "Build web (Cloudflare Pages: pnpm --filter @freshy/web build)"
pnpm --filter @freshy/web build

echo "Web build OK (Cloudflare parity)"
