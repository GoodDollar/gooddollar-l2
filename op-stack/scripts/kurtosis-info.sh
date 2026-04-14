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

ENCLAVE_NAME="${1:-optimism}"

# Check if kurtosis is available
if ! command -v kurtosis &>/dev/null; then
    echo -e "${RED}Error: kurtosis CLI not found${NC}"
    echo "Install: curl -L https://install.kurtosis.com | bash"
    exit 1
fi

# Check if the enclave exists
if ! kurtosis enclave inspect "$ENCLAVE_NAME" &>/dev/null 2>&1; then
    echo -e "${RED}Error: Enclave '$ENCLAVE_NAME' not found${NC}"
    echo ""
    echo "Available enclaves:"
    kurtosis enclave ls
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

# Extract L1 EL RPC (el-1-geth-lighthouse)
L1_RPC=$(echo "$INSPECT_OUTPUT" | grep -A5 "el-1-geth" | grep "rpc: 8545/tcp" | grep -oP '127\.0\.0\.1:\d+' | head -1)
if [ -z "$L1_RPC" ]; then
    L1_RPC=$(echo "$INSPECT_OUTPUT" | grep -A10 "el-1-geth" | grep -oP '127\.0\.0\.1:\d+' | head -1)
fi

# Extract L2 EL RPC (op-el-1-op-geth-op-node)
L2_RPC=$(echo "$INSPECT_OUTPUT" | grep -A5 "op-el-1-op-geth" | grep "rpc: 8545/tcp" | grep -oP '127\.0\.0\.1:\d+' | head -1)
if [ -z "$L2_RPC" ]; then
    L2_RPC=$(echo "$INSPECT_OUTPUT" | grep -A10 "op-el-1-op-geth" | grep -oP '127\.0\.0\.1:\d+' | head -1)
fi

# Extract op-node RPC
OP_NODE_RPC=$(echo "$INSPECT_OUTPUT" | grep -A5 "op-cl-1-op-node" | grep "http: 8547/tcp" | grep -oP '127\.0\.0\.1:\d+' | head -1)
if [ -z "$OP_NODE_RPC" ]; then
    OP_NODE_RPC=$(echo "$INSPECT_OUTPUT" | grep -A10 "op-cl-1-op-node" | grep -oP '127\.0\.0\.1:\d+' | head -1)
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
echo -e "${CYAN}Tip:${NC} To use with forge/cast:"
if [ -n "$L2_RPC" ]; then
    echo "  cast chain-id --rpc-url http://$L2_RPC"
    echo "  forge script Deploy.s.sol --rpc-url http://$L2_RPC --broadcast"
else
    echo "  cast chain-id --rpc-url http://<L2_RPC_PORT>"
fi
echo ""
