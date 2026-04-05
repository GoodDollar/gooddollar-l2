#!/usr/bin/env bash
# Iteration 23 issue updates

GOO476="2bf9c14b-a313-4ccd-a437-f6f990f5cd98"
GOO450="94a46703-0f79-4831-8b66-27a6483ae315"
COMPANY="7e8ba4ed-e545-4394-ad98-c0c855409a4e"

echo "=== Reopen GOO-476 (market2 gap) ==="
npx paperclipai issue comment "$GOO476" \
  --body "Iteration 23 partial regression: 5/6 markets seeded (BTC, ETH confirmed). Market 2 (key 0x0a3ec4fc) has supportedMarkets()=false — FixPerpOraclePrices.s.sol silently reverted for this market. Need setManualPrice() + registerMarket() for market 2." \
  --reopen 2>&1 | grep -E '"id"|error'

echo "=== Comment GOO-450 (root cause) ==="
npx paperclipai issue comment "$GOO450" \
  --body "Iteration 23 root cause found: openPosition() reverts InsufficientBalance(available=0, required=100.1e18). The issue is not missing GDT approval — it is missing MarginVault.deposit(collateral) step before calling openPosition(). Test was approve-only. Will test two-step flow (deposit then openPosition) next iteration. This may be a test gap not a contract bug." 2>&1 | grep -E '"id"|error'

echo "=== File new bug: CollateralVault asset seeding ==="
npx paperclipai issue create -C "$COMPANY" \
  --title "bug(stocks): CollateralVault new deployment missing registerAsset — AAPL/TSLA/all synths unregistered" \
  --description "Discovered: Iteration 23 (2026-04-05). Severity: HIGH. New CollateralVault at 0xbfd3c8a9 correctly wired to GDT (GOO-473 fix) but has no assets registered. depositCollateral(AAPL, 100e18) reverts 'asset not registered'. All synthetic asset minting is blocked. Fix: re-run asset registration script for all synths (AAPL, TSLA, GOOGL, etc.) on new CollateralVault address." \
  --priority high 2>&1 | grep -E '"identifier"|"id"|error'

echo "=== File new bug: PerpPriceOracle market2 ==="
npx paperclipai issue create -C "$COMPANY" \
  --title "bug(perps): PerpPriceOracle market 2 supportedMarkets=false — registration silently failed" \
  --description "Discovered: Iteration 23 (2026-04-05). Severity: MEDIUM. PerpPriceOracle market 2 (key 0x0a3ec4fc) returns supportedMarkets()=false and price=0. The other 5 markets are correctly seeded. FixPerpOraclePrices.s.sol transaction for market 2 silently reverted. Fix: call setManualPrice() and ensure market 2 is registered in the oracle. Blocks perp trading on market 2." \
  --priority medium 2>&1 | grep -E '"identifier"|"id"|error'

echo "=== File new bug: PSM reverse direction ==="
npx paperclipai issue create -C "$COMPANY" \
  --title "bug(psm): PSM swapUSDCForGUSD reverts allowance — wrong USDC address" \
  --description "Discovered: Iteration 23 (2026-04-05). Severity: LOW. PSM.swapUSDCForGUSD() reverts with allowance error even after approving MockUSDC. swapGUSDForUSDC (forward direction) works correctly. Root cause: PSM likely uses a different USDC contract address than the mock used in tests. Call PSM.usdc() to get the expected address, then approve that specific contract. Or PSM deployment needs to be updated to use the deployed mock USDC address." \
  --priority low 2>&1 | grep -E '"identifier"|"id"|error'
