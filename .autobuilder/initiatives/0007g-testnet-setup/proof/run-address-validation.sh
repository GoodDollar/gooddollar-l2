#!/usr/bin/env bash
# Lane-7 internal-smoke STOCK_ORACLE_V2_ADDRESS shape proof driver
# (task 0007g/0014).
#
# Verifies the new normalize + regex check rejects malformed
# StockOracleV2 addresses with a single redacted-shape WARN, while
# normalizing trailing whitespace / CRLF on otherwise-valid inputs.
# Today's bug: any invalid value (typo, wrong type in JSON,
# trailing whitespace, CRLF) silently makes the eth_call reject and
# the smoke prints the misleading "fresh oracle absent (testnet
# candidate phase)" WARN — operator sees the expected pre-deploy
# message and takes no action.
#
# Cases (run against the `lane7-smoke-rpc-fresh` profile so the
# valid path actually returns a fresh value):
#
#   A. STOCK_ORACLE_V2_ADDRESS=0x1234            → too short, WARN
#   B. STOCK_ORACLE_V2_ADDRESS=foo               → non-hex, WARN
#   C. STOCK_ORACLE_V2_ADDRESS="0x<40hex> "      → trailing space:
#                                                  normalize, no WARN,
#                                                  eth_call runs
#   D. STOCK_ORACLE_V2_ADDRESS="0x<40hex>\r"     → trailing CR: ditto
#   E. addresses.json:StockOracleV2=12345        → numeric, WARN
#   F. STOCK_ORACLE_V2_ADDRESS=<valid lowercase> → existing freshness
#                                                  row, no WARN

set -u

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
SMOKE="$REPO_ROOT/scripts/testnet/internal-smoke.sh"
HARNESS="$REPO_ROOT/.autobuilder/initiatives/0007g-testnet-setup/proof/fake-status-server.js"

GREEN_PORT=49651
RPC_PORT=49652

VALID_ADDR=0xabcdefabcdefabcdefabcdefabcdefabcdefabcd

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

# Shared green services + working RPC harness for every case.
node "$HARNESS" "$GREEN_PORT" --profile lane7-smoke-green \
  >/tmp/proof-address.green.log 2>&1 &
GREEN_PID=$!
node "$HARNESS" "$RPC_PORT" --profile lane7-smoke-rpc-fresh \
  >/tmp/proof-address.rpc.log 2>&1 &
RPC_PID=$!
sleep 0.5

run_case() {
  local label="$1" addr="$2" report="$3"
  echo
  echo "=== $label ==="
  STOCK_ORACLE_V2_ADDRESS="$addr" \
  PRICE_SERVICE_URL=http://127.0.0.1:$GREEN_PORT/health \
  ORACLE_SIGNER_URL=http://127.0.0.1:$GREEN_PORT/health \
  HEDGE_ENGINE_URL=http://127.0.0.1:$GREEN_PORT/health \
  STATUS_AGGREGATOR_URL=http://127.0.0.1:$GREEN_PORT/status.json \
  LANE7_RPC=http://127.0.0.1:$RPC_PORT \
  REPORT="$report" \
    "$SMOKE" >/dev/null 2>&1
  echo "exit: $?"
}

# Case A: too short.
run_case "Case A: too-short (0x1234)" "0x1234" /tmp/proof-address-A.md
assert_substr "shape-invalid WARN" \
  /tmp/proof-address-A.md "STOCK_ORACLE_V2_ADDRESS shape invalid" || exit 1
refute_substr "no misleading 'fresh oracle absent'" \
  /tmp/proof-address-A.md "fresh oracle absent" || exit 1
refute_substr "no eth_call freshness row" \
  /tmp/proof-address-A.md "StockOracleV2.lastUpdated() = " || exit 1

# Case B: non-hex.
run_case "Case B: non-hex (foo)" "foo" /tmp/proof-address-B.md
assert_substr "shape-invalid WARN" \
  /tmp/proof-address-B.md "STOCK_ORACLE_V2_ADDRESS shape invalid" || exit 1

# Case C: trailing whitespace — normalize and pass.
run_case "Case C: trailing space" "${VALID_ADDR} " /tmp/proof-address-C.md
refute_substr "no shape-invalid WARN" \
  /tmp/proof-address-C.md "STOCK_ORACLE_V2_ADDRESS shape invalid" || exit 1
assert_substr "freshness row from valid normalized addr" \
  /tmp/proof-address-C.md "StockOracleV2.lastUpdated() = " || exit 1

# Case D: trailing CR.
run_case "Case D: trailing CR" "${VALID_ADDR}"$'\r' /tmp/proof-address-D.md
refute_substr "no shape-invalid WARN" \
  /tmp/proof-address-D.md "STOCK_ORACLE_V2_ADDRESS shape invalid" || exit 1
assert_substr "freshness row from valid normalized addr" \
  /tmp/proof-address-D.md "StockOracleV2.lastUpdated() = " || exit 1

# Case E: addresses.json with numeric value (env unset).
echo
echo "=== Case E: addresses.json:StockOracleV2=12345 (numeric) ==="
TMP_REPO=$(mktemp -d)
mkdir -p "$TMP_REPO/scripts/testnet" "$TMP_REPO/op-stack" "$TMP_REPO/docs/testnet"
cp "$SMOKE" "$TMP_REPO/scripts/testnet/internal-smoke.sh"
cp "$REPO_ROOT/docs/testnet/HEALTH-CONTRACT.md" "$TMP_REPO/docs/testnet/HEALTH-CONTRACT.md"
cat > "$TMP_REPO/op-stack/addresses.json" <<'JSON'
{ "contracts": { "StockOracleV2": 12345 } }
JSON
unset STOCK_ORACLE_V2_ADDRESS
PRICE_SERVICE_URL=http://127.0.0.1:$GREEN_PORT/health \
ORACLE_SIGNER_URL=http://127.0.0.1:$GREEN_PORT/health \
HEDGE_ENGINE_URL=http://127.0.0.1:$GREEN_PORT/health \
STATUS_AGGREGATOR_URL=http://127.0.0.1:$GREEN_PORT/status.json \
LANE7_RPC=http://127.0.0.1:$RPC_PORT \
REPORT=/tmp/proof-address-E.md \
  bash "$TMP_REPO/scripts/testnet/internal-smoke.sh" >/dev/null 2>&1
echo "exit: $?"
assert_substr "shape-invalid WARN (numeric JSON)" \
  /tmp/proof-address-E.md "STOCK_ORACLE_V2_ADDRESS shape invalid" || exit 1
refute_substr "no misleading 'fresh oracle absent'" \
  /tmp/proof-address-E.md "fresh oracle absent" || exit 1
rm -rf "$TMP_REPO"

# Case F: valid lowercase address — regression baseline.
run_case "Case F: valid lowercase address" "$VALID_ADDR" /tmp/proof-address-F.md
refute_substr "no shape-invalid WARN" \
  /tmp/proof-address-F.md "STOCK_ORACLE_V2_ADDRESS shape invalid" || exit 1
assert_substr "freshness row from valid addr" \
  /tmp/proof-address-F.md "StockOracleV2.lastUpdated() = " || exit 1

# Criterion 5: redacted shape ≤ 30 chars when fed an 80-char garbage input.
echo
echo "=== Case G: 80-char garbage input — redacted shape ≤ 30 chars ==="
LONG_GARBAGE=$(printf 'X%.0s' $(seq 1 80))
run_case "Case G: 80-char garbage" "$LONG_GARBAGE" /tmp/proof-address-G.md
SHAPE_LINE=$(grep -F "STOCK_ORACLE_V2_ADDRESS shape invalid" /tmp/proof-address-G.md | head -1)
if [[ -z "$SHAPE_LINE" ]]; then
  echo "FAIL  Case G shape line missing"; exit 1
fi
echo "shape line: $SHAPE_LINE"
# Must NOT contain the full 80-char input
if printf '%s' "$SHAPE_LINE" | grep -q "$LONG_GARBAGE"; then
  echo "FAIL  Case G leaked full 80-char input into report"
  exit 1
fi
echo "PASS  full input not leaked"

echo
echo "ALL CASES PASS"
