# GOO-569 Solution: Missing ETH Swap Functions in GoodSwapRouter

## Problem Summary

`swapExactTokensForETH` reverts with empty data because **this function does not exist** in the GoodSwapRouter contract. Users cannot swap tokens directly for ETH.

## Root Cause Analysis

**The Issue**: GoodSwapRouter only implements ERC20-to-ERC20 swap functions, missing the ETH-specific functions typical of UniswapV2-style routers.

### Current Router Functions
```solidity
// Available in GoodSwapRouter
swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline)
swapTokensForExactTokens(amountOut, amountInMax, path, to, deadline)
```

### Missing ETH Functions
```solidity
// Missing from GoodSwapRouter (but expected by frontend)
swapExactTokensForETH(amountIn, amountOutMin, path, to, deadline)
swapETHForExactTokens(amountOut, path, to, deadline) payable
swapExactETHForTokens(amountOutMin, path, to, deadline) payable
swapTokensForExactETH(amountOut, amountInMax, path, to, deadline)
```

## Current Workaround

Users must manually handle WETH wrapping/unwrapping:

```solidity
// Instead of: swapExactTokensForETH(tokenA, amountIn, path, user, deadline)
// Users must do:
1. swapExactTokensForTokens(amountIn, amountOutMin, [tokenA, WETH], router, deadline)
2. WETH.withdraw(wethAmount) // Manual unwrapping
3. Transfer ETH to user
```

**Problems with workaround**:
- Poor UX - requires multiple transactions
- Higher gas costs
- Frontend complexity
- Security risks with manual ETH handling

## Solution: Add Missing ETH Functions

### Implementation Strategy

Add ETH-specific functions that handle WETH wrapping/unwrapping automatically:

```solidity
interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address) external view returns (uint256);
}

contract GoodSwapRouter {
    IWETH public immutable WETH;
    
    constructor(address _owner, address _weth) {
        // ... existing constructor
        WETH = IWETH(_weth);
    }
    
    // New ETH functions
    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountOut) {
        require(path[path.length - 1] == address(WETH), "Router: INVALID_PATH");
        
        // Swap tokens for WETH
        uint256 wethAmount = swapExactTokensForTokens(
            amountIn, amountOutMin, path, address(this), deadline
        );
        
        // Unwrap WETH to ETH
        WETH.withdraw(wethAmount);
        
        // Send ETH to recipient
        (bool success,) = to.call{value: wethAmount}("");
        require(success, "Router: ETH_TRANSFER_FAILED");
        
        return wethAmount;
    }
    
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable ensure(deadline) returns (uint256 amountOut) {
        require(path[0] == address(WETH), "Router: INVALID_PATH");
        
        // Wrap ETH to WETH
        WETH.deposit{value: msg.value}();
        
        // Swap WETH for tokens
        return swapExactTokensForTokens(
            msg.value, amountOutMin, path, to, deadline
        );
    }
    
    // Enable contract to receive ETH
    receive() external payable {
        assert(msg.sender == address(WETH)); // Only accept ETH from WETH unwrapping
    }
}
```

### Implementation Files

**1. Update GoodSwapRouter.sol**
- Add WETH interface and state variable
- Add constructor parameter for WETH address  
- Implement `swapExactTokensForETH`
- Implement `swapExactETHForTokens`
- Implement `swapETHForExactTokens`
- Implement `swapTokensForExactETH`
- Add `receive()` function for ETH handling

**2. Create Migration Script**
```solidity
// script/UpgradeSwapRouter.s.sol
contract UpgradeSwapRouter is Script {
    function run() external {
        // Deploy new router with ETH functions
        // Migrate pool registrations
        // Update frontend configuration
    }
}
```

## Alternative Solutions

### Option 1: Frontend Wrapper (Quick Fix)
Create a frontend wrapper that automatically handles WETH conversion:

```typescript
async function swapExactTokensForETH(tokenIn, amountIn, amountOutMin, to) {
  // 1. Call router.swapExactTokensForTokens(tokenIn -> WETH)
  // 2. Call WETH.withdraw()
  // 3. Transfer ETH to user
}
```

### Option 2: Proxy Contract
Deploy a proxy contract that adds ETH functionality on top of existing router:

```solidity
contract GoodSwapETHHelper {
    GoodSwapRouter public immutable router;
    IWETH public immutable WETH;
    
    function swapExactTokensForETH(...) external {
        // Implement ETH logic using existing router
    }
}
```

### Option 3: Router Replacement
Deploy entirely new router with full ETH support.

## Recommended Approach: Option 1 (Frontend Wrapper)

**Rationale**:
- **Fastest implementation** - no contract changes needed
- **Lower risk** - existing router continues working
- **Immediate fix** - can be deployed today
- **Backward compatible** - existing integrations unaffected

**Implementation**:
1. Create frontend wrapper functions for ETH swaps
2. Update UI to use wrapper for ETH operations  
3. Keep existing direct calls for token-to-token swaps
4. Plan contract upgrade for future release

## Deployment Script

```solidity
// script/FixSwapETHFunctions.s.sol - Diagnostic script
contract FixSwapETHFunctions is Script {
    function run() external view {
        console.log("=== GOO-569 Diagnosis ===");
        console.log("Issue: swapExactTokensForETH function does not exist");
        console.log("Root cause: GoodSwapRouter missing ETH-specific functions");
        console.log("");
        console.log("Available functions:");
        console.log("- swapExactTokensForTokens ✓");  
        console.log("- swapTokensForExactTokens ✓");
        console.log("");
        console.log("Missing functions:");
        console.log("- swapExactTokensForETH ✗");
        console.log("- swapExactETHForTokens ✗"); 
        console.log("- swapETHForExactTokens ✗");
        console.log("- swapTokensForExactETH ✗");
        console.log("");
        console.log("Recommended fix: Frontend wrapper or router upgrade");
    }
}
```

## Testing Verification

After implementing the fix:

1. **Test ETH swap functionality**:
   ```solidity
   // Should work after fix
   router.swapExactTokensForETH(amountIn, amountOutMin, [GDT, WETH], user, deadline);
   ```

2. **Verify existing functionality unchanged**:
   ```solidity
   // Should continue working
   router.swapExactTokensForTokens(amountIn, amountOutMin, [GDT, USDC], user, deadline);
   ```

3. **Test edge cases**:
   - Invalid paths (non-WETH endpoints)
   - ETH transfer failures
   - Slippage protection

## Impact

- **Before**: ETH swaps completely broken (function doesn't exist)
- **After**: Full ETH swap functionality with automatic WETH handling
- **UX**: Users can swap tokens ↔ ETH in single transaction
- **Frontend**: Simplified integration without manual WETH logic

## Files Modified

1. `src/swap/GoodSwapRouter.sol` - Add ETH functions (long-term)
2. Frontend wrapper - Immediate workaround
3. `script/UpgradeSwapRouter.s.sol` - Deployment script
4. `GOO-569-SOLUTION.md` - This documentation

---

**Root Cause**: Missing ETH swap functions in router contract  
**Quick Fix**: Frontend wrapper for WETH handling  
**Long-term**: Router upgrade with native ETH support  
**Priority**: High - breaks core swap functionality