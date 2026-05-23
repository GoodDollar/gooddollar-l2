#!/bin/bash
#
# Pin the freshness contract for `scripts/_lane1_lib.sh::needs_rebuild`.
# Builds a synthetic `<pkg>/src + tsconfig.json + dist/index.js` layout
# in a tmp sandbox, walks each documented scenario, and asserts that
# the helper returns the expected exit code (0 = rebuild, 1 = skip).
#
# Run via: bash scripts/__tests__/staleness.test.sh
# Wired into scripts/test-lane1-backend.sh after the per-package suite.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# shellcheck source=../_lane1_lib.sh
. "$ROOT/scripts/_lane1_lib.sh"

SANDBOX="$(mktemp -d)"
trap 'rm -rf "$SANDBOX"' EXIT

PASS=0
FAIL=0

assert_rebuild() {
  local label="$1" pkg="$2"
  if needs_rebuild "$pkg"; then
    printf '[pass] %s\n' "$label"
    PASS=$((PASS + 1))
  else
    printf '[fail] %s — expected rebuild, got skip\n' "$label" >&2
    FAIL=$((FAIL + 1))
  fi
}

assert_skip() {
  local label="$1" pkg="$2"
  if needs_rebuild "$pkg"; then
    printf '[fail] %s — expected skip, got rebuild\n' "$label" >&2
    FAIL=$((FAIL + 1))
  else
    printf '[pass] %s\n' "$label"
    PASS=$((PASS + 1))
  fi
}

# Build a minimal package layout: src/index.ts + tsconfig.json + dist/index.js
PKG="$SANDBOX/pkg-a"
mkdir -p "$PKG/src"
echo 'export const a = 1;' > "$PKG/src/index.ts"
echo '{}' > "$PKG/tsconfig.json"

# Scenario 1: dist missing → rebuild.
assert_rebuild 'dist missing → rebuild' "$PKG"

# Scenario 2: dist exists and is the newest file → skip.
mkdir -p "$PKG/dist"
echo '"use strict";' > "$PKG/dist/index.js"
# Bump dist mtime past src by one second to defeat low-resolution
# filesystems (HFS+, FAT, some NFS mounts).
sleep 1
touch "$PKG/dist/index.js"
assert_skip 'fresh dist → skip' "$PKG"

# Scenario 3: touch src/index.ts after dist → rebuild.
sleep 1
touch "$PKG/src/index.ts"
assert_rebuild 'src newer than dist → rebuild' "$PKG"

# Scenario 4: rebuild dist again, then touch tsconfig.json → rebuild.
sleep 1
touch "$PKG/dist/index.js"
assert_skip 'fresh dist after src rebuild → skip' "$PKG"
sleep 1
touch "$PKG/tsconfig.json"
assert_rebuild 'tsconfig newer than dist → rebuild' "$PKG"

# Scenario 5: nested src file → rebuild.
sleep 1
touch "$PKG/dist/index.js"
mkdir -p "$PKG/src/sub"
echo 'export {};' > "$PKG/src/sub/extra.ts"
assert_rebuild 'nested src file newer than dist → rebuild' "$PKG"

# Scenario 6: rebuild_reason output.
sleep 1
touch "$PKG/dist/index.js"
sleep 1
touch "$PKG/src/index.ts"
reason="$(rebuild_reason "$PKG")"
if [ "$reason" = 'src newer than dist' ]; then
  printf '[pass] rebuild_reason: src newer than dist\n'
  PASS=$((PASS + 1))
else
  printf '[fail] rebuild_reason — expected "src newer than dist", got %q\n' "$reason" >&2
  FAIL=$((FAIL + 1))
fi
rm "$PKG/dist/index.js"
reason="$(rebuild_reason "$PKG")"
if [ "$reason" = 'dist missing' ]; then
  printf '[pass] rebuild_reason: dist missing\n'
  PASS=$((PASS + 1))
else
  printf '[fail] rebuild_reason — expected "dist missing", got %q\n' "$reason" >&2
  FAIL=$((FAIL + 1))
fi

printf '\n[summary] passed=%d failed=%d\n' "$PASS" "$FAIL"
if [ "$FAIL" -ne 0 ]; then
  exit 1
fi
