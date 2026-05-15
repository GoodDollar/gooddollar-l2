---
id: gooddollar-l2-fix-ubi-fee-splitter-test-failures
title: "Tests — Fix 9 UBI Fee Splitter Test Failures (Gas Overhead + Arithmetic)"
parent: gooddollar-l2
priority: high
split: false
planned: true
executed: true
---

## Problem
9 tests across PerpUBIFeeSplitter and StableUBIFeeSplitter are failing with gas overhead assertion failures and arithmetic underflow/overflow panics.

### PerpUBIFeeSplitter (4 failures)
| Test | Error |
|------|-------|
| test_gasOverhead_EnhancedTrackingMinimal | panic: arithmetic underflow or overflow (0x11) |
| test_gasOverhead_WithinTarget | Gas overhead exceeds 2% target: 29078 >= 200 |
| test_getMonthlyUBIEstimate_ReachesTarget | Insufficient balance |
| test_setMonthlyTarget_UpdatesCorrectly | log != expected log |

### StableUBIFeeSplitter (5 failures)
| Test | Error |
|------|-------|
| test_gasOverhead_MintingFee | Gas overhead should be <2%: 45204 >= 200 |
| test_gasOverhead_StabilityFee | Gas overhead should be <2%: 66218 >= 200 |
| test_getStablecoinUBIStats_Comprehensive | panic: arithmetic underflow or overflow (0x11) |
| test_splitFeeToken_ZeroUBIRecipient_Reverts | zero address (wrong revert message) |
| test_splitGovernanceFee | panic: arithmetic underflow or overflow (0x11) |

## Research Notes

### Gas overhead tests
The gas overhead tests compare raw gas numbers against a threshold of 200. This is clearly wrong — 200 represents 2% (200 basis points), but the test compares it against absolute gas used (29078, 45204, 66218). The comparison logic needs to compute the percentage: `(gasWithSplitter - gasBaseline) * 10000 / gasBaseline >= 200`.

### Arithmetic overflows
The `0x11` panic code means arithmetic underflow/overflow in unchecked Solidity. Likely causes:
- Subtraction from a smaller uint (e.g., `a - b` where `a < b`)
- Division rounding issues in fee calculation
- Need to check the fee splitting math for edge cases

### Insufficient balance
`test_getMonthlyUBIEstimate_ReachesTarget` — the test setUp mints tokens to specific addresses but doesn't fund enough for the monthly target calculation flow.

### Wrong revert message
`test_splitFeeToken_ZeroUBIRecipient_Reverts` — expects `vm.expectRevert("zero address")` but contract may use a different string (e.g., custom error or different message).

## One-week decision
**YES** — These are test logic bugs (wrong comparison formula, missing funding, stale revert messages), not deep contract issues.

## Implementation Plan
1. **Gas overhead tests**: Fix the comparison to compute actual percentage:
   ```solidity
   uint256 overheadBps = (gasWithSplitter - gasBaseline) * 10000 / gasBaseline;
   assertLt(overheadBps, 200, "Gas overhead should be <2%");
   ```
2. **Arithmetic overflows**: Run failing tests with `-vvvv` to find exact line, then add SafeMath or reorder operations
3. **Insufficient balance**: Increase token minting in setUp or adjust test parameters
4. **Wrong revert message**: Check actual revert string in contract, update `expectRevert`
5. Run `forge test --match-contract PerpUBIFeeSplitterTest` and `StableUBIFeeSplitterTest` to verify all pass
6. Run full `forge test` to verify no regressions

## Files
- `test/PerpUBIFeeSplitter.t.sol`
- `test/StableUBIFeeSplitter.t.sol`
- `src/predict/PredictUBIFeeSplitter.sol`
- `src/stable/StableUBIFeeSplitter.sol`
