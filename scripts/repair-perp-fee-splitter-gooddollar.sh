#!/usr/bin/env bash
# Align PerpUBIFeeSplitter.goodDollar with MarginVault.collateral so
# PerpEngine.openPosition() fee routing succeeds on devnet.
# Idempotent — safe to run after every redeploy. See GOO-3230.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -f "$ROOT/.autobuilder/addresses.env" ]; then
  echo "ERROR: .autobuilder/addresses.env not found" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source "$ROOT/.autobuilder/addresses.env"
set +a

: "${RPC:?RPC missing}"
: "${PERP:?PERP missing}"
: "${VAULT:?VAULT missing}"
: "${DEPLOYER_KEY:?DEPLOYER_KEY missing}"

normalize() { echo "$1" | tr '[:upper:]' '[:lower:]'; }

FEE_SPLITTER=$(cast call "$PERP" "feeSplitter()(address)" --rpc-url "$RPC")
COLLATERAL=$(cast call "$VAULT" "collateral()(address)" --rpc-url "$RPC")
BEFORE=$(cast call "$FEE_SPLITTER" "goodDollar()(address)" --rpc-url "$RPC")

echo "── Perp fee-splitter goodDollar repair ──"
echo "  PerpEngine:     $PERP"
echo "  FeeSplitter:    $FEE_SPLITTER"
echo "  Vault collateral: $COLLATERAL"
echo "  goodDollar (before): $BEFORE"

if [ "$(normalize "$BEFORE")" = "$(normalize "$COLLATERAL")" ]; then
  echo "  Already aligned — nothing to do."
  exit 0
fi

cast send "$FEE_SPLITTER" "setGoodDollar(address)" "$COLLATERAL" \
  --rpc-url "$RPC" \
  --private-key "$DEPLOYER_KEY" \
  >/dev/null

AFTER=$(cast call "$FEE_SPLITTER" "goodDollar()(address)" --rpc-url "$RPC")
echo "  goodDollar (after):  $AFTER"

if [ "$(normalize "$AFTER")" != "$(normalize "$COLLATERAL")" ]; then
  echo "ERROR: repair failed" >&2
  exit 1
fi

echo "✅ PerpUBIFeeSplitter.goodDollar aligned with vault collateral."
