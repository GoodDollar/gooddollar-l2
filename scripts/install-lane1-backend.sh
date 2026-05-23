#!/bin/bash
#
# Installs npm dependencies AND builds the four lane-1 backend packages.
#
# Why this exists:
#   1. The root `package.json` declares `workspaces: ["frontend", "sdk"]`
#      and does NOT include the backend packages, so a root `npm install`
#      does NOT hydrate them. Without this script, a fresh checkout has no
#      `node_modules` in any of the lane-1 backend packages and `npm test`
#      fails with `jest: not found`.
#   2. The operator runbooks (`docs/runbooks/lane1-*.md`) lead with
#      `(cd backend/<pkg> && npm start)`. `npm start` runs
#      `node dist/index.js` and `dist/` is gitignored — so without a build
#      step the runbook's Step 1 fails with `Cannot find module
#      './dist/index.js'` on every fresh clone.
#
# This script does both in one pass: install deps, then build TypeScript
# for each package. The companion `scripts/build-lane1-backend.sh` exposes
# the build-only loop for iterative development (edit source → rebuild
# without re-installing).
#
# Idempotency:
#   - `npm install` is skipped when `node_modules/.bin/jest` already
#     exists (cheap proxy for a hydrated install).
#   - `npm run build` is skipped only when `dist/index.js` exists AND is
#     newer than every file under `src/` and `tsconfig.json`. This means
#     a `git pull` that updates source files automatically triggers a
#     rebuild on the next install run — no more silent stale-bytecode
#     boots after pulling lane updates.
#   - Pass `--force` / `-f` (or `FORCE=1`) to rebuild every package
#     regardless of dist freshness.
# Adding a fifth lane-1 package later requires editing the `PKGS` array
# below.
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

# Order matters: etoro-client first because its `dist/` is the resolution
# target for the three consumer packages' `file:` dependencies. The three
# consumers themselves have no inter-package build order.
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
  if [ -e "$pkg/node_modules/.bin/jest" ]; then
    printf '[skip-install] %s — jest already present in node_modules\n' "$pkg"
  else
    printf '[install] %s\n' "$pkg"
    (cd "$pkg" && npm install)
  fi
  if [ "$FORCE" = "1" ]; then
    printf '[build] %s (--force)\n' "$pkg"
    (cd "$pkg" && npm run build)
  elif needs_rebuild "$pkg"; then
    printf '[build] %s (%s)\n' "$pkg" "$(rebuild_reason "$pkg")"
    (cd "$pkg" && npm run build)
  else
    printf '[skip-build] %s — dist is fresh\n' "$pkg"
  fi
done
