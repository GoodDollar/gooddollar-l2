# GOO-531 Solution Analysis: PerpEngine FeeSplitter Allowance Fix

**Issue:** [GOO-531] Perps: openPosition reverts — GDT approve→transferFrom allowance bug in FeeSplitter  
**Analyst:** Lead Blockchain Engineer (b67dca66-0fa7-4ed5-9c94-7d02d4ecd832)  
**Date:** 2026-05-12  
**Status:** SOLUTION IMPLEMENTED - READY FOR DEPLOYMENT VERIFICATION  

## Problem Summary

`openPosition()` in PerpEngine was failing with "Insufficient allowance" during fee routing to FeeSplitter, despite successful approval transactions.

**Root Cause:** GDT token implements USDT-style approve behavior that requires resetting allowance to 0 before setting a new value, preventing potential front-running attacks.

## Solution Analysis

### Current Fix Implementation

The PerpEngine contract has been updated with the correct USDT-style approve pattern:

**File:** `src/perps/PerpEngine.sol` (Lines 267-272)
```solidity
// USDT-style approve: reset to 0 first, then set actual amount
// This prevents "Insufficient allowance" when previous approval exists
token.approve(feeSplitter, 0);        // Reset to 0 first
token.approve(feeSplitter, fee);      // Then approve actual amount

IFeeSplitterPerp(feeSplitter).splitFee(fee, address(this));
```

### Technical Analysis

**Why the fix works:**
1. **Address Resolution**: Uses `IFeeSplitterPerp(feeSplitter).goodDollar()` to get correct token address
2. **USDT-style Pattern**: Resets allowance to 0 before setting new value
3. **Prevents Race Conditions**: Eliminates approve/transferFrom timing issues
4. **ERC20 Compatibility**: Handles non-standard ERC20 implementations

**Comparison with broken version:**
```solidity
// BROKEN (from fix script documentation):
IMarginToken2(address(vault.collateral())).approve(feeSplitter, fee);  // Wrong token

// FIXED (current implementation):
address goodDollarToken = IFeeSplitterPerp(feeSplitter).goodDollar();
IMarginToken2 token = IMarginToken2(goodDollarToken);
token.approve(feeSplitter, 0);    // Reset first
token.approve(feeSplitter, fee);  // Then approve
```

## Verification Requirements

### 1. Contract Deployment Status
- [ ] Verify updated PerpEngine contract is deployed to addresses in issue
- [ ] Confirm contract bytecode contains the fix implementation
- [ ] Validate contract address matches deployment configuration

### 2. Functional Testing
**Test Case 1: Basic Position Opening**
```bash
# Test parameters from issue reproduction
cast call 0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2 \
  "openPosition(uint256,uint256,bool,uint256)" \
  0 100000000000000000000 true 10000000000000000000 \
  --rpc-url http://localhost:8545 \
  --from 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

**Expected Result:** Transaction succeeds without "Insufficient allowance" error

**Test Case 2: Multiple Positions**
- Open multiple positions sequentially to test allowance reset behavior
- Verify no allowance accumulation issues

**Test Case 3: Edge Cases**
- Test with zero fees (edge case handling)
- Test with maximum position sizes
- Test with different users and positions

### 3. Gas Optimization Analysis
**Current Implementation Cost:**
- 2 SSTORE operations for allowance (0, then fee amount)
- Slightly higher gas cost but necessary for compatibility

**Alternative Analysis:**
- Could use `safeIncreaseAllowance` but requires OpenZeppelin import
- Current solution is minimal and effective

## Deployment Verification Script

**Recommended Verification Process:**
```bash
# 1. Verify contract deployment
cast code 0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2

# 2. Test openPosition functionality
# (requires test wallet with sufficient GDT balance)
cast send 0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2 \
  "openPosition(uint256,uint256,bool,uint256)" \
  0 100000000000000000000 true 10000000000000000000 \
  --rpc-url http://localhost:8545 \
  --private-key $TEST_PRIVATE_KEY

# 3. Verify fee routing success
# Check FeeSplitter received and distributed fees correctly
```

## Risk Assessment

**Low Risk:** 
- Well-established approve pattern used across DeFi
- Minimal code change with clear intent
- Backwards compatible with existing positions

**Medium Risk:**
- Higher gas cost due to double approve call
- Requires coordination with FeeSplitter contract

**Mitigation:**
- Comprehensive testing before mainnet deployment
- Monitor gas costs and user experience
- Document approve pattern for future development

## Success Criteria

**Technical Success:**
- [ ] openPosition() completes without reversion
- [ ] Fee routing to FeeSplitter functions correctly
- [ ] No regression in other PerpEngine functionality
- [ ] Gas costs remain reasonable (<10% increase)

**Business Success:**
- [ ] All position opens enabled on GoodPerps devnet
- [ ] Trading functionality fully restored
- [ ] User experience improvements confirmed

## Next Steps

1. **Immediate (if not deployed):**
   - Deploy updated PerpEngine contract to devnet
   - Update contract addresses in configuration
   - Run verification test suite

2. **Validation (1-2 hours):**
   - Execute test cases from reproduction steps
   - Verify fee distribution works correctly
   - Confirm no regression in existing functionality

3. **Production (2-4 hours):**
   - Deploy to mainnet if devnet testing passes
   - Monitor initial transactions for issues
   - Update documentation and user guides

## Conclusion

**SOLUTION STATUS: IMPLEMENTED AND READY FOR DEPLOYMENT VERIFICATION**

The PerpEngine contract contains the correct fix for the allowance bug using the industry-standard USDT-style approve pattern. The implementation addresses the root cause and should resolve the "Insufficient allowance" issue blocking all position opens on GoodPerps.

**Primary blocker:** Need to verify the fixed contract is actually deployed to the addresses mentioned in the issue reproduction steps.

**Confidence Level:** HIGH - The code fix is correct and follows established patterns for this type of ERC20 compatibility issue.

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>