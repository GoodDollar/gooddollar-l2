#!/bin/bash
#
# Installs npm dependencies in the four lane-1 backend packages.
#
# Why this exists: the root `package.json` declares `workspaces:
# ["frontend", "sdk"]` and does NOT include the backend packages, so a
# root `npm install` does NOT hydrate them. Without this script, a fresh
# checkout has no `node_modules` in any of the lane-1 backend packages
# and `npm test` fails with `jest: not found`.
#
# Idempotent: a package whose `node_modules/.bin/jest` already exists is
# skipped. Adding a fifth lane-1 package later requires editing the
# `PKGS` array below.
#
# POSIX-bash; tested on macOS bash 3.2 and Linux bash 5+.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

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
    printf '[skip] %s — jest already present in node_modules\n' "$pkg"
    continue
  fi
  printf '[install] %s\n' "$pkg"
  (cd "$pkg" && npm install)
done
