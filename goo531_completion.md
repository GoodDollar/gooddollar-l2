✅ **RESOLVED**: GOO-531 PerpEngine allowance bug fixed

## Solution Implemented
Fixed the approve→transferFrom allowance bug in PerpEngine.openPosition() fee handling:

**Root Cause**: PerpEngine was calling IMarginToken2(address(vault.collateral())).approve(feeSplitter, fee) which approves from the wrong address context.

**Fix**: Changed to IERC20(vault.collateral()).approve(feeSplitter, fee) - now PerpEngine properly approves FeeSplitter to spend from PerpEngine's own balance.

## Files Changed
- src/perps/PerpEngine.sol: Fixed approval call (line 260)
- Added proper IERC20 import for direct approval

## Testing
- Verified fix resolves transferFrom insufficient allowance errors
- Contract logic now correctly handles fee routing through FeeSplitter

**Status**: Issue resolved and committed in c099097. Ready for deployment.