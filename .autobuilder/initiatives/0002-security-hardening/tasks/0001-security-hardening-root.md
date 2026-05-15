---
id: security-hardening-root
title: "Phase 1: Security Hardening & Production Readiness"
parent: gooddollar-l2
deps: []
split: null
depth: 0
planned: false
executed: false
---

---
title: "Phase 1: Security Hardening & Production Readiness"
priority: P0
---

# Phase 1: Security Hardening & Production Readiness

## Goal
Fix ALL security vulnerabilities, start all backend services, and verify every protocol works with real on-chain transactions. This initiative must be 100% complete before Phase 2 (OP Stack migration).

## Acceptance Criteria
1. Zero Slither HIGH findings (currently 30)
2. All 10 backend services running and healthy via PM2
3. Real on-chain transactions executed across all 6 protocols
4. UBI 33% fee routing verified end-to-end
5. All Foundry tests passing (currently 837+)

## Scope

### 1. Fix All Slither HIGH Findings (P0)

Run `slither .` and fix every HIGH severity finding. The main categories are:

**Reentrancy vulnerabilities:**
- ETH withdrawal functions in bridge contracts (GoodDollarBridgeL1, GoodDollarBridgeL2)
- Any function that does external calls before state updates
- Add `nonReentrant` modifier from OpenZeppelin to all vulnerable functions

**Unchecked ERC20 transfers:**
- Every `IERC20.transfer()` and `IERC20.transferFrom()` call must use SafeERC20
- Or wrap in `require(token.transfer(...), "transfer failed")`
- Check: GoodLendPool, PerpEngine, MarginVault, CollateralVault, StabilityPool, PegStabilityModule

**Missing balance checks:**
- Validate sufficient balance before transfers
- Check for zero-amount operations
- Validate collateral ratios before minting

**Hardcoded gas limits:**
- Remove or make configurable any hardcoded gas values
- Use `gasleft()` checks where appropriate

**Access control gaps:**
- Ensure all admin functions have proper access control
- Implement two-step admin transfer where missing (StabilityPool.transferAdmin)
- Verify onlyAdmin/onlyOwner on all privileged functions

### 2. Fix Slither MEDIUM Findings (P1)

After all HIGHs are fixed, address the 148 MEDIUM findings:
- Unused return values
- Missing events on state changes
- Shadowed variables
- Dangerous strict equalities
- Timestamp dependence

### 3. Start All Backend Services (P0)

Start each service via PM2 and verify it connects to the chain:

```bash
cd /home/goodclaw/gooddollar-l2/backend

# For each service, install deps + start:
# activity-reporter, bridge-keeper, harvest-keeper, indexer,
# liquidator, monitor, revenue-tracker, rpc-balancer,
# stocks-keeper, swap-oracle

for svc in activity-reporter bridge-keeper harvest-keeper indexer liquidator monitor revenue-tracker rpc-balancer stocks-keeper swap-oracle; do
  cd $svc && npm install && cd ..
done
```

Create a proper PM2 ecosystem config (ecosystem.config.js) with:
- Proper restart policies (max_restarts: 10, restart_delay: 5000)
- Log rotation
- Environment variables from .env
- Health check endpoints

### 4. Integration Testing — Real On-Chain Transactions (P0)

Execute real transactions on the Anvil devnet using `cast send`:

**GoodSwap:**
```bash
# Approve + swap G$ for ETH
cast send $GDT "approve(address,uint256)" $SWAP $(cast --max-uint) --private-key $TESTER_KEY --rpc-url http://localhost:8545
cast send $SWAP "swap(address,address,uint256)" $GDT $WETH 1000000000000000000 --private-key $TESTER_KEY --rpc-url http://localhost:8545
```

**GoodPerps:**
```bash
# Deposit margin + open position
cast send $GDT "approve(address,uint256)" $VAULT $(cast --max-uint) --private-key $TESTER_KEY --rpc-url http://localhost:8545
cast send $VAULT "deposit(uint256)" 10000000000000000000 --private-key $TESTER_KEY --rpc-url http://localhost:8545
cast send $PERP "openPosition(uint256,uint256,bool)" 0 5000000000000000000 true --private-key $TESTER_KEY --rpc-url http://localhost:8545
```

**GoodLend:**
```bash
# Supply + withdraw
cast send $GDT "approve(address,uint256)" $LEND $(cast --max-uint) --private-key $TESTER_KEY --rpc-url http://localhost:8545
cast send $LEND "supply(address,uint256)" $GDT 5000000000000000000 --private-key $TESTER_KEY --rpc-url http://localhost:8545
```

**GoodStable:**
```bash
# Deposit collateral + mint gUSD
cast send $STABLE "depositCollateral(uint256)" 10000000000000000000 --value 10000000000000000000 --private-key $TESTER_KEY --rpc-url http://localhost:8545
```

**GoodStocks:**
```bash
# Mint synthetic stock
cast send $GDT "approve(address,uint256)" $STOCKS $(cast --max-uint) --private-key $TESTER_KEY --rpc-url http://localhost:8545
cast send $STOCKS "mintSynthetic(string,uint256)" "sAAPL" 1000000000000000000 --private-key $TESTER_KEY --rpc-url http://localhost:8545
```

**GoodPredict:**
```bash
# Create market + buy position
cast send $MF "createMarket(string,uint256)" "Will BTC hit 100K?" 1735689600 --private-key $TESTER_KEY --rpc-url http://localhost:8545
```

### 5. Verify UBI Fee Routing (P0)

After each protocol transaction, verify that 33% of fees went to the UBI pool:

```bash
# Check UBI pool balance before and after transactions
UBI_BEFORE=$(cast call $UBI "accumulatedFees()" --rpc-url http://localhost:8545)
# ... execute transactions ...
UBI_AFTER=$(cast call $UBI "accumulatedFees()" --rpc-url http://localhost:8545)
# Verify UBI_AFTER > UBI_BEFORE
```

Write a test script that:
1. Records UBI pool balance
2. Executes a swap
3. Checks that exactly 33% of the swap fee arrived in UBI pool
4. Repeat for each protocol

### 6. Contract Addresses

Use addresses from `.autobuilder/addresses.env`:
- GDT (G$ Token): 0x36c02da8a0983159322a80ffe9f24b1acff8b570
- UBI Claims: 0x976fcd02f7c4773dd89c309fbf55d5923b4c98a1
- PerpEngine: 0x2e2ed0cfd3ad2f1d34481277b3204d807ca2f8c2
- MarginVault: 0x21df544947ba3e8b3c32561399e88b52dc8b2823
- MarketFactory: 0xd28f3246f047efd4059b24fa1fa587ed9fa3e77f
- ValidatorStaking: 0x103a3b128991781ee2c8db0454ca99d67b257923
- GoodLend: 0x49fd2be640db2910c2fab69bb8531ab6e76127ff
- GoodStable: 0x5d42ebdbba61412295d7b0302d6f50ac449ddb4f
- GoodStocks: 0x2d13826359803522cce7a4cfa2c1b582303dd0b4
- GoodSwap: 0x922D6956C99E12DFeB3224DEA977D0939758A1Fe
- RPC: http://localhost:8545
- Tester key: from .autobuilder/addresses.env

## Non-Goals
- No new UI features
- No new protocols
- No OP Stack migration (that's Phase 2)
- No frontend changes unless fixing a security issue

## Definition of Done
- `slither .` reports 0 HIGH findings
- `forge test` reports 0 failures
- All 10 backend services show "online" in `pm2 list`
- Transaction receipts prove all 6 protocols execute on-chain
- UBI fee routing verified with balance checks
