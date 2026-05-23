#!/bin/bash
#
# Builds the four lane-1 backend packages (TypeScript → dist/).
#
# Companion to `scripts/install-lane1-backend.sh`: install once, then
# rebuild repeatedly as you edit source. `npm run build:lane1` from the
# repo root exposes this.
#
# Order matters: `etoro-client` is built first because its `dist/` is the
# resolution target for the three consumer packages' `file:` deps.
#
# Idempotent by default — skips a package whose `dist/index.js` already
# exists. Pass `--force` (or set `FORCE=1`) to rebuild every package
# regardless. The install script also runs `npm run build` for any
# package missing `dist/index.js`, so this script is purely for the
# iterative dev loop.
#
# POSIX-bash; tested on macOS bash 3.2 and Linux bash 5+.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FORCE="${FORCE:-0}"
for arg in "$@"; do
  if [ "$arg" = "--force" ] || [ "$arg" = "-f" ]; then
    FORCE=1
  fi
done

PKGS=(
  "backend/etoro-client"
  "backend/price-service"
  "backend/oracle-signer"
  "backend/hedge-engine"
)

for pkg in "${PKGS[@]}"; do
  if [ ! -d "$pkg" ]; then
    printf '[skip] %s — directory missing\n' "$pkg"
    continue
  fi
  if [ "$FORCE" != "1" ] && [ -e "$pkg/dist/index.js" ]; then
    printf '[skip] %s — dist/index.js already present (pass --force to rebuild)\n' "$pkg"
    continue
  fi
  printf '[build] %s\n' "$pkg"
  (cd "$pkg" && npm run build)
done

printf '[ok] lane-1 build complete\n'
