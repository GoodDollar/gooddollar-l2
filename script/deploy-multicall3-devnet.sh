#!/usr/bin/env bash
#
# deploy-multicall3-devnet.sh
# ---------------------------
# Install the vendored Multicall3 (`script/multicall3/Multicall3.sol`)
# at the canonical address `0xcA11bde05977b3631167028862bE2a173976CA11`
# on the local Anvil devnet via `anvil_setCode`.
#
# Why: wagmi/viem `useReadContracts` and viem's `multicall` action
# only batch reads when `chain.contracts.multicall3.address` points at
# a contract with real code. On a fresh Anvil instance nothing lives
# at the canonical address, so every batched read silently fans out
# into N parallel `eth_call` requests — exactly the perf regression
# observed on `/stocks`, `/perps`, `/lend`, and the sidebar wallet
# widget this iteration.
#
# See: .autobuilder/initiatives/0002-security-hardening/tasks/0059-deploy-multicall3-and-wire-chain-batching.md
#
# Idempotent: safe to re-run. If the canonical address already has
# matching code, it's a no-op.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Load RPC_URL from addresses.env when available; fall back to localhost.
RPC_URL="${RPC_URL:-http://localhost:8545}"
if [[ -f .autobuilder/addresses.env ]]; then
  # shellcheck disable=SC1091
  set -a
  source .autobuilder/addresses.env
  set +a
  RPC_URL="${RPC:-$RPC_URL}"
fi

MULTICALL3_ADDR="0xcA11bde05977b3631167028862bE2a173976CA11"
ARTIFACT="out/Multicall3.sol/Multicall3.json"

echo "▶ Multicall3 devnet installer"
echo "  rpc:  $RPC_URL"
echo "  addr: $MULTICALL3_ADDR"

# 1. Build the vendored Multicall3 (idempotent — forge caches).
if [[ ! -f "$ARTIFACT" ]]; then
  echo "▶ forge build script/multicall3/Multicall3.sol"
  forge build script/multicall3/Multicall3.sol >/dev/null
fi

if [[ ! -f "$ARTIFACT" ]]; then
  echo "✗ Multicall3 artifact not found at $ARTIFACT after forge build"
  exit 1
fi

# 2. Extract the runtime (deployed) bytecode.
BYTECODE="$(jq -r '.deployedBytecode.object' "$ARTIFACT")"
if [[ -z "$BYTECODE" || "$BYTECODE" == "null" || "$BYTECODE" == "0x" ]]; then
  echo "✗ deployedBytecode.object empty in $ARTIFACT"
  exit 1
fi
echo "  bytecode: ${#BYTECODE} chars"

# 3. Inject via Anvil's `anvil_setCode` cheatcode.
echo "▶ anvil_setCode → $MULTICALL3_ADDR"
cast rpc --rpc-url "$RPC_URL" anvil_setCode "$MULTICALL3_ADDR" "$BYTECODE" >/dev/null

# 4. Verify.
ONCHAIN_CODE="$(cast code "$MULTICALL3_ADDR" --rpc-url "$RPC_URL")"
if [[ -z "$ONCHAIN_CODE" || "$ONCHAIN_CODE" == "0x" ]]; then
  echo "✗ Multicall3 install failed — on-chain code is empty"
  exit 1
fi

# 5. Sanity-check the selector for `getBlockNumber()` (0x42cbb15c).
BLOCK_NUMBER_HEX="$(cast call "$MULTICALL3_ADDR" "getBlockNumber()(uint256)" --rpc-url "$RPC_URL" 2>/dev/null || true)"
if [[ -z "$BLOCK_NUMBER_HEX" ]]; then
  echo "✗ Multicall3 install verified bytecode but getBlockNumber() reverted"
  exit 1
fi

echo "✓ Multicall3 installed at $MULTICALL3_ADDR"
echo "  getBlockNumber() = $BLOCK_NUMBER_HEX"
