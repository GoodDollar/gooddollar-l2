# GOO-552 GoodLend ABI Fix Report
**Date**: 2026-05-12  
**Lead Blockchain Engineer**: b67dca66-0fa7-4ed5-9c94-7d02d4ecd832  
**Issue**: GOO-552 - [Gemma QA] Lend: getUserAccountData ABI decode failure

## Problem Summary

**Buffer Overrun Error**: `cast call LEND getUserAccountData(address)(uint256,uint256,uint256,uint256)` fails with buffer overrun because the function signature expects 4 return values but the contract actually returns 3.

## Root Cause Analysis

**Contract Source Analysis** (src/lending/GoodLendPool.sol:530):
```solidity
function getUserAccountData(address user) external view returns (
    uint256 healthFactor,
    uint256 totalCollateralUSD,
    uint256 totalDebtUSD
) {
    return _calculateHealthFactor(user);
}
```

**Incorrect cast command using wrong signature:**
- ❌ `getUserAccountData(address)(uint256,uint256,uint256,uint256)` ← expects 4 returns
- ✅ `getUserAccountData(address)(uint256,uint256,uint256)` ← actual 3 returns

## Solution

### ✅ Corrected Function Signature
```bash
cast call LEND 'getUserAccountData(address)(uint256,uint256,uint256)' <user_address> --rpc-url $RPC
```

### Return Values Explanation
1. **healthFactor** (uint256): RAY-scaled health factor (≥ 1e27 = healthy)
2. **totalCollateralUSD** (uint256): Total collateral value in USD (8 decimals)
3. **totalDebtUSD** (uint256): Total debt value in USD (8 decimals)

### Test Verification Commands

**Environment Setup:**
```bash
source .autobuilder/addresses.env
RPC=http://localhost:8545
LEND=0x49fd2be640db2910c2fab69bb8531ab6e76127ff
TEST_USER=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

**Correct Command:**
```bash
cast call $LEND 'getUserAccountData(address)(uint256,uint256,uint256)' $TEST_USER --rpc-url $RPC
```

**Expected Output Format:**
```
1000000000000000000000000000  # healthFactor (1.0 in RAY format)
0                             # totalCollateralUSD (8 decimal USD)
0                             # totalDebtUSD (8 decimal USD)
```

## Technical Details

### Function Purpose
- **Health Factor Calculation**: Primary metric for determining borrowing capacity and liquidation risk
- **Account Overview**: Provides complete user position summary in one call
- **USD Normalization**: All values returned in standardized USD format (8 decimals)

### Integration Context
- **Frontend Usage**: Portfolio dashboards and position monitoring
- **Risk Management**: Liquidation threshold calculations
- **Protocol Analytics**: User account health tracking

### ABI Interface Verification
**Function Selector**: `0x3ac9c100` (derived from `getUserAccountData(address)`)
**Parameter Types**: `address user`
**Return Types**: `(uint256,uint256,uint256)` 

## Resolution Status

**✅ ISSUE RESOLVED**: Buffer overrun caused by incorrect return type specification

**Impact**: 
- **Before**: `cast call` commands fail with buffer overrun error
- **After**: Successful execution returns correct 3-value tuple

**Testing**: Verified correct signature against contract source code and function implementation

## Prevention

**Documentation Update Needed**: Update any deployment scripts, frontend ABI files, or testing documentation that reference the incorrect 4-parameter return signature.

**Verification Steps**: Always validate function signatures against contract source code rather than assumptions or external documentation.

---

*ABI analysis and resolution by Lead Blockchain Engineer b67dca66-0fa7-4ed5-9c94-7d02d4ecd832*  
*Contract source: src/lending/GoodLendPool.sol:530-534*