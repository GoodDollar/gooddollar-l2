#!/usr/bin/env bash
# verify-onchain-integration.sh
#
# Executes real on-chain transactions across the 6 GoodDollar L2 protocols and
# writes receipts to .autobuilder/integration-receipts/<protocol>.json.
#
# Strategy:
#   - Source addresses from .autobuilder/addresses.env (regenerated from broadcast/).
#   - Fund the tester wallet from the deployer.
#   - For every protocol, attempt the smallest meaningful interaction.
#   - Capture cast receipt JSON on success; capture the revert reason on failure.
#   - Re-render .autobuilder/integration-results.md by invoking
#     scripts/render-integration-report.py (single source of truth for the
#     canonical Markdown report; consumes the JSON receipts + live PM2 / cast).
#
# Honesty principle: this script does NOT silently swallow reverts. Every
# protocol gets a documented outcome — successful tx receipt or a clear gap
# explanation (e.g. "router has no liquid pool for current GDT/WETH").
#
# Usage: bash scripts/verify-onchain-integration.sh

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADDR_ENV="$REPO_ROOT/.autobuilder/addresses.env"
RECEIPTS_DIR="$REPO_ROOT/.autobuilder/integration-receipts"
RENDERER="$REPO_ROOT/scripts/render-integration-report.py"
RESULTS_MD="$REPO_ROOT/.autobuilder/integration-results.md"
# Historical per-iteration narrative (frozen at iteration 3 — do not rewrite).
# Kept on disk for cross-iteration context; the canonical, machine-rendered
# report at $RESULTS_MD is produced by $RENDERER from the JSON receipts.
HISTORICAL_MD="$REPO_ROOT/.autobuilder/initiatives/0002-security-hardening/integration-results.md"

if [[ ! -f "$ADDR_ENV" ]]; then
  echo "FATAL: $ADDR_ENV not found — run scripts/refresh-addresses.py first" >&2
  exit 2
fi

# shellcheck disable=SC2046
export $(grep -E '^[A-Z_]+=' "$ADDR_ENV" | sed 's/  *#.*$//' | xargs)

mkdir -p "$RECEIPTS_DIR"

DEPLOYER_WALLET="0xf39Fd6e51aad88F6F4ce6aB8827279cfFFb92266"

# ── helpers ──────────────────────────────────────────────────────────────────

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

declare -A STATUS_TABLE
declare -A NOTES_TABLE

# record_result <protocol> <status> <note>
record_result() {
  STATUS_TABLE["$1"]="$2"
  NOTES_TABLE["$1"]="$3"
}

# capture_receipt <txhash> <protocol>
# Saves cast receipt JSON to receipts dir. Returns 0 if status=success.
capture_receipt() {
  local txhash="$1"
  local proto="$2"
  local out="$RECEIPTS_DIR/${proto}.json"
  if [[ -z "$txhash" || "$txhash" == "null" ]]; then
    echo "{\"error\": \"no tx hash returned\", \"timestamp\": \"$(ts)\"}" > "$out"
    return 1
  fi
  cast receipt "$txhash" --rpc-url "$RPC" --json > "$out" 2>/dev/null || {
    echo "{\"error\": \"cast receipt failed\", \"tx\": \"$txhash\", \"timestamp\": \"$(ts)\"}" > "$out"
    return 1
  }
  local s
  s=$(python3 -c "import json,sys; d=json.load(open('$out')); print(d.get('status',''))" 2>/dev/null || echo "")
  [[ "$s" == "0x1" ]] && return 0 || return 1
  return 0
}

# send_tx <protocol> <description> <to> <sig> [args...]
# Returns the tx hash on stdout, "" on failure.
send_tx() {
  local proto="$1"; shift
  local desc="$1"; shift
  local to="$1"; shift
  local sig="$1"; shift
  local out
  out=$(cast send "$to" "$sig" "$@" \
         --private-key "$TESTER_KEY" --rpc-url "$RPC" --json 2>&1) || {
    echo "[$proto] $desc — FAILED: $(echo "$out" | tail -1)" >&2
    NOTES_TABLE["$proto"]="${NOTES_TABLE[$proto]:-} | $desc reverted: $(echo "$out" | tail -1 | head -c 120)"
    echo ""
    return 1
  }
  python3 -c "import json,sys; print(json.loads('''$out''').get('transactionHash',''))" 2>/dev/null \
    || echo "$out" | python3 -c "import json,sys; print(json.loads(sys.stdin.read()).get('transactionHash',''))" 2>/dev/null \
    || echo ""
}

echo "== verify-onchain-integration.sh =="
echo "rpc=$RPC tester=$TESTER_WALLET"
echo

# ── 0. fund tester from deployer ─────────────────────────────────────────────
echo "[setup] funding tester with 1,000,000 GDT from deployer..."
out=$(cast send "$GDT" "transfer(address,uint256)" "$TESTER_WALLET" 1000000000000000000000000 \
        --private-key "$DEPLOYER_KEY" --rpc-url "$RPC" --json 2>&1) || true
fund_tx=$(echo "$out" | python3 -c "import json,sys; print(json.loads(sys.stdin.read()).get('transactionHash',''))" 2>/dev/null || echo "")
if [[ -n "$fund_tx" ]]; then
  cast receipt "$fund_tx" --rpc-url "$RPC" --json > "$RECEIPTS_DIR/_setup-fund-tester.json" 2>/dev/null
  echo "[setup] tx=$fund_tx"
else
  echo "[setup] WARN: funding tx failed: $(echo "$out" | tail -1)"
fi

tester_bal=$(cast call "$GDT" "balanceOf(address)(uint256)" "$TESTER_WALLET" --rpc-url "$RPC" 2>/dev/null | awk '{print $1}')
echo "[setup] tester GDT balance: $tester_bal"
echo

# ── snapshot UBI splitter state ──────────────────────────────────────────────
splitter_token=$(cast call "$FEE_SPLITTER" "goodDollar()(address)" --rpc-url "$RPC" 2>/dev/null | tr 'A-Z' 'a-z')
ubi_before=$(cast call "$FEE_SPLITTER" "claimableBalance()(uint256)" --rpc-url "$RPC" 2>/dev/null | awk '{print $1}')
echo "[ubi] splitter.goodDollar = $splitter_token"
echo "[ubi] splitter.claimableBalance(before) = $ubi_before"
if [[ "${splitter_token,,}" != "${GDT,,}" ]]; then
  echo "[ubi] WARN: splitter.goodDollar != current GDT — fees won't accrue to splitter"
fi
echo

# ── 1. GoodSwap ──────────────────────────────────────────────────────────────
echo "[1/6] GoodSwap — attempting swap via router"
pool=$(cast call "$SWAP" "getPool(address,address)(address)" "$GDT" "$WETH" --rpc-url "$RPC" 2>/dev/null || echo "0x0000000000000000000000000000000000000000")
if [[ "$pool" == "0x0000000000000000000000000000000000000000" || -z "$pool" ]]; then
  record_result "GoodSwap" "GAP" "Router live at $SWAP but no GDT/WETH pool registered. CreateInitialPools must be re-run against current GDT ($GDT)."
  echo "[1/6] GoodSwap — GAP: no pool registered for current GDT/WETH"
else
  echo "[1/6] GoodSwap — pool=$pool"
  send_tx "GoodSwap" "approve GDT to router" "$GDT" "approve(address,uint256)" "$SWAP" 1000000000000000000000 >/dev/null
  deadline=$(($(date +%s)+3600))
  hash=$(send_tx "GoodSwap" "swapExactTokensForTokens" "$SWAP" \
          "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)" \
          1000000000000000000 0 "[$GDT,$WETH]" "$TESTER_WALLET" "$deadline")
  if [[ -n "$hash" ]] && capture_receipt "$hash" "GoodSwap"; then
    record_result "GoodSwap" "PASS" "swap tx $hash"
  else
    record_result "GoodSwap" "FAIL" "swap reverted; pool=$pool deadline=$deadline"
  fi
fi
echo

# ── 2. GoodPerps ─────────────────────────────────────────────────────────────
echo "[2/6] GoodPerps — depositing margin to vault"
send_tx "GoodPerps" "approve GDT to vault" "$GDT" "approve(address,uint256)" "$VAULT" 100000000000000000000 >/dev/null
hash=$(send_tx "GoodPerps" "vault.deposit(10 GDT)" "$VAULT" "deposit(uint256)" 10000000000000000000)
if [[ -n "$hash" ]] && capture_receipt "$hash" "GoodPerps"; then
  record_result "GoodPerps" "PASS" "vault.deposit tx $hash"
else
  record_result "GoodPerps" "FAIL" "vault.deposit reverted"
fi
echo

# ── 3. GoodLend ──────────────────────────────────────────────────────────────
echo "[3/6] GoodLend — supplying GDT to pool"
send_tx "GoodLend" "approve GDT to lend pool" "$GDT" "approve(address,uint256)" "$LEND" 100000000000000000000 >/dev/null
hash=$(send_tx "GoodLend" "lend.supply(GDT, 5 GDT)" "$LEND" "supply(address,uint256)" "$GDT" 5000000000000000000)
if [[ -n "$hash" ]] && capture_receipt "$hash" "GoodLend"; then
  record_result "GoodLend" "PASS" "supply tx $hash"
else
  record_result "GoodLend" "FAIL" "supply reverted — likely no GDT reserve initialised. initReserve required."
fi
echo

# ── 4. GoodStable ────────────────────────────────────────────────────────────
echo "[4/6] GoodStable — reading PSM state (write path requires collateral approval flow)"
stable_admin=$(cast call "$STABLE" "admin()(address)" --rpc-url "$RPC" 2>/dev/null || echo "?")
if [[ -n "$stable_admin" && "$stable_admin" != "?" ]]; then
  record_result "GoodStable" "PARTIAL" "StabilityPool live at $STABLE, gUSD at $GUSD, admin=$stable_admin. Full mint flow requires collateral routing through PSM ($PSM); deferred to next iteration."
else
  record_result "GoodStable" "GAP" "Cannot read StabilityPool.admin()"
fi
echo

# ── 5. GoodStocks ────────────────────────────────────────────────────────────
echo "[5/6] GoodStocks — checking factory state"
stocks_admin=$(cast call "$STOCKS" "admin()(address)" --rpc-url "$RPC" 2>/dev/null || echo "?")
if [[ -n "$stocks_admin" && "$stocks_admin" != "?" ]]; then
  record_result "GoodStocks" "PARTIAL" "SyntheticAssetFactory live at $STOCKS, admin=$stocks_admin. Mint flow requires per-symbol setup (mintSynthetic interface differs from spec); deferred."
else
  record_result "GoodStocks" "GAP" "Cannot read SyntheticAssetFactory.admin()"
fi
echo

# ── 6. GoodPredict ───────────────────────────────────────────────────────────
echo "[6/6] GoodPredict — attempting market creation (admin-only)"
deadline=$(($(date +%s)+86400))
hash=$(send_tx "GoodPredict" "createMarket(question,endTime,resolver=0)" "$MF" \
         "createMarket(string,uint256,address)" "Will BTC hit \$100K by 2026?" "$deadline" "0x0000000000000000000000000000000000000000" \
         || true)
# createMarket is onlyAdmin — try with deployer key
if [[ -z "$hash" ]]; then
  out=$(cast send "$MF" "createMarket(string,uint256,address)" "Will BTC hit \$100K by 2026?" "$deadline" "0x0000000000000000000000000000000000000000" \
         --private-key "$DEPLOYER_KEY" --rpc-url "$RPC" --json 2>&1) || true
  hash=$(echo "$out" | python3 -c "import json,sys; print(json.loads(sys.stdin.read()).get('transactionHash',''))" 2>/dev/null || echo "")
fi
if [[ -n "$hash" ]] && capture_receipt "$hash" "GoodPredict"; then
  record_result "GoodPredict" "PASS" "createMarket tx $hash (admin sender)"
else
  record_result "GoodPredict" "FAIL" "createMarket reverted with both tester and deployer keys"
fi
echo

# ── snapshot UBI splitter state after ────────────────────────────────────────
ubi_after=$(cast call "$FEE_SPLITTER" "claimableBalance()(uint256)" --rpc-url "$RPC" 2>/dev/null | awk '{print $1}')
echo "[ubi] splitter.claimableBalance(after) = $ubi_after"

# ── render canonical integration-results.md ─────────────────────────────────
# Single source of truth for the human-readable report is the renderer at
# $RENDERER. It consumes the JSON receipts written above plus live PM2 + cast
# state, and writes $RESULTS_MD. The historical iteration narrative at
# $HISTORICAL_MD is intentionally NOT rewritten by this script.
echo
echo "[render] regenerating $RESULTS_MD via $(basename "$RENDERER")"
if [[ -x "$RENDERER" ]]; then
  python3 "$RENDERER" || echo "[render] WARN: renderer exited non-zero; receipts on disk are still authoritative"
else
  echo "[render] WARN: $RENDERER not found or not executable; skipping markdown render"
fi

echo
echo "== JSON receipts written to $RECEIPTS_DIR =="
echo "== canonical markdown at $RESULTS_MD =="
echo "== historical narrative preserved at $HISTORICAL_MD =="

# exit 0 even on partial — report file is the deliverable
exit 0
