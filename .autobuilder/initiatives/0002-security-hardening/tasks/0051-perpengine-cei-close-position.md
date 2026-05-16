---
id: gooddollar-l2-perpengine-cei-close-position
title: "PerpEngine — Enforce CEI in _closePosition() helper"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P1
labels: [contracts, slither, security, cei, reentrancy, perps]
---

# PerpEngine — Enforce CEI in _closePosition() helper

## Problem

`slither .` reports `reentrancy-no-eth` (MEDIUM) on
`src/perps/PerpEngine.sol`, currently 4 distinct findings concentrated
around the close/liquidate paths (lines ~208-275, 281-293, 302-352,
410-445). All four trace back to the internal helper
`_closePosition()` (L410-L445), which is reused by both
`closePosition()` and `liquidate()`.

The public entry points already carry the `nonReentrant` modifier, so
this is not an exploitable runtime vulnerability today. The fix is
defense-in-depth + static-analysis cleanup so the contract follows the
Checks-Effects-Interactions pattern uniformly.

### `_closePosition(...)` — current ordering

```solidity
function _closePosition(
    address trader,
    uint256 marketId,
    int256 pnl,
    int256 fundingPayment,
    uint256 exitPrice
) internal {
    Position storage pos = positions[trader][marketId];
    Market storage m = markets[marketId];

    // EFFECT (partial): decrement open interest
    if (pos.isLong) {
        m.openInterestLong  -= pos.size;
    } else {
        m.openInterestShort -= pos.size;
    }

    int256 netPnL = pnl - fundingPayment;

    // INTERACTION: external call BEFORE remaining state cleanup
    if (netPnL >= 0) {
        vault.credit(trader, pos.margin + uint256(netPnL));   // EXT
    } else {
        uint256 loss = uint256(-netPnL);
        if (loss < pos.margin) {
            vault.credit(trader, pos.margin - loss);          // EXT
        }
    }

    // EFFECT (after EXT): event + storage delete happen LAST
    emit PositionClosed(trader, marketId, pnl, exitPrice);
    delete positions[trader][marketId];                       // EFFECT after EXT
}
```

The `delete positions[trader][marketId]` after `vault.credit(...)` is
the textbook CEI smell: a malicious or buggy vault implementation that
calls back into PerpEngine during `credit` would still observe
`pos.isOpen == true` with the original `pos.size`, `pos.margin`, and
`pos.entryPrice`. The `nonReentrant` guard on the public entry points
already blocks the attack, but the helper itself does not enforce CEI.

`liquidate()` has a related smell on lines 332-349: it calls
`_closePosition` (which performs `vault.credit`), then immediately
calls `vault.debit` + `vault.flushFee` + `feeSplitter.splitFee`. This
is fine from CEI's perspective because `_closePosition` has already
deleted the position when those subsequent calls run, **once
`_closePosition` itself is CEI-compliant**.

## Scope

### Restructure `_closePosition` to:

1. **Read** position into a local-scope `Position memory` snapshot
   (size, margin, isLong, marketId, entryPrice, etc.) so we can keep
   referring to it after the storage slot is deleted.
2. **Effects** — apply *all* state mutations first:
   - Decrement `m.openInterestLong` / `m.openInterestShort`.
   - `delete positions[trader][marketId]`.
   - `emit PositionClosed(trader, marketId, pnl, exitPrice)`.
3. **Interactions** — call `vault.credit(...)` last, using the
   captured `posSnapshot.margin` and the locally-computed `netPnL`.

If `vault.credit` reverts, every effect above is rolled back
atomically by Solidity's transaction-revert semantics — same
guarantee that PSM and StabilityPool now rely on (tasks 0049, 0050).

### Pseudocode (target shape)

```solidity
function _closePosition(
    address trader,
    uint256 marketId,
    int256 pnl,
    int256 fundingPayment,
    uint256 exitPrice
) internal {
    // 1. CHECKS / SNAPSHOT — capture everything we need before delete
    Position memory snap = positions[trader][marketId];
    Market storage m     = markets[marketId];

    int256 netPnL  = pnl - fundingPayment;
    uint256 payout = 0;
    if (netPnL >= 0) {
        payout = snap.margin + uint256(netPnL);
    } else {
        uint256 loss = uint256(-netPnL);
        if (loss < snap.margin) {
            payout = snap.margin - loss;
        }
        // else: wipe-out, payout stays 0
    }

    // 2. EFFECTS — apply every storage mutation BEFORE any external call
    if (snap.isLong) {
        m.openInterestLong  -= snap.size;
    } else {
        m.openInterestShort -= snap.size;
    }
    delete positions[trader][marketId];
    emit PositionClosed(trader, marketId, pnl, exitPrice);

    // 3. INTERACTIONS — external call last
    if (payout > 0) {
        vault.credit(trader, payout);
    }
}
```

## Out of Scope

- Refactoring `openPosition` (L208-L275). It already has a
  `// CEI: write all state before any external interaction (GOO-461)`
  comment, but `funding.applyFunding(...)` still happens before state
  writes. That's a separate, lower-leverage change because
  `funding` is a trusted internal contract; will be handled in a
  later iteration if it remains a slither finding.
- Refactoring the `vault.debit` / `flushFee` / `splitFee` block in
  `liquidate()` (L332-L349). With `_closePosition` made CEI-clean,
  those subsequent external calls happen after the position has been
  fully deleted, so the only remaining concern there is fee-splitter
  reentrancy which is gated by `nonReentrant` on the public entry.
- Changes to `vault.credit`, `IFeeSplitterPerp`, or
  `IMarginVault`. We do not touch interfaces.
- Mythril / formal verification — out of phase.

## Verification

1. `forge test --match-path "test/perps/GoodPerps.t.sol" -vv` → all
   PerpEngine tests pass, including the `closePosition` and
   `liquidate` paths.
2. `forge test --match-path "test/PerpUBIFeeSplitter.t.sol" -vv` →
   confirms fee routing through `liquidate` still works (the
   liquidator bonus path depends on `_closePosition` having credited
   the trader before the bonus is debited).
3. `forge test` (full suite) → no regressions; ≥1026 tests passing.
4. `slither . --json /tmp/slither-iter23-after-0051.json 2>/dev/null;
   python3 -c 'import json; d=json.load(open("/tmp/slither-iter23-after-0051.json"));
   ree=[r for r in d["results"]["detectors"] if r["check"]=="reentrancy-no-eth"
        and "PerpEngine.sol" in r.get("first_markdown_element","")];
   print("PerpEngine reentrancy-no-eth:", len(ree))'` → **strictly
   fewer findings than the 4 reported today** (target: ≤1, since the
   helper backs three of the four call sites). HIGH count must remain
   `0`.
5. Manual diff review: in the new `_closePosition`, every read of
   `pos.size` / `pos.margin` / `pos.isLong` happens before the
   `delete`, every state mutation precedes `vault.credit`, and the
   `PositionClosed` event is emitted before the external call.

## One-week decision

**One-shot.** Single internal helper rewrite in one file. Same
mechanical pattern as StabilityPool task 0049 and PSM task 0050. No
ABI change, no new state, no new dependencies. Risk is bounded to
re-running the existing GoodPerps test suite.

## Architecture diagram

```
closePosition(marketId)             liquidate(trader, marketId)
        │                                   │
        ▼                                   ▼
  funding.applyFunding(...) (EXT, trusted, sets cumulative idx)
  _settlePnL(...)              (pure read of storage)
        │                                   │
        └──────────► _closePosition ◄──────┘
                            │
                            ▼
                ┌────────────────────────┐
                │ 1. SNAPSHOT (memory)   │  pos → Position memory snap
                │    size, margin,       │
                │    isLong, etc.        │
                ├────────────────────────┤
                │ 2. EFFECTS (storage)   │  m.openInterest{Long,Short} -= snap.size
                │                        │  delete positions[trader][marketId]
                │                        │  emit PositionClosed(...)
                ├────────────────────────┤
                │ 3. INTERACTION         │  vault.credit(trader, payout)   ← LAST
                └────────────────────────┘
```
