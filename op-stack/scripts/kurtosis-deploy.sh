#!/bin/bash

# ============================================================
# GoodDollar L2 — Deploy Contracts to Kurtosis Enclave
# ============================================================
# Deploys all GoodDollar contracts to the local Kurtosis L2 in
# dependency order. Auto-detects the L2 RPC from the running
# enclave.
#
# Usage:
#   ./scripts/kurtosis-deploy.sh              # deploy all
#   ./scripts/kurtosis-deploy.sh --only swap  # deploy one module
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ONLY_MODULE="${1:-all}"

# ── Detect L2 RPC from Kurtosis ──

detect_l2_rpc() {
    if ! command -v kurtosis &>/dev/null; then
        echo -e "${RED}Error: kurtosis CLI not found${NC}"
        exit 1
    fi

    ENCLAVE=$(kurtosis enclave ls 2>/dev/null | grep -i "RUNNING" | awk '{print $1}' | head -1)
    if [ -z "$ENCLAVE" ]; then
        echo -e "${RED}Error: No running Kurtosis enclave found${NC}"
        echo "Start one with: make kurtosis-up"
        exit 1
    fi

    INSPECT=$(kurtosis enclave inspect "$ENCLAVE" 2>&1)

    # Try to find op-geth L2 RPC port
    L2_RPC=$(echo "$INSPECT" | grep -A5 "op-el-1-op-geth" | grep "rpc: 8545/tcp" | grep -oE '127\.0\.0\.1:[0-9]+' | head -1)
    if [ -z "$L2_RPC" ]; then
        L2_RPC=$(echo "$INSPECT" | grep -A10 "op-el-1-op-geth" | grep -oE '127\.0\.0\.1:[0-9]+' | head -1)
    fi

    if [ -z "$L2_RPC" ]; then
        echo -e "${RED}Error: Could not detect L2 RPC from enclave '$ENCLAVE'${NC}"
        echo "Run 'kurtosis enclave inspect $ENCLAVE' to find the L2 RPC port"
        exit 1
    fi

    echo "http://$L2_RPC"
}

# ── Deploy helper ──

DEPLOYED=()  # track deployed addresses

deploy_script() {
    local script_name="$1"
    local description="$2"
    shift 2
    local env_vars=("$@")

    echo ""
    echo -e "${BLUE}━━━ Deploying: ${description} ━━━${NC}"
    echo -e "  Script: ${script_name}"

    local env_prefix=""
    for ev in "${env_vars[@]}"; do
        env_prefix="$env_prefix $ev"
    done

    cd "$REPO_ROOT"

    # Run forge script, capture output
    local output
    if output=$(eval $env_prefix forge script "script/${script_name}" \
        --rpc-url "$RPC_URL" \
        --broadcast \
        --legacy 2>&1); then
        echo -e "  ${GREEN}✅ Success${NC}"

        # Extract deployed contract addresses from output
        local addrs
        addrs=$(echo "$output" | grep -iE '(deployed|contract|address).*0x[0-9a-fA-F]{40}' | grep -oE '0x[0-9a-fA-F]{40}' || true)
        if [ -n "$addrs" ]; then
            echo -e "  ${CYAN}Addresses:${NC}"
            echo "$addrs" | while read -r addr; do
                echo -e "    $addr"
            done
        fi

        # Also show the console.log lines from forge
        echo "$output" | grep -E "^\s*(Deployed|Created|Set |Granted|Minted)" || true

        return 0
    else
        echo -e "  ${RED}❌ Failed${NC}"
        echo "$output" | tail -20
        return 1
    fi
}

# ── Main ──

echo ""
echo -e "${CYAN}┌──────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│  GoodDollar L2 — Contract Deployment         │${NC}"
echo -e "${CYAN}│  Target: Kurtosis Local Enclave               │${NC}"
echo -e "${CYAN}└──────────────────────────────────────────────┘${NC}"

# Use env override or auto-detect
if [ -n "$L2_RPC_URL" ]; then
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
    echo "Wait for the chain to start or check 'make kurtosis-status'"
    exit 1
fi

CHAIN_DEC=$(printf "%d" "$CHAIN_ID" 2>/dev/null || echo "unknown")
echo -e "${GREEN}L2 connected — Chain ID: $CHAIN_DEC${NC}"

# Default private key: Anvil/Kurtosis dev account #0
export PRIVATE_KEY="${PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"

# ── Deploy in dependency order ──
# Phase 1: Core (no dependencies)
# Phase 2: Depends on GoodDollarToken / UBIFeeSplitter
# Phase 3: Depends on Phase 2 outputs

FAIL_COUNT=0

should_deploy() {
    local module="$1"
    [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "--only" ] || [ "$ONLY_MODULE" = "$module" ] || \
    ([ "$1" = "$2" ] 2>/dev/null)
}

# Handle --only flag
if [ "$ONLY_MODULE" = "--only" ]; then
    ONLY_MODULE="${2:-all}"
fi

echo ""
echo -e "${YELLOW}Phase 1: Core Contracts (no dependencies)${NC}"

PHASE1_SCRIPTS=(
    "DeployGovernance.s.sol:Governance (Timelock + Governor):governance"
    "DeployTimelock.s.sol:Timelock:timelock"
    "DeployAgentRegistry.s.sol:Agent Registry:agents"
    "DeployValidatorStaking.s.sol:Validator Staking:staking"
    "DeployOptimisticResolver.s.sol:Optimistic Resolver:resolver"
    "DeployMultiChainBridge.s.sol:Multi-Chain Bridge:bridge"
    "DeploySwapPriceOracle.s.sol:Swap Price Oracle:oracle"
    "DeployPerps.s.sol:Perpetuals Engine:perps"
)

for entry in "${PHASE1_SCRIPTS[@]}"; do
    IFS=':' read -r script desc module <<< "$entry"
    if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "$module" ]; then
        deploy_script "$script" "$desc" || ((FAIL_COUNT++))
    fi
done

echo ""
echo -e "${YELLOW}Phase 2: DeFi Infrastructure${NC}"

PHASE2_SCRIPTS=(
    "DeploySwapInfra.s.sol:Swap Infrastructure (Router + Pools):swap-infra"
    "DeployGoodSwap.s.sol:GoodSwap DEX (UBI Fee Hook):swap"
    "DeployGoodLend.s.sol:GoodLend (Lending Protocol):lend"
    "DeployGoodStable.s.sol:GoodStable (Stablecoin):stable"
    "DeployGoodStocks.s.sol:GoodStocks (Synthetic Stocks):stocks"
    "DeployGoodYield.s.sol:GoodYield (Yield Vaults):yield"
)

for entry in "${PHASE2_SCRIPTS[@]}"; do
    IFS=':' read -r script desc module <<< "$entry"
    if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "$module" ]; then
        deploy_script "$script" "$desc" || ((FAIL_COUNT++))
    fi
done

echo ""
echo -e "${YELLOW}Phase 3: Application Layer${NC}"

PHASE3_SCRIPTS=(
    "DeployUBIClaimV2.s.sol:UBI Claims V2:ubi"
    "DeployUBIRevenueTracker.s.sol:UBI Revenue Tracker:revenue"
    "DeployLiFiBridgeAggregator.s.sol:LiFi Bridge Aggregator:lifi"
    "DeployFastWithdrawalLP.s.sol:Fast Withdrawal LP:withdrawal"
    "DeployInitialVaults.s.sol:Initial Vaults:vaults"
)

for entry in "${PHASE3_SCRIPTS[@]}"; do
    IFS=':' read -r script desc module <<< "$entry"
    if [ "$ONLY_MODULE" = "all" ] || [ "$ONLY_MODULE" = "$module" ]; then
        deploy_script "$script" "$desc" || ((FAIL_COUNT++))
    fi
done

# ── Summary ──

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ All deployments succeeded!${NC}"
else
    echo -e "${YELLOW}⚠️  $FAIL_COUNT deployment(s) failed${NC}"
    echo -e "   Re-run failed modules with: make kurtosis-deploy ONLY=<module>"
fi
echo ""
echo -e "${CYAN}Tip:${NC} Verify with:"
echo "  cd $REPO_ROOT && forge script script/CheckDevnetState.s.sol --rpc-url $RPC_URL"
echo ""
