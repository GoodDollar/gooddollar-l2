#!/usr/bin/env bash
# Lane-7 internal-smoke future-dated lastUpdated() proof driver.
#
# Verifies the new negative-age branch in scripts/testnet/internal-smoke.sh
# correctly handles a future-dated StockOracleV2.lastUpdated() value.
# Today's bug: `(( age_s > STALENESS_THRESHOLD_S ))` silently returns
# false when age_s is negative, so the smoke prints a contradictory
# `✅ ... age -86400 s ≤ 600 s` GREEN row even though the signer
# claimed a timestamp from tomorrow.
#
# Cases (all driven via fake-status-server's `lane7-smoke-rpc-fresh`
# profile + the new `RPC_LAST_UPDATED_OFFSET` env knob):
#
#   A. offset = +86400 (24h in the future)  → WARN line with
#      `86400s in the future`, NO `❌ ... age -86400 s` row, exit 0.
#   B. offset = 0      (exact-now)          → existing
#      `✅ ... age 0 s ≤ N s` line, exit 0 (zero-age boundary).
#   C. offset = -3600  (1h ago, threshold 600) → existing
#      `❌ ... age 3600 s > threshold 600 s` BLOCKER, exit 1.
#   D. offset = -60    (default)            → regression baseline,
#      byte-identical to iter06 modulo the fresh timestamp itself.

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"
HARNESS="$REPO_ROOT/.autobuilder/initiatives/0007g-testnet-setup/proof/fake-status-server.js"

GREEN_PORT=49621
RPC_PORT=49622

cleanup() {
  for pid in "${GREEN_PID:-}" "${RPC_PID:-}"; do
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
    [[ -n "$pid" ]] && wait "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT

assert_substr() {
  local label="$1" file="$2" needle="$3"
  if grep -qF "$needle" "$file"; then
    echo "PASS  $label"
  else
    echo "FAIL  $label  — missing literal: $needle"
    echo "--- file contents ---"
    cat "$file"
    return 1
  fi
}

refute_substr() {
  local label="$1" file="$2" needle="$3"
  if grep -qF "$needle" "$file"; then
    echo "FAIL  $label  — found forbidden literal: $needle"
    echo "--- file contents ---"
    cat "$file"
    return 1
  else
    echo "PASS  $label"
  fi
}

# Single green services harness shared across every case.
node "$HARNESS" "$GREEN_PORT" --profile lane7-smoke-green \
  >/tmp/proof-future-dated.green.log 2>&1 &
GREEN_PID=$!
sleep 0.4

run_case() {
  local label="$1" offset="$2" report="$3"
  echo
  echo "=== $label (RPC_LAST_UPDATED_OFFSET=$offset) ==="
  RPC_LAST_UPDATED_OFFSET="$offset" \
    node "$HARNESS" "$RPC_PORT" --profile lane7-smoke-rpc-fresh \
    >/tmp/proof-future-dated.rpc.log 2>&1 &
  RPC_PID=$!
  sleep 0.4
  PRICE_SERVICE_URL=http://127.0.0.1:$GREEN_PORT/health \
  ORACLE_SIGNER_URL=http://127.0.0.1:$GREEN_PORT/health \
  HEDGE_ENGINE_URL=http://127.0.0.1:$GREEN_PORT/health \
  STATUS_AGGREGATOR_URL=http://127.0.0.1:$GREEN_PORT/status.json \
  LANE7_RPC=http://127.0.0.1:$RPC_PORT \
  STOCK_ORACLE_V2_ADDRESS=0x0000000000000000000000000000000000000001 \
  REPORT="$report" \
    "$SMOKE" >/dev/null 2>&1
  echo "exit: $?"
  kill "$RPC_PID" 2>/dev/null || true
  wait "$RPC_PID" 2>/dev/null || true
  RPC_PID=
}

# Case A: future-dated by 24h.
run_case "Case A: future +86400s" 86400 /tmp/proof-future-dated-A.md
assert_substr "WARN line surfaced (86400s in the future)" \
  /tmp/proof-future-dated-A.md "86400s in the future" || exit 1
refute_substr "no contradictory negative-age row" \
  /tmp/proof-future-dated-A.md "age -86400 s" || exit 1

# Case B: exact-now (offset 0).
run_case "Case B: exact-now (offset 0)" 0 /tmp/proof-future-dated-B.md
assert_substr "zero-age boundary" \
  /tmp/proof-future-dated-B.md "age 0 s" || exit 1
refute_substr "no future-drift WARN at offset 0" \
  /tmp/proof-future-dated-B.md "in the future" || exit 1

# Case C: 1h ago, threshold 600 → BLOCKER.
run_case "Case C: 1h ago (-3600s, threshold 600)" -3600 /tmp/proof-future-dated-C.md
assert_substr "stale BLOCKER fires" \
  /tmp/proof-future-dated-C.md "age 3600 s > threshold 600 s" || exit 1

# Case D: regression baseline at -60.
run_case "Case D: default offset -60" -60 /tmp/proof-future-dated-D.md
assert_substr "default fresh row" \
  /tmp/proof-future-dated-D.md "StockOracleV2.lastUpdated() = " || exit 1
refute_substr "no future-drift WARN at default offset" \
  /tmp/proof-future-dated-D.md "in the future" || exit 1

echo
echo "ALL CASES PASS"
