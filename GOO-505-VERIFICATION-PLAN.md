# GOO-505: GoodLend G$ Supply/Withdraw Verification

## Issue Description

**Problem**: GoodLend supply() function may revert when trying to supply GoodDollar (G$) tokens.
**Root Cause**: G$ reserve is not initialized in GoodLendPool, and the corresponding gToken is not deployed.

## Architecture Overview

GoodLend follows an Aave V3-inspired architecture where each asset requires:

1. **Asset Token**: The underlying token (G$ = `0x6533158b042775e2FdFeF3cA1a782EFDbB8EB9b1`)
2. **gToken**: Interest-bearing receipt token (e.g., gG$ for GoodDollar)
3. **Debt Token**: Variable debt token (e.g., dG$ for GoodDollar) 
4. **Reserve Initialization**: Asset added to GoodLendPool with parameters
5. **Oracle Price**: Price feed for liquidation calculations
6. **Interest Rate Model**: Rate parameters for supply/borrow APY

## Current Deployment State

Based on `broadcast/DeployGoodLend.s.sol/42069/run-1775327412795.json`:

- **GoodLendPool**: `0x49fd2be640db2910c2fab69bb8531ab6e76127ff`
- **SimplePriceOracle**: `0x46b142dd1e924fab83ecc3c08e4d46e82f005e0e`
- **InterestRateModel**: `0x367761085bf3c12e5da2df99ac6e1a824612b8fb`
- **Existing Reserves**: USDC and WETH only (no G$)

## Verification Process

### Step 1: Run Diagnosis

```bash
python3 verify_goodlend_gooddollar.py
```

This script checks:
- ✅ Devnet connectivity
- ✅ Contract deployments 
- ❌ G$ in reserves list
- ❌ G$ reserve active status
- ❌ G$ oracle price
- ❌ G$ supply functionality

**Expected Result**: Script identifies that G$ reserve is missing.

### Step 2: Deploy G$ Reserve Components

```bash
forge script script/DeployGoodDollarReserve.s.sol \
  --rpc-url http://localhost:8545 --broadcast --legacy
```

This script:
1. **Deploys gGoodDollar** (GoodLendToken for G$)
2. **Deploys dGoodDollar** (DebtToken for G$)  
3. **Initializes Reserve** with conservative parameters:
   - 50% LTV (Loan-to-Value)
   - 60% Liquidation Threshold
   - 10% Liquidation Bonus
   - 30% Reserve Factor (protocol revenue)
   - 100M G$ Supply Cap
   - 50M G$ Borrow Cap
4. **Sets Oracle Price** ($0.001 = 100,000 in 8-decimal format)
5. **Configures Interest Rates** (1% base, 5% slope1, 100% slope2)

### Step 3: Verify Fix

```bash
python3 verify_goodlend_gooddollar.py
```

**Expected Result**: All checks should pass ✅

### Step 4: Test Supply/Withdraw

```bash
python3 test_goodlend_supply.py
```

This performs end-to-end testing:
1. **Checks G$ balance** of test account
2. **Approves spending** to GoodLendPool
3. **Supplies 1 G$** to the pool  
4. **Verifies gToken receipt** (if possible)
5. **Withdraws 0.5 G$** from the pool
6. **Validates final balances**

**Expected Result**: Supply and withdraw operations succeed without reverting.

## Key Implementation Details

### GoodLendPool.supply() Requirements

From `src/lending/GoodLendPool.sol:231-254`, supply() requires:

```solidity
function _supply(address asset, uint256 amount, address onBehalfOf) internal {
    ReserveData storage reserve = reserves[asset];
    require(reserve.isActive, "GoodLendPool: reserve inactive");  // ← FAILS HERE
    require(amount > 0, "GoodLendPool: zero amount");
    // ... rest of function
}
```

**Fix**: `reserve.isActive` must be `true`, which happens when `initReserve()` is called.

### Reserve Initialization Process

From `src/lending/GoodLendPool.sol:170-208`:

```solidity
function initReserve(
    address asset,      // G$ token address
    address gToken,     // Deployed gG$ address  
    address debtToken,  // Deployed dG$ address
    // ... parameters
) external onlyAdmin {
    reserves[asset] = ReserveData({
        gToken: gToken,
        debtToken: debtToken,
        isActive: true,  // ← This enables supply()
        // ... other fields
    });
}
```

### Parameter Selection Rationale

**Conservative Parameters** chosen for G$ reserve:
- **50% LTV**: Lower than USDC (80%) due to G$ volatility
- **60% Liquidation Threshold**: Provides safety buffer  
- **30% Reserve Factor**: Higher protocol revenue share for UBI funding
- **High Supply/Borrow Caps**: G$ has large circulating supply

## Troubleshooting

### Common Issues

1. **"reserve inactive" error**: Reserve not initialized
   - **Solution**: Run `DeployGoodDollarReserve.s.sol`

2. **"transferFrom failed" error**: Insufficient approval/balance
   - **Solution**: Ensure G$ balance and approval to GoodLendPool

3. **Oracle price issues**: May affect borrowing/liquidation
   - **Solution**: Verify oracle price is set correctly

4. **Permission errors**: Admin-only functions
   - **Solution**: Use deployer account with admin permissions

### Manual Verification Commands

Check reserve exists:
```solidity
// Call GoodLendPool.getReservesCount() and reservesList(index)
```

Check reserve active:
```solidity  
// Call GoodLendPool.getReserveData(G$_ADDRESS)
// Should return non-zero liquidityIndex
```

Check oracle price:
```solidity
// Call SimplePriceOracle.getAssetPrice(G$_ADDRESS)  
// Should return 100000 (for $0.001)
```

## Files Created

1. **`verify_goodlend_gooddollar.py`**: Diagnostic script
2. **`script/DeployGoodDollarReserve.s.sol`**: Deployment script
3. **`test_goodlend_supply.py`**: End-to-end test script
4. **`GOO-505-VERIFICATION-PLAN.md`**: This documentation

## Success Criteria

- [ ] G$ appears in GoodLendPool reserves list
- [ ] G$ reserve shows as active with proper gToken/debtToken addresses
- [ ] Oracle price set for G$ 
- [ ] Interest rate model configured for G$
- [ ] `pool.supply(G$_ADDRESS, amount)` succeeds without revert
- [ ] `pool.withdraw(G$_ADDRESS, amount)` succeeds without revert  
- [ ] gG$ tokens minted to supplier correctly
- [ ] G$ balance changes reflect supply/withdraw amounts

## Next Steps After Fix

1. **Frontend Integration**: Update UI to support G$ lending
2. **Liquidity Incentives**: Consider G$ supply rewards
3. **Risk Parameters**: Monitor and adjust LTV/thresholds based on usage
4. **UBI Integration**: Verify 30% reserve factor flows to UBI pool correctly

## Related Issues

- **GOO-388**: GoodLend reserves becoming inactive after redeploy
- **GOO-531**: Perps allowance bug (similar contract interaction patterns)
- **UBI Fee Routing**: Ensure G$ lending revenue supports UBI properly