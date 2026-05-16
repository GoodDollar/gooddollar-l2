#!/usr/bin/env bash
set -euo pipefail

LANE="${1:-}"
if [[ -z "$LANE" ]]; then
  echo "usage: scripts/run-dapp-lane.sh <lane>" >&2
  exit 2
fi

cd "$(dirname "$0")/../frontend"

echo "== GoodDollar L2 dapp lane: $LANE =="
echo "node=$(node --version) npm=$(npm --version)"

declare -a tests=()
case "$LANE" in
  swap)
    tests=(
      "src/components/__tests__/SwapConfirmModal.test.tsx"
      "src/components/__tests__/PriceImpactWarning.test.tsx"
      "src/lib/__tests__/computePriceImpactBps.test.ts"
      "src/lib/__tests__/computeSwapDeadline.test.ts"
      "src/app/swap/__tests__/page.test.tsx"
    )
    ;;
  perps)
    tests=("src/lib/__tests__/perpsInput.test.ts")
    ;;
  predict)
    tests=(
      "src/lib/__tests__/selectFeaturedMarket.test.ts"
      "src/app/(app)/predict/__tests__/market-detail.test.tsx"
      "src/app/__tests__/create-market.test.tsx"
    )
    ;;
  lend)
    tests=("src/lib/__tests__/useGoodLend.test.ts" "src/components/__tests__/PortfolioOnChain.test.tsx")
    ;;
  stable)
    tests=("src/lib/__tests__/useGoodStable.test.ts" "src/components/__tests__/PortfolioOnChain.test.tsx")
    ;;
  stocks)
    tests=("src/lib/__tests__/useStockPrices.test.ts")
    ;;
  portfolio-claim)
    tests=(
      "src/components/__tests__/PortfolioOnChain.test.tsx"
      "src/components/__tests__/ConnectWalletBanner.test.tsx"
      "src/components/__tests__/ConnectWalletEmptyState.test.tsx"
    )
    ;;
  explore)
    tests=(
      "src/app/(app)/explore/[symbol]/__tests__/page.test.tsx"
      "src/app/(app)/explore/__tests__/page.test.tsx"
      "src/lib/__tests__/useOnChainMarketData.test.ts"
      "src/lib/__tests__/usePriceFeeds.test.ts"
    )
    ;;
  *)
    echo "unknown lane: $LANE" >&2
    exit 2
    ;;
esac

existing=()
for f in "${tests[@]}"; do
  if [[ -e "$f" ]]; then
    existing+=("$f")
  else
    echo "skip missing: $f"
  fi
done

if [[ ${#existing[@]} -eq 0 ]]; then
  echo "No configured test files exist for $LANE; running TypeScript gate instead."
  npx tsc --noEmit
  exit 0
fi

npx vitest run --reporter=verbose "${existing[@]}"
