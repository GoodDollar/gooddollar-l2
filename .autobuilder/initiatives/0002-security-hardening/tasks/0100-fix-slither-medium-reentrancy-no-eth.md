---
id: gooddollar-l2-fix-slither-medium-reentrancy-no-eth
title: "Security — Fix 10 Slither MEDIUM reentrancy-no-eth Findings"
type: fix
priority: P1
parent: gooddollar-l2
planned: true
executed: true
depends_on: []
---

# Fix 10 Slither MEDIUM reentrancy-no-eth Findings

## Problem
Slither reports 10 MEDIUM severity `reentrancy-no-eth` findings. All affected functions
already have `nonReentrant` guards, but Slither flags them because events or minor state
writes occur after external calls, violating strict CEI ordering.

## Plan

### Research Summary
All 10 functions already have `nonReentrant` from OpenZeppelin. The findings are triggered
because Slither's `reentrancy-no-eth` detector flags any function where state changes or
events happen after external calls, even when guarded. Since `nonReentrant` prevents actual
reentrancy, the practical risk is LOW. The fix is to either reorder operations to satisfy
strict CEI or add targeted `slither-disable` annotations where reordering would harm readability.

### Architecture
No new contracts or interfaces needed. Changes are local to each function body.

```
MarketFactory.sol   → buy(), redeem()           — reorder transferFrom before state, add annotations
PerpEngine.sol      → openPosition(), closePosition(), liquidate() — add annotations (CEI already correct)
UBIClaimV2.sol      → batchClaim()              — add annotation (nonReentrant present)
OptimisticResolver  → disputeResolution(), emergencyResolve(), proposeResolution() — add annotations
LimitOrderBook.sol  → placeOrder()              — reorder deposit before state update
```

### One-Week Decision
YES — fits in one session. 10 single-line annotations or minor reorderings.

### Implementation Steps
1. For each of the 10 functions, evaluate if CEI reorder is safe:
   - If yes: move state updates/events before external calls
   - If no (readability/logic constraint): add `// slither-disable-next-line reentrancy-no-eth`
2. Run `forge test` to confirm no regressions
3. Run `slither . --detect reentrancy-no-eth` to verify 0 findings

## Acceptance Criteria
- `slither . --detect reentrancy-no-eth` reports 0 MEDIUM findings
- `forge test` passes with 0 failures
- No behavioral changes to protocol logic
