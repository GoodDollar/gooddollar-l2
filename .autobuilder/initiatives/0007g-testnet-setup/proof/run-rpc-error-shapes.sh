#!/usr/bin/env bash
# Lane-7 internal-smoke RPC error shapes proof driver (task 0007g/0023).
#
# The on-chain freshness probe's response parser collapsed every
# non-`result` JSON-RPC response shape into the literal string "0",
# which the bash side then surfaced as the benign pre-deploy WARN
# ("fresh oracle absent (testnet candidate phase)"). That hides the
# four operationally distinct failure modes operators most want to
# distinguish at promotion time:
#
#   - execution reverted (wrong contract address / no code at address)
#   - method not found (wrong RPC endpoint / restricted provider)
#   - internal error (transient outage / node restart)
#   - null result (pruned archival state / bad block tag)
#   - non-JSON response (proxy / 502 page / transport interference)
#
# Fix: branch the node-side on `j.error` / `j.result === null` /
# parse-failure and forward structured sentinels (RPCERR:<code>:<msg>,
# NORESULT, PARSEFAIL) to bash, which adds matching `elif` arms.
# `RPCERR` is BLOCKER-grade (server says the call is wrong);
# `NORESULT` and `PARSEFAIL` are WARN-grade (transient / non-
# conforming, re-runnable).
#
# Cases:
#   A. execution reverted (-32000)           → BLOCKER, exit 1
#   B. method not found (-32601)             → BLOCKER, exit 1
#   C. internal error (-32603)               → BLOCKER, exit 1
#   D. {result: null}                        → NORESULT WARN, exit 0
#   E. HTML 502 (non-JSON)                   → PARSEFAIL WARN, exit 0
#   F. {result: "0x"}                        → existing pre-deploy WARN
#   G. {result: "0x...<timestamp>"}          → existing fresh path

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"
HARNESS="$REPO_ROOT/.autobuilder/initiatives/0007g-testnet-setup/proof/fake-status-server.js"

GREEN_PORT=49701
RPC_PORT=49702

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

# Generic stub RPC: the mode is set via $RPC_MODE in the env passed
# to node. Routes by mode to one of the canonical shapes.
start_rpc_stub() {
  local mode="$1"
  RPC_MODE="$mode" node -e '
const http = require("http");
const port = parseInt(process.argv[1], 10);
const mode = process.env.RPC_MODE;
http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => { raw += c; });
  req.on("end", () => {
    let id = 1;
    try { id = JSON.parse(raw).id; } catch (_) { /* ignore */ }
    if (mode === "html-502") {
      res.writeHead(502, { "content-type": "text/html" });
      res.end("<html><body>Bad Gateway</body></html>");
      return;
    }
    let body;
    switch (mode) {
      case "revert":
        body = { jsonrpc: "2.0", id, error: { code: -32000, message: "execution reverted: not deployed" } };
        break;
      case "method":
        body = { jsonrpc: "2.0", id, error: { code: -32601, message: "the method eth_call does not exist" } };
        break;
      case "internal":
        body = { jsonrpc: "2.0", id, error: { code: -32603, message: "Internal error" } };
        break;
      case "null-result":
        body = { jsonrpc: "2.0", id, result: null };
        break;
      case "empty-hex":
        body = { jsonrpc: "2.0", id, result: "0x" };
        break;
      case "fresh": {
        const ts = Math.floor(Date.now() / 1000) - 60;
        const hex = ts.toString(16).padStart(64, "0");
        body = { jsonrpc: "2.0", id, result: "0x" + hex };
        break;
      }
      default:
        body = { jsonrpc: "2.0", id, error: { code: -1, message: "unknown stub mode: " + mode } };
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  });
}).listen(port, "127.0.0.1");
' "$RPC_PORT" >/tmp/proof-rpc-shapes.stub.log 2>&1 &
  RPC_PID=$!
  sleep 0.3
}

stop_rpc_stub() {
  if [[ -n "${RPC_PID:-}" ]]; then
    kill "$RPC_PID" 2>/dev/null || true
    wait "$RPC_PID" 2>/dev/null || true
    RPC_PID=
  fi
}

# Shared green services harness.
node "$HARNESS" "$GREEN_PORT" --profile lane7-smoke-green \
  >/tmp/proof-rpc-shapes.green.log 2>&1 &
GREEN_PID=$!
sleep 0.4

run_case() {
  local label="$1" mode="$2" report="$3"
  echo
  echo "=== $label (mode=$mode) ==="
  start_rpc_stub "$mode"
  PRICE_SERVICE_URL=http://127.0.0.1:$GREEN_PORT/health \
  ORACLE_SIGNER_URL=http://127.0.0.1:$GREEN_PORT/health \
  HEDGE_ENGINE_URL=http://127.0.0.1:$GREEN_PORT/health \
  STATUS_AGGREGATOR_URL=http://127.0.0.1:$GREEN_PORT/status.json \
  LANE7_RPC=http://127.0.0.1:$RPC_PORT \
  STOCK_ORACLE_V2_ADDRESS=0x0000000000000000000000000000000000000001 \
  REPORT="$report" \
    "$SMOKE" >/dev/null 2>&1
  rc=$?
  stop_rpc_stub
  echo "exit: $rc"
}

assert_exit() {
  local label="$1" expected="$2" actual="$3"
  if (( actual == expected )); then
    echo "PASS  $label (exit $actual)"
  else
    echo "FAIL  $label  — expected exit $expected, got $actual"
    return 1
  fi
}

# ---- Case A: execution reverted (-32000) ----
run_case "Case A: execution reverted" revert /tmp/proof-rpc-shapes-A.md
assert_exit "execution reverted → BLOCKER" 1 "$rc" || exit 1
assert_substr "RPCERR row with execution-reverted text" \
  /tmp/proof-rpc-shapes-A.md "execution reverted: not deployed" || exit 1
assert_substr "RPCERR row uses BLOCKER icon" \
  /tmp/proof-rpc-shapes-A.md "RPC returned error" || exit 1
refute_substr "no pre-deploy WARN on execution-reverted" \
  /tmp/proof-rpc-shapes-A.md "fresh oracle absent (testnet candidate phase)" || exit 1

# ---- Case B: method not found (-32601) ----
run_case "Case B: method not found" method /tmp/proof-rpc-shapes-B.md
assert_exit "method not found → BLOCKER" 1 "$rc" || exit 1
assert_substr "RPCERR row names method-not-found" \
  /tmp/proof-rpc-shapes-B.md "the method eth_call does not exist" || exit 1
refute_substr "no pre-deploy WARN on method-not-found" \
  /tmp/proof-rpc-shapes-B.md "fresh oracle absent (testnet candidate phase)" || exit 1

# ---- Case C: internal error (-32603) ----
run_case "Case C: internal error" internal /tmp/proof-rpc-shapes-C.md
assert_exit "internal error → BLOCKER" 1 "$rc" || exit 1
assert_substr "RPCERR row names internal-error" \
  /tmp/proof-rpc-shapes-C.md "Internal error" || exit 1

# ---- Case D: {result: null} ----
run_case "Case D: null result" null-result /tmp/proof-rpc-shapes-D.md
assert_exit "null result → verdict-grade (warn)" 0 "$rc" || exit 1
assert_substr "NORESULT warn line" \
  /tmp/proof-rpc-shapes-D.md "null/undefined result" || exit 1
refute_substr "no pre-deploy WARN on NORESULT" \
  /tmp/proof-rpc-shapes-D.md "fresh oracle absent (testnet candidate phase)" || exit 1

# ---- Case E: HTML 502 (non-JSON) ----
run_case "Case E: HTML 502 (non-JSON)" html-502 /tmp/proof-rpc-shapes-E.md
assert_exit "HTML 502 → verdict-grade (warn)" 0 "$rc" || exit 1
assert_substr "PARSEFAIL warn line" \
  /tmp/proof-rpc-shapes-E.md "non-JSON response" || exit 1

# ---- Case F: {result: "0x"} (existing pre-deploy WARN, must regress cleanly) ----
run_case "Case F: result 0x (pre-deploy regression)" empty-hex /tmp/proof-rpc-shapes-F.md
assert_exit "0x → verdict-grade (warn)" 0 "$rc" || exit 1
assert_substr "pre-deploy WARN preserved" \
  /tmp/proof-rpc-shapes-F.md "fresh oracle absent (testnet candidate phase)" || exit 1
refute_substr "no RPCERR misclassification" \
  /tmp/proof-rpc-shapes-F.md "RPC returned error" || exit 1

# ---- Case G: real timestamp (happy path regression) ----
run_case "Case G: real timestamp (happy path)" fresh /tmp/proof-rpc-shapes-G.md
assert_exit "fresh ts → verdict-grade" 0 "$rc" || exit 1
assert_substr "fresh row" \
  /tmp/proof-rpc-shapes-G.md "StockOracleV2.lastUpdated() = " || exit 1

echo
echo "ALL CASES PASS"
