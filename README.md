# GoodChain L2 (GoodDollar L2) — The UBI Chain

![GoodDollar L2 logo](docs/assets/gooddollar-l2-logo.svg)

GoodChain L2 is an OP Stack-style EVM chain where useful financial activity routes protocol fees into universal basic income for verified humans. The repository combines the chain, Solidity protocols, a unified Next.js app suite, PM2-managed backend keepers, analytics, agent SDK, and testnet readiness automation.

**Package version:** `0.2.0` · **Chain ID:** `42069` (`0xa455`)

## Vision

One chain where AI agents and humans share the same DeFi surface — swap, perps, prediction markets, lending, stablecoins, synthetic stocks, bridges, and governance — with **every protocol fee path auditable into the UBI pool**. See [`wiki/raw/VISION.md`](wiki/raw/VISION.md) for the product narrative.

```text
User or agent activity → protocol transaction → protocol fee
  → UBI fee splitter → UBI revenue tracker → verified-human claim
  → public analytics evidence
```

## Live surfaces (devnet / alpha-testnet)

| Surface | URL | Notes |
|---------|-----|-------|
| Landing | https://goodclaw.org | Marketing / entry |
| Web app | https://goodswap.goodclaw.org | All protocol UIs (port `3100` via PM2 `goodswap`) |
| Status API | https://goodswap.goodclaw.org/api/status | Aggregates backend `/health` |
| Public RPC | https://rpc.goodclaw.org | JSON-RPC POST only; `eth_chainId = 0xa455` |
| Explorer | https://explorer.goodclaw.org | Blockscout |
| Agents dashboard | https://paperclip.goodclaw.org | Paperclip control plane |

Canonical network metadata: [`op-stack/addresses.json`](op-stack/addresses.json).

## Release status — 2026-05-22

_Last refreshed for RC merge on `main`. Supersedes older status rows where they conflict._

### RC integration (merged)

- **HEAD:** `main` includes GoodChain L2 RC coordinator merge ([`docs/release/RC_COORDINATOR_20260522.md`](docs/release/RC_COORDINATOR_20260522.md)).
- **Verdict:** **E2E green / deploy complete** — coordinator RC merged to `main`, deployed to `goodswap`, and verified live.
- **Foundry (RC security suites):** 55/55 on `GoodDollarTokenSecure`, `SecurityValidation`, `MultiOracleConsensus`, `StateMigration`, `PerformanceValidation`.
- **Playwright slices (post-integration):** analytics + app-regression **62/62** (chromium + mobile-chrome); perps journey **20/20** after on-chain follow-up fix.
- **Full E2E (`npm run test:e2e:all`):** **807 passed, 7 skipped, 0 failed** on 2026-05-22 after the RC coordinator merge.
- **Deployment:** `frontend/scripts/deploy.sh` completed; `goodswap` served BUILD_ID `JFi9iODQWOKbY7q8OUHh7` and passed live BUILD_ID/chunk sync checks.

### Live health snapshot (2026-05-22 README checkpoint)

| Check | Result |
|-------|--------|
| Public app route sweep | **29/29 HTTP 200** on `goodswap.goodclaw.org` |
| `scripts/health-check.sh` | OK with warnings (disk/memory within bounds) |
| `/api/status` | **14/14** services healthy on local and public GoodSwap status APIs |
| Public RPC | `eth_chainId = 0xa455` / decimal `42069` |
| PM2 | Core GoodChain services online; A/B lanes stopped; agent prototypes still flapping (not release-blocking for GoodSwap) |

### Go / no-go

| Audience | Guidance |
|----------|----------|
| Internal demo / controlled testnet | **Go** — app, RPC, faucet, core protocols, analytics, feedback ingest are live and full E2E is green |
| Broad public alpha | **Conditional go** — browser/release gate is green; still requires release tag/manifest, security sign-off, and external audit/bug-bounty decision |

### UBI fee accounting

All **14 routes** integration-proven on devnet — [`docs/UBI-FEE-ACCOUNTING.md`](docs/UBI-FEE-ACCOUNTING.md):

- [`test/integration/UBIFeeIntegrationProofSwapPerps.t.sol`](test/integration/UBIFeeIntegrationProofSwapPerps.t.sol) (routes 1–5)
- [`test/integration/UBIFeeIntegrationProofPredictLendStableStocks.t.sol`](test/integration/UBIFeeIntegrationProofPredictLendStableStocks.t.sol) (routes 6–14)

## Architecture

```mermaid
flowchart TB
  User[Users / Testers / Agents] --> App[Next.js Web App\ngoodswap.goodclaw.org]
  App --> Wallet[Wallets / WalletConnect]
  Wallet --> RPC[Public RPC\nrpc.goodclaw.org]
  RPC --> Chain[GoodDollar L2\nChain ID 42069]
  Chain --> Explorer[explorer.goodclaw.org]

  Chain --> Protocols[Swap · Perps · Predict · Lend · Stable · Stocks · Bridge · Governance]
  Protocols --> UBI[UBI Fee Splitters + Revenue Tracker]
  UBI --> Analytics[Status · Analytics · UBI Impact]

  PM2[PM2] --> Keepers[Oracles · Indexer · Liquidator · Keepers]
  Keepers --> Chain
  App --> StatusAPI[/api/status] --> Agg[status-aggregator]
  Agg --> Keepers
```

Extended diagrams: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## App suite & routes

All apps ship in one Next.js deployment. **Per-app documentation:** [`docs/apps/README.md`](docs/apps/README.md).

| App | Primary routes | Contracts (under `src/`) |
|-----|----------------|--------------------------|
| GoodSwap | `/` | `swap/`, `hooks/UBIFeeHook.sol` |
| Explore | `/explore` | read-only via `devnet.ts` |
| Pool / Yield | `/pool`, `/yield` | swap pools, `yield/GoodVault.sol` |
| Bridge | `/bridge` | `bridge/`, `swap/LiFiBridgeAggregator.sol` |
| GoodPerps | `/perps`, `/perps/portfolio`, `/perps/leaderboard` | `perps/` |
| GoodPredict | `/predict`, `/predict/create`, `/predict/portfolio` | `predict/` |
| GoodLend | `/lend` | `lending/` |
| GoodStable | `/stable` | `stable/` (gUSD) |
| GoodStocks | `/stocks`, `/stocks/[ticker]`, `/stocks/portfolio` | `stocks/`, `oracle/StockOracleV2.sol` |
| Portfolio / Claim | `/portfolio` | `UBIClaimV2.sol`, cross-protocol reads |
| Governance | `/governance`, `/governance/analytics` | `governance/` |
| Agents | `/agents`, `/agents/register` | `AgentRegistry.sol` |
| UBI Impact | `/ubi-impact` | `UBIRevenueTracker.sol` |
| Activity / Analytics | `/activity`, `/analytics` | indexer + address book |
| Faucet / Testnet | `/faucet`, `/testnet-guide` | `/api/faucet` |
| QA | `/tests`, `/test-dashboard`, `/invite` | E2E registry |

E2E registry (29 routes): [`frontend/src/lib/tests/e2eRegistry.json`](frontend/src/lib/tests/e2eRegistry.json)

## Protocol contracts

Organized under `src/`:

| Domain | Key files |
|--------|-----------|
| Core token & UBI | `GoodDollarToken.sol`, `GoodDollarTokenSecure.sol`, `UBIFeeSplitter.sol`, `UBIRevenueTracker.sol`, `UBIClaimV2.sol` |
| Swap | `GoodSwap.sol`, `swap/GoodSwapRouter.sol`, `swap/LimitOrderBook.sol`, `hooks/UBIFeeHook.sol` |
| Perps | `perps/PerpEngine.sol`, `MarginVault.sol`, `FundingRate.sol`, `PerpPriceOracle.sol` |
| Predict | `predict/MarketFactory.sol`, `ConditionalTokens.sol`, `OptimisticResolver.sol` |
| Lend | `lending/GoodLendPool.sol`, `SimplePriceOracle.sol` (devnet placeholder — no staleness guard) |
| Stable | `stable/gUSD.sol`, `VaultManager.sol`, `PegStabilityModule.sol`, `StabilityPool.sol` |
| Stocks | `stocks/SyntheticAssetFactory.sol`, `CollateralVault.sol`, `StockAMM.sol` |
| Bridge | `bridge/GoodDollarBridgeL1.sol`, `GoodDollarBridgeL2.sol`, `FastWithdrawalLP.sol` |
| Governance | `governance/GoodDAO.sol`, `GoodTimelock.sol`, `VoteEscrowedGD.sol` |
| Agents / validators | `AgentRegistry.sol`, `ValidatorStaking.sol` |
| Risk (optional) | `risk/UnifiedRiskEngine.sol`, `ClearingHouse.sol` |

**Addresses:** always use [`op-stack/addresses.json`](op-stack/addresses.json). Frontend mirror: [`frontend/src/lib/devnet.ts`](frontend/src/lib/devnet.ts) (entries tagged `STALE` need redeploy/refresh).

## Backend services (PM2)

Full catalog: [`backend/README.md`](backend/README.md)

| Service | Role |
|---------|------|
| `goodswap` | Next.js frontend `:3100` |
| `swap-oracle` | Swap on-chain prices |
| `stocks-keeper` | Stock oracle upkeep |
| `indexer` | Chain/event indexing |
| `monitor` | Contract/chain health |
| `revenue-tracker` | UBI revenue tracking |
| `activity-reporter` | Protocol activity |
| `harvest-keeper` | Yield harvest |
| `liquidator` | Liquidations |
| `rpc-balancer` | Public RPC proxy |
| `bridge-keeper` | Bridge support |
| `perps` / `goodperps` | Perps order book API |
| `predict` / `goodpredict` | Predict CLOB API |
| `status-aggregator` | `:9200/status.json` → `/api/status` |
| `hedge-engine` | Risk hedging (health-only until configured) |
| `oracle-signer` | Oracle submission (health-only until keyed) |

Configs: [`backend/ecosystem.config.js`](backend/ecosystem.config.js), [`pm2-ecosystem.config.js`](pm2-ecosystem.config.js)

## Lane 1 — eToro live prices & demo hedging

Lane 1 is the active initiative `0007a-etoro-connectivity`. It pipes eToro/demo
market data into on-chain price oracles and produces a capped demo-hedge proof
from `hedge-engine`. **Demo only** — `REAL_TRADING_ENABLED` is a source-level
`const` fence in [`backend/etoro-client/src/auth.ts`](backend/etoro-client/src/auth.ts);
no real-money path exists.

| Package | Path | Role |
|---------|------|------|
| `@goodchain/etoro-client` | [`backend/etoro-client/`](backend/etoro-client/) | TypeScript SDK — REST + WS client, four-mode safety (`mock` / `demo-readonly` / `demo-trading` / `real-disabled`), demo cap enforcer |
| `@goodchain/price-service` | [`backend/price-service/`](backend/price-service/) | Normalizes SDK quotes for downstream consumers (REST `:9300`, WS `:9301`) |
| `oracle-signer` | [`backend/oracle-signer/`](backend/oracle-signer/) | Signs and publishes prices on-chain (`:9107`) |
| `@goodchain/hedge-engine` | [`backend/hedge-engine/`](backend/hedge-engine/) | Maps GoodChain exposure to capped demo eToro hedges (`:9106`); ships the demo-proof script |

```bash
npm run install:lane1   # idempotent install across the four packages
npm run test:lane1      # runs all four suites; halts on first failure
```

Operator helper: rotate the demo credentials the SDK reads
(`ETORO_DEMO_KEY` / `ETORO_DEMO_SECRET` / `ETORO_DEMO_USER_KEY`) with
`./scripts/rotate-etoro-keys.sh demo` — refuses any non-demo mode per
the lane's `REAL_TRADING_ENABLED=false` stance.

Full env contract, four-mode safety matrix, endpoint table, and the
demo-proof runbook live in
[`docs/ETORO_GOODCHAIN_ADAPTER.md`](docs/ETORO_GOODCHAIN_ADAPTER.md).
Two operator runbooks cover the lane's two DoD halves:

- Live-prices proof (eToro → price-service → oracle-signer → on-chain):
  [`docs/runbooks/lane1-live-prices-on-chain.md`](docs/runbooks/lane1-live-prices-on-chain.md).
- Demo-hedge proof (one capped demo open):
  [`docs/runbooks/lane1-demo-hedge-proof.md`](docs/runbooks/lane1-demo-hedge-proof.md).

## Repository layout

```text
.
├── src/                    # Solidity contracts
├── script/                 # Foundry deploy scripts
├── test/                   # Foundry unit, fuzz, integration
├── frontend/               # Next.js app (see frontend/README.md)
├── backend/                # PM2 services (see backend/README.md)
├── sdk/                    # TypeScript agent SDK
├── op-stack/               # Chain config + addresses.json
├── analytics/              # Address book + Dune package
├── docs/                   # Architecture, apps/, release/, runbooks
├── scripts/                # Health gates, lane tests, doc checks
└── .autobuilder/           # Readiness evidence & initiatives
```

## Development

### Prerequisites

- Foundry (`forge`)
- Node.js 22+ (see CI / `.nvm` paths in gate scripts)
- PM2 (production/devnet host)
- Docker (optional — Kurtosis local OP Stack: [`op-stack/README.md`](op-stack/README.md))

### Root scripts

```bash
npm run build:contracts    # forge build
npm run test:contracts     # forge test -vvv
npm run build:frontend     # cd frontend && npm run build
npm run build:sdk          # cd sdk && npm run build
npm run health             # scripts/health-check.sh
npm run test:e2e           # frontend app-regression
npm run tests:publish      # publish /tests page data
npm run install:lane1      # install lane 1 backend packages (eToro live prices / demo hedging)
npm run test:lane1         # test lane 1 backend packages
```

### Local frontend

```bash
cd frontend && npm install && npm run dev   # :3100
```

### Local chain

```bash
make kurtosis-up    # op-stack — see op-stack/README.md
# or connect to public RPC: https://rpc.goodclaw.org
```

## Test & release gates

Run before release-candidate tagging or deploy:

```bash
export PATH="$HOME/.foundry/bin:$PATH"

# Contracts
forge build && forge test -vvv

# SDK
cd sdk && npm run build && npm test && cd ..

# Frontend
cd frontend
npx tsc --noEmit
npx vitest run --reporter=verbose
npm run test:e2e                    # registry (app-regression)
# npm run test:e2e:all              # full suite — required for RC green; long-running
cd ..

# Dapp smoke lanes
for lane in swap perps predict lend stable stocks portfolio-claim explore; do
  ./scripts/run-dapp-lane.sh "$lane"
done

# Ops + docs
bash scripts/health-check.sh
python3 scripts/check-doc-links.py README.md docs/TESTNET_README.md docs/ARCHITECTURE.md docs/apps/README.md
```

**Baselines (re-run fresh before tagging):**

| Gate | Last documented baseline |
|------|--------------------------|
| Foundry | 1126/1126 (README checkpoint — verify on HEAD) |
| SDK | 79/79 |
| Frontend Vitest | 834 pass, 1 skip |
| App-regression E2E | 27 routes green (`.autobuilder/final-e2e-gate-20260519T051711Z.log`) |
| RC slice (2026-05-22) | 62/62 analytics+regression; 20/20 perps journey |
| Full E2E | **807 passed, 7 skipped, 0 failed** — RC browser gate green |

## Deployment & PM2 model

### Frontend (required path)

```bash
cd frontend && npm run deploy
```

[`frontend/scripts/deploy.sh`](frontend/scripts/deploy.sh): `npm ci` → `npm run build` (atomic) → `pm2 reload goodswap --update-env` → BUILD_ID sync proof.

**Never** run `next build` without reload — stale CSS/chunk 400s. **Never** run `next dev` on the production tree.

Runbooks: [`docs/runbooks/frontend-rebuild.md`](docs/runbooks/frontend-rebuild.md)

### Backend

```bash
pm2 start backend/ecosystem.config.js
pm2 save
```

### CI / deploy workflows

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — SSH deploy from `main` or tag
- [`.github/workflows/dapp-parallel-tests.yml`](.github/workflows/dapp-parallel-tests.yml)

## Analytics & feedback

| Loop | Surface | Source |
|------|---------|--------|
| Address book | [`analytics/address-book.json`](analytics/address-book.json) | `op-stack/addresses.json` + UBI spec |
| Dashboard | `/analytics`, `/api/analytics/overview` | On-chain reads |
| Dune package | [`analytics/dune-package/`](analytics/dune-package/README.md) | External indexers |
| Feedback | Floating button → `POST /api/feedback` | Redacted JSONL — [`docs/testnet/iter29-feedback-pipeline.md`](docs/testnet/iter29-feedback-pipeline.md) |

## Security notes

- Slither high/medium cleanup completed in prior security initiative — continuous checks still required.
- **Lending oracle:** admin-set placeholder; replace before mainnet ([`docs/security/iter35-oracle-risk-controls.md`](docs/security/iter35-oracle-risk-controls.md)).
- **GOO-1846:** `setMinter` extcodesize policy — open for production ([`docs/release/RC_COORDINATOR_20260522.md`](docs/release/RC_COORDINATOR_20260522.md)).
- **Secrets:** PM2 uses Anvil default keys in dev only — never commit `.env` with production keys.
- External audit + bug bounty: **required before mainnet** ([`docs/SECURITY-AUDIT.md`](docs/SECURITY-AUDIT.md)).

## Known boundaries

- Network is **POC V1 / persistent devnet** — not production mainnet infra.
- Explorer: live but requires soak/hardening for broad public alpha.
- External Dune indexing: package shipped; live dashboards **pending**.
- `hedge-engine` / `oracle-signer`: healthy in the 2026-05-22 post-deploy status snapshot; if keys/addresses are removed they degrade into health-only mode.
- Agent prototype PM2 processes: **unstable** — do not rely on for demos.
- Some `devnet.ts` addresses tagged **STALE** — refresh via `scripts/refresh-addresses.py` after redeploy.

## Key documentation

| Doc | Purpose |
|-----|---------|
| [`docs/apps/README.md`](docs/apps/README.md) | **Per-app route & module guide** |
| [`frontend/README.md`](frontend/README.md) | Frontend dev, test, deploy |
| [`backend/README.md`](backend/README.md) | Backend services & PM2 |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System topology |
| [`docs/TESTNET_README.md`](docs/TESTNET_README.md) | Operator testnet guide |
| [`docs/TESTNET-READINESS-50-ITERATIONS.md`](docs/TESTNET-READINESS-50-ITERATIONS.md) | Active readiness sprint |
| [`docs/UBI-FEE-ACCOUNTING.md`](docs/UBI-FEE-ACCOUNTING.md) | 14-route fee map |
| [`docs/release/RC_COORDINATOR_20260522.md`](docs/release/RC_COORDINATOR_20260522.md) | RC merge evidence |
| [`op-stack/README.md`](op-stack/README.md) | Chain deployment (Kurtosis / Sepolia) |
| [`sdk/README.md`](sdk/README.md) | Agent SDK |
| [`scripts/check-doc-links.py`](scripts/check-doc-links.py) | Doc link CI gate |

## Logo & brand

SVG mark: [`docs/assets/gooddollar-l2-logo.svg`](docs/assets/gooddollar-l2-logo.svg) — G$ primitive, L2 ring, connected nodes. Tagline: **The UBI Chain**.

## Development rules

1. Canonical addresses from `op-stack/addresses.json` only.
2. Public URL behavior is release-critical — localhost-only success is insufficient.
3. Do not hide degraded services in `/api/status`; fix or document exclusions.
4. Major features need proof: test, E2E, smoke, tx hash, or explicit blocker.
5. Refresh README, testnet guide, and [`docs/apps/`](docs/apps/README.md) every five readiness iterations.
