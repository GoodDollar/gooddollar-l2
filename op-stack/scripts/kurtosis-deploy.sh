#!/bin/bash

# ============================================================
# GoodDollar L2 — Deploy Contracts to Kurtosis Enclave
# ============================================================
# Deploys all GoodDollar contracts to a local Kurtosis (or any
# devnet) L2 in dependency order.
#
# Auto-detects the L2 RPC from a running Kurtosis enclave, or
# you can override with L2_RPC_URL env var.
#
# Usage:
#   ./scripts/kurtosis-deploy.sh              # deploy all
#   ./scripts/kurtosis-deploy.sh --only swap  # deploy one module
#   L2_RPC_URL=http://localhost:8545 ./scripts/kurtosis-deploy.sh
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Parse args
ONLY_MODULE="all"
if [ "${1:-}" = "--only" ] && [ -n "${2:-}" ]; then
    ONLY_MODULE="$2"
elif [ -n "${1:-}" ] && [ "${1:-}" != "--only" ]; then
    ONLY_MODULE="$1"
fi

# ── Detect L2 RPC from Kurtosis ──

detect_l2_rpc() {
    if ! command -v kurtosis &>/dev/null; then
        echo -e "${RED}Error: kurtosis CLI not found${NC}" >&2
        exit 1
    fi

    local enclave
    enclave=$(kurtosis enclave ls 2>/dev/null | grep -i "RUNNING" | awk '{print $1}' | head -1)
    if [ -z "$enclave" ]; then
        echo -e "${RED}Error: No running Kurtosis enclave found${NC}" >&2
        echo "Start one with: make kurtosis-up" >&2
        exit 1
    fi

    local inspect
    inspect=$(kurtosis enclave inspect "$enclave" 2>&1)

    local l2_rpc
    l2_rpc=$(echo "$inspect" | grep -A2 "op-el-.*op-geth" | grep "rpc: 8545" | grep -oE '127\.0\.0\.1:[0-9]+' | head -1)
    if [ -z "$l2_rpc" ]; then
        l2_rpc=$(echo "$inspect" | grep -A5 "op-el-" | grep "rpc: 8545" | grep -oE '127\.0\.0\.1:[0-9]+' | head -1)
    fi

    if [ -z "$l2_rpc" ]; then
        echo -e "${RED}Error: Could not detect L2 RPC from enclave '$enclave'${NC}" >&2
        exit 1
    fi

    echo "http://$l2_rpc"
}

# ── Deploy helper ──

FAIL_COUNT=0
DEPLOY_LOG="$REPO_ROOT/.kurtosis-deploy.log"
> "$DEPLOY_LOG"  # truncate

# Extract deployed address from forge broadcast output
# Looks for "Deployed <Name> at: 0x..." or "new <Name>@0x..." patterns
extract_address() {
    local label="$1"
    local output="$2"
    # Try console.log pattern first: "Label: 0x..."  or "Label deployed at: 0x..."
    local addr
    addr=$(echo "$output" | grep -i "$label" | grep -oE '0x[0-9a-fA-F]{40}' | head -1)
    echo "$addr"
}

deploy_script() {
    local script_name="$1"
    local tc_name="$2"         # --tc contract name (empty = auto)
    local description="$3"
    shift 3
    local extra_env=("$@")

    echo ""
    echo -e "${BLUE}━━━ Deploying: ${description} ━━━${NC}"
    echo -e "  Script: ${script_name}${tc_name:+ (--tc $tc_name)}"

    cd "$REPO_ROOT"

    # Build forge command
    local cmd="forge script script/${script_name} --rpc-url $RPC_URL --broadcast --legacy"
    if [ -n "$tc_name" ]; then
        cmd="$cmd --tc $tc_name"
    fi

    # Build env prefix
    local env_prefix=""
    for ev in "${extra_env[@]}"; do
        env_prefix="$env_prefix $ev"
    done

    # Run
    local output
    set +e
    output=$(eval $env_prefix $cmd 2>&1)
    local exit_code=$?
    set -e

    # forge returns 1 with "default sender" warning even on success
    # Check if transactions were actually broadcast
    local has_txs=false
    if echo "$output" | grep -q "Transactions saved to:"; then
        has_txs=true
    fi

    if [ $exit_code -eq 0 ] || [ "$has_txs" = true ]; then
        echo -e "  ${GREEN}✅ Success${NC}"
        # Show console.log lines
        echo "$output" | grep -E "^\s*(  |Deployed|deployed|Created|Set |Granted|Minted|VaultFactory|GoodDollarToken|UBIFeeSplitter|UBIClaimV2|GoodDAO|VoteEscrowedGD|GoodTimelock|PerpEngine|GoodSwapRouter|GoodLend|MockPoolManager)" | head -20 || true
        # Save full output for address extraction
        echo "=== $script_name ===" >> "$DEPLOY_LOG"
        echo "$output" >> "$DEPLOY_LOG"
        return 0
    else
        echo -e "  ${RED}❌ Failed${NC}"
        echo "$output" | grep -E "Error|error|revert|FAIL|panic" | head -5
        echo ""
        echo "$output" | tail -10
        ((FAIL_COUNT++)) || true
        return 1
    fi
}

# ── Main ──

echo ""
echo -e "${CYAN}┌──────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│  GoodDollar L2 — Contract Deployment         │${NC}"
echo -e "${CYAN}│  Target: Kurtosis / Local Devnet              │${NC}"
echo -e "${CYAN}└──────────────────────────────────────────────┘${NC}"

# Use env override or auto-detect
if [ -n "${L2_RPC_URL:-}" ]; then
    RPC_URL="$L2_RPC_URL"
    echo -e "${BLUE}Using L2 RPC from env:${NC} $RPC_URL"
else
    RPC_URL=$(detect_l2_rpc)
    echo -e "${BLUE}Auto-detected L2 RPC:${NC} $RPC_URL"
fi

# Verify L2 is alive
CHAIN_ID=$(curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
    "$RPC_URL" 2>/dev/null | jq -r '.result' 2>/dev/null)

if [ -z "$CHAIN_ID" ] || [ "$CHAIN_ID" = "null" ]; then
    echo -e "${RED}Error: L2 not responding at $RPC_URL${NC}"
    exit 1
fi

CHAIN_DEC=$(printf "%d" "$CHAIN_ID" 2>/dev/null || echo "unknown")
echo -e "${GREEN}L2 connected — Chain ID: $CHAIN_DEC${NC}"

# Default private key: Anvil/Kurtosis dev account #0 (pre-funded with ETH)
export PRIVATE_KEY="${PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
DEV_ADDR="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

echo -e "${GREEN}Deployer:${NC}"
echo -e "  ${BLUE}Address:${NC}     $DEV_ADDR"
echo -e "  ${BLUE}Private Key:${NC} ${PRIVATE_KEY:0:10}...${PRIVATE_KEY: -4}"

# Check deployer balance
BAL_HEX=$(curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'"$DEV_ADDR"'","latest"],"id":1}' \
    "$RPC_URL" 2>/dev/null | jq -r '.result' 2>/dev/null)
if [ -n "$BAL_HEX" ] && [ "$BAL_HEX" != "null" ] && [ "$BAL_HEX" != "0x0" ]; then
    BAL_DEC=$(printf "%d" "$BAL_HEX" 2>/dev/null || echo "0")
    BAL_ETH=$(echo "scale=4; $BAL_DEC / 1000000000000000000" | bc 2>/dev/null || echo "unknown")
    echo -e "  ${BLUE}L2 Balance:${NC}  ${BAL_ETH} ETH"
else
    echo -e "  ${RED}⚠️  Deployer has 0 ETH! Deployments will fail.${NC}"
    echo -e "  ${YELLOW}Check that fund_dev_accounts: true is set in kurtosis-params.yaml${NC}"
    exit 1
fi

SENDER_FLAG="--sender $DEV_ADDR"

# ════════════════════════════════════════════════════════════
# Phase 0: Core Token + Fee Splitter (everything depends on these)
# ════════════════════════════════════════════════════════════

echo ""
echo -e "${YELLOW}Phase 0: Core Tokens (GoodDollarToken + UBIFeeSplitter)${NC}"

# DeployGoodSwap deploys GDT + UBIFeeSplitter when env vars are empty,
# and also deploys MockPoolManager + UBIFeeHook + GoodSwapRouter.
# We use it as the bootstrap deployer.

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "core" ] || [ "$ONLY_MODULE" = "swap" ]; then
    deploy_script "DeployGoodSwap.s.sol" "DeployGoodSwap" \
        "GoodSwap + Core Tokens (GDT, UBIFeeSplitter, Hook, Router)"
fi

# Extract core addresses from the deploy log
GD_TOKEN=$(grep -i "GoodDollarToken" "$DEPLOY_LOG" | grep -oE '0x[0-9a-fA-F]{40}' | head -1)
UBI_SPLITTER=$(grep -i "UBIFeeSplitter" "$DEPLOY_LOG" | grep -oE '0x[0-9a-fA-F]{40}' | head -1)

if [ -n "$GD_TOKEN" ]; then
    echo -e "\n  ${CYAN}GoodDollarToken:${NC}  $GD_TOKEN"
    export GOOD_DOLLAR_TOKEN="$GD_TOKEN"
else
    echo -e "\n  ${YELLOW}⚠️  Could not extract GoodDollarToken address — dependent scripts may fail${NC}"
fi

if [ -n "$UBI_SPLITTER" ]; then
    echo -e "  ${CYAN}UBIFeeSplitter:${NC}   $UBI_SPLITTER"
    export UBI_FEE_SPLITTER="$UBI_SPLITTER"
    export UBI_FEE="$UBI_SPLITTER"
else
    echo -e "  ${YELLOW}⚠️  Could not extract UBIFeeSplitter address — dependent scripts may fail${NC}"
fi

# ════════════════════════════════════════════════════════════
# Phase 1: Governance & Infrastructure (depend on GDT/Splitter)
# ════════════════════════════════════════════════════════════

echo ""
echo -e "${YELLOW}Phase 1: Governance & Infrastructure${NC}"

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "governance" ]; then
    # DeployGovernance uses bare vm.startBroadcast() — needs --sender
    deploy_script "DeployGovernance.s.sol" "" \
        "Governance (VoteEscrowedGD + GoodDAO)" \
        || true
fi

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "timelock" ]; then
    deploy_script "DeployTimelock.s.sol" "" \
        "Timelock" \
        || true
fi

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "agents" ]; then
    deploy_script "DeployAgentRegistry.s.sol" "" "Agent Registry" || true
fi

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "staking" ]; then
    deploy_script "DeployValidatorStaking.s.sol" "" "Validator Staking" || true
fi

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "resolver" ]; then
    deploy_script "DeployOptimisticResolver.s.sol" "" "Optimistic Resolver" || true
fi

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "bridge" ]; then
    deploy_script "DeployMultiChainBridge.s.sol" "" "Multi-Chain Bridge" || true
fi

# ════════════════════════════════════════════════════════════
# Phase 2: DeFi Protocols
# ════════════════════════════════════════════════════════════

echo ""
echo -e "${YELLOW}Phase 2: DeFi Protocols${NC}"

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "oracle" ]; then
    deploy_script "DeploySwapPriceOracle.s.sol" "" "Swap Price Oracle" || true
fi

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "swap-infra" ]; then
    deploy_script "DeploySwapInfra.s.sol" "DeploySwapInfra" \
        "Swap Infrastructure (Router + Pools)" || true
fi

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "perps" ]; then
    deploy_script "DeployPerps.s.sol" "" "Perpetuals Engine" || true
fi

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "lend" ]; then
    deploy_script "DeployGoodLend.s.sol" "DeployGoodLend" \
        "GoodLend (Lending Protocol)" || true
fi

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "stable" ]; then
    deploy_script "DeployGoodStable.s.sol" "DeployGoodStable" \
        "GoodStable (Stablecoin)" || true
fi

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "stocks" ]; then
    deploy_script "DeployGoodStocks.s.sol" "" \
        "GoodStocks (Synthetic Stocks)" \
        || true
fi

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "yield" ]; then
    deploy_script "DeployGoodYield.s.sol" "" \
        "GoodYield (Vault Factory)" \
        "UBI_FEE=${UBI_SPLITTER:-0x0000000000000000000000000000000000000001}" \
        || true
fi

# Extract addresses from Phase 2 deploys for Phase 3 (InitialVaults needs these)
VAULT_FACTORY=$(grep -i "VaultFactory deployed" "$DEPLOY_LOG" | grep -oE '0x[0-9a-fA-F]{40}' | head -1)
GOOD_LEND_POOL=$(grep -i "GoodLendPool deployed" "$DEPLOY_LOG" | grep -oE '0x[0-9a-fA-F]{40}' | head -1)
MOCK_WETH=$(grep -i "MockWETH deployed" "$DEPLOY_LOG" | grep -oE '0x[0-9a-fA-F]{40}' | head -1)
G_TOKEN_WETH=$(grep -i "gWETH deployed" "$DEPLOY_LOG" | grep -oE '0x[0-9a-fA-F]{40}' | head -1)
GUSD=$(grep -i "gUSD deployed" "$DEPLOY_LOG" | grep -oE '0x[0-9a-fA-F]{40}' | head -1)
STABILITY_POOL=$(grep -i "StabilityPool deployed" "$DEPLOY_LOG" | grep -oE '0x[0-9a-fA-F]{40}' | head -1)

[ -n "$VAULT_FACTORY" ]   && export VAULT_FACTORY
[ -n "$GOOD_LEND_POOL" ]  && export GOOD_LEND_POOL
[ -n "$MOCK_WETH" ]       && export WETH="$MOCK_WETH"
[ -n "$G_TOKEN_WETH" ]    && export G_TOKEN_WETH
[ -n "$GUSD" ]            && export GUSD
[ -n "$STABILITY_POOL" ]  && export STABILITY_POOL

# ════════════════════════════════════════════════════════════
# Phase 3: Application Layer
# ════════════════════════════════════════════════════════════

echo ""
echo -e "${YELLOW}Phase 3: Application Layer${NC}"

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "ubi" ]; then
    deploy_script "DeployUBIClaimV2.s.sol" "" \
        "UBI Claims V2" \
        || true
fi

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "revenue" ]; then
    deploy_script "DeployUBIRevenueTracker.s.sol" "" "UBI Revenue Tracker" || true
fi

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "lifi" ]; then
    deploy_script "DeployLiFiBridgeAggregator.s.sol" "" "LiFi Bridge Aggregator" || true
fi

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "withdrawal" ]; then
    deploy_script "DeployFastWithdrawalLP.s.sol" "" "Fast Withdrawal LP" || true
fi

if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "vaults" ]; then
    deploy_script "DeployInitialVaults.s.sol" "DeployInitialVaults" \
        "Initial Vaults" || true
fi

# ════════════════════════════════════════════════════════════
# Summary
# ════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Count successes from log
SUCCESS_COUNT=$(grep -c "^=== Deploy" "$DEPLOY_LOG" 2>/dev/null || echo "0")

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ All deployments succeeded! ($SUCCESS_COUNT scripts)${NC}"
else
    echo -e "${YELLOW}⚠️  $FAIL_COUNT deployment(s) failed, $SUCCESS_COUNT succeeded${NC}"
    echo -e "   Re-run individual modules with: make kurtosis-deploy ONLY=<module>"
    echo -e "   Modules: core swap governance timelock agents staking resolver bridge"
    echo -e "            oracle swap-infra perps lend stable stocks yield"
    echo -e "            ubi revenue lifi withdrawal vaults"
fi

if [ -n "${GD_TOKEN:-}" ] || [ -n "${UBI_SPLITTER:-}" ]; then
    echo ""
    echo -e "${GREEN}Core Addresses:${NC}"
    [ -n "${GD_TOKEN:-}" ] && echo -e "  ${BLUE}GOOD_DOLLAR_TOKEN:${NC} $GD_TOKEN"
    [ -n "${UBI_SPLITTER:-}" ] && echo -e "  ${BLUE}UBI_FEE_SPLITTER:${NC}  $UBI_SPLITTER"
fi

echo ""
echo -e "${CYAN}Full deploy log:${NC} $DEPLOY_LOG"
echo ""
