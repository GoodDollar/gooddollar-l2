# GOO-388 Solution: GoodLendPool Reserves Inactive After Redeploy

## Problem Summary

After devnet restart and redeploy, GoodLendPool at `0x49fd2BE640DB2910c2fAb69bB8531Ab6E76127ff` has both reserves (USDC6 and WETH18) inactive (`isActive=false`). This causes:

- `supply()` reverts with error message "GoodLendPool: reserve inactive" 
- `getReserveData()` may also revert
- Users cannot supply or interact with the lending pool

## Root Cause Analysis

The issue occurs because after redeployment of the GoodLendPool contract, the reserves need to be reactivated. The reserves are stored in the contract's state, and the `isActive` flag gets reset to `false` when:

1. The contract is redeployed with fresh state
2. The `initReserve()` function wasn't called again after redeploy
3. Or `setReserveActive(asset, false)` was called inadvertently

## Solution Implementation

### Option A: Reactivate Existing Reserves (Recommended)

If the reserves were already initialized but marked inactive, use the `setReserveActive()` function:

```solidity
// Reactivate USDC reserve
pool.setReserveActive(USDC_ADDRESS, true);

// Reactivate WETH reserve  
pool.setReserveActive(WETH_ADDRESS, true);
```

### Option B: Re-initialize Reserves

If reserves were never initialized, use `initReserve()` with the same parameters as the original deployment.

## Deployment Scripts

I've created comprehensive fix scripts:

### 1. Diagnostic Script
```bash
forge script script/FixGoodLendReserves.s.sol:DiagnoseGoodLendReserves \\
  --rpc-url $RPC_URL
```

This will:
- List all reserves and their current status
- Test `getReserveData()` calls to identify inactive reserves
- Provide detailed diagnostics

### 2. Fix Script
```bash
forge script script/FixGoodLendReserves.s.sol:FixGoodLendReserves \\
  --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY
```

This will:
- Automatically reactivate all reserves on the pool
- Test the fix by performing a test supply operation
- Provide detailed logging of the repair process

## Manual Verification

After running the fix script, verify the solution:

```solidity
// 1. Check reserve is active
(uint256 totalDeposits, , , , , , ) = pool.getReserveData(USDC_ADDRESS);
// Should not revert

// 2. Test supply operation
usdc.approve(address(pool), 1000e6);
pool.supply(USDC_ADDRESS, 1000e6);
// Should succeed without reverting
```

## Contract Addresses (From Issue)

- **GoodLendPool**: `0x49fd2BE640DB2910c2fAb69bB8531Ab6E76127ff`
- **USDC (from fix script)**: `0x2B0d36FACD61B71CC05ab8F3D2355ec3631C0dd5`
- **gUSDC**: `0x4631BCAbD6dF18D94796344963cB60d44a4136b6`
- **dUSDC**: `0x86A2EE8FAf9A840F7a2c64CA3d51209F9A02081D`

*Note: WETH addresses will be discovered by the diagnostic script*

## Technical Details

### Error Code Analysis
The "error code 3" mentioned in the issue likely refers to the first `require` statement in `_supply()`:
```solidity
require(reserve.isActive, "GoodLendPool: reserve inactive");
```

### Reserve State Structure
```solidity
struct ReserveData {
    bool isActive;        // ← This is the flag that needs to be true
    bool borrowingEnabled;
    // ... other fields
}
```

## Prevention

To prevent this issue in future deployments:

1. **Document deployment checklist** including reserve activation
2. **Add integration tests** that verify reserve functionality post-deployment  
3. **Use deployment scripts** that automatically activate reserves after initialization
4. **Monitor reserve status** in health checks

## Files Modified/Created

1. `script/FixGoodLendReserves.s.sol` - Comprehensive fix and diagnostic scripts
2. `GOO-388-SOLUTION.md` - This solution document

## Verification Steps

1. Run diagnostic script to confirm problem
2. Run fix script to reactivate reserves
3. Test supply/withdraw operations
4. Monitor lending pool functionality

---

**Status**: Ready for deployment  
**Risk Level**: Low (only activates existing reserves)  
**Estimated Fix Time**: 5 minutes  
**Dependencies**: Admin access to GoodLendPool contract