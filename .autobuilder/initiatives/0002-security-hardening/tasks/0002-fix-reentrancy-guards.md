---
id: fix-reentrancy-guards
title: "Fix Reentrancy Vulnerabilities — Add Guards to All Vulnerable Contracts"
parent: security-hardening-root
deps: []
split: null
depth: 1
planned: true
executed: false
---

## Planning Notes

### Research Findings
- 18 contracts already import ReentrancyGuard
- ~12 contracts with external calls have NO ReentrancyGuard
- StabilityPool has custom nonReentrant but `provideToSP` (3 overloads) and `withdrawFromSP` are NOT protected
- FastWithdrawalLP.depositETHLiquidity() is missing nonReentrant
- GoodDollarBridgeL2 finalize* functions called by messenger - need review
- GoodSwapRouter delegates to pool, no direct token handling in router itself
- GoodVault already well-protected with nonReentrant on all mutating functions
- GoodLendPool already has nonReentrant on supply/withdraw/borrow/repay

### Architecture

```mermaid
graph LR
    A[Add ReentrancyGuard import] --> B[Add 'is ReentrancyGuard' inheritance]
    B --> C[Add nonReentrant to vulnerable functions]
    C --> D[Run forge test]
    D --> E[Verify with Slither]
```

### One-Week Decision: YES — fits in one week
~12 contracts need changes, each change is mechanical (add import, add modifier). Estimated: 2-3 days.

## Goal
Add OpenZeppelin ReentrancyGuard and `nonReentrant` modifier to every contract with external calls before state updates. Target: zero reentrancy-related Slither HIGH findings.

## Scope

### Contracts missing ReentrancyGuard (need import + inheritance):
- `src/stable/StabilityPool.sol` — has custom nonReentrant, replace with OZ
- `src/stable/PegStabilityModule.sol` — mint/redeem do ERC20 transfers
- `src/stable/VaultManager.sol` — liquidation + collateral operations
- `src/lending/GoodLendPool.sol` — supply/withdraw/borrow/repay/liquidate/flashLoan
- `src/swap/GoodSwapRouter.sol` — swap routing with external calls
- `src/swap/LimitOrderBook.sol` — order execution with token transfers
- `src/yield/GoodVault.sol` — deposit/withdraw with strategy calls
- `src/yield/strategies/StablecoinStrategy.sol` — external protocol calls
- `src/bridge/FastWithdrawalLP.sol` — ETH/token withdrawal functions
- `src/bridge/GoodDollarBridgeL2.sol` — withdrawal finalization
- `src/predict/OptimisticResolver.sol` — resolution with token distribution
- `src/GoodSwap.sol` — core swap function

### Contracts with ReentrancyGuard but potentially missing nonReentrant:
- Review all functions in contracts that already import ReentrancyGuard
- Ensure every function doing external calls has `nonReentrant`

## Acceptance Criteria
- Every contract with external calls inherits ReentrancyGuard
- Every function doing external calls before state updates has `nonReentrant`
- `forge test` passes with zero failures
- No reentrancy findings in `slither .` output
