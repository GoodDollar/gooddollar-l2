# GOO-560 Solution: ValidatorStaking MinStake Too High for Testing

## Problem Summary

ValidatorStaking.stake() reverts with "BelowMinStake" error even when users try to stake 500k GDT. Users only have ~80k GDT in their test wallets.

## Root Cause Analysis

**The Issue**: `MIN_STAKE` is hardcoded to **1,000,000 GDT** (1 million) in the ValidatorStaking contract.

```solidity
// Line 26 in ValidatorStaking.sol
uint256 public constant MIN_STAKE = 1_000_000e18; // 1M G$ minimum
```

**The Problem for Testing**:
- Test wallets have ~80,000 GDT
- Users try to stake 500,000 GDT  
- Both amounts are below the 1M minimum
- This makes validator staking completely unusable on devnet

## Production vs Testing Requirements

### Production (Mainnet)
- 1M GDT minimum makes sense for security and economic incentives
- Prevents spam validators and ensures skin-in-the-game

### Testing (Devnet)  
- 1M GDT is too high for realistic testing
- Test wallets typically have much smaller balances
- Should be lowered for testing purposes

## Solution Options

### Option 1: Configurable MIN_STAKE (Recommended)

Make MIN_STAKE configurable by admin:

```solidity
// Replace constant with configurable variable
uint256 public minStake = 1_000_000e18; // Default 1M GDT

function setMinStake(uint256 _minStake) external onlyAdmin {
    require(_minStake > 0, "MinStake must be positive");
    minStake = _minStake;
    emit MinStakeUpdated(minStake);
}

// Update stake function to use variable
function stake(uint256 amount, string calldata name, string calldata endpoint) external {
    if (amount < minStake) revert BelowMinStake(); // Use variable instead of constant
    // ... rest of function
}
```

### Option 2: Deploy Separate Test Contract

Deploy ValidatorStaking with lower MIN_STAKE for devnet:

```solidity
uint256 public constant MIN_STAKE = 10_000e18; // 10k GDT for testing
```

### Option 3: Environment-Based Configuration

Use constructor parameter to set MIN_STAKE:

```solidity
uint256 public immutable MIN_STAKE;

constructor(address _goodDollar, address _admin, uint256 _minStake) {
    goodDollar = IGoodDollarToken(_goodDollar);
    admin = _admin;
    MIN_STAKE = _minStake; // Set at deployment
}
```

## Implementation: Option 1 - Configurable MIN_STAKE

**File**: `src/ValidatorStaking.sol`

**Changes Required**:

1. **Replace constant with variable** (line 26):
```solidity
// OLD
uint256 public constant MIN_STAKE = 1_000_000e18;

// NEW  
uint256 public minStake = 1_000_000e18;
```

2. **Add admin function** to update minStake:
```solidity
event MinStakeUpdated(uint256 newMinStake);

function setMinStake(uint256 _minStake) external onlyAdmin {
    require(_minStake > 0, "MinStake must be positive");
    minStake = _minStake;
    emit MinStakeUpdated(minStake);
}
```

3. **Update all references** to use variable:
- Line 92: `if (amount < minStake) revert BelowMinStake();`
- Line 143: `if (v.staked < minStake) {`
- Line 205: `if (v.staked < minStake) {`

## Deployment Script

```solidity
// script/FixValidatorStakingMinStake.s.sol
contract FixValidatorStakingMinStake is Script {
    address constant VALIDATOR_STAKING = 0x103a3b128991781ee2c8db0454ca99d67b257923;
    
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        
        // Set minStake to 10k GDT for testing (instead of 1M)
        IValidatorStaking(VALIDATOR_STAKING).setMinStake(10_000e18);
        
        console.log("MinStake updated to 10k GDT for testing");
        vm.stopBroadcast();
    }
}
```

## Testing Verification

After applying the fix:

1. **Check new minStake value**:
   ```solidity
   uint256 newMin = validatorStaking.minStake(); 
   // Should return 10,000e18 (10k GDT)
   ```

2. **Test staking with 50k GDT**:
   ```solidity
   validatorStaking.stake(50_000e18, "Test Validator", "http://localhost:8545");
   // Should succeed
   ```

3. **Test staking below new minimum**:
   ```solidity
   validatorStaking.stake(5_000e18, "Test Validator", "http://localhost:8545");
   // Should revert with BelowMinStake
   ```

## Production Deployment Notes

- **Mainnet**: Keep minStake at 1M GDT for security
- **Testnets**: Set minStake to reasonable testing amounts (10k-100k GDT)
- **Governance**: Consider making minStake adjustable through governance votes

## Files Modified

1. `src/ValidatorStaking.sol` - Make minStake configurable
2. `script/FixValidatorStakingMinStake.s.sol` - Deployment script to update minStake
3. `GOO-560-SOLUTION.md` - This documentation

---

**Root Cause**: Hardcoded 1M GDT minimum too high for testing  
**Fix**: Make MIN_STAKE configurable by admin  
**Impact**: Enables validator staking functionality on devnet  
**Priority**: High - blocks validator testing workflow