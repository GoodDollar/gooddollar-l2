---
id: gooddollar-l2-pegstabilitymodule-cei-swap
title: "PegStabilityModule — Enforce CEI in swapUSDCForGUSD() and swapGUSDForUSDC()"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P1
labels: [contracts, slither, security, cei, reentrancy, stable, psm]
---

# PegStabilityModule — Enforce CEI in swapUSDCForGUSD() and swapGUSDForUSDC()

## Problem

`slither .` reports `reentrancy-no-eth` (MEDIUM) on
`src/stable/PegStabilityModule.sol` for both swap functions. They are
already protected by `nonReentrant`, but they interleave external calls
(`usdc.transferFrom`, `gusd.mint`, `gusd.burn`, `gusd.approve`,
`feeSplitter.splitFeeToken`, `usdc.transfer`) with state updates
(`totalUSDCReserves`, `psmMintedGUSD`, `psmBurnedGUSD`,
`totalFeesCollected`).

This violates the Checks-Effects-Interactions pattern. While the
nonReentrant guard prevents simple reentrancy, CEI is required because:

1. `gusd` is an upgradeable token — a malicious upgrade could insert a
   callback in `mint` or `burn` that observes stale `totalUSDCReserves`.
2. `feeSplitter.splitFeeToken` is an external contract that receives
   gUSD via `transferFrom` — a malicious or buggy splitter could call
   back into PSM views that read partially-updated state.
3. External audit firms (Trail of Bits / OpenZeppelin) treat any
   external call before a state mutation as a finding regardless of
   reentrancy guards.

### `swapUSDCForGUSD(uint256 usdcAmount)` — current ordering

```solidity
require(usdc.transferFrom(...));         // EXT
totalUSDCReserves += usdcAmount;         // EFFECT (after EXT)
// fee calc
gusd.mint(msg.sender, gusdOut);          // EXT
psmMintedGUSD += gusdOut;                // EFFECT (after EXT)
if (fee > 0) {
    gusd.mint(address(this), fee);       // EXT
    require(gusd.approve(feeSplitter,…));// EXT
    try this._callMintingFeeTracking(…) {} catch {
        feeSplitter.splitFeeToken(…);    // EXT
    }
    totalFeesCollected += fee;           // EFFECT (after EXT)
}
emit SwapUSDCForGUSD(...);
```

### `swapGUSDForUSDC(uint256 gusdAmount)` — current ordering

```solidity
require(gusd.transferFrom(...));         // EXT
gusd.burn(netGUSD);                      // EXT
psmBurnedGUSD += netGUSD;                // EFFECT (after EXT)
if (fee > 0) {
    require(gusd.approve(feeSplitter,…));// EXT
    try this._callMintingFeeTracking(…) {} catch {
        feeSplitter.splitFeeToken(…);    // EXT
    }
    totalFeesCollected += fee;           // EFFECT (after EXT)
}
totalUSDCReserves -= usdcOut;            // EFFECT
require(usdc.transfer(...));             // EXT
emit SwapGUSDForUSDC(...);
```

Both flows perform multiple external calls before all bookkeeping is
written, which is the textbook CEI smell.

## Scope

### Restructure both swap functions to:

1. **Checks** — `require(amount > 0, ...)` plus any caps/limits.
2. **Effects** — apply *all* counters first:
   - For `swapUSDCForGUSD`: `totalUSDCReserves += usdcAmount`,
     `psmMintedGUSD += gusdOut`, `totalFeesCollected += fee`.
   - For `swapGUSDForUSDC`: `psmBurnedGUSD += netGUSD`,
     `totalFeesCollected += fee`, `totalUSDCReserves -= usdcOut`.
   - Emit the swap event before any external call.
3. **Interactions** — perform the external transfers/mints/burns in
   the correct sequence:
   - `swapUSDCForGUSD`: `usdc.transferFrom` (pull) → `gusd.mint` (user
     output) → if fee > 0: `gusd.mint(this, fee)` →
     `gusd.approve(feeSplitter, fee)` → `splitFeeToken(...)`.
   - `swapGUSDForUSDC`: `gusd.transferFrom` (pull) → if fee > 0:
     `gusd.approve(feeSplitter, fee)` → `splitFeeToken(...)` →
     `gusd.burn(netGUSD)` → `usdc.transfer(msg.sender, usdcOut)`.

If any interaction reverts, the whole transaction reverts and all
state mutations are rolled back. This is correct because solidity-level
revert undoes storage writes atomically.

### Defensive note

`totalUSDCReserves -= usdcOut` happens during Effects, before
`usdc.transfer` releases the funds. This is intentional and standard:
the contract's actual USDC balance does not change until `transfer`
runs, but reverting the transfer reverts the bookkeeping too — so the
view function `totalUSDCReserves` will never report a value that
disagrees with `usdc.balanceOf(this)` outside an in-progress call.

## Out of Scope

- Refactoring `_callMintingFeeTracking` or the
  try/catch fallback to `feeSplitter.splitFeeToken`. The fallback is
  still required for the case where the receipt-tracking helper is
  unavailable.
- Removing the `require(gusd.approve(...))` pattern. (We need the
  allowance for `splitFeeToken` to pull the fee.)
- Other CEI fixes in StabilityPool / PerpEngine — those have their own
  tasks (`0049`, `0040`).

## Verification

1. `forge test --match-contract PegStabilityModuleTest -vvv` → all PSM
   tests pass.
2. `forge test --match-contract UBI` and
   `forge test --match-contract FeeSplitter` to confirm the fee
   routing path still works end-to-end.
3. `forge test` → all 1030 tests pass.
4. `slither src/stable/PegStabilityModule.sol --print human-summary
   2>&1 | grep reentrancy-no-eth` → no longer lists `swapUSDCForGUSD`
   or `swapGUSDForUSDC`.
5. Manual diff review: every `usdc.transferFrom`, `gusd.mint`,
   `gusd.burn`, `gusd.approve`, `feeSplitter.splitFeeToken`, and
   `usdc.transfer` appears AFTER all `totalUSDCReserves`,
   `psmMintedGUSD`, `psmBurnedGUSD`, `totalFeesCollected` mutations
   and after the matching event emit.

## One-week decision

**One-shot.** Two function reorderings in one file. Same approach as
StabilityPool task 0049.

## Architecture diagram

```
swapUSDCForGUSD(usdcAmount):

   Checks                    Effects (write all bookkeeping)
  ─────────                 ─────────
  require amount>0    ──►  totalUSDCReserves += usdcAmount
  fee = computeFee(...)    psmMintedGUSD     += gusdOut
                           totalFeesCollected+= fee
                           emit SwapUSDCForGUSD(...)

   Interactions (external calls last, in order)
  ─────────────
  usdc.transferFrom(user → this, usdcAmount)
  gusd.mint(user, gusdOut)
  if fee > 0:
      gusd.mint(this, fee)
      gusd.approve(feeSplitter, fee)
      feeSplitter.splitFeeToken(fee, this, gusd)


swapGUSDForUSDC(gusdAmount):

   Checks                    Effects
  ─────────                 ─────────
  require amount>0    ──►  psmBurnedGUSD     += netGUSD
  fee = computeFee(...)    totalFeesCollected+= fee
  usdcOut = ...            totalUSDCReserves -= usdcOut
                           emit SwapGUSDForUSDC(...)

   Interactions
  ─────────────
  gusd.transferFrom(user → this, gusdAmount)
  if fee > 0:
      gusd.approve(feeSplitter, fee)
      feeSplitter.splitFeeToken(fee, this, gusd)
  gusd.burn(netGUSD)
  usdc.transfer(user, usdcOut)
```
