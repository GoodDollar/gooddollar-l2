#!/bin/bash

# ============================================================
# GoodDollar L2 — Kurtosis Enclave Info
# ============================================================
# Extracts and displays useful connection info from a running
# Kurtosis OP Stack enclave.
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check if kurtosis is available
if ! command -v kurtosis &>/dev/null; then
    echo -e "${RED}Error: kurtosis CLI not found${NC}"
    echo "Install: curl -L https://install.kurtosis.com | bash"
    exit 1
fi

# Auto-detect enclave name if not provided
if [ -n "$1" ]; then
    ENCLAVE_NAME="$1"
else
    # Find the first running enclave (Kurtosis may name it differently)
    ENCLAVE_NAME=$(kurtosis enclave ls 2>/dev/null | grep -i "RUNNING" | awk '{print $1}' | head -1)
    if [ -z "$ENCLAVE_NAME" ]; then
        echo -e "${RED}Error: No running Kurtosis enclave found${NC}"
        echo ""
        echo "Available enclaves:"
        kurtosis enclave ls 2>/dev/null || echo "  (none)"
        echo ""
        echo "Start one with: make kurtosis-up"
        exit 1
    fi
    echo -e "${BLUE}Auto-detected enclave:${NC} $ENCLAVE_NAME"
fi

# Check if the enclave exists
if ! kurtosis enclave inspect "$ENCLAVE_NAME" &>/dev/null 2>&1; then
    echo -e "${RED}Error: Enclave '$ENCLAVE_NAME' not found${NC}"
    echo ""
    echo "Available enclaves:"
    kurtosis enclave ls 2>/dev/null
    exit 1
fi

echo ""
echo -e "${CYAN}  ┌──────────────────────────────────────────┐${NC}"
echo -e "${CYAN}  │  GoodDollar L2 — Kurtosis Info           │${NC}"
echo -e "${CYAN}  │  Chain ID: 42069                         │${NC}"
echo -e "${CYAN}  └──────────────────────────────────────────┘${NC}"
echo ""

# Get the full enclave inspection
INSPECT_OUTPUT=$(kurtosis enclave inspect "$ENCLAVE_NAME" 2>&1)

# Extract L1 EL RPC — matches "el-1-geth" but NOT "op-el-*"
L1_RPC=$(echo "$INSPECT_OUTPUT" | grep -E '^[0-9a-f]+ +el-' | grep -A2 "rpc: 8545/tcp" | grep -oE '127\.0\.0\.1:[0-9]+' | head -1)
if [ -z "$L1_RPC" ]; then
    # Fallback: find the el-1-geth line and grab the rpc port from subsequent lines
    L1_RPC=$(echo "$INSPECT_OUTPUT" | grep -A5 "el-1-geth" | grep -v "op-el" | grep "rpc: 8545" | grep -oE '127\.0\.0\.1:[0-9]+' | head -1)
fi

# Extract L2 EL RPC — matches "op-el-*-op-geth" (name includes chain ID, e.g. op-el-42069-node0-op-geth)
L2_RPC=$(echo "$INSPECT_OUTPUT" | grep -A2 "op-el-.*op-geth" | grep "rpc: 8545" | grep -oE '127\.0\.0\.1:[0-9]+' | head -1)
if [ -z "$L2_RPC" ]; then
    L2_RPC=$(echo "$INSPECT_OUTPUT" | grep -A5 "op-el-" | grep "rpc: 8545" | grep -oE '127\.0\.0\.1:[0-9]+' | head -1)
fi

# Extract op-node RPC — matches "op-cl-*-op-node" (e.g. op-cl-42069-node0-op-node)
OP_NODE_RPC=$(echo "$INSPECT_OUTPUT" | grep -A2 "op-cl-.*op-node" | grep "rpc: 8547" | grep -oE '127\.0\.0\.1:[0-9]+' | head -1)
if [ -z "$OP_NODE_RPC" ]; then
    OP_NODE_RPC=$(echo "$INSPECT_OUTPUT" | grep -A5 "op-cl-" | grep "rpc: 8547" | grep -oE '127\.0\.0\.1:[0-9]+' | head -1)
fi

echo -e "${GREEN}Endpoints:${NC}"
echo ""

if [ -n "$L1_RPC" ]; then
    echo -e "  ${BLUE}L1 RPC:${NC}     http://$L1_RPC"
else
    echo -e "  ${YELLOW}L1 RPC:${NC}     (could not auto-detect — check 'kurtosis enclave inspect $ENCLAVE_NAME')"
fi

if [ -n "$L2_RPC" ]; then
    echo -e "  ${BLUE}L2 RPC:${NC}     http://$L2_RPC"
else
    echo -e "  ${YELLOW}L2 RPC:${NC}     (could not auto-detect — check 'kurtosis enclave inspect $ENCLAVE_NAME')"
fi

if [ -n "$OP_NODE_RPC" ]; then
    echo -e "  ${BLUE}op-node:${NC}    http://$OP_NODE_RPC"
else
    echo -e "  ${YELLOW}op-node:${NC}    (could not auto-detect — check 'kurtosis enclave inspect $ENCLAVE_NAME')"
fi

echo ""
echo -e "${GREEN}Chain Config:${NC}"
echo -e "  ${BLUE}Chain ID:${NC}   42069"
echo -e "  ${BLUE}Chain Name:${NC} GoodDollar L2"

# Pre-funded dev accounts (fund_dev_accounts: true in kurtosis-params.yaml)
# These are the standard Hardhat/Anvil dev accounts, pre-loaded with ETH on both L1 and L2.
DEV_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
DEV_ADDR="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

echo ""
echo -e "${GREEN}Funded Dev Account:${NC}"
echo -e "  ${BLUE}Address:${NC}     $DEV_ADDR"
echo -e "  ${BLUE}Private Key:${NC} $DEV_KEY"

# Check balance on L2 if RPC is available
if [ -n "$L2_RPC" ]; then
    BAL_HEX=$(curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["'"$DEV_ADDR"'","latest"],"id":1}' \
        "http://$L2_RPC" 2>/dev/null | jq -r '.result' 2>/dev/null)
    if [ -n "$BAL_HEX" ] && [ "$BAL_HEX" != "null" ]; then
        # Convert hex wei to ETH (integer division, good enough for display)
        BAL_DEC=$(printf "%d" "$BAL_HEX" 2>/dev/null || echo "0")
        BAL_ETH=$(echo "scale=4; $BAL_DEC / 1000000000000000000" | bc 2>/dev/null || echo "$BAL_DEC wei")
        echo -e "  ${BLUE}L2 Balance:${NC}  ${BAL_ETH} ETH"
    fi
fi

echo ""
echo -e "${CYAN}Quick deploy:${NC}"
echo "  export PRIVATE_KEY=$DEV_KEY"
if [ -n "$L2_RPC" ]; then
    echo "  forge script script/DeployGoodSwap.s.sol --rpc-url http://$L2_RPC --broadcast --legacy"
else
    echo "  forge script script/DeployGoodSwap.s.sol --rpc-url <L2_RPC> --broadcast --legacy"
fi

# Test L2 connection if we found the RPC
if [ -n "$L2_RPC" ]; then
    echo ""
    echo -e "${GREEN}Connection Test:${NC}"
    RESULT=$(curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
        "http://$L2_RPC" 2>/dev/null | jq -r '.result' 2>/dev/null)
    if [ -n "$RESULT" ] && [ "$RESULT" != "null" ]; then
        CHAIN_DEC=$(printf "%d" "$RESULT" 2>/dev/null || echo "unknown")
        echo -e "  ${GREEN}✅ L2 connected (chainId: $CHAIN_DEC)${NC}"
    else
        echo -e "  ${YELLOW}⏳ L2 not responding yet — chain may still be starting${NC}"
    fi

    BLOCK=$(curl -s -X POST -H "Content-Type: application/json" \
        --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
        "http://$L2_RPC" 2>/dev/null | jq -r '.result' 2>/dev/null)
    if [ -n "$BLOCK" ] && [ "$BLOCK" != "null" ]; then
        BLOCK_DEC=$(printf "%d" "$BLOCK" 2>/dev/null || echo "unknown")
        echo -e "  ${BLUE}Latest block:${NC} $BLOCK_DEC"
    fi
fi

echo ""
echo -e "${CYAN}Tip:${NC} For full details, run:"
echo "  kurtosis enclave inspect $ENCLAVE_NAME"
echo ""
echo -e "${CYAN}Tip:${NC} Deploy all contracts:"
echo "  make kurtosis-deploy"
echo ""
