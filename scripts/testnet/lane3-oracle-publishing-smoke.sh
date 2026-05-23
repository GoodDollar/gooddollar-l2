#!/usr/bin/env bash
# lane3-oracle-publishing-smoke.sh — end-to-end devnet proof for Lane 3.
#
# Orchestrates:
#   1. anvil on an ephemeral port (chain id 31337)
#   2. forge-deploy StockOracleV2 + SwapPriceOracle
#   3. lane3-mock-price-source.mjs (WS:9301 + HTTP:9300)
#   4. backend/oracle-signer with both rails enabled
#   5. polls oracle-signer /proof for ≥1 stocks tx and ≥1 crypto tx (≤30s)
#   6. reads back AAPL and WETH on-chain prices to confirm publication
#   7. writes proof JSON to .autobuilder/lane-proof/lane3-oracle-publishing.json
#
# Quiet on success (one-line OK + the lane-proof path).
# Noisy on failure (tails of anvil + mock + signer logs printed before exit 1).
#
# Usage:
#   bash scripts/testnet/lane3-oracle-publishing-smoke.sh
#
# Env knobs:
#   ANVIL_PORT       (default: 18545)
#   PRICE_WS_PORT    (default: 9301)
#   PRICE_HTTP_PORT  (default: 9300)
#   ORACLE_SIGNER_PORT (default: 19107 — avoids clashing with a running pm2 signer)
#   SMOKE_TIMEOUT_S  (default: 30)
#
# Devnet-only. The signer's key is anvil's well-known account #0. Never reuse
# in any other context.

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
ANVIL_PORT="${ANVIL_PORT:-18545}"
PRICE_WS_PORT="${PRICE_WS_PORT:-9301}"
PRICE_HTTP_PORT="${PRICE_HTTP_PORT:-9300}"
ORACLE_SIGNER_PORT="${ORACLE_SIGNER_PORT:-19107}"
SMOKE_TIMEOUT_S="${SMOKE_TIMEOUT_S:-30}"
ANVIL_KEY="${ANVIL_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
PROOF_OUT_DIR="${PROOF_OUT_DIR:-${ROOT_DIR}/.autobuilder/lane-proof}"
PROOF_OUT="${PROOF_OUT_DIR}/lane3-oracle-publishing.json"

RUNDIR="$(mktemp -d -t lane3-smoke-XXXXXX)"
ANVIL_LOG="${RUNDIR}/anvil.log"
MOCK_LOG="${RUNDIR}/mock.log"
SIGNER_LOG="${RUNDIR}/signer.log"
DEPLOY_LOG_STOCKS="${RUNDIR}/deploy-stocks.log"
DEPLOY_LOG_SWAP="${RUNDIR}/deploy-swap.log"

ANVIL_PID=""
MOCK_PID=""
SIGNER_PID=""

log()  { printf '\033[36m[smoke]\033[0m %s\n' "$*"; }
fail() { printf '\033[31m[smoke FAIL]\033[0m %s\n' "$*" >&2; }

cleanup() {
  local code=$?
  if [[ -n "$SIGNER_PID" ]] && kill -0 "$SIGNER_PID" 2>/dev/null; then kill "$SIGNER_PID" 2>/dev/null || true; fi
  if [[ -n "$MOCK_PID"   ]] && kill -0 "$MOCK_PID"   2>/dev/null; then kill "$MOCK_PID"   2>/dev/null || true; fi
  if [[ -n "$ANVIL_PID"  ]] && kill -0 "$ANVIL_PID"  2>/dev/null; then kill "$ANVIL_PID"  2>/dev/null || true; fi
  if [[ "$code" -ne 0 ]]; then
    echo
    fail "exit $code — tailing logs from $RUNDIR"
    for f in "$ANVIL_LOG" "$DEPLOY_LOG_STOCKS" "$DEPLOY_LOG_SWAP" "$MOCK_LOG" "$SIGNER_LOG"; do
      [[ -f "$f" ]] || continue
      echo
      echo "------ $(basename "$f") (last 40 lines) ------"
      tail -n 40 "$f" || true
    done
  fi
  exit $code
}
trap cleanup EXIT INT TERM

# ---- 0. preflight ----
command -v anvil >/dev/null || { fail "anvil not in PATH (install foundry)"; exit 1; }
command -v forge >/dev/null || { fail "forge not in PATH (install foundry)"; exit 1; }
command -v node  >/dev/null || { fail "node not in PATH"; exit 1; }

# ---- 1. anvil ----
log "starting anvil on :${ANVIL_PORT} (chain id 31337)"
anvil --port "$ANVIL_PORT" --chain-id 31337 --silent > "$ANVIL_LOG" 2>&1 &
ANVIL_PID=$!

# wait for readiness
for i in {1..30}; do
  if curl -s "http://127.0.0.1:${ANVIL_PORT}" \
      -H 'Content-Type: application/json' \
      -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
      2>/dev/null | grep -q result; then
    break
  fi
  sleep 0.2
  if (( i == 30 )); then fail "anvil never became ready on :${ANVIL_PORT}"; exit 1; fi
done
log "anvil ready"

# ---- 2. deploy contracts ----
log "deploying StockOracleV2"
(
  cd "$ROOT_DIR"
  forge script script/DeployStockOracleV2.s.sol --rpc-url "http://127.0.0.1:${ANVIL_PORT}" \
    --private-key "$ANVIL_KEY" --broadcast
) > "$DEPLOY_LOG_STOCKS" 2>&1
STOCK_ORACLE_V2_ADDRESS="$(grep -oE 'deployed at: 0x[a-fA-F0-9]{40}' "$DEPLOY_LOG_STOCKS" | head -1 | awk '{print $NF}')"
if [[ -z "$STOCK_ORACLE_V2_ADDRESS" ]]; then fail "could not parse StockOracleV2 address"; exit 1; fi
log "StockOracleV2 @ $STOCK_ORACLE_V2_ADDRESS"

log "deploying SwapPriceOracle"
(
  cd "$ROOT_DIR"
  forge script script/DeploySwapPriceOracle.s.sol --rpc-url "http://127.0.0.1:${ANVIL_PORT}" \
    --private-key "$ANVIL_KEY" --broadcast
) > "$DEPLOY_LOG_SWAP" 2>&1
SWAP_PRICE_ORACLE_ADDRESS="$(grep -oE 'deployed at: 0x[a-fA-F0-9]{40}' "$DEPLOY_LOG_SWAP" | head -1 | awk '{print $NF}')"
if [[ -z "$SWAP_PRICE_ORACLE_ADDRESS" ]]; then fail "could not parse SwapPriceOracle address"; exit 1; fi
log "SwapPriceOracle @ $SWAP_PRICE_ORACLE_ADDRESS"

# Token addresses the swap deploy script registered.
WETH_ADDR='0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
USDC_ADDR='0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
WBTC_ADDR='0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
G_DOLLAR_ADDR='0x5FbDB2315678afecb367f032d93F642f64180aa3'

CRYPTO_SYMBOL_MAP="WETH=${WETH_ADDR},USDC=${USDC_ADDR},WBTC=${WBTC_ADDR},G\$=${G_DOLLAR_ADDR}"

# ---- 3. mock price source ----
log "starting mock price source"
PRICE_WS_PORT="$PRICE_WS_PORT" PRICE_HTTP_PORT="$PRICE_HTTP_PORT" \
  node "${ROOT_DIR}/scripts/testnet/lane3-mock-price-source.mjs" > "$MOCK_LOG" 2>&1 &
MOCK_PID=$!

# wait for ws ready
for i in {1..30}; do
  if curl -s "http://127.0.0.1:${PRICE_HTTP_PORT}/status/quotes" >/dev/null 2>&1; then break; fi
  sleep 0.1
  if (( i == 30 )); then fail "mock price source never bound HTTP on :${PRICE_HTTP_PORT}"; exit 1; fi
done
log "mock ready (WS :${PRICE_WS_PORT}, HTTP :${PRICE_HTTP_PORT})"

# ---- 4. oracle-signer ----
log "building oracle-signer (npx tsc)"
(
  cd "${ROOT_DIR}/backend/oracle-signer"
  if [[ ! -d node_modules ]]; then npm install --silent; fi
  npx tsc
) > "${RUNDIR}/build.log" 2>&1 || { fail "oracle-signer build failed"; exit 1; }

log "starting oracle-signer (both rails)"
ORACLE_SIGNER_KEY="$ANVIL_KEY" \
ORACLE_SIGNER_PORT="$ORACLE_SIGNER_PORT" \
PRICE_SERVICE_URL="ws://127.0.0.1:${PRICE_WS_PORT}" \
L2_RPC_URL="http://127.0.0.1:${ANVIL_PORT}" \
STOCK_ORACLE_V2_ADDRESS="$STOCK_ORACLE_V2_ADDRESS" \
SWAP_PRICE_ORACLE_ADDRESS="$SWAP_PRICE_ORACLE_ADDRESS" \
CRYPTO_SYMBOL_MAP="$CRYPTO_SYMBOL_MAP" \
ORACLE_SIGNER_ALLOWED_CHAIN_IDS=31337 \
ORACLE_UPDATE_INTERVAL=2000 \
ORACLE_MIN_DEVIATION=0 \
ORACLE_AUDIT_LOG_DIR="${RUNDIR}/audit" \
  node "${ROOT_DIR}/backend/oracle-signer/dist/index.js" > "$SIGNER_LOG" 2>&1 &
SIGNER_PID=$!

# wait for /health
for i in {1..30}; do
  if curl -s "http://127.0.0.1:${ORACLE_SIGNER_PORT}/health" >/dev/null 2>&1; then break; fi
  sleep 0.2
  if (( i == 30 )); then fail "oracle-signer never bound :${ORACLE_SIGNER_PORT}"; exit 1; fi
done
log "oracle-signer up on :${ORACLE_SIGNER_PORT}"

# ---- 5. poll /proof for at least 1 stocks + 1 crypto tx ----
log "waiting up to ${SMOKE_TIMEOUT_S}s for one stocks tx and one crypto tx"
deadline=$(( $(date +%s) + SMOKE_TIMEOUT_S ))
PROOF=""
while (( $(date +%s) < deadline )); do
  PROOF="$(curl -s "http://127.0.0.1:${ORACLE_SIGNER_PORT}/proof" 2>/dev/null || true)"
  if [[ -n "$PROOF" ]]; then
    if node -e "
      const d = JSON.parse(process.argv[1]);
      if ((d.stocks ?? []).length > 0 && (d.crypto ?? []).length > 0) process.exit(0);
      process.exit(2);
    " "$PROOF" 2>/dev/null; then
      break
    fi
  fi
  sleep 1
done
if ! node -e "
  const d = JSON.parse(process.argv[1]);
  if ((d.stocks ?? []).length === 0) { console.error('no stocks tx'); process.exit(1); }
  if ((d.crypto ?? []).length === 0) { console.error('no crypto tx'); process.exit(1); }
" "$PROOF" 2>/dev/null; then
  fail "did not observe both rails publishing within ${SMOKE_TIMEOUT_S}s"
  exit 1
fi
log "proof observed: stocks + crypto rails both published"

# ---- 6. on-chain price reads ----
# cast's stringified uint output is "<dec> [<sci>]"; strip the bracketed sci.
AAPL_PRICE8_RAW="$(cast call "$STOCK_ORACLE_V2_ADDRESS" 'getPrice(string)(uint256)' AAPL --rpc-url "http://127.0.0.1:${ANVIL_PORT}" 2>/dev/null || echo 0)"
AAPL_PRICE8="${AAPL_PRICE8_RAW%% *}"
WETH_TUPLE_RAW="$(cast call "$SWAP_PRICE_ORACLE_ADDRESS" 'getPriceUnsafe(address)(uint256,uint256)' "$WETH_ADDR" --rpc-url "http://127.0.0.1:${ANVIL_PORT}" 2>/dev/null || echo '0 0')"
WETH_PRICE8_RAW="$(echo "$WETH_TUPLE_RAW" | head -1)"
WETH_PRICE8="${WETH_PRICE8_RAW%% *}"

if [[ "$AAPL_PRICE8" == "0" ]]; then fail "AAPL price on StockOracleV2 is zero"; exit 1; fi
if [[ "$WETH_PRICE8" == "0" ]]; then fail "WETH price on SwapPriceOracle is zero"; exit 1; fi

# ---- 7. write proof JSON ----
mkdir -p "$PROOF_OUT_DIR"
STOCK_TX="$(node -e "process.stdout.write(JSON.parse(process.argv[1]).stocks[0].txHash)" "$PROOF")"
SWAP_TX="$(node -e "process.stdout.write(JSON.parse(process.argv[1]).crypto[0].txHash)" "$PROOF")"
cat > "$PROOF_OUT" <<EOF
{
  "lane": "lane3-oracle-publishing",
  "generatedAt": $(date +%s),
  "chainId": 31337,
  "stockOracleV2": "${STOCK_ORACLE_V2_ADDRESS}",
  "swapPriceOracle": "${SWAP_PRICE_ORACLE_ADDRESS}",
  "stockTx": "${STOCK_TX}",
  "swapTx": "${SWAP_TX}",
  "aaplPrice8": ${AAPL_PRICE8},
  "wethPrice8": ${WETH_PRICE8}
}
EOF
# Sanity-check the proof JSON; reject if the on-chain price field is not a number.
if ! node -e "
  const p = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
  if (typeof p.aaplPrice8 !== 'number' || p.aaplPrice8 <= 0) process.exit(1);
  if (typeof p.wethPrice8 !== 'number' || p.wethPrice8 <= 0) process.exit(1);
" "$PROOF_OUT"; then
  fail "proof JSON failed validation (price field must be a positive number)"
  exit 1
fi
log "OK — proof written to $PROOF_OUT"
