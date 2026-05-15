#!/usr/bin/env bash
# scripts/repair-ubi-revenue-tracker-feesplitter.sh
#
# Repairs the on-chain configuration of the canonical UBIRevenueTracker so
# that getDashboardData() stops reverting and the /ubi-impact dashboard can
# render. See: .autobuilder/initiatives/0002-security-hardening/tasks/
# 0027-reconfigure-ubirevenuetracker-feesplitter-pointer.md
#
# What it does:
#   1. Reads the current feeSplitter pointer from UBI_REVENUE_TRACKER.
#   2. If it does not equal FEE_SPLITTER (the canonical splitter from
#      .autobuilder/addresses.env), sends setFeeSplitter(FEE_SPLITTER) using
#      DEPLOYER_KEY (which == admin()).
#   3. Re-reads the pointer and asserts it matches FEE_SPLITTER.
#   4. Calls getDashboardData() and asserts it does NOT revert.
#
# Idempotent: a second run is a no-op (just prints status).
# Exits non-zero on any failure.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -f "$ROOT/.autobuilder/addresses.env" ]; then
  echo "ERROR: .autobuilder/addresses.env not found at $ROOT" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source "$ROOT/.autobuilder/addresses.env"
set +a

: "${RPC:?RPC missing from addresses.env}"
: "${UBI_REVENUE_TRACKER:?UBI_REVENUE_TRACKER missing from addresses.env}"
: "${FEE_SPLITTER:?FEE_SPLITTER missing from addresses.env}"
: "${DEPLOYER_KEY:?DEPLOYER_KEY missing from addresses.env}"

normalize() { echo "$1" | tr '[:upper:]' '[:lower:]'; }

CANON=$(normalize "$FEE_SPLITTER")

echo "── UBIRevenueTracker fee-splitter repair ──"
echo "  RPC:                 $RPC"
echo "  UBI_REVENUE_TRACKER: $UBI_REVENUE_TRACKER"
echo "  Target FEE_SPLITTER: $FEE_SPLITTER"
echo

BEFORE=$(cast call "$UBI_REVENUE_TRACKER" "feeSplitter()(address)" --rpc-url "$RPC")
echo "  feeSplitter (before): $BEFORE"

ADMIN=$(cast call "$UBI_REVENUE_TRACKER" "admin()(address)" --rpc-url "$RPC")
echo "  tracker.admin():      $ADMIN"

DEPLOYER_ADDR=$(cast wallet address --private-key "$DEPLOYER_KEY")
echo "  DEPLOYER_KEY addr:    $DEPLOYER_ADDR"

if [ "$(normalize "$ADMIN")" != "$(normalize "$DEPLOYER_ADDR")" ]; then
  echo "ERROR: tracker admin ($ADMIN) does not match DEPLOYER_KEY address" >&2
  echo "       ($DEPLOYER_ADDR). Aborting — somebody re-keyed the tracker." >&2
  exit 2
fi

if [ "$(normalize "$BEFORE")" = "$CANON" ]; then
  echo
  echo "  feeSplitter already canonical — nothing to do."
else
  echo
  echo "  feeSplitter is stale; sending setFeeSplitter($FEE_SPLITTER) ..."
  cast send "$UBI_REVENUE_TRACKER" \
    "setFeeSplitter(address)" "$FEE_SPLITTER" \
    --private-key "$DEPLOYER_KEY" \
    --rpc-url "$RPC" \
    >/dev/null
  echo "  setFeeSplitter sent."
fi

AFTER=$(cast call "$UBI_REVENUE_TRACKER" "feeSplitter()(address)" --rpc-url "$RPC")
echo
echo "  feeSplitter (after):  $AFTER"

if [ "$(normalize "$AFTER")" != "$CANON" ]; then
  echo "ERROR: feeSplitter still wrong after repair (got $AFTER, expected $FEE_SPLITTER)" >&2
  exit 3
fi

echo
echo "  Calling getDashboardData() to verify it no longer reverts ..."
if ! cast call "$UBI_REVENUE_TRACKER" "getDashboardData()" --rpc-url "$RPC" >/dev/null 2>&1; then
  echo "ERROR: getDashboardData() still reverts after repair." >&2
  echo "       Re-run with: cast call $UBI_REVENUE_TRACKER 'getDashboardData()' --rpc-url $RPC" >&2
  exit 4
fi

echo "  getDashboardData() OK."
echo
echo "✅ UBIRevenueTracker.feeSplitter repaired and dashboard call live."
