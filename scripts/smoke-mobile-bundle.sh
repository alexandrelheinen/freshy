#!/usr/bin/env bash
# Verify Android Metro bundle (EAS Bundle JavaScript phase parity).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}/apps/mobile"

echo "==> Bundle Android JS (expo export:embed, release)"
pnpm exec expo export:embed --eager --platform android --dev false

echo "Mobile Android bundle OK (EAS parity)"
