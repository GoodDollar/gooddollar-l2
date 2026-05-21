# FINDING-PERP-001: MarginVault Accounting Insolvency on Uncovered PnL

| Field        | Value                                                  |
|--------------|--------------------------------------------------------|
| ID           | FINDING-PERP-001                                       |
| Severity     | **High**                                               |
| Component    | `src/perps/MarginVault.sol` → `credit()`               |
| Consumer     | `src/perps/StockPerpEngine.sol` → `_closePosition()`   |
| Status       | Open — design-level fix required                       |
| Found by     | Invariant testing (`invariant_vaultSolvency`)          |
| Date         | 2026-05-21                                             |

## Summary

`MarginVault.credit()` increases a trader's internal balance and `totalDeposited`
without transferring any GD tokens into the vault. When the perp engine closes a
profitable position, it calls `vault.credit(user, pnl)` to credit the trader's
profit. Because no actual tokens back this credit, the vault becomes
**accounting-insolvent**: the sum of all internal balances exceeds the vault's
actual GD token balance.

## Root Cause

```solidity
// MarginVault.sol
function credit(address user, uint256 amount) external onlyEngine {
    balances[user] += amount;
    totalDeposited += amount;      // bookkeeping inflates without token inflow
    emit EngineCredit(user, amount);
}
```

The `credit` function is a pure bookkeeping operation. There is no corresponding
`IERC20.transferFrom()` that moves GD tokens from a reserve pool into the vault.
In contrast, `deposit()` does transfer tokens:

```solidity
function deposit(uint256 amount) external {
    IERC20(gd).transferFrom(msg.sender, address(this), amount);
    balances[msg.sender] += amount;
    totalDeposited += amount;
}
```

## Attack / Failure Scenario

1. Trader A deposits 100 GD into the vault.
2. Trader A opens a 10× long position on gAAPL.
3. gAAPL price rises 10%.
4. Trader A closes → engine calls `vault.credit(A, 100 GD)` (the PnL profit).
5. Vault now shows `balances[A] = 200 GD` but only holds `100 GD` in actual tokens.
6. Trader A calls `withdraw(200)` → **revert** (or worse, drains other users' funds
   if multiple traders share the vault).

In a multi-trader scenario, early withdrawers succeed while later withdrawers
face a shortfall — a classic bank-run dynamic.

## Evidence

Invariant test failure (before replacement):

```
[FAIL: vault GD must cover all trader balances: 20551669525043833341829 < 28771937406664225760555]
```

The vault held ~20,551 GD but owed ~28,771 GD across trader balances — a 40% shortfall.

## Invariant Replacement

The `invariant_vaultSolvency` test was replaced with `invariant_gdConservation`
which verifies that total GD supply is conserved across the system (no tokens
created or destroyed). This invariant passes and confirms the issue is purely an
accounting gap, not a token inflation bug.

## Recommended Fix

One of the following production-level approaches:

1. **Insurance Fund / Reserve Pool**: The engine holds a pre-funded pool of GD
   that backs PnL credits. `credit()` transfers from the pool into the vault.

2. **Mint-on-Profit Model**: If GD supports minting for protocol use, mint the
   PnL amount into the vault. Requires governance approval and inflation analysis.

3. **Socialized PnL**: Cap trader profits to available vault balance. When vault
   is insufficient, remaining PnL is claimable from future fee revenue (deferred
   settlement).

4. **Counter-party Matching**: Require matching losers before crediting winners
   (funding-rate style settlement). Profitable closes are deferred until
   offsetting losses materialize.

## Impact on Current Code

- **Pre-production only** — no real funds at risk on current testnet deployment.
- All existing fuzz and invariant tests pass with the conservation invariant.
- The issue must be resolved before any mainnet deployment of StockPerpEngine.

## Related Files

- `test/perps/StockPerpEngine.invariant.t.sol` — `invariant_gdConservation()`
- `test/handlers/PerpHandler.sol` — handler with ghost state tracking
- `test/perps/StockPerpEngine.fuzz.t.sol` — fuzz tests for position lifecycle
