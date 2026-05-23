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
#   I. (task 0016, Leak A) userinfo in malformed FATAL — host:port only,
#                          no userinfo, no `supersecret`.
#   J. (task 0016, Leak B) query string in valid-URL report header —
#                          report shows host:port only, no `?key`, no
#                          `DEADBEEF`.
#   K. (task 0016, combined) userinfo+query — FATAL path — neither
#                          `userpass` nor `KEY` shows up in stderr.

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

# Case I (task 0016, Leak A): userinfo password in the malformed FATAL
# echo. The regex rejects URLs whose host segment contains `:` or `/`
# (and `@user:pass` produces both via the userinfo separator), so this
# falls through to FATAL. The redact helper must strip the userinfo
# segment so neither `user` nor `supersecret` lands on stderr.
echo
echo "=== Case I: userinfo in malformed FATAL (Leak A) ==="
rm -f /tmp/proof-rpc-url-I.md
LANE7_RPC='https://user:supersecret@rpc.example.com:8545/path' \
PRICE_SERVICE_URL=http://127.0.0.1:49911/health \
ORACLE_SIGNER_URL=http://127.0.0.1:49911/health \
HEDGE_ENGINE_URL=http://127.0.0.1:49911/health \
STATUS_AGGREGATOR_URL=http://127.0.0.1:49911/status.json \
REPORT=/tmp/proof-rpc-url-I.md \
  "$SMOKE" >/dev/null 2>/tmp/proof-rpc-url-I.stderr
rc=$?
echo "exit: $rc"
[[ "$rc" == "2" ]] || { echo "FAIL  Case I expected exit 2"; exit 1; }
echo "PASS  exit code 2"
refute_substr "no userinfo leak in stderr" \
  /tmp/proof-rpc-url-I.stderr "supersecret" || exit 1
refute_substr "no username leak in stderr" \
  /tmp/proof-rpc-url-I.stderr "user:supersecret" || exit 1
assert_substr "redacted FATAL (host only)" \
  /tmp/proof-rpc-url-I.stderr \
  "FATAL: LANE7_RPC=https://rpc.example.com:8545/path" || exit 1

# Case J (task 0016, Leak B): query string in the report header on a
# valid-shape URL. The preflight regex requires the query to follow a
# path segment (`(/.*)?` matches `/path?key=...`), so the URL has the
# shape `http://host:port/path?key=...`. The report writer must redact
# before echoing into the persistent Markdown report.
echo
echo "=== Case J: query string in report header (Leak B) ==="
rm -f /tmp/proof-rpc-url-J.md
LANE7_RPC="http://127.0.0.1:$RPC_PORT/rpc?key=DEADBEEFREDACTABLE" \
STOCK_ORACLE_V2_ADDRESS=0xabcdefabcdefabcdefabcdefabcdefabcdefabcd \
PRICE_SERVICE_URL=http://127.0.0.1:$GREEN_PORT/health \
ORACLE_SIGNER_URL=http://127.0.0.1:$GREEN_PORT/health \
HEDGE_ENGINE_URL=http://127.0.0.1:$GREEN_PORT/health \
STATUS_AGGREGATOR_URL=http://127.0.0.1:$GREEN_PORT/status.json \
REPORT=/tmp/proof-rpc-url-J.md \
  "$SMOKE" >/dev/null 2>&1
echo "exit: $?"
[[ -f /tmp/proof-rpc-url-J.md ]] || { echo "FAIL  Case J: no report written"; exit 1; }
refute_substr "no query string in report" \
  /tmp/proof-rpc-url-J.md "DEADBEEFREDACTABLE" || exit 1
refute_substr "no '?key=' in report" \
  /tmp/proof-rpc-url-J.md "?key=" || exit 1
assert_substr "redacted RPC in report header" \
  /tmp/proof-rpc-url-J.md \
  "**LANE7_RPC:** \`http://127.0.0.1:$RPC_PORT/rpc\`" || exit 1

# Case K (task 0016, combined): userinfo + query string. Regex rejects
# (userinfo introduces `@`/`:` past `://`), FATAL path. Both secret
# vectors must be stripped from stderr.
echo
echo "=== Case K: combined userinfo + query string (FATAL) ==="
rm -f /tmp/proof-rpc-url-K.md
LANE7_RPC='https://userpass:KEYSECRET12345@host.example.com:8545/x?key=DEADBEEFKQ' \
PRICE_SERVICE_URL=http://127.0.0.1:49911/health \
ORACLE_SIGNER_URL=http://127.0.0.1:49911/health \
HEDGE_ENGINE_URL=http://127.0.0.1:49911/health \
STATUS_AGGREGATOR_URL=http://127.0.0.1:49911/status.json \
REPORT=/tmp/proof-rpc-url-K.md \
  "$SMOKE" >/dev/null 2>/tmp/proof-rpc-url-K.stderr
rc=$?
echo "exit: $rc"
[[ "$rc" == "2" ]] || { echo "FAIL  Case K expected exit 2"; exit 1; }
echo "PASS  exit code 2"
refute_substr "no userinfo password in stderr" \
  /tmp/proof-rpc-url-K.stderr "KEYSECRET12345" || exit 1
refute_substr "no query-string secret in stderr" \
  /tmp/proof-rpc-url-K.stderr "DEADBEEFKQ" || exit 1
refute_substr "no userinfo username in stderr" \
  /tmp/proof-rpc-url-K.stderr "userpass" || exit 1
assert_substr "redacted FATAL (host only, no userinfo, no query)" \
  /tmp/proof-rpc-url-K.stderr \
  "FATAL: LANE7_RPC=https://host.example.com:8545/x" || exit 1

echo
echo "ALL CASES PASS"
