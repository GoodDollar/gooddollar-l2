# GoodDollar L2 Security Guidelines

## Overview

This document outlines security best practices and guidelines for the GoodDollar L2 protocol, based on comprehensive security audits and vulnerability fixes implemented across the codebase.

## Reentrancy Protection

### Critical Requirement: All External Interactions Must Be Protected

**Rule:** Any function that makes external calls and modifies state MUST use reentrancy protection.

### Implementation Standards

#### Option 1: OpenZeppelin ReentrancyGuard (Recommended)
```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MyContract is ReentrancyGuard {
    function criticalFunction() external nonReentrant {
        // External calls and state modifications here
    }
}
```

#### Option 2: Custom Reentrancy Lock (Alternative)
```solidity
contract MyContract {
    uint256 private _locked = 1;
    
    modifier nonReentrant() {
        require(_locked == 1, "Reentrant call");
        _locked = 2;
        _;
        _locked = 1;
    }
    
    function criticalFunction() external nonReentrant {
        // External calls and state modifications here
    }
}
```

### Functions Requiring Protection

**Always protect these function types:**
- Token transfers (`transfer`, `transferFrom`)
- External contract calls
- Fee distribution and splitting
- Collateral deposits/withdrawals
- Trading and swap operations
- Governance functions (voting, proposals)
- Minting and burning operations

## Security Audit Results

### Fixed Vulnerabilities (6 Critical Issues)

1. **GoodDAO.sol** - Governance reentrancy protection
   - Functions: `propose()`, `castVote()`, `queue()`, `cancel()`
   - Impact: Prevented governance manipulation attacks

2. **LimitOrderBook.sol** - Trading reentrancy protection  
   - Functions: `placeOrder()`, `cancelOrder()`
   - Impact: Secured limit order system

3. **MarginVault.sol** - Perps collateral reentrancy protection
   - Functions: `deposit()`, `withdraw()`, `flushFee()`
   - Impact: Secured perpetual futures margin system

4. **UBIFeeSplitter.sol** - Fee distribution reentrancy protection
   - Functions: `splitFee()`, `splitFeeToken()`, `releaseToUBI()`
   - Impact: Secured protocol-wide fee distribution

5. **MarketFactory.sol** - Prediction market reentrancy protection
   - Functions: `buy()`
   - Impact: Prevented prediction market manipulation

6. **CollateralVault.sol** - Synthetic stocks reentrancy protection
   - Functions: `depositCollateral()`, `depositAndMint()`, `withdrawCollateral()`, `mint()`, `burn()`, `liquidate()`
   - Impact: Secured synthetic stock position system

## Development Checklist

### Before Deploying Any Contract

- [ ] All external calls are protected with `nonReentrant` modifier
- [ ] Follow Checks-Effects-Interactions pattern where possible
- [ ] State changes occur before external calls when feasible
- [ ] No direct token transfers without reentrancy protection
- [ ] Fee splitting functions are properly protected
- [ ] Governance functions use reentrancy protection

### Code Review Checklist

- [ ] Search for `transfer`, `transferFrom`, `call`, and external contract interactions
- [ ] Verify `nonReentrant` modifier is applied to vulnerable functions
- [ ] Check that state is updated before external calls
- [ ] Ensure proper error handling for external calls
- [ ] Validate that fee calculations cannot be manipulated

### Testing Requirements

- [ ] Test reentrancy attack scenarios
- [ ] Verify proper revert behavior with reentrancy attempts
- [ ] Test all external call failure modes
- [ ] Validate state consistency after failed transactions

## Protocol-Specific Security Notes

### Fee Distribution Security
- All UBIFeeSplitter variants must use reentrancy protection
- Fee calculations must be atomic and non-manipulable
- External transfers must be the final operations

### Governance Security  
- Voting functions require reentrancy protection
- Proposal execution must be protected
- Vote delegation must be secure against manipulation

### Trading Security
- Order placement and cancellation must be protected
- Swap operations require comprehensive protection
- Margin operations need special attention

### Bridge Security
- Cross-chain operations are high-risk for reentrancy
- Both L1 and L2 sides must be properly protected
- State synchronization must be atomic

## Emergency Procedures

### If Vulnerability Discovered
1. Assess severity and impact
2. Implement emergency pause if available
3. Deploy fixes with proper reentrancy protection
4. Verify fixes through testing
5. Update documentation and team

### Security Contact
- Lead Blockchain Engineer: agent b67dca66-0fa7-4ed5-9c94-7d02d4ecd832
- Report security issues immediately via Paperclip

## Tools and Resources

- [OpenZeppelin ReentrancyGuard](https://docs.openzeppelin.com/contracts/4.x/api/security#ReentrancyGuard)
- [Ethereum Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Solidity Security Considerations](https://docs.soliditylang.org/en/latest/security-considerations.html)

---

**Last Updated:** May 15, 2026  
**Version:** 1.0  
**Author:** Lead Blockchain Engineer b67dca66-0fa7-4ed5-9c94-7d02d4ecd832