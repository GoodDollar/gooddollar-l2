---
id: gooddollar-l2-fix-opstack-bridge-test
title: "Tests — Fix OPStack Bridge Test Authorization Failure"
parent: gooddollar-l2
priority: medium
split: false
planned: true
executed: false
---

## Problem
1 test in `test/bridge/OPStack.t.sol` is failing:
- `test_finalizeETHWithdrawal` — reverts with "only portal"

The test calls `bridge.finalizeETHWithdrawal(...)` directly from the test contract, but the bridge has a `onlyPortal` modifier requiring `msg.sender == portal`.

## Research Notes
- `src/bridge/L1StandardBridge.sol` line 41-44:
  ```solidity
  modifier onlyPortal() {
      require(msg.sender == portal, "only portal");
      _;
  }
  ```
- The test at line 203-209 calls `finalizeETHWithdrawal` without pranking as the portal
- Other tests in this file (e.g., `test_ubiFeeOnBridge`) work fine because `bridgeETH` has no `onlyPortal` restriction
- The portal address is set during bridge initialization

## One-week decision
**YES** — One-line fix: add `vm.prank(address(portal))` before the finalize call.

## Implementation Plan
1. Find the portal address in the test setUp (likely stored in `bridge` or test contract)
2. Add `vm.prank(address(portal))` before line 207: `bridge.finalizeETHWithdrawal(...)`
3. If the portal address isn't exposed, use the OptimismPortal contract deployed in setUp
4. Run `forge test --match-test test_finalizeETHWithdrawal -vvvv` to confirm it passes
5. Run `forge test --match-path test/bridge/OPStack.t.sol` to verify no regressions

## Files
- `test/bridge/OPStack.t.sol`
- `src/bridge/L1StandardBridge.sol`
