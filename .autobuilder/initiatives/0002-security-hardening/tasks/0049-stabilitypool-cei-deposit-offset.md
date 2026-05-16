---
id: gooddollar-l2-stabilitypool-cei-deposit-offset
title: "StabilityPool — Enforce Checks-Effects-Interactions in deposit() and offset()"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P1
labels: [contracts, slither, security, cei, reentrancy, stable]
---

# StabilityPool — Enforce Checks-Effects-Interactions in deposit() and offset()

## Problem

`slither .` reports `reentrancy-no-eth` (MEDIUM) on
`src/stable/StabilityPool.sol` for both `deposit(uint256)` and
`offset(uint256,bytes32,uint256)`. Both functions already have the
OpenZeppelin `nonReentrant` modifier, so the warnings are not
exploitable today, but the underlying code violates the
**Checks-Effects-Interactions (CEI)** pattern, which is the standard
defense-in-depth requirement for Phase 1 hardening.

Specifically:

### `deposit(uint256 amount)`

```solidity
function deposit(uint256 amount) public nonReentrant {
    require(amount > 0, "SP: zero amount");
    _settleGains(msg.sender);
    // ... epoch and snapshot logic ...

    // EXTERNAL CALL ──────────────────────────────────────
    require(
        gusd.transferFrom(msg.sender, address(this), amount),
        "SP: transfer failed"
    );

    // STATE UPDATES (after external call ── violates CEI)
    deposits[msg.sender]             += amount;
    depositScaleSnapshot[msg.sender]  = scaleIndex;
    depositEpoch[msg.sender]          = drainEpoch;
    totalDeposits                    += amount;
    emit Deposited(msg.sender, amount);
}
```

### `offset(uint256 debtAmount, bytes32 ilk, uint256 collAmount)`

External `transferFrom` of collateral is performed before
`cumulativeGainPerGUSD[ilk] += gainPerUnit` is updated. `gusd.burn` and
the `scaleIndex` recomputation are also interleaved with state changes.

While `nonReentrant` blocks classical reentrancy, CEI ordering is also
required to defend against:
- Cross-function reentrancy via `gusd` callbacks
  (e.g., a malicious gUSD upgrade that calls back into StabilityPool's
  `withdraw`/`claimGain`).
- Read-only reentrancy where view functions return stale values during
  the external call.
- Auditor checklist compliance: every protocol engineer review and
  every external audit firm requires CEI in DeFi-grade code.

## Scope

### `deposit()` reordering

Move all state mutations **before** the `gusd.transferFrom` call:

```solidity
function deposit(uint256 amount) public nonReentrant {
    require(amount > 0, "SP: zero amount");
    _settleGains(msg.sender);
    // ... epoch and snapshot logic ...

    // EFFECTS (state updates first ── CEI compliant)
    deposits[msg.sender]             += amount;
    depositScaleSnapshot[msg.sender]  = scaleIndex;
    depositEpoch[msg.sender]          = drainEpoch;
    totalDeposits                    += amount;
    emit Deposited(msg.sender, amount);

    // INTERACTIONS (external call last)
    require(
        gusd.transferFrom(msg.sender, address(this), amount),
        "SP: transfer failed"
    );
}
```

Note the `emit` before the external call is intentional — events are
state, and emitting before the interaction also satisfies CEI.

### `offset()` reordering

Compute `gainPerUnit` and update `cumulativeGainPerGUSD[ilk]` /
`collateralDust[ilk]` and the new `scaleIndex` **before** calling
`gusd.burn(debtAmount)` or pulling collateral via `transferFrom`. The
final ordering should be:

1. Validate inputs (Checks).
2. Compute and apply `cumulativeGainPerGUSD` / `collateralDust` /
   `scaleIndex` / `totalDeposits` / `drainEpoch` updates (Effects).
3. Emit `Offset(...)` event (Effects).
4. Pull collateral via `IERC20Transfer(colToken).transferFrom(...)`
   (Interactions).
5. Burn gUSD via `gusd.burn(debtAmount)` (Interactions).

Pulling collateral and burning gUSD are deferred to the end. If either
external call fails, the whole transaction reverts and all state
updates are reverted along with it — preserving correctness.

## Out of Scope

- Other reentrancy-no-eth findings outside StabilityPool (handled by
  per-contract tasks such as the existing
  `0040-goodlendpool-fix-reentrancy-no-eth.md` and the new
  `0050-pegstabilitymodule-cei-swap.md`).
- Refactoring `_settleGains` or other helpers — only the public
  entry-point ordering is changed.
- Switching to `SafeERC20` for `gusd.transferFrom` — already wrapped in
  `require(...)` which produces a hard revert on failure.

## Verification

1. `forge test --match-contract StabilityPoolTest -vvv` → all StabilityPool
   tests pass (was passing before, must still pass).
2. `forge test` → all 1030 tests pass.
3. `slither src/stable/StabilityPool.sol --print human-summary 2>&1 |
   grep reentrancy-no-eth` → no longer lists `deposit` or `offset`.
4. Read the diff: every external call (`transferFrom`, `burn`) appears
   AFTER all state mutations in its function body.

## One-week decision

**One-shot.** Two function reorderings in one file. No splits.

## Architecture diagram

```
StabilityPool.deposit(amount):

  BEFORE (current):                 AFTER (CEI):
  ┌────────────────────┐            ┌────────────────────┐
  │ require amount>0   │            │ require amount>0   │
  │ _settleGains(...)  │            │ _settleGains(...)  │
  ├────────────────────┤            ├────────────────────┤
  │ gusd.transferFrom  │ ◄ external │ deposits += amount │ ◄ effects
  ├────────────────────┤            │ scaleSnapshot      │
  │ deposits += amount │ ◄ effects  │ depositEpoch       │
  │ scaleSnapshot      │  AFTER     │ totalDeposits +=   │
  │ depositEpoch       │  external  │ emit Deposited(..) │
  │ totalDeposits +=   │  call      ├────────────────────┤
  │ emit Deposited(..) │            │ gusd.transferFrom  │ ◄ interactions
  └────────────────────┘            └────────────────────┘
                                       (CEI compliant)
```

The `offset()` reordering follows the same pattern: compute and write
all bookkeeping (`cumulativeGainPerGUSD`, `scaleIndex`, etc.) before
the `transferFrom(collateral)` and `gusd.burn` external calls.
