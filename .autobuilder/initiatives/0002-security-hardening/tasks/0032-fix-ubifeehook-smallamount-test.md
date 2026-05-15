---
id: fix-ubifeehook-smallamount-test
title: "Tests — Fix UBIFeeHook test_calculateUBIFee_smallAmount incorrect expectation"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P1
labels: [tests, ubi, fee-hook, foundry, security-hardening]
---

# Tests — Fix UBIFeeHook test_calculateUBIFee_smallAmount incorrect expectation

## Plan (one-week decision: ✅ <1 hour, single file, no split needed)

### Research
- Verified `DEFAULT_UBI_FEE_BPS = 2000` (20%) in `test/UBIFeeHook.t.sol:22`.
- Verified `BPS_DENOMINATOR = 10000` in `src/hooks/UBIFeeHook.sol:96`.
- Verified contract function does plain integer math: `(amount * ubiFeeShareBPS) / BPS_DENOMINATOR`.
- The bug is in the test, not the contract — `4 * 2000 / 10000 = 0` (integer), not `1`.
- Test-only fix; no contract behavior change.

### Architecture
```
test/UBIFeeHook.t.sol
  └─ test_calculateUBIFee_smallAmount() [lines 87-94]
        └─ Replace `assertEq(hook.calculateUBIFee(4), 1)` with `assertEq(..., 0)`
        └─ Add `assertEq(hook.calculateUBIFee(5), 1)` to document boundary.
        └─ Fix comments to reflect correct integer math.
```

### Steps
1. Edit `test/UBIFeeHook.t.sol` lines 87–94 per the "Fix" section above.
2. Run `forge test --match-test test_calculateUBIFee_smallAmount -vvv` — must pass.
3. Run `forge test --match-path test/UBIFeeHook.t.sol` — must be fully green.
4. Commit: `tests(ubi): correct test_calculateUBIFee_smallAmount integer-division expectations`.

## Problem
`test/UBIFeeHook.t.sol::test_calculateUBIFee_smallAmount` fails with assertion `0 != 1`.

Repro:
```bash
forge test --match-test test_calculateUBIFee_smallAmount -vvv
```

Output:
```
[FAIL: assertion failed: 0 != 1] test_calculateUBIFee_smallAmount() (gas: 13859)
```

## Root cause
The test has mathematically incorrect expectations. With `DEFAULT_UBI_FEE_BPS = 2000` (20%) and `BPS_DENOMINATOR = 10000`, integer-division math is:

| Input | Calculation | Actual | Test expects |
|-------|-------------|--------|--------------|
| 1 wei | `1 * 2000 / 10000` = 0 | 0 | 0 ✓ |
| 3 wei | `3 * 2000 / 10000` = 0 | 0 | 0 ✓ |
| 4 wei | `4 * 2000 / 10000` = 0 | 0 | **1 ✗** |

The third assertion `assertEq(hook.calculateUBIFee(4), 1)` is wrong. `8000 / 10000` rounds down to `0` in Solidity integer division. The accompanying comment `"4 * 2000 / 10000 = 1.3332 → 1"` is also numerically wrong (correct floating-point result is 0.8).

The first amount at which the fee becomes non-zero (with 20% fee) is **5 wei**, which yields `10000 / 10000 = 1`.

## Fix
Update `test/UBIFeeHook.t.sol` lines 87–94:
- Change the third assertion to expect `0` for 4 wei input, and correct the comment.
- Add an additional assertion for 5 wei → 1 to document the boundary.

```solidity
function test_calculateUBIFee_smallAmount() public view {
    // With 20% BPS, integer division rounds down for small amounts.
    // 1 wei  → 1 * 2000 / 10000 = 0
    assertEq(hook.calculateUBIFee(1), 0);
    // 3 wei  → 3 * 2000 / 10000 = 0
    assertEq(hook.calculateUBIFee(3), 0);
    // 4 wei  → 4 * 2000 / 10000 = 0 (rounds down, 8000 / 10000)
    assertEq(hook.calculateUBIFee(4), 0);
    // 5 wei  → 5 * 2000 / 10000 = 1 (first non-zero fee)
    assertEq(hook.calculateUBIFee(5), 1);
}
```

## Acceptance criteria
- [ ] `forge test --match-test test_calculateUBIFee_smallAmount` passes.
- [ ] Comment math is correct.
- [ ] No production contract changes (test-only fix).
- [ ] `forge test --match-path test/UBIFeeHook.t.sol` is fully green.

## Out of scope
- Adding a minimum-fee floor in `UBIFeeHook.calculateUBIFee` (would be a behavior change requiring separate discussion).
- Other UBI fee splitter test failures (tracked separately).
