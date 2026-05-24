#!/usr/bin/env bash
# Per-package pointer. The canonical lane-1 key-rotation script lives at
# `scripts/rotate-etoro-keys.sh` in the repo root so a single
# implementation governs vocabulary, audit-log shape, PM2 targets, and
# the post-rotation verification. Delegate verbatim.
exec "$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)/scripts/rotate-etoro-keys.sh" "$@"
