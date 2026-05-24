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
# Idempotent by default — skips a package whose `dist/index.js` exists
# AND is newer than every file under `src/` and `tsconfig.json`. After a
# `git pull` (or any local source edit), the freshness probe trips and
# the package rebuilds automatically. Pass `--force` (or set `FORCE=1`)
# to rebuild every package regardless of staleness.
#
# POSIX-bash; tested on macOS bash 3.2 and Linux bash 5+.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# shellcheck source=./_lane1_lib.sh
. "$ROOT/scripts/_lane1_lib.sh"

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
  if [ "$FORCE" != "1" ] && ! needs_rebuild "$pkg"; then
    printf '[skip] %s — dist is fresh (pass --force to rebuild)\n' "$pkg"
    continue
  fi
  if [ "$FORCE" = "1" ]; then
    printf '[build] %s (--force)\n' "$pkg"
  else
    printf '[build] %s (%s)\n' "$pkg" "$(rebuild_reason "$pkg")"
  fi
  (cd "$pkg" && npm run build)
done

printf '[ok] lane-1 build complete\n'
