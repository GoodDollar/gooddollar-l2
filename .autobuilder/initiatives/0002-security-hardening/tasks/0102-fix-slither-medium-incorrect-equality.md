---
id: gooddollar-l2-fix-slither-medium-incorrect-equality
title: "Security — Fix 28 Slither MEDIUM incorrect-equality Findings"
type: fix
priority: P1
parent: gooddollar-l2
planned: true
executed: false
depends_on: []
---

# Fix 28 Slither MEDIUM incorrect-equality Findings

## Problem
Slither reports 28 MEDIUM severity `incorrect-equality` findings. These use strict
equality (`==`) on values that could be manipulated or may not match exactly.

## Plan

### Research Summary
The 28 findings break down into categories:
1. **Enum/state comparisons** (~10): `GoodTimelock.isOperationDone`, `OptimisticResolver.isFinalized`,
   `OptimisticResolver.getFinalOutcome`, etc. — strict equality on enum values is correct and
   intentional. Fix: annotate with `slither-disable`.
2. **Zero-balance checks** (~8): `GoodVault.redeem`, `GoodVault.mint`, `GoodSwap.mint/burn/swap`,
   `GoodVault.deposit` — checking `== 0` for balances/supply. These are safe as they check
   internal computed values. Fix: annotate.
3. **Arithmetic identity checks** (~6): `VaultManager._rpow`, `VaultManager.drip`,
   `VaultManager.pendingFee` — checking intermediate calculation results. Fix: annotate.
4. **Index comparisons** (~4): `GoodLendPool._updateState`, `GoodLendPool.getLiquidityIndex`,
   `GoodLendPool.getBorrowIndex` — comparing accumulators against 0 or RAY. Fix: annotate.

### Architecture
No new contracts. Each fix is adding `// slither-disable-next-line incorrect-equality`
on the line before the flagged comparison where the equality check is intentional,
or replacing `==` with `>=`/`<=` where a range check is more appropriate.

### One-Week Decision
YES — fits in one session. 28 annotations across ~12 contract files.

### Implementation Steps
1. For each finding, verify the equality is intentional (enum, zero-check, identity)
2. Add `// slither-disable-next-line incorrect-equality` above the flagged line
3. For any genuinely dangerous strict equality, replace with range comparison
4. Run `forge test` to confirm no regressions
5. Run `slither . --detect incorrect-equality` to verify

## Acceptance Criteria
- All 28 findings addressed with annotations or fixes
- `forge test` passes with 0 failures
- No behavioral changes to intended protocol logic
