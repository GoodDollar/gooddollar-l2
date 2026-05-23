#!/usr/bin/env bash
# Lane-7 internal-smoke malformed-URL proof driver.
#
# Verifies that internal-smoke.sh fails fast (exit 2 + FATAL line on
# stderr) when a default URL ends up with a syntactically invalid form
# — e.g. when an operator passes `LANE7_BASE=http://127.0.0.1:9999`
# (host:port instead of host-only) and the script's naive default
# concatenation produces `http://127.0.0.1:9999:4000/health` (two colons).
#
# Cases:
#   A. LANE7_BASE=http://127.0.0.1:9999 — produces 4 malformed URLs;
#      smoke must exit 2 with `FATAL: malformed probe URL`.
#   B. PRICE_SERVICE_URL=http://example.com/  (valid override) plus the
#      same bad LANE7_BASE for the other three — smoke STILL exits 2
#      because the unspecified URLs are malformed.
#   C. All four `*_URL` envs explicitly set to valid URLs — smoke does
#      NOT exit at preflight (proceeds to probe; expected verdict RED
#      because the URLs do not answer).
#
# This script is the "Red" half of TDD for task 0006 — today the smoke
# emits "BLOCKER: <svc> unreachable at http://127.0.0.1:9999:4000/health"
# instead of FATAL, leaving the operator chasing a non-existent outage.

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"

run_fatal() {
  local label="$1" expect_substr="$2"
  shift 2
  local err out rc
  err="$(mktemp)"; out="$(mktemp)"
  env "$@" REPORT=/tmp/proof-malformed-url.md "$SMOKE" >"$out" 2>"$err"
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
  # Case C — every URL explicitly valid. Should NOT exit 2 at preflight;
  # bind to ports nothing answers on so we get RED quickly.
  local err out rc
  err="$(mktemp)"; out="$(mktemp)"
  PRICE_SERVICE_URL=http://127.0.0.1:49911/health \
  ORACLE_SIGNER_URL=http://127.0.0.1:49912/health \
  HEDGE_ENGINE_URL=http://127.0.0.1:49913/health \
  STATUS_AGGREGATOR_URL=http://127.0.0.1:49914/status.json \
  REPORT=/tmp/proof-malformed-url.md \
  "$SMOKE" >"$out" 2>"$err"
  rc=$?
  echo "--- case: C: explicit *_URL envs (preflight should accept) ---"
  echo "exit code: $rc"
  if (( rc == 2 )); then
    echo "FAIL: preflight rejected valid explicit URLs"
    cat "$err"
    rm -f "$err" "$out"
    return 1
  fi
  echo "PASS (preflight accepted; downstream rc=$rc)"
  rm -f "$err" "$out"
}

run_fatal "A: LANE7_BASE=http://127.0.0.1:9999 (double colon in defaults)" \
  "FATAL: malformed probe URL" \
  LANE7_BASE=http://127.0.0.1:9999 || exit 1

# Case B: one explicit override, three still bad. Preflight still fails on
# the three malformed defaults.
run_fatal "B: partial override (3 still bad)" \
  "FATAL: malformed probe URL" \
  LANE7_BASE=http://127.0.0.1:9999 \
  PRICE_SERVICE_URL=http://127.0.0.1:49911/health || exit 1

run_passes_preflight || exit 1

echo
echo "ALL CASES PASS"
