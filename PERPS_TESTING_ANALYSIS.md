# GoodPerps Testing Analysis - GOO-504

## Issue: Position opening/closing failures in margin→position flow

### Root Cause Analysis

Based on code review of PerpEngine.sol, MarginVault.sol, and PerpPriceOracle.sol, the most likely failure points are:

#### 1. Oracle Configuration Issues
- **Zero Price Error**: Oracle might not have prices set for markets
- **Market Not Supported**: `supportedMarkets[key]` not set properly
- **Price Staleness**: If deployment was long ago and prices not marked with `manualOverride`

#### 2. Margin Vault Issues  
- **Insufficient GDT Balance**: Test wallet doesn't have enough GDT tokens
- **Insufficient Approval**: GDT approval to MarginVault insufficient for margin + fees
- **Contract Linking**: MarginVault not properly linked to PerpEngine

#### 3. Contract State Issues
- **Paused State**: PerpEngine might be paused (`whenNotPaused` modifier)
- **Market Inactive**: Markets not marked as `active: true`
- **Wrong Market ID**: Trying to access market that doesn't exist

#### 4. Leverage/Margin Calculation Issues
- **Leverage Too High**: `size > margin * m.maxLeverage` check failing
- **Fee Calculation**: Total required margin includes trading fee (0.1% of position size)

### Expected Test Flow

```
1. Deploy Contracts ✅ (Already done)
2. Register Markets ✅ (BTC=0, ETH=1, SOL=2, BNB=3, MATIC=4, ARB=5)
3. Set Oracle Prices ✅ (Manual prices with override)
4. Fund Test Wallet → Check GDT balance
5. Approve MarginVault → Allow spending GDT  
6. Deposit Margin → Transfer GDT to vault
7. Open Position → Validate all conditions
8. Close Position → Settle PnL and release margin
9. Withdraw Margin → Return unused GDT
```

### Test Parameters Analysis

From the test script:
- **Market ID**: 0 (BTC market)
- **Position Size**: 100 GDT 
- **Margin**: 10 GDT
- **Leverage**: 100/10 = 10x (within BTC's 50x limit ✅)
- **Trading Fee**: 100 * 0.1% = 0.1 GDT
- **Total Required**: 10 + 0.1 = 10.1 GDT margin needed

### Potential Fixes

#### Fix 1: Oracle Price Refresh
If prices are stale or missing:
```solidity
// Refresh oracle prices
oracle.setManualPrice(
    keccak256("BTC"), 
    6_500_000_000_000,  // $65,000
    6_498_000_000_000   // Index price
);
```

#### Fix 2: Market Activation
If markets not active:
```solidity
// Ensure market is active
perpEngine.setMarketActive(0, true);
```

#### Fix 3: Contract Unpausing
If engine is paused:
```solidity
perpEngine.setPaused(false);
```

#### Fix 4: Funding Test Wallet
If insufficient GDT:
```solidity
// Admin mints GDT to test wallet
goodDollarToken.mint(testWallet, 50000 * 1e18); // 50K GDT
```

### Testing Strategy

Since direct blockchain access requires approval, recommend:

1. **Static Analysis**: Review deployed contract state through scripts
2. **Test Script Enhancement**: Add detailed error reporting to identify exact failure
3. **Deployment Verification**: Confirm all contracts properly linked
4. **Balance Checks**: Verify test wallet has sufficient funds
5. **Step-by-Step Testing**: Test each component individually before full flow

### Next Steps

1. Create enhanced test script with detailed error handling
2. Verify contract deployment addresses in addresses.env
3. Check oracle price configuration
4. Test margin deposit flow separately
5. Test position operations with proper error reporting