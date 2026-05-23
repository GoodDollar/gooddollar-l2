#!/usr/bin/env bash
# Lane-7 internal-smoke tool-preflight proof driver.
#
# Verifies that internal-smoke.sh fails fast (exit 2 + FATAL line on stderr)
# when a load-bearing tool (node/curl/awk/date) is missing from PATH.
#
# Cases:
#   A. PATH=/nonexistent — every tool missing, FATAL on the first one
#      the loop checks (`node`).
#   B. shimmed PATH that has node but masks curl  → FATAL: missing required tool: curl
#   C. shimmed PATH that has node + curl but masks awk → FATAL: missing required tool: awk
#   D. shimmed PATH that has node + curl + awk but masks date → FATAL: missing required tool: date
#
# This script is the "Red" half of TDD for task 0009 — it is expected to
# fail on the current `internal-smoke.sh` (which only preflights `node`).

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"

if [[ ! -x "$SMOKE" ]]; then
  echo "FATAL: $SMOKE not found / not executable" >&2
  exit 2
fi

BASH_BIN="$(command -v bash)"
[[ -x "$BASH_BIN" ]] || { echo "FATAL: bash not on PATH" >&2; exit 2; }

shim_dir() {
  # Build a tmpdir that exposes only the tools listed.
  local tmp
  tmp="$(mktemp -d)"
  for tool in "$@"; do
    local real
    real="$(command -v "$tool" 2>/dev/null)"
    [[ -n "$real" ]] || { echo "FATAL: real $tool not found on host" >&2; rm -rf "$tmp"; exit 2; }
    ln -s "$real" "$tmp/$tool"
  done
  echo "$tmp"
}

run_case() {
  local label="$1" path="$2" expect_substr="$3"
  local out err rc
  out="$(mktemp)"
  err="$(mktemp)"
  # Invoke bash directly so the test does not require bash to be present
  # on the (intentionally restricted) PATH. The script's `command -v`
  # checks honour the inherited PATH, which is what we want to exercise.
  PATH="$path" "$BASH_BIN" "$SMOKE" >"$out" 2>"$err"
  rc=$?
  echo "--- case: $label (PATH=$path) ---"
  echo "exit code: $rc"
  echo "stderr:"
  cat "$err"
  if (( rc != 2 )); then
    echo "FAIL: expected exit 2, got $rc"
    rm -f "$out" "$err"
    return 1
  fi
  if ! grep -qF "$expect_substr" "$err"; then
    echo "FAIL: stderr missing literal: $expect_substr"
    rm -f "$out" "$err"
    return 1
  fi
  echo "PASS"
  rm -f "$out" "$err"
  return 0
}

cleanup_dirs=()
trap 'for d in "${cleanup_dirs[@]:-}"; do [[ -n "$d" ]] && rm -rf "$d"; done' EXIT

run_case "A: empty PATH"  "/nonexistent" \
  "FATAL: missing required tool: node" || exit 1

dir_no_curl="$(shim_dir node awk date)"
cleanup_dirs+=("$dir_no_curl")
run_case "B: no curl" "$dir_no_curl" \
  "FATAL: missing required tool: curl" || exit 1

dir_no_awk="$(shim_dir node curl date)"
cleanup_dirs+=("$dir_no_awk")
run_case "C: no awk" "$dir_no_awk" \
  "FATAL: missing required tool: awk" || exit 1

dir_no_date="$(shim_dir node curl awk)"
cleanup_dirs+=("$dir_no_date")
run_case "D: no date" "$dir_no_date" \
  "FATAL: missing required tool: date" || exit 1

echo
echo "ALL CASES PASS"
