#!/usr/bin/env bash
# GoodDollar L2 — Auto-redeploy after devnet restart
#
# Checks whether core protocol contracts are deployed at their last-known
# addresses. If the devnet was wiped (OOM restart, down -v, host reprovisioned),
# re-runs all deployment scripts in the correct order.
#
# Usage:
#   bash scripts/redeploy-check.sh [--rpc <url>] [--key <private-key>] [--yes]
#
#   --rpc   RPC URL (default: http://localhost:8545)
#   --key   Private key for broadcasts (default: Anvil funded key)
#   --yes   Skip confirmation prompt

set -euo pipefail

RPC="${RPC:-http://localhost:8545}"
DEPLOYER_KEY="${DEPLOYER_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
FORGE="${FORGE:-/home/goodclaw/.foundry/bin/forge}"
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
AUTO_YES=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --rpc) RPC="$2"; shift 2 ;;
    --key) DEPLOYER_KEY="$2"; shift 2 ;;
    --yes) AUTO_YES=1; shift ;;
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
done

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[redeploy-check]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }

# Read most recently deployed addresses from broadcast artifacts.
# Returns empty string if no broadcast exists yet.
latest_addr() {
  local script="$1" contract="$2"
  local broadcast_dir="$SCRIPT_DIR/broadcast/${script}/42069/run-latest.json"
  if [ -f "$broadcast_dir" ]; then
    python3 -c "
import json, sys
data = json.load(open('$broadcast_dir'))
for tx in data.get('transactions', []):
    if tx.get('contractName') == '$contract' and tx.get('contractAddress'):
        print(tx['contractAddress'])
        sys.exit(0)
print('')
" 2>/dev/null || echo ""
  else
    echo ""
  fi
}

# Check whether bytecode exists at an address.
has_code() {
  local addr="$1"
  [ -z "$addr" ] && return 1
  CODE=$(python3 -c "
import urllib.request, json
req = urllib.request.Request('$RPC',
  data=json.dumps({'jsonrpc':'2.0','method':'eth_getCode','params':['$addr','latest'],'id':1}).encode(),
  headers={'Content-Type':'application/json'})
resp = json.loads(urllib.request.urlopen(req).read())
print(resp.get('result','0x'))
" 2>/dev/null)
  [ "$CODE" != "0x" ] && [ -n "$CODE" ] && [ "$CODE" != "null" ]
}

echo ""
echo "═══════════════════════════════════════════"
echo "  GoodDollar L2 — Devnet State Check"
echo "  RPC: $RPC"
echo "═══════════════════════════════════════════"
echo ""

log "Checking chain connectivity..."
CHAIN_ID=$(python3 -c "
import urllib.request, json
req = urllib.request.Request('$RPC',
  data=json.dumps({'jsonrpc':'2.0','method':'eth_chainId','params':[],'id':1}).encode(),
  headers={'Content-Type':'application/json'})
try:
  resp = json.loads(urllib.request.urlopen(req, timeout=5).read())
  print(int(resp.get('result','0x0'), 16))
except: print(0)
" 2>/dev/null)

if [ "$CHAIN_ID" = "0" ]; then
  err "Cannot connect to RPC at $RPC. Is the devnet running?"
  exit 1
fi
ok "Chain ID: $CHAIN_ID"

MISSING=0
FOUND=0

check_contract() {
  local name="$1" script="$2" contractName="$3"
  local addr
  addr=$(latest_addr "$script" "$contractName")
  if [ -z "$addr" ]; then
    warn "$name — no broadcast artifact found (first deploy?)"
    ((MISSING++))
  elif has_code "$addr"; then
    ok "$name at $addr"
    ((FOUND++))
  else
    err "$name — $addr has no bytecode (devnet was reset)"
    ((MISSING++))
  fi
}

log "Checking deployed contracts..."
echo ""

check_contract "GoodDollarToken"     "RedeployGoodDollarToken.s.sol"  "GoodDollarToken"
check_contract "UBIFeeSplitter"      "RedeployUBIAndLiFi.s.sol"       "UBIFeeSplitter"
check_contract "UBIFeeHook"          "RedeployUBIFeeHook.s.sol"       "UBIFeeHook"
check_contract "GoodLendPool"        "DeployGoodLend.s.sol"           "GoodLendPool"
check_contract "AgentRegistry"       "DeployAgentRegistry.s.sol"      "AgentRegistry"
check_contract "PerpPriceOracle"     "DeployPerps.s.sol"              "PerpPriceOracle"
check_contract "FundingRate"         "DeployPerps.s.sol"              "FundingRate"
check_contract "MarginVault"         "DeployPerps.s.sol"              "MarginVault"
check_contract "PerpEngine"          "DeployPerps.s.sol"              "PerpEngine"
check_contract "SyntheticAssetFact"  "DeployGoodStocks.s.sol"         "SyntheticAssetFactory"
check_contract "ValidatorStaking"    "DeployValidatorStaking.s.sol"   "ValidatorStaking"

echo ""
echo "───────────────────────────────────────────"
echo "  Found: $FOUND  |  Missing: $MISSING"
echo "───────────────────────────────────────────"
echo ""

if [ "$MISSING" = "0" ]; then
  ok "All contracts deployed — devnet state intact."
  exit 0
fi

warn "$MISSING contract(s) missing — devnet may have been reset."
echo ""

if [ "$AUTO_YES" = "0" ]; then
  read -r -p "Re-run deployment scripts? [y/N] " CONFIRM
  [[ "$CONFIRM" =~ ^[Yy]$ ]] || { log "Aborted."; exit 0; }
fi

echo ""
log "Running deployment scripts..."
echo ""

# Deployment scripts in dependency order
SCRIPTS=(
  "script/RedeployGoodDollarToken.s.sol"
  "script/RedeployUBIAndLiFi.s.sol"
  "script/RedeployUBIFeeHook.s.sol"
  "script/DeployAgentRegistry.s.sol"
  "script/DeployGoodLend.s.sol"
  "script/DeployGovernance.s.sol"
  "script/WireUBIFeeSplitter.s.sol"
  "script/DeployPerps.s.sol"
  "script/DeployGoodStocks.s.sol"
  "script/DeployValidatorStaking.s.sol"
)

cd "$SCRIPT_DIR"

# Read the most recently broadcast address for a given script+contract.
addr_from_broadcast() {
  local script="$1" contract="$2"
  local broadcast_file="$SCRIPT_DIR/broadcast/${script}/42069/run-latest.json"
  [ -f "$broadcast_file" ] || { echo ""; return; }
  python3 -c "
import json, sys
data = json.load(open('$broadcast_file'))
for tx in data.get('transactions', []):
    if tx.get('contractName') == '$contract' and tx.get('contractAddress'):
        print(tx['contractAddress'])
        sys.exit(0)
print('')
" 2>/dev/null || echo ""
}

for script in "${SCRIPTS[@]}"; do
  name=$(basename "$script" .s.sol)

  # DeployGoodStocks requires GOOD_DOLLAR_TOKEN and UBI_FEE_SPLITTER.
  # Derive them from sibling broadcast artifacts so the vault is always
  # wired to the currently-deployed token and fee-splitter, not a stale
  # env var from a previous run.
  if [ "$name" = "DeployGoodStocks" ]; then
    GDT=$(addr_from_broadcast "RedeployGoodDollarToken.s.sol" "GoodDollarToken")
    FSP=$(addr_from_broadcast "RedeployUBIAndLiFi.s.sol" "UBIFeeSplitter")
    if [ -z "$GDT" ] || [ -z "$FSP" ]; then
      err "DeployGoodStocks: cannot derive GDT/UBIFeeSplitter from broadcast artifacts — aborting"
      err "  GoodDollarToken : ${GDT:-<not found>}"
      err "  UBIFeeSplitter  : ${FSP:-<not found>}"
      exit 1
    fi
    export GOOD_DOLLAR_TOKEN="$GDT"
    export UBI_FEE_SPLITTER="$FSP"
    log "DeployGoodStocks env: GOOD_DOLLAR_TOKEN=$GDT  UBI_FEE_SPLITTER=$FSP"
  fi

  if [ -f "$script" ]; then
    log "Deploying $name ..."
    $FORGE script "$script" \
      --rpc-url "$RPC" \
      --private-key "$DEPLOYER_KEY" \
      --broadcast \
      --legacy \
      2>&1 | tail -10
    ok "$name done"
  else
    warn "Skipping $name (script not found at $script)"
  fi
done

echo ""
ok "Re-deployment complete. Update any hardcoded addresses in scripts if needed."
echo ""
log "Tip: Run 'bash scripts/redeploy-check.sh' again to verify all contracts are live."
