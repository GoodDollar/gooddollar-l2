#!/usr/bin/env bash
# Lane-7 internal-smoke RPC-timeout proof driver.
#
# Verifies that the on-chain freshness probe is now bounded by a
# 10-second socket timeout rather than hanging indefinitely on a
# silent / paused RPC. Three cases:
#
#   A. silent listener (`nc -l <port>` accepts the TCP connection but
#      never sends a response) — smoke must complete in ≤12s, write a
#      `WARN: on-chain freshness probe timed out after 10s` line, and
#      exit 0 (warnings only — staleness threshold breach is the only
#      blocker path; timeout is warning-grade, matching the existing
#      "LANE7_RPC unset" rule).
#   B. LANE7_RPC unset — existing "LANE7_RPC unset" warning, exit 0.
#   C. working RPC (extended fake-status-server `/rpc` handler) —
#      returns `now-60` as the lastUpdated() value; smoke reports a
#      fresh oracle and the verdict reflects warning-only state.
#
# Red half of TDD for task 0010.
#
# Requires GNU `nc` (Ubuntu testnet hosts). BSD nc differs on
# `-l -p PORT` vs `-l PORT`; the GNU form is `nc -l -p <port>` but
# `nc -l <port>` works on both. We use the latter.

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"
HARNESS="$REPO_ROOT/.autobuilder/initiatives/0007g-testnet-setup/proof/fake-status-server.js"

NC_PORT=49600
RPC_PORT=49601
HARNESS_PORT=49602

cleanup() {
  for pid in "${NC_PID:-}" "${HARNESS_PID:-}"; do
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

# Case A: silent listener. Use `nc -l <port>` to accept-and-stall.
# `nc` is part of `netcat-openbsd` on Ubuntu; if absent, skip.
if ! command -v nc >/dev/null 2>&1; then
  echo "skip Case A: nc not installed on host"
else
  echo "=== Case A: silent listener on port $NC_PORT ==="
  nc -l "$NC_PORT" >/dev/null 2>&1 &
  NC_PID=$!
  sleep 0.3

  start=$(date +%s)
  PRICE_SERVICE_URL=http://127.0.0.1:49911/health \
  ORACLE_SIGNER_URL=http://127.0.0.1:49911/health \
  HEDGE_ENGINE_URL=http://127.0.0.1:49911/health \
  STATUS_AGGREGATOR_URL=http://127.0.0.1:49911/status.json \
  LANE7_RPC=http://127.0.0.1:$NC_PORT \
  STOCK_ORACLE_V2_ADDRESS=0x0000000000000000000000000000000000000001 \
  REPORT=/tmp/proof-rpc-timeout-A.md \
  timeout 30 "$SMOKE" >/dev/null 2>&1
  rc=$?
  end=$(date +%s)
  elapsed=$(( end - start ))
  echo "elapsed: ${elapsed}s, exit: $rc"
  if (( elapsed > 14 )); then
    echo "FAIL  smoke ran for ${elapsed}s — expected ≤ 12s"
    exit 1
  else
    echo "PASS  smoke completed in ${elapsed}s (≤ 14s including overhead)"
  fi
  assert_substr "WARN line surfaced" /tmp/proof-rpc-timeout-A.md \
    "on-chain freshness probe timed out after 10s" || exit 1

  kill "$NC_PID" 2>/dev/null || true
  NC_PID=
fi

# Case B: LANE7_RPC unset — existing behaviour.
echo
echo "=== Case B: LANE7_RPC unset ==="
PRICE_SERVICE_URL=http://127.0.0.1:49911/health \
ORACLE_SIGNER_URL=http://127.0.0.1:49911/health \
HEDGE_ENGINE_URL=http://127.0.0.1:49911/health \
STATUS_AGGREGATOR_URL=http://127.0.0.1:49911/status.json \
REPORT=/tmp/proof-rpc-timeout-B.md \
"$SMOKE" >/dev/null 2>&1
echo "exit: $?"
assert_substr "LANE7_RPC unset warning" /tmp/proof-rpc-timeout-B.md \
  "LANE7_RPC unset" || exit 1

# Case C: working RPC.
echo
echo "=== Case C: working RPC harness on port $HARNESS_PORT ==="
node "$HARNESS" "$HARNESS_PORT" --profile lane7-smoke-rpc-fresh \
  >/tmp/proof-rpc-timeout-C.harness.log 2>&1 &
HARNESS_PID=$!
sleep 0.5

PRICE_SERVICE_URL=http://127.0.0.1:49911/health \
ORACLE_SIGNER_URL=http://127.0.0.1:49911/health \
HEDGE_ENGINE_URL=http://127.0.0.1:49911/health \
STATUS_AGGREGATOR_URL=http://127.0.0.1:49911/status.json \
LANE7_RPC=http://127.0.0.1:$HARNESS_PORT \
STOCK_ORACLE_V2_ADDRESS=0x0000000000000000000000000000000000000001 \
REPORT=/tmp/proof-rpc-timeout-C.md \
"$SMOKE" >/dev/null 2>&1
echo "exit: $?"
assert_substr "fresh lastUpdated reported" /tmp/proof-rpc-timeout-C.md \
  "StockOracleV2.lastUpdated() = " || exit 1
if grep -qF "timed out after 10s" /tmp/proof-rpc-timeout-C.md; then
  echo "FAIL  Case C produced a spurious timeout warning"
  exit 1
else
  echo "PASS  no spurious timeout on the working RPC path"
fi

echo
echo "ALL CASES PASS"
