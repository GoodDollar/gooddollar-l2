# GoodDollar L2 — Autobuilder Scope

## Vision
One chain where AI agents do everything in finance — and every transaction funds UBI for humans. See docs/VISION.md for the full picture.

## CURRENT PRIORITY: TESTING & TRANSACTIONS

**Every agent must:**
1. Use MemClaw for memory: `memclaw search "topic"` before work, `memclaw write "outcome"` after
2. Read wiki/ for domain knowledge before making changes
3. Focus on making things WORK, not building new features

### Phase 3: Test Everything, Fix Everything, Transact on Chain

#### 3.1 Fix Critical Blockers (PRIORITY: CRITICAL)
- [ ] Fix GOO-276: CSP inline script violations — blocks hydration + RPC calls on frontend
- [ ] Fix GOO-403: WalletConnect placeholder text
- [ ] Fix Predict contracts: MarketFactory.marketCount() returns empty on-chain
- [ ] Fix RPC proxy: rpc.goodclaw.org returns 400 (Caddy config)
- [ ] Fix GoodSwap frontend: connect to real on-chain pools, verify swap executes

#### 3.2 Start All Backend Services (PRIORITY: HIGH)
- [ ] Start activity-reporter as PM2 service
- [ ] Start bridge-keeper as PM2 service
- [ ] Start harvest-keeper as PM2 service
- [ ] Start indexer as PM2 service
- [ ] Start liquidator as PM2 service
- [ ] Start monitor as PM2 service
- [ ] Start revenue-tracker as PM2 service
- [ ] Start rpc-balancer as PM2 service
- [ ] Start stocks-keeper as PM2 service
- [ ] Start swap-oracle as PM2 service
- [ ] Verify all 10 services are healthy and connected to chain

#### 3.3 On-Chain Testing & Transactions (PRIORITY: HIGH)
- [ ] Deploy test accounts with devnet ETH/G$
- [ ] Execute real swaps on GoodSwap (G$/ETH, G$/USDC)
- [ ] Open and close positions on GoodPerps (BTC-USD, ETH-USD)
- [ ] Create and trade on prediction markets (GoodPredict)
- [ ] Supply and borrow on GoodLend (ETH, USDC)
- [ ] Mint gUSD via GoodStable CDPs
- [ ] Mint and trade synthetic stocks (sAAPL, sTSLA)
- [ ] Bridge assets L1↔L2
- [ ] Verify UBI fee routing: every transaction sends 33% to UBI pool
- [ ] Stress test: 100+ transactions across all protocols

#### 3.4 Frontend E2E Testing (PRIORITY: HIGH)
- [ ] Get E2E pass rate from 79% to 95%+
- [ ] Fix all CSP violations
- [ ] Test every page with wallet connected
- [ ] Test every page on mobile viewport
- [ ] Verify all charts render with real data
- [ ] Test error states and edge cases

#### 3.5 Integration Testing (PRIORITY: MEDIUM)
- [ ] Cross-protocol: swap → lend → borrow → trade perps flow
- [ ] Liquidation testing: trigger liquidations on Lend, Stable, Perps
- [ ] Oracle staleness: test behavior when price feeds go stale
- [ ] Bridge: full deposit → confirm → withdraw cycle
- [ ] Governance: create proposal → vote → execute

## Tester Agent Assignments

### Tester Alpha — Swap & Lending
- Test GoodSwap: real swaps, slippage, price impact
- Test GoodLend: supply, borrow, repay, liquidation
- Test GoodStable: mint gUSD, manage CDPs, PSM
- Report bugs as GOO-xxx issues

### Tester Beta — Perps & Predictions
- Test GoodPerps: open/close positions, funding rates, liquidation
- Test GoodPredict: create markets, buy/sell YES/NO, resolution
- Test oracle feeds: price accuracy, staleness detection
- Report bugs as GOO-xxx issues

### Tester Gamma — Stocks & Stress
- Test GoodStocks: mint/redeem synthetics, oracle prices
- Stress test: high-volume transactions, concurrent operations
- Gas usage profiling across all protocols
- Report bugs as GOO-xxx issues

### Tester Delta — E2E & UX
- Browser E2E tests: all pages, all flows
- Mobile responsiveness testing
- Accessibility audit
- UX issues and polish
- Report bugs as GOO-xxx issues

## MemClaw Integration

All agents MUST use MemClaw for persistent memory:

```bash
# Before starting work
memclaw search "what I'm working on"

# After completing work
memclaw write "what I did and found" --type outcome

# Check fleet knowledge
memclaw brief "topic"
```

API: https://memclaw.net
Wiki: wiki/ directory in this repo
Domains config: wiki/domains.yaml

## Completed (Phase 1 & 2) — 86 items ✅

All 8 protocols built: GoodSwap, GoodPerps, GoodPredict, GoodLend, GoodStable, GoodStocks, GoodBridge, Infrastructure. 53 contracts, 837 tests, 208 frontend files. See git log for details.

## Security Process (MANDATORY for all agents)

### Security Tools
- **Slither** — runs daily at 06:00 UTC, reports HIGH/MEDIUM/LOW findings
- **Foundry Fuzz** — `forge test --fuzz-runs 10000` for property testing
- **Foundry Coverage** — target: >85% line, >50% branch
- **Mythril** — symbolic execution for deep analysis
- **Cast** — on-chain contract testing

### Security Agent Tasks
1. Run Slither on every new commit
2. Fix all HIGH severity findings (reentrancy, unchecked transfers)
3. Add fuzz tests for all financial functions
4. Check oracle staleness and manipulation vectors
5. Audit bridge contracts for cross-chain replay attacks
6. Verify access control on all privileged functions

### Auto-Research Protocol
Every agent should improve daily by:
1. Search MemClaw for recent DeFi exploits and security patterns
2. Study new audit tools and techniques
3. Apply learnings to current codebase
4. Write new findings back to MemClaw

```bash
# Example auto-research
memclaw search "recent DeFi exploit 2026" --limit 5
memclaw search "smart contract security best practices" --limit 5
memclaw write "Learned: [new technique or pattern]" --type fact
```

### Current Security Status (auto-updated)
- Slither: 30 HIGH / 148 MEDIUM / 344 LOW
- Tests: 887/887 passing
- Coverage: 68.66% line, 64.86% branch
- Key fixes needed: 13 unchecked transfers, 8 missing reentrancy guards
