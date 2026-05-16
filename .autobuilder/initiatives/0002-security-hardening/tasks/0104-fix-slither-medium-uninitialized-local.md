---
id: gooddollar-l2-fix-slither-medium-uninitialized-local
title: "Security — Fix 1 Slither MEDIUM uninitialized-local Finding"
type: fix
priority: P1
parent: gooddollar-l2
planned: true
executed: true
depends_on: []
---

# Fix 1 Slither MEDIUM uninitialized-local Finding

## Problem
Slither reports 1 MEDIUM severity `uninitialized-local` finding:
- `PerpEngine._closePosition(address,uint256,int256,int256,uint256).payout` (src/perps/PerpEngine.sol#426)

## Plan

### Research Summary
The `payout` variable in `_closePosition` is declared as `uint256 payout;` without
explicit initialization. The code then sets it conditionally:
- If `netPnL >= 0`: `payout = snap.margin + uint256(netPnL)`
- If `netPnL < 0 && loss < snap.margin`: `payout = snap.margin - loss`
- If `netPnL < 0 && loss >= snap.margin`: payout stays 0 (total wipeout)

The third branch is intentional — the trader loses all margin. The Solidity default of
`uint256` is 0, so the behavior is correct. But explicit initialization makes intent clear
and satisfies Slither.

### Architecture
Single-line change: `uint256 payout;` → `uint256 payout = 0;`

### One-Week Decision
YES — trivial, 30-second fix.

### Implementation Steps
1. Change line 426 of `src/perps/PerpEngine.sol`: `uint256 payout = 0;`
2. Run `forge test` to verify no regressions
3. Run `slither . --detect uninitialized-local` to verify 0 findings

## Acceptance Criteria
- `slither . --detect uninitialized-local` reports 0 MEDIUM findings
- `forge test` passes with 0 failures
- No behavioral changes to payout logic
