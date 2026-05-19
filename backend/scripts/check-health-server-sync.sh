#!/usr/bin/env bash
#
# Verify that per-service healthServer.ts copies are identical to the
# canonical source at backend/shared/healthServer.ts.
#
# Exit 0 if all copies match, exit 1 if any have drifted.
# Usage: bash backend/scripts/check-health-server-sync.sh

set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CANONICAL="$BACKEND_DIR/shared/healthServer.ts"

COPIES=(
  "swap-oracle/src/healthServer.ts"
  "activity-reporter/src/healthServer.ts"
  "harvest-keeper/src/healthServer.ts"
  "liquidator/src/healthServer.ts"
  "revenue-tracker/src/healthServer.ts"
  "stocks-keeper/src/healthServer.ts"
  "hedge-engine/src/healthServer.ts"
  "oracle-signer/src/healthServer.ts"
)

if [[ ! -f "$CANONICAL" ]]; then
  echo "ERROR: Canonical file not found at $CANONICAL"
  exit 1
fi

drifted=0
for copy in "${COPIES[@]}"; do
  full_path="$BACKEND_DIR/$copy"
  if [[ ! -f "$full_path" ]]; then
    echo "WARN: $copy does not exist (skipped)"
    continue
  fi
  if diff -q "$CANONICAL" "$full_path" > /dev/null 2>&1; then
    echo "OK:   $copy"
  else
    echo "DRIFT: $copy differs from shared/healthServer.ts"
    diff --color=auto "$CANONICAL" "$full_path" || true
    drifted=1
  fi
done

if [[ $drifted -eq 1 ]]; then
  echo ""
  echo "FAIL: Some healthServer.ts copies have drifted."
  echo "Fix: Copy backend/shared/healthServer.ts to the drifted locations."
  exit 1
else
  echo ""
  echo "ALL healthServer.ts copies are in sync."
fi
