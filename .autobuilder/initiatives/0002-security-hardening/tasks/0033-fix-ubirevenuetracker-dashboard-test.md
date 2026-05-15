---
id: fix-ubirevenuetracker-dashboard-test
title: "Tests — Fix UBIRevenueTracker test_GetDashboardData incorrect totalUBI expectation"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P1
labels: [tests, ubi, revenue-tracker, foundry, security-hardening]
---

# Tests — Fix UBIRevenueTracker test_GetDashboardData incorrect totalUBI expectation

## Plan (one-week decision: ✅ <30 minutes, single line change, no split needed)

### Research
- Inspected `test/UBIRevenueTracker.t.sol::test_GetDashboardData` (lines 168–193).
- Two `reportFees` calls contribute UBI: `200e18` and `80e18`. Cumulative `totalUBI = 280e18`.
- All other accumulator assertions in the test (`totalFees`, `totalTx`, `pCount`, `activeP`) sum correctly across the two protocols.
- Only `totalUBI` was left at the first protocol's value — clear copy-paste typo.

### Architecture
```
test/UBIRevenueTracker.t.sol
  └─ test_GetDashboardData() [line 188]
        └─ assertEq(totalUBI, 200e18)  →  assertEq(totalUBI, 280e18)
```

### Steps
1. Edit line 188 of `test/UBIRevenueTracker.t.sol`: change `200e18` to `280e18` and add inline comment `// 200e18 (protocol 0) + 80e18 (protocol 1)`.
2. Run `forge test --match-test test_GetDashboardData -vvv` — must pass.
3. Run `forge test --match-path test/UBIRevenueTracker.t.sol` — must be fully green.
4. Commit: `tests(ubi): correct totalUBI expectation in test_GetDashboardData`.

## Problem
`test/UBIRevenueTracker.t.sol::test_GetDashboardData` fails with:

```
[FAIL: assertion failed: 280000000000000000000 != 200000000000000000000]
test_GetDashboardData() (gas: 635761)
```

The assertion `assertEq(totalUBI, 200e18)` is wrong: the test reports UBI fees from two protocols (200e18 + 80e18 = 280e18), but expects only 200e18.

## Root cause
Looking at `test/UBIRevenueTracker.t.sol` lines 168–193:

```solidity
tracker.reportFees(0, 600e18, 200e18, 30);  // protocol 0: 200e18 UBI
tracker.reportFees(1, 400e18, 80e18, 20);   // protocol 1:  80e18 UBI
...
assertEq(totalFees, 1000e18);   // 600 + 400 = 1000 ✓ correct
assertEq(totalUBI, 200e18);     // 200 +  80 = 280 ✗ expects 200
```

The total UBI across both protocols is `200e18 + 80e18 = 280e18`, not `200e18`. The expected value in the assertion was almost certainly copy-pasted from the first `reportFees` call without summing the second.

This is a test-expectation bug. Cross-check matches other assertions in the same test:
- `totalFees = 1000e18` (= 600 + 400) ✓
- `totalTx = 50` (= 30 + 20) ✓
- `pCount = 2` ✓

So `totalUBI` should be `280e18`.

## Fix
Update `test/UBIRevenueTracker.t.sol` line 188:

```solidity
// Before:
assertEq(totalUBI, 200e18);

// After:
assertEq(totalUBI, 280e18);  // 200e18 (protocol 0) + 80e18 (protocol 1)
```

## Acceptance criteria
- [ ] `forge test --match-test test_GetDashboardData` passes.
- [ ] `forge test --match-path test/UBIRevenueTracker.t.sol` is fully green.
- [ ] No production contract changes (test-only fix).

## Out of scope
- Other UBIRevenueTracker tests.
- Changes to the `getDashboardData` function itself.
