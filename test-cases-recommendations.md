# Test Case Recommendations for GoodDollar L2

## Priority 1: Critical Security Test Suites

### Liquidation System Tests
```solidity
// Health Factor & Liquidation Logic
describe("GoodLendPool Liquidation", function() {
  it("should liquidate user when health factor < 1", async function() {
    // Test liquidateUserHF with undercollateralized position
  });
  
  it("should calculate correct liquidation amount", async function() {
    // Test max liquidation vs partial liquidation
  });
  
  it("should handle insufficient collateral scenarios", async function() {
    // Edge case: liquidation attempt with no collateral
  });
  
  it("should update health factor after liquidation", async function() {
    // Verify health factor recalculation post-liquidation
  });
});

describe("CDPManager Liquidation", function() {
  it("should liquidate unhealthy vault", async function() {
    // Test liquidate() function with underwater vault
  });
  
  it("should close vault after complete liquidation", async function() {
    // Test full vault closure flow
  });
  
  it("should handle partial liquidations", async function() {
    // Test scenarios where only portion of debt is liquidated
  });
});

describe("StabilityPool Integration", function() {
  it("should absorb bad debt via offset mechanism", async function() {
    // Test offset() function during liquidations
  });
  
  it("should distribute liquidation rewards", async function() {
    // Test reward distribution to stability pool providers
  });
});
```

### Bridge Security Tests
```solidity
describe("Cross-Chain Bridge Security", function() {
  it("should validate multi-signature deposits", async function() {
    // Test L1Bridge.deposit() with valid signatures
  });
  
  it("should reject invalid signatures", async function() {
    // Test signature validation edge cases
  });
  
  it("should prevent replay attacks", async function() {
    // Test withdrawal nonce and hash validation
  });
  
  it("should enforce validator threshold", async function() {
    // Test minimum validator requirements
  });
  
  it("should handle validator set changes", async function() {
    // Test addValidator/removeValidator scenarios
  });
});
```

### Emergency System Tests
```solidity
describe("Emergency Controls", function() {
  it("should pause all operations when activated", async function() {
    // Test EmergencyPause.pause() functionality
  });
  
  it("should allow emergency withdrawals during pause", async function() {
    // Test emergencyWithdraw() during pause state
  });
  
  it("should restrict unpause to authorized accounts", async function() {
    // Test access controls on unpause()
  });
  
  it("should cage collateral during emergency shutdown", async function() {
    // Test CollateralJoin.cage() emergency procedures
  });
});
```

## Priority 2: Trading System Tests

### Perp Engine Tests
```solidity
describe("Perpetual Futures Engine", function() {
  it("should update funding rates correctly", async function() {
    // Test updateFundingRate() calculations
  });
  
  it("should calculate PnL accurately", async function() {
    // Test calculatePnL() for long/short positions
  });
  
  it("should liquidate underwater positions", async function() {
    // Test position liquidation logic
  });
  
  it("should handle market creation", async function() {
    // Test new market deployment and initialization
  });
});

describe("Margin Vault Security", function() {
  it("should enforce timelock on withdrawals", async function() {
    // Test enforceTimelock() mechanism
  });
  
  it("should maintain collateral ratios", async function() {
    // Test getCollateralRatio() calculations
  });
  
  it("should prevent over-leverage", async function() {
    // Test margin requirement enforcement
  });
});
```

## Priority 3: Core Token & Vault Tests

### gUSD Extended Tests
```solidity
describe("gUSD Token Extended", function() {
  it("should transfer tokens correctly", async function() {
    // Test transfer() and transferFrom() functions
  });
  
  it("should handle allowances properly", async function() {
    // Test approve(), allowance() edge cases
  });
  
  it("should maintain accurate total supply", async function() {
    // Test totalSupply() after mint/burn operations
  });
  
  it("should check balances correctly", async function() {
    // Test balanceOf() in various scenarios
  });
});
```

### Vault System Tests  
```solidity
describe("Good Vault Extended Tests", function() {
  it("should handle large deposits/withdrawals", async function() {
    // Test deposit() with edge amounts
  });
  
  it("should calculate shares correctly", async function() {
    // Test share calculation during deposits
  });
  
  it("should prevent vault manipulation", async function() {
    // Test against donation/inflation attacks
  });
});
```

## Infrastructure Test Improvements

### Pre-Test Validation
```javascript
describe("Infrastructure Health Checks", function() {
  before(async function() {
    // Validate all contracts have bytecode
    await validateContractDeployments();
    
    // Check tester account gas balances
    await ensureGasFunding();
    
    // Verify RPC connectivity
    await testRPCHealth();
  });
});
```

### Automated Recovery
```javascript
// Auto-recovery from DEVNET_DRIFT
async function handleDevnetDrift() {
  try {
    await testContractCall();
  } catch (error) {
    if (error.message.includes("no bytecode")) {
      console.log("DEVNET_DRIFT detected, refreshing addresses...");
      await exec("python scripts/refresh-addresses.py");
      await delay(5000);
      return testContractCall(); // Retry
    }
    throw error;
  }
}
```

## Test Execution Strategy

### Phase 1: Critical Security (Weeks 1-2)
1. **Liquidation Tests:** Implement all health factor and liquidation logic tests
2. **Bridge Security:** Complete cross-chain validation and signature tests
3. **Emergency Systems:** Full coverage of pause/unpause and emergency procedures

### Phase 2: Trading & Operations (Week 3)
1. **Perp Engine:** Market creation, funding rates, PnL calculations
2. **Margin Management:** Collateral ratios, timelock enforcement
3. **Token Operations:** Extended gUSD and vault testing

### Phase 3: Comprehensive Coverage (Week 4+)
1. **Oracle Systems:** Price feed validation and failure scenarios
2. **Fee Distribution:** UBI pool management and fee splitting
3. **Governance:** Parameter updates and upgrade procedures

## Success Metrics
- **Coverage Target:** >80% of critical contract functions
- **Success Rate:** >95% test pass rate
- **Security Coverage:** 100% of liquidation, bridge, emergency functions
- **Performance:** Tests complete within 10 minutes
- **Reliability:** Zero infrastructure failures blocking tests

## Implementation Notes
- Use fuzzing for edge case discovery
- Implement property-based testing for invariants
- Add stress testing with large transaction volumes
- Create comprehensive revert reason testing
- Document all test scenarios and expected outcomes