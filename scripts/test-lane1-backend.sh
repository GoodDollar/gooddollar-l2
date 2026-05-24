#!/bin/bash
#
# Runs the unit test suite for each of the four lane-1 backend packages
# in order. Halts on first failure with the failing package's `npm test`
# exit code. Each output line is prefixed `[<pkg>]` so CI logs are easy
# to scan.
#
# Adding a fifth lane-1 package later requires editing the `PKGS` array.
# Pair with `scripts/install-lane1-backend.sh` to hydrate `node_modules`
# from a cold checkout.
#
# POSIX-bash; uses `sed` (in POSIX) for line prefixing and a `PIPESTATUS`
# check so that `set -e` correctly captures the upstream `npm test`
# failure even though we pipe through `sed`.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PKGS=(
  "backend/etoro-client"
  "backend/price-service"
  "backend/oracle-signer"
  "backend/hedge-engine"
)

printf '==== pm2 ecosystem ====\n'
node scripts/check-pm2-ecosystem.js

for pkg in "${PKGS[@]}"; do
  if [ ! -d "$pkg" ]; then
    printf '[skip] %s — directory missing\n' "$pkg"
    continue
  fi
  printf '==== %s ====\n' "$pkg"
  set +e
  (cd "$pkg" && npm test 2>&1) | sed -e "s|^|[$pkg] |"
  pkg_status=${PIPESTATUS[0]}
  set -e
  if [ "$pkg_status" -ne 0 ]; then
    printf '[fail] %s exited %d — halting\n' "$pkg" "$pkg_status"
    exit "$pkg_status"
  fi
done

printf '[ok] all lane-1 backend suites passed\n'
