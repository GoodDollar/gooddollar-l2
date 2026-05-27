# GOO-2286: Prediction Market Buy() Failure - Complete Analysis

**Issue**: Prediction market buy() function reverting — all trades fail  
**Status**: ROOT CAUSE IDENTIFIED — Requires MarketFactory redeployment  
**Investigator**: Lead Blockchain Engineer  
**Date**: 2026-05-25

## Executive Summary

✅ **ROOT CAUSE IDENTIFIED**: MarketFactory deployed with incorrect GoodDollar address  
❌ **MarketFactory Contract**: `0x6da3d07a6bf01f02fb41c02984a49b5d9aa6ea92`  
❌ **Expected GoodDollar**: `0x5FbDB2315678afecb367f032d93F642f64180aa3` (NO CONTRACT)  
✅ **Actual GoodDollar**: `0x68d2ecd85bdebffd075fb6d87ffd829ad025dd5c` (VALID ERC20)

## Investigation Results

### 1. Primary Issue: Contract Configuration Error

The MarketFactory was deployed with a GoodDollar address that has no contract:

```
MarketFactory.goodDollar = 0x5FbDB2315678afecb367f032d93F642f64180aa3 ❌ (empty)
Real GoodDollar address = 0x68d2ecd85bdebffd075fb6d87ffd829ad025dd5c ✅ (valid)
```

**Technical Failure Mode**:
- buy() calls `goodDollar.transferFrom(msg.sender, address(this), amount)`
- Contract attempts to call transferFrom on non-existent contract
- Transaction reverts with empty data (no contract to return error message)

### 2. Secondary Issue: Expired Markets (RESOLVED)

- **139 markets** initially existed, **128 were expired** 
- **Created 3 new valid markets** with proper durations:
  - Market 177: "Will BTC exceed $100k by end of 2026?" (24 hours)
  - Market 179: "Will ETH reach $5000 in the next month?" (30 days)  
  - Market 180: "Will GoodDollar L2 launch this quarter?" (7 days)

### 3. Contract Verification

**MarketFactory (0x6da3d07a6bf01f02fb41c02984a49b5d9aa6ea92)**:
- ✅ Contract deployed (10,922 bytes)
- ✅ 205 markets total
- ✅ Admin functions working
- ❌ Configured with wrong GoodDollar address

**GoodDollar (0x68d2ecd85bdebffd075fb6d87ffd829ad025dd5c)**:
- ✅ Valid ERC20 contract (7,926 bytes)  
- ✅ Name: "GoodDollar", Symbol: "G$", Decimals: 18
- ✅ Matches addresses.json configuration

**Expected GoodDollar (0x5FbDB2315678afecb367f032d93F642f64180aa3)**:
- ❌ No contract deployed (empty bytecode)

## Solution Required

### IMMEDIATE: Redeploy MarketFactory

The `goodDollar` address is set as `immutable` in the constructor and cannot be updated.

**Current deployment**:
```solidity
new MarketFactory(
    0x5FbDB2315678afecb367f032d93F642f64180aa3, // ❌ Empty address
    feeSplitter,
    admin
);
```

**Required deployment**:
```solidity
new MarketFactory(
    0x68d2ecd85bdebffd075fb6d87ffd829ad025dd5c, // ✅ Real GoodDollar
    feeSplitter,
    admin
);
```

### Implementation Steps

1. **Redeploy MarketFactory** with correct GoodDollar address from addresses.json
2. **Update backend configuration** to use new MarketFactory address  
3. **Update addresses.json** with new MarketFactory address
4. **Test buy() function** on new deployment
5. **Migrate existing markets** if needed (or start fresh)

### Files Requiring Updates

- `op-stack/addresses.json` - Update MarketFactory address
- `backend/predict/src/index.ts` - Update CONTRACT_ADDRESSES.marketFactory
- Deployment scripts - Fix GoodDollar address reference

## Investigation Tools Created

- `debug-market-factory-buy-issue.js` - Market state diagnostics
- `fix-expired-prediction-markets.js` - Market lifecycle management  
- `debug-buy-failure.js` - Transaction failure analysis
- `investigate-deployments.js` - Contract verification tool

## Technical Evidence

**Transaction Failures**:
- Static call error: `execution reverted (no data present; likely require(false) occurred)`
- Reason: Contract calling transferFrom on non-existent address
- Gas usage: ~36,418 gas (transaction processed but reverted)

**Market State**:
- All new test markets are valid and non-expired
- Market status checks pass (Open, non-expired, positive amount)  
- GoodDollar balances and approvals are sufficient

**Configuration Mismatch**:
- addresses.json: `0x68d2...` ✅ (valid GoodDollar)
- MarketFactory: `0x5FbD...` ❌ (no contract)

## Impact Assessment

- **Trading blocked**: All prediction market buy() transactions fail
- **Markets available**: 3 valid test markets ready for trading
- **Infrastructure**: Core contracts functional, configuration issue only
- **Data loss**: None, markets and balances preserved

## Next Steps

**Immediate**: Deploy team to redeploy MarketFactory with correct configuration  
**Timeline**: Should resolve within hours once redeployment completes  
**Testing**: Verify buy() transactions work on new contract  
**Monitoring**: Confirm no further configuration mismatches exist

---

**Investigation Status**: COMPLETE  
**Solution**: Identified, requires deployment team action  
**Priority**: HIGH - Blocks all prediction market functionality