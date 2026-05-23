#!/usr/bin/env bash
# Lane-7 internal-smoke input-validation proof driver.
#
# Verifies that internal-smoke.sh fails fast (exit 2 + FATAL line on stderr)
# on non-integer / out-of-range numeric inputs:
#   A. STALENESS_THRESHOLD_S=10m            → FATAL must-be-int
#   B. STALENESS_THRESHOLD_S=                → FATAL must-be-int (empty)
#   C. PRICE_SERVICE_PORT=99999              → FATAL out-of-range
#   D. STALENESS_THRESHOLD_S=0 (boundary)    → preflight passes
#
# This script is the "Red" half of TDD for task 0008 — it is expected to
# fail today (current script lets `10m` through and raises a raw bash
# arithmetic error mid-run, while still writing a misleading verdict).

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"

run_fatal() {
  local label="$1" expect_substr="$2"
  shift 2
  local err out rc
  err="$(mktemp)"; out="$(mktemp)"
  env "$@" REPORT=/tmp/proof-input-validation.md "$SMOKE" \
    >"$out" 2>"$err"
  rc=$?
  echo "--- case: $label ---"
  echo "exit code: $rc"
  echo "stderr:"
  cat "$err"
  if (( rc != 2 )); then
    echo "FAIL: expected exit 2, got $rc"
    rm -f "$err" "$out"
    return 1
  fi
  if ! grep -qF "$expect_substr" "$err"; then
    echo "FAIL: stderr missing literal: $expect_substr"
    rm -f "$err" "$out"
    return 1
  fi
  echo "PASS"
  rm -f "$err" "$out"
}

run_passes_preflight() {
  # Boundary case D — STALENESS_THRESHOLD_S=0 must NOT exit 2 at preflight.
  # We don't care about the final verdict here, only that we get past the
  # input-validation block. Bind probes to a port that won't answer so the
  # smoke completes quickly with verdict=RED (exit 1), proving the
  # preflight passed.
  local err out rc
  err="$(mktemp)"; out="$(mktemp)"
  STALENESS_THRESHOLD_S=0 \
  LANE7_BASE=http://127.0.0.1 \
  PRICE_SERVICE_PORT=49901 \
  ORACLE_SIGNER_PORT=49902 \
  HEDGE_ENGINE_PORT=49903 \
  STATUS_AGGREGATOR_PORT=49904 \
  REPORT=/tmp/proof-input-validation.md \
  "$SMOKE" >"$out" 2>"$err"
  rc=$?
  echo "--- case: D: STALENESS_THRESHOLD_S=0 (boundary) ---"
  echo "exit code: $rc"
  if (( rc == 2 )); then
    echo "FAIL: preflight rejected boundary value 0"
    cat "$err"
    rm -f "$err" "$out"
    return 1
  fi
  echo "PASS (preflight accepted; downstream rc=$rc)"
  rm -f "$err" "$out"
}

run_fatal "A: STALENESS_THRESHOLD_S=10m" \
  "FATAL: STALENESS_THRESHOLD_S='10m' must be a non-negative integer" \
  STALENESS_THRESHOLD_S=10m || exit 1

run_fatal "B: STALENESS_THRESHOLD_S=''" \
  "FATAL: STALENESS_THRESHOLD_S='' must be a non-negative integer" \
  STALENESS_THRESHOLD_S='' || exit 1

run_fatal "C: PRICE_SERVICE_PORT=99999" \
  "FATAL: PRICE_SERVICE_PORT='99999' out of range" \
  PRICE_SERVICE_PORT=99999 || exit 1

run_passes_preflight || exit 1

echo
echo "ALL CASES PASS"
