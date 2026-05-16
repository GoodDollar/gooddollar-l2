---
id: gooddollar-l2-fix-slither-medium-divide-before-multiply
title: "Security — Fix 26 Slither MEDIUM divide-before-multiply Findings"
type: fix
priority: P1
parent: gooddollar-l2
planned: true
executed: false
depends_on: []
---

# Fix 26 Slither MEDIUM divide-before-multiply Findings

## Problem
Slither reports 26 MEDIUM severity `divide-before-multiply` findings. Integer division
before multiplication causes precision loss in Solidity's integer arithmetic.

## Plan

### Research Summary
The 26 findings break down into categories:
1. **Interest rate calculations** (~10): `GoodLendPool._updateState`, `GoodLendPool._accumulateAssetValues`,
   `GoodLendPool._calcCollateralToSeize`, `GoodLendPool.getLiquidityIndex/getBorrowIndex`,
   `InterestRateModel.calculateRates` — these use WAD/RAY math where division-first is
   intentional to prevent overflow in intermediate values. Fix: annotate.
2. **UBI fee estimates** (~4): `PerpUBIFeeSplitter.getMonthlyUBIEstimate`,
   `StocksUBIFeeSplitter.getMonthlyUBIEstimate`, `StableUBIFeeSplitter.getMonthlyUBIEstimate` —
   dividing by time period before multiplying by 30 days. Precision loss is negligible for
   estimates. Fix: annotate.
3. **Vault math** (~5): `VaultManager._rpow`, `VaultManager._isHealthy`, `VaultManager.healthFactor`,
   `VaultManager.drip` — exponentiation and health factor calculations using fixed-point math
   where order matters for overflow prevention. Fix: annotate.
4. **Swap/AMM math** (~4): `GoodSwap._update`, `FastWithdrawalLP.claimFastETHWithdrawal/claimFastWithdrawal` —
   TWAP and LP share calculations. Fix: annotate.
5. **Staking rewards** (~2): `ValidatorStaking.pendingRewards`, `ValidatorStakingDevnet.pendingRewards` —
   per-share reward calculation. Fix: annotate.
6. **Other** (~1): `MarketFactory.redeem`, `VoteEscrowedGD.earlyUnlock`, `GoodVault.harvest`.

### Architecture
No new contracts. Most fixes are annotations because the division-first ordering is
intentional to prevent intermediate overflow in fixed-point arithmetic (WAD/RAY math).
Where reordering is safe (no overflow risk), multiply first.

### One-Week Decision
YES — fits in one session. 26 annotations across ~14 contract files.

### Implementation Steps
1. For each finding, evaluate if reordering is safe (no intermediate overflow)
2. If safe to reorder: multiply first, divide last
3. If intentional (WAD/RAY math, overflow prevention): add `// slither-disable-next-line divide-before-multiply`
4. Run `forge test` to verify no precision changes
5. Run `slither . --detect divide-before-multiply` to verify

## Acceptance Criteria
- All 26 findings addressed with reorder or annotation
- `forge test` passes with 0 failures
- Financial calculations maintain correct precision
