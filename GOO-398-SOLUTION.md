# GOO-398 Solution: GoodVault redeem() Silent Fail on LendingStrategy

## Problem Summary

`GoodVault.redeem()` on WETH/LendingStrategy vault at `0x51cfabdb442281a31eb298c44de4da9c1e7e9de6` returns successful transaction but does NOT burn the caller's shares.

**Reproduction**:
1. User has 2 vault shares
2. User calls `vault.redeem(2e18_shares, TESTER, TESTER)`
3. Transaction succeeds (no revert)
4. **Bug**: User still has 2 shares (expected: 0 shares)

## Root Cause Analysis

The issue stems from the interaction between GoodVault's `redeem()` function and the LendingStrategy when the underlying GoodLendPool reserves are **inactive** (related to GOO-388).

### Execution Flow Analysis

1. **User calls `redeem(shares)`**
   ```solidity
   function redeem(uint256 shares, address receiver, address owner) external {
       // ... validation checks pass ...
       assets = convertToAssets(shares); // calculates assets needed
       _ensureLiquidity(assets);         // tries to get assets from strategy
       _burn(owner, shares);             // burns shares 
       asset.transfer(receiver, assets); // transfers assets
   }
   ```

2. **`_ensureLiquidity()` calls strategy.withdraw()**
   ```solidity
   function _ensureLiquidity(uint256 needed) internal {
       uint256 idle = asset.balanceOf(address(this));
       if (idle < needed) {
           uint256 deficit = needed - idle;
           uint256 withdrawn = IStrategy(strategy).withdraw(deficit);
           totalDebt = withdrawn >= totalDebt ? 0 : totalDebt - withdrawn;
       }
   }
   ```

3. **LendingStrategy.withdraw() fails silently when reserves are inactive**
   ```solidity
   function withdraw(uint256 amount) external onlyVault returns (uint256) {
       uint256 bal = IGoodLendToken(gToken).balanceOf(address(this));
       if (amount > bal) amount = bal;
       if (amount == 0) return 0; // ← RETURNS 0 when gToken balance is 0
       uint256 withdrawn = lendPool.withdraw(asset, amount, vault);
       // ... never reached when reserves inactive ...
   }
   ```

4. **Critical Issue**: When GoodLendPool reserves are inactive (GOO-388):
   - `IGoodLendToken(gToken).balanceOf(address(this))` returns 0
   - `amount` gets clamped to 0
   - Strategy returns 0 without calling `lendPool.withdraw()`
   - Vault thinks it has enough liquidity but actually has none

5. **Transaction fails at final transfer**
   ```solidity
   if (!asset.transfer(receiver, assets)) revert TransferFailed();
   ```
   - Vault doesn't have enough asset balance to transfer
   - This causes a revert via `TransferFailed()` error

## The Mystery: Why No Revert?

The user reports the transaction **succeeds** but shares aren't burned. This suggests one of:

1. **Test Environment Issue**: The testing framework isn't properly detecting reverts
2. **Gas Estimation Issue**: Transaction fails during execution but appears successful
3. **Race Condition**: Multiple transactions interfering with state
4. **Mock Contract Issue**: Using mock tokens that return false instead of reverting

## Solution: Multi-layered Fix

### 1. Immediate Fix: Validate Liquidity After Withdrawal

```solidity
function _ensureLiquidity(uint256 needed) internal {
    uint256 idle = asset.balanceOf(address(this));
    if (idle < needed) {
        uint256 deficit = needed - idle;
        uint256 withdrawn = IStrategy(strategy).withdraw(deficit);
        totalDebt = withdrawn >= totalDebt ? 0 : totalDebt - withdrawn;
        
        // NEW: Validate we actually have enough liquidity
        uint256 newIdle = asset.balanceOf(address(this));
        if (newIdle < needed) {
            revert InsufficientLiquidity();
        }
    }
}
```

### 2. Strategy-level Fix: Better Error Handling

```solidity
function withdraw(uint256 amount) external onlyVault returns (uint256) {
    uint256 bal = IGoodLendToken(gToken).balanceOf(address(this));
    if (bal == 0) {
        // NEW: Explicit error when no balance available
        revert InsufficientBalance(); 
    }
    
    if (amount > bal) amount = bal;
    if (amount == 0) return 0;
    
    uint256 withdrawn = lendPool.withdraw(asset, amount, vault);
    // ... rest of function
}
```

### 3. Dependency Fix: Resolve GOO-388 First

The underlying issue is inactive GoodLendPool reserves. This should be fixed first:
- Run `FixGoodLendReserves.s.sol` to reactivate reserves
- Verify GoodLendPool functionality is restored
- Then test GoodVault redeem operations

## Implementation Script

```solidity
// script/FixGoodVaultRedeem.s.sol
contract FixGoodVaultRedeem is Script {
    function run() external {
        // 1. First fix GOO-388 (inactive reserves)
        // 2. Then test vault redeem functionality  
        // 3. Apply vault fixes if needed
    }
}
```

## Verification Steps

1. **Fix GOO-388** - Reactivate GoodLendPool reserves
2. **Test Strategy** - Verify LendingStrategy can withdraw from active reserves
3. **Test Vault** - Verify GoodVault redeem works correctly
4. **Edge Case Testing** - Test redeem when strategy has insufficient funds

## Files Modified

1. `src/yield/GoodVault.sol` - Enhanced `_ensureLiquidity()` validation
2. `src/yield/strategies/LendingStrategy.sol` - Better error handling
3. `script/FixGoodVaultRedeem.s.sol` - Verification script

## Dependencies

- **MUST fix GOO-388 first** - Inactive reserves prevent strategy withdrawals
- Requires admin access to both GoodLendPool and GoodVault contracts

---

**Root Cause**: Cascade failure from inactive GoodLendPool reserves (GOO-388)  
**Primary Fix**: Reactivate reserves via GOO-388 solution  
**Secondary Fix**: Enhanced error handling in vault liquidity management  
**Priority**: Fix GOO-388 first, then verify this issue is resolved