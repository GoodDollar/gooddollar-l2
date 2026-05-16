---
id: gooddollar-l2-fix-slither-medium-unused-return
title: "Security — Fix 20 Slither MEDIUM unused-return Findings"
type: fix
priority: P1
parent: gooddollar-l2
planned: true
executed: false
depends_on: []
---

# Fix 20 Slither MEDIUM unused-return Findings

## Problem
Slither reports 20 MEDIUM severity `unused-return` findings. External calls return values
that are not checked, which can silently fail.

## Plan

### Research Summary
The findings fall into three categories:
1. **UBI fee splitter calls** (~8): `splitFee()`, `splitFeeToken()`, `applyFunding()` returns
   are ignored in PerpEngine, MarketFactory, CollateralVault, VaultManager. These are
   fire-and-forget fee distribution — if they fail, the main tx should still succeed.
2. **ERC20 approve/transfer** (~6): `approve()` returns unchecked in CollateralVault._mint,
   MarketFactory.redeem, MultiChainBridge.bridgeTokens. Fix: use SafeERC20.
3. **Internal helper calls** (~6): PriceOracle._getPrice, VaultManager.drip, etc.
   Fix: capture return or annotate.

### Architecture
No new contracts. Changes are one-line fixes per finding:
- Replace `token.approve(x, y)` with `token.safeApprove(x, y)` (SafeERC20)
- Add `// slither-disable-next-line unused-return` for intentional ignores (fee splitters)
- Capture return values where they carry meaningful data

### One-Week Decision
YES — fits in one session. 20 single-line fixes across ~9 contract files.

### Implementation Steps
1. For each finding, determine the category (ERC20 / fee splitter / internal)
2. Apply the appropriate fix per category
3. Run `forge test` after all changes
4. Run `slither . --detect unused-return` to verify 0 findings

## Acceptance Criteria
- `slither . --detect unused-return` reports 0 MEDIUM findings
- `forge test` passes with 0 failures
- No behavioral changes to protocol logic
