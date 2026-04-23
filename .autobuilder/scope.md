# GoodDollar L2 — Autobuilder Scope

## Vision
One chain where AI agents do everything in finance — and every transaction funds UBI for humans. See docs/VISION.md for the full picture.

## CURRENT PRIORITY: TESTING & TRANSACTIONS

**Every agent must:**
1. Use MemClaw for memory: `memclaw search "topic"` before work, `memclaw write "outcome"` after
2. Read wiki/ for domain knowledge before making changes
3. Focus on making things WORK, not building new features

### Phase 3: Test Everything, Fix Everything, Transact on Chain

#### 3.1 Fix Critical Blockers (PRIORITY: CRITICAL) — **4/5 COMPLETE** ✅
- [x] Fix GOO-276: CSP inline script violations — RESOLVED ✅ (React hydration + RPC functional)
- [ ] Fix GOO-403: WalletConnect placeholder text — **PENDING** ⏳ ([GOO-1034](/GOO/issues/GOO-1034) manual registration)
- [x] Fix Predict contracts: MarketFactory.marketCount() returns empty on-chain — RESOLVED ✅ (via GOO-214 + related fixes)
- [x] Fix RPC proxy: rpc.goodclaw.org returns 400 (Caddy config) — RESOLVED ✅ (GOO-231/GOO-232 complete)
- [x] Fix GoodSwap frontend: connect to real on-chain pools, verify swap executes — RESOLVED ✅ (GOO-64, GOO-27, GOO-474 complete)

**STATUS UPDATE (2026-04-23)**: Phase 3.1 completion at 80% - final blocker requires CEO manual WalletConnect/Reown registration (15min task). All engineering teams ready for deployment upon projectId completion.

#### 3.2 Start All Backend Services (PRIORITY: HIGH) — **READY TO BEGIN** 🚀
**NEXT PHASE**: Ready to commence upon Phase 3.1 completion (WalletConnect resolution)

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

## Phase 4: Scale Tokenized Stocks + Stock Perps (PRIORITY: HIGH)

### 4.1 Oracle Upgrade — Pyth Network (Week 1-2)
- [ ] Write PythPriceAdapter.sol (ticker→Pyth ID mapping, staleness checks, batch updates)
- [ ] Deploy Pyth mock on devnet for testing
- [ ] Update stocks-keeper to use Pyth SDK instead of Yahoo Finance
- [ ] Test price accuracy: Pyth vs Yahoo Finance for 12 existing stocks
- [ ] Migrate PriceOracle consumers to PythPriceAdapter

### 4.2 NASDAQ-100 Listing (Week 2-3)
- [ ] Write ListNasdaq100.s.sol batch deploy script (EIP-1167 clones)
- [ ] Register all 100 Pyth price IDs in PythPriceAdapter
- [ ] Deploy all 100 synthetic stocks (2 batch txs, ~17M gas total)
- [ ] Add sector classification (Technology, Healthcare, Finance, Energy, etc.)
- [ ] Update frontend: paginated stock listing, search, sector filters
- [ ] Update stocks-keeper for 100 tickers

### 4.3 Stock Perpetuals — Connect Stocks ↔ Perps (Week 3-4)
- [ ] Write StockPerpEngine.sol (extends PerpEngine, creates perp market per stock)
- [ ] Add synthetic collateral support (sAAPL as margin for perps at 80% haircut)
- [ ] Auto-create perp markets for top 100 stocks by volume
- [ ] Set stock perp leverage limits (max 20x vs 50x for crypto)
- [ ] Unified liquidation engine: cross-liquidate stock collateral + perp positions
- [ ] Frontend: unified trading view (spot synthetic + leveraged perp side-by-side)
- [ ] Tests: fuzz test cross-margin scenarios, liquidation cascades

### 4.4 S&P 500 Expansion (Week 4-6)
- [ ] Register remaining 400 S&P tickers in PythPriceAdapter
- [ ] Batch-list in 5 deploy txs (~100 each, ~85M gas total, < $1)
- [ ] Auto-create perp markets for top 200 by volume
- [ ] Add basket indices: sTECH, sHEALTH, sFINANCE (sector ETF-like synthetics)

### 4.5 Market Hours Controller (Week 5-6)
- [ ] Write MarketHoursController.sol (US market 9:30-4pm ET, pre/after-hours)
- [ ] Synthetic minting/redemption: restricted to market hours
- [ ] GoodSwap secondary trading: 24/7 (AMM pricing)
- [ ] Perp trading: 24/7, funding rate adjusts on oracle staleness
- [ ] Handle market holidays (NYSE calendar on-chain)
- [ ] Frontend: show market status (open/closed/pre-market/after-hours)

### Reference
- Full research: research/STOCKS-PERPS-SCALING.md
- Pyth Network: pyth.network/price-feeds
- Synthetix V3: github.com/Synthetixio/synthetix-v3
- GMX V2: github.com/gmx-io/gmx-synthetics
- GNS/gTrade: github.com/GainsNetwork-org

## Tester → Builder Feedback Loop

### How it works:
1. **7 Gemma testers** run every 30 min, test all protocols on-chain + frontend
2. Testers write results to **MemClaw** (pass/fail with details)
3. Testers file **Paperclip issues** (GOO-XXX) for each failure
4. **Cursor dev agents** read MemClaw + Paperclip issues on heartbeat
5. Dev agents **fix the issues**, commit, push
6. Next tester run verifies the fix

### For Dev Agents — Check Tester Results
Every heartbeat, dev agents MUST:
```bash
# 1. Check MemClaw for recent test failures
memclaw search "FAILED devnet" --limit 10

# 2. Check Paperclip for open QA issues
curl -s "http://127.0.0.1:3102/api/companies/7e8ba4ed-e545-4394-ad98-c0c855409a4e/issues?status=todo&limit=20" | python3 -c "import json,sys; [print(i['identifier'],i['title']) for i in json.load(sys.stdin) if 'Gemma QA' in i.get('title','')]"

# 3. Pick the highest priority issue and fix it
```

### Contract Addresses (for all testers)
See .autobuilder/addresses.env for latest deployed addresses.

## MANDATE: All Tests Must Transact

Every Gemma tester run MUST include `cast send` transactions. Read-only checks are NOT sufficient.

### 7 Gemma Testers (every 30 min):
| Tester | Transactions |
|--------|-------------|
| QA Core | ETH send, G$ transfer, G$ stake |
| Swap | approve + swap via router |
| Perps | deposit margin + open/close position |
| Lend | supply + withdraw from pool |
| Stocks | approve + trade synthetic |
| Predict | create market + buy position |
| Infra | health checks (reads OK here) |

### Transaction tracking:
- Explorer: https://explorer.goodclaw.org
- Expected: 20+ new transactions per hour from testers
- Chain should show growing tx count every 30 min
