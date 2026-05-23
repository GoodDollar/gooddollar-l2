#!/usr/bin/env bash
# Lane-7 internal-smoke LANE7_RPC URL preflight proof driver
# (task 0007g/0015).
#
# Verifies the new LANE7_RPC URL preflight + node-side BADURL
# sentinel + bash BADURL branch. Today's bug: a malformed
# `LANE7_RPC` makes `new URL(...)` throw synchronously inside the
# node child, the child exits with stderr redirected to /dev/null,
# stdout empty defaults to "0", and the operator sees the misleading
# "fresh oracle absent (testnet candidate phase)" WARN — the *expected*
# pre-deploy signal, so they take no action while the actual problem
# is a typo in the RPC URL.
#
# Cases:
#   A. LANE7_RPC=foo                              → FATAL exit 2
#   B. LANE7_RPC=http://                          → FATAL exit 2
#   C. LANE7_RPC=tcp://localhost:8545             → FATAL exit 2 (scheme)
#   D. LANE7_RPC="http://localhost:8545 "         → FATAL exit 2 (space)
#   E. LANE7_RPC=http://localhost:8545$'\r'       → FATAL exit 2 (CR)
#   F. LANE7_RPC=http://127.0.0.1:<rpc_port>      → existing freshness row
#   G. unset LANE7_RPC                            → existing unset WARN
#   H. LANE7_RPC=http://localhost:8545?key=secret → redacted FATAL echo
#                                                   (no `secret` leak)

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"
HARNESS="$REPO_ROOT/.autobuilder/initiatives/0007g-testnet-setup/proof/fake-status-server.js"

GREEN_PORT=49661
RPC_PORT=49662

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

run_fatal_case() {
  local label="$1" rpc="$2" report="$3" stderr="$4"
  echo
  echo "=== $label ==="
  start_ns=$(date +%s%N)
  LANE7_RPC="$rpc" \
  PRICE_SERVICE_URL=http://127.0.0.1:49911/health \
  ORACLE_SIGNER_URL=http://127.0.0.1:49911/health \
  HEDGE_ENGINE_URL=http://127.0.0.1:49911/health \
  STATUS_AGGREGATOR_URL=http://127.0.0.1:49911/status.json \
  REPORT="$report" \
    "$SMOKE" >/dev/null 2>"$stderr"
  rc=$?
  end_ns=$(date +%s%N)
  elapsed_ms=$(( (end_ns - start_ns) / 1000000 ))
  echo "exit: $rc, elapsed: ${elapsed_ms}ms"
  [[ "$rc" == "2" ]] || { echo "FAIL  expected exit 2, got $rc"; return 1; }
  echo "PASS  exit code 2"
  assert_substr "FATAL line 1 (malformed)" "$stderr" \
    "FATAL: malformed LANE7_RPC — must match http(s)://host[:port][/path]" || return 1
  if (( elapsed_ms > 500 )); then
    echo "FAIL  wallclock ${elapsed_ms}ms — expected ≤ 500ms"
    return 1
  fi
  echo "PASS  wallclock ${elapsed_ms}ms (≤ 500ms)"
  if [[ -e "$report" ]]; then
    echo "FAIL  Markdown report written despite FATAL"
    return 1
  fi
  echo "PASS  no Markdown report written"
}

# Case A: LANE7_RPC=foo
rm -f /tmp/proof-rpc-url-A.md
run_fatal_case "Case A: LANE7_RPC=foo" "foo" \
  /tmp/proof-rpc-url-A.md /tmp/proof-rpc-url-A.stderr || exit 1
assert_substr "echoes value" /tmp/proof-rpc-url-A.stderr \
  "FATAL: LANE7_RPC=foo" || exit 1

# Case B: LANE7_RPC=http://  (no host)
rm -f /tmp/proof-rpc-url-B.md
run_fatal_case "Case B: LANE7_RPC=http://" "http://" \
  /tmp/proof-rpc-url-B.md /tmp/proof-rpc-url-B.stderr || exit 1

# Case C: wrong scheme.
rm -f /tmp/proof-rpc-url-C.md
run_fatal_case "Case C: LANE7_RPC=tcp://localhost:8545" "tcp://localhost:8545" \
  /tmp/proof-rpc-url-C.md /tmp/proof-rpc-url-C.stderr || exit 1

# Case D: trailing space.
rm -f /tmp/proof-rpc-url-D.md
run_fatal_case "Case D: trailing space" "http://localhost:8545 " \
  /tmp/proof-rpc-url-D.md /tmp/proof-rpc-url-D.stderr || exit 1

# Case E: trailing CR.
rm -f /tmp/proof-rpc-url-E.md
run_fatal_case "Case E: trailing CR" $'http://localhost:8545\r' \
  /tmp/proof-rpc-url-E.md /tmp/proof-rpc-url-E.stderr || exit 1

# Spawn fixtures for non-FATAL cases.
node "$HARNESS" "$GREEN_PORT" --profile lane7-smoke-green \
  >/tmp/proof-rpc-url.green.log 2>&1 &
GREEN_PID=$!
node "$HARNESS" "$RPC_PORT" --profile lane7-smoke-rpc-fresh \
  >/tmp/proof-rpc-url.rpc.log 2>&1 &
RPC_PID=$!
sleep 0.5

# Case F: valid RPC (regression baseline against fake-status `/rpc`).
echo
echo "=== Case F: valid LANE7_RPC=http://127.0.0.1:$RPC_PORT ==="
LANE7_RPC="http://127.0.0.1:$RPC_PORT" \
STOCK_ORACLE_V2_ADDRESS=0xabcdefabcdefabcdefabcdefabcdefabcdefabcd \
PRICE_SERVICE_URL=http://127.0.0.1:$GREEN_PORT/health \
ORACLE_SIGNER_URL=http://127.0.0.1:$GREEN_PORT/health \
HEDGE_ENGINE_URL=http://127.0.0.1:$GREEN_PORT/health \
STATUS_AGGREGATOR_URL=http://127.0.0.1:$GREEN_PORT/status.json \
REPORT=/tmp/proof-rpc-url-F.md \
  "$SMOKE" >/dev/null 2>&1
echo "exit: $?"
assert_substr "freshness row from valid RPC" \
  /tmp/proof-rpc-url-F.md "StockOracleV2.lastUpdated() = " || exit 1
refute_substr "no FATAL on valid path" \
  /tmp/proof-rpc-url-F.md "FATAL:" || exit 1

# Case G: unset LANE7_RPC.
echo
echo "=== Case G: unset LANE7_RPC (regression) ==="
unset LANE7_RPC
PRICE_SERVICE_URL=http://127.0.0.1:$GREEN_PORT/health \
ORACLE_SIGNER_URL=http://127.0.0.1:$GREEN_PORT/health \
HEDGE_ENGINE_URL=http://127.0.0.1:$GREEN_PORT/health \
STATUS_AGGREGATOR_URL=http://127.0.0.1:$GREEN_PORT/status.json \
REPORT=/tmp/proof-rpc-url-G.md \
  "$SMOKE" >/dev/null 2>&1
echo "exit: $?"
assert_substr "LANE7_RPC unset WARN" \
  /tmp/proof-rpc-url-G.md "LANE7_RPC\` unset" || exit 1

# Case H: query-string redaction in FATAL echo.
# A query-string-bearing URL must trip the regex (it adds `?` outside
# the path class) — and the FATAL echo must strip the `?key=...`
# part so the API key never lands in stderr.
echo
echo "=== Case H: query string redaction in FATAL echo ==="
rm -f /tmp/proof-rpc-url-H.md
LANE7_RPC=$'http://localhost:8545?key=SUPERSECRETAPIKEY\r' \
PRICE_SERVICE_URL=http://127.0.0.1:49911/health \
ORACLE_SIGNER_URL=http://127.0.0.1:49911/health \
HEDGE_ENGINE_URL=http://127.0.0.1:49911/health \
STATUS_AGGREGATOR_URL=http://127.0.0.1:49911/status.json \
REPORT=/tmp/proof-rpc-url-H.md \
  "$SMOKE" >/dev/null 2>/tmp/proof-rpc-url-H.stderr
rc=$?
echo "exit: $rc"
[[ "$rc" == "2" ]] || { echo "FAIL  Case H expected exit 2"; exit 1; }
echo "PASS  exit code 2"
refute_substr "no API key leak in stderr" \
  /tmp/proof-rpc-url-H.stderr "SUPERSECRETAPIKEY" || exit 1
assert_substr "redacted echo (host only)" \
  /tmp/proof-rpc-url-H.stderr \
  "FATAL: LANE7_RPC=http://localhost:8545" || exit 1

echo
echo "ALL CASES PASS"
