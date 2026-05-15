# GoodDollar L2 — Production Roadmap

## Vision
The Good Chain — one chain where every transaction funds UBI for humans. See docs/VISION.md.

## Current State (May 2026)
- 57 smart contracts, 837+ tests passing
- 6 DeFi protocols built: Swap, Perps, Lend, Stable, Stocks, Predict
- Frontend: 28 pages (Next.js 14), live at goodswap.goodclaw.org
- Backend: 12 services coded, GoodPerps + GoodPredict running
- Chain: Anvil devnet (chain ID 42069), block 73K+
- Security: 30 HIGH / 148 MEDIUM Slither findings

## Phase 1: Stabilize & Secure (Current — Weeks 1-4)

### 1.1 Fix Critical Security Issues (PRIORITY: P0)
- [ ] Fix 30 Slither HIGH findings (reentrancy, unchecked transfers)
- [ ] Fix missing balance checks and hardcoded gas limits (GOO-1548)
- [ ] Fix ETH withdrawal reentrancy vulnerabilities (GOO-1547)
- [ ] Fix StabilityPool two-step admin transfer (GOO-493)
- [ ] Add reentrancy guards to all external call functions
- [ ] Run full Slither + Mythril audit and get to 0 HIGH findings

### 1.2 Start All Backend Services (GOO-1615)
- [ ] Start all 10 backend services via PM2 (activity-reporter, bridge-keeper, harvest-keeper, indexer, liquidator, monitor, revenue-tracker, rpc-balancer, stocks-keeper, swap-oracle)
- [ ] Verify all services connect to chain and pass health checks
- [ ] Set up PM2 ecosystem config with proper restart policies

### 1.3 Integration Testing
- [ ] Execute real swaps on GoodSwap (GOO-504, GOO-339)
- [ ] Open/close positions on GoodPerps
- [ ] Full cross-protocol flow: swap → lend → borrow → trade perps
- [ ] Verify UBI fee routing: every protocol sends 33% to UBI pool
- [ ] Stress test: 100+ transactions across all protocols

## Phase 2: OP Stack Migration (Weeks 4-8)

### 2.1 Replace Anvil with Real OP Stack
- [ ] Deploy op-geth + op-node + op-batcher locally
- [ ] Migrate all contracts to OP Stack devnet
- [ ] Configure G$ as custom gas token
- [ ] Set up UBI fee routing at fee vault level
- [ ] Verify all protocols work on real OP Stack

### 2.2 Deploy Public Testnet
- [ ] Deploy on OP Sepolia
- [ ] Set up block explorer (Blockscout)
- [ ] Public RPC endpoint
- [ ] Faucet for test G$
- [ ] Documentation for testers

## Phase 3: Trading Infrastructure (Weeks 8-12)

### 3.1 CLOB Upgrade
- [ ] Add persistence to matching engine (Redis/SQLite)
- [ ] Add crash recovery and order replay
- [ ] Connect Hyperliquid router in production mode
- [ ] Benchmark: target 1,000 orders/second

### 3.2 Stock Expansion
- [ ] Deploy Pyth oracle adapter
- [ ] Batch-deploy NASDAQ-100 synthetic stocks
- [ ] Launch stock perpetuals (StockPerpEngine.sol)
- [ ] Market hours controller

## Phase 4: Audit & Mainnet (Weeks 12-20)

### 4.1 External Audit
- [ ] Select audit firm (Trail of Bits / OpenZeppelin)
- [ ] Scope: bridge contracts, PerpEngine, UBIFeeSplitter, GoodLend
- [ ] Bug bounty program (Immunefi)
- [ ] Formal verification of UBI fee routing

### 4.2 Mainnet Launch
- [ ] Deploy Good Chain L2 via RaaS (Conduit/Caldera)
- [ ] G$ as native gas token
- [ ] Bridge: Celo ↔ Good Chain ↔ Ethereum
- [ ] Seed liquidity
- [ ] First 100 users

## Agent Roles (5 agents)

### Protocol Engineer
- Owns: All .sol files, Foundry tests, deployment scripts
- Focus: Fix security issues, deploy contracts, write tests
- Must: Run Slither before every commit, 0 HIGH findings policy

### Full-Stack Engineer
- Owns: frontend/, backend/, sdk/
- Focus: Connect frontend to real contracts, start backend services
- Must: E2E tests must pass before merge

### Security Engineer
- Owns: Security audits, fuzz tests, coverage reports
- Focus: Continuous Slither/Mythril, audit prep, threat modeling
- Must: Block any deploy with unresolved HIGH findings

### DevOps Engineer
- Owns: PM2, chain infra, Caddy, monitoring, bridges
- Focus: Keep services up, configure OP Stack, RPC endpoints
- Must: All services green on health check

### QA Bot
- Runs: Automated on-chain transaction testing every 30 min
- Reports: Pass/fail metrics to MemClaw (not Paperclip issues)
- Must: Execute real transactions (cast send), not just reads
