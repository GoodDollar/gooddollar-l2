## Severity: HIGH

## Summary

`StabilityPool.offset()` resets `scaleIndex` to `PRECISION` when the pool is fully drained (`remaining == 0`). This incorrectly restores the apparent balance of pre-drain depositors, allowing them to steal funds from new depositors who deposit after the drain.

## Root Cause

In `src/stable/StabilityPool.sol` (GOO-352 fix), `offset()` contains:

```solidity
} else if (remaining == 0) {
    // Pool fully drained — reset scale index for future deposits
    scaleIndex = PRECISION;
}
```

If `scaleIndex` was `S < PRECISION` before the drain, and a pre-drain depositor has `depositScaleSnapshot == S`, the reset makes `scaleIndex = PRECISION > S`. When `_settleGains` is next called for that depositor:

```
effective = deposits[user] * PRECISION / S  ->  INFLATED
```

Even simpler: if scaleIndex was already at PRECISION when the full drain occurs (no prior partial offsets), the reset changes nothing — but the user's nominal `deposits[user]` is never zeroed out, so they can still withdraw from future depositors.

## Attack Path (simplest case: no prior partial offsets)

1. Alice deposits 100 gUSD. `scaleIndex = PRECISION`, `depositScaleSnapshot[Alice] = PRECISION`, `totalDeposits = 100`.
2. Full offset burns all 100 gUSD. `remaining = 0` -> `scaleIndex = PRECISION` (reset). `totalDeposits = 0`.
3. Bob deposits 1000 gUSD. `totalDeposits = 1000`. `depositScaleSnapshot[Bob] = PRECISION`.
4. Alice calls `withdraw(100)`:
   - `_settleGains(Alice)`: `scaleIndex == snapshot` -> no update. `deposits[Alice]` stays at 100.
   - `require(100 >= 100)` passes. `totalDeposits -= 100`.
   - Alice receives 100 gUSD from Bob's deposit.
5. Bob can only recover 900 gUSD. **Alice stole 100 gUSD.**

## Impact

Any depositor whose gUSD was burned in a full liquidation can reclaim an equal amount from future depositors. Breaks the core stability pool invariant: burned gUSD is gone forever.

## Affected File

- `src/stable/StabilityPool.sol` — `offset()`, `remaining == 0` branch

## Fix Direction

Epoch-based tracking (Liquity-style): increment a `drainEpoch` counter on full drain. Store `depositEpoch[user]` at deposit time. In `_settleGains`, zero out balance if `depositEpoch[user] < drainEpoch`. Reset `scaleIndex = PRECISION` on epoch increment (safe because all pre-epoch deposits are treated as zero).

## Test Gap

`test_SP_MultiDepositorWithdrawAfterOffset` only covers a partial drain (50%). No test for: full drain + new deposit + old depositor withdrawal.
