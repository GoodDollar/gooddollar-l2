#!/bin/bash
#
# Shared helpers for scripts/install-lane1-backend.sh and
# scripts/build-lane1-backend.sh.
#
# Source via:
#   # shellcheck source=./_lane1_lib.sh
#   . "$(dirname "${BASH_SOURCE[0]}")/_lane1_lib.sh"

# needs_rebuild PKG_DIR
# Decides whether a lane-1 backend package needs `npm run build` to be
# re-run. Returns 0 (rebuild) when:
#   - `<PKG>/dist/index.js` is missing, or
#   - any file under `<PKG>/src` or `<PKG>/tsconfig.json` is newer than
#     `<PKG>/dist/index.js` (i.e. source has been edited or pulled
#     since the last build).
# Returns 1 (skip) otherwise.
#
# Uses `find -newer ... -print -quit` so the scan exits at the first
# stale file — cheap on large trees and portable across GNU/BSD find.
needs_rebuild() {
  local pkg="$1"
  if [ ! -e "$pkg/dist/index.js" ]; then
    return 0
  fi
  local newer
  newer="$(find "$pkg/src" "$pkg/tsconfig.json" \
    -newer "$pkg/dist/index.js" \
    -print -quit 2>/dev/null)"
  if [ -n "$newer" ]; then
    return 0
  fi
  return 1
}

# rebuild_reason PKG_DIR
# Echoes a short human-readable reason for a rebuild — `dist missing`
# when there is no compiled entry point, `src newer than dist`
# otherwise. Callers print this in `[build] <pkg> (<reason>)` log
# lines so operators can tell why a rebuild fired.
rebuild_reason() {
  local pkg="$1"
  if [ ! -e "$pkg/dist/index.js" ]; then
    printf 'dist missing'
  else
    printf 'src newer than dist'
  fi
}
