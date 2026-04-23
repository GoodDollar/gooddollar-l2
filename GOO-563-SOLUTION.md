# GOO-563 Solution: FeeSplitter Allowance Bug in PerpEngine

## Problem Summary

`PerpEngine.openPosition()` fails with "Insufficient allowance" when the FeeSplitter tries to collect fees. The entire perps system is non-functional.

## Root Cause Analysis

**The Bug**: Mismatch in the approve/transferFrom pattern between PerpEngine and UBIFeeSplitter.

### Current (Broken) Flow:

```solidity
// In PerpEngine.openPosition() around lines 260-261:
IMarginToken2(address(vault.collateral())).approve(feeSplitter, fee);
IFeeSplitterPerp(feeSplitter).splitFee(fee, address(this));
```

```solidity
// In UBIFeeSplitter.splitFee() line 87:
goodDollar.transferFrom(msg.sender, address(this), totalFee);
```

**The Problem**:
1. **Approval**: `vault.collateral().approve(feeSplitter, fee)` - FeeSplitter approved to spend from vault.collateral() address
2. **TransferFrom**: `goodDollar.transferFrom(msg.sender, ...)` - FeeSplitter tries to spend from PerpEngine address (msg.sender)

**Address Mismatch**:
- Approval is for: `(vault.collateral(), feeSplitter)`  
- TransferFrom uses: `(PerpEngine, feeSplitter)`

## Solution: Fix Token Flow in PerpEngine

The fix requires ensuring tokens are available in PerpEngine before calling FeeSplitter.

### Option 1: Transfer-Then-Approve Pattern (Recommended)

```solidity
// Fix in PerpEngine.openPosition()
if (fee > 0) {
    vault.debit(msg.sender, fee);
    vault.flushFee(address(this), fee);  // Transfer fee tokens to PerpEngine
    
    // Now PerpEngine has the tokens, approve FeeSplitter to spend them
    IMarginToken2(address(vault.collateral())).approve(feeSplitter, fee);
    IFeeSplitterPerp(feeSplitter).splitFee(fee, address(this));
}
```

### Option 2: Direct Vault-to-FeeSplitter Flow

```solidity
// Alternative: Transfer directly to FeeSplitter then call with 0-transfer
if (fee > 0) {
    vault.debit(msg.sender, fee);
    vault.flushFee(feeSplitter, fee);  // Send directly to FeeSplitter
    
    // FeeSplitter already has the tokens, call with dummy parameters
    IFeeSplitterPerp(feeSplitter).splitFee(fee, address(this));
}
```

But this would require modifying UBIFeeSplitter to handle the case where it already has the tokens.

### Option 3: Modify UBIFeeSplitter Interface

Add a new function to UBIFeeSplitter:

```solidity
function splitFeeFrom(address from, uint256 totalFee, address dAppRecipient) external {
    // Transfer from specified address instead of msg.sender
    goodDollar.transferFrom(from, address(this), totalFee);
    // ... rest of logic
}
```

Then PerpEngine calls:
```solidity
IFeeSplitterPerp(feeSplitter).splitFeeFrom(address(vault.collateral()), fee, address(this));
```

## Recommended Implementation: Option 1

**File**: `src/perps/PerpEngine.sol`  
**Lines**: ~258-262

**Current**:
```solidity
vault.debit(msg.sender, fee);
vault.flushFee(address(this), fee);
IMarginToken2(address(vault.collateral())).approve(feeSplitter, fee);
IFeeSplitterPerp(feeSplitter).splitFee(fee, address(this));
```

**Fixed**:
```solidity
vault.debit(msg.sender, fee);
vault.flushFee(address(this), fee);  // Ensure tokens are in PerpEngine
// Now approve FeeSplitter to spend from PerpEngine (msg.sender to FeeSplitter)
IMarginToken2(address(vault.collateral())).approve(feeSplitter, fee);
IFeeSplitterPerp(feeSplitter).splitFee(fee, address(this));
```

**Key Change**: Ensure `vault.flushFee()` transfers tokens TO the PerpEngine, so when FeeSplitter calls `transferFrom(msg.sender, ...)`, the PerpEngine has the tokens and the approval works.

## Verification Steps

1. **Check vault.flushFee()** - Ensure it transfers tokens to the specified recipient (PerpEngine)
2. **Test openPosition()** - Verify fee payment works after fix
3. **Verify FeeSplitter** - Confirm UBI, protocol, and dApp shares are properly distributed

## Impact

- **Before**: Entire perps system non-functional (no positions can be opened)
- **After**: Full perps functionality restored with proper UBI fee routing

## Dependencies

- Verify `MarginVault.flushFee()` implementation transfers tokens correctly
- Test with devnet GDT token to ensure approve/transferFrom compatibility

---

**Root Cause**: Approve/transferFrom address mismatch  
**Fix**: Ensure tokens flow to PerpEngine before FeeSplitter approval  
**Priority**: Critical - blocks entire perps system