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
| Agents dashboard | `paperclip.goodclaw.org` | Paperclip control plane (operator surface; availability is not a GoodSwap release gate) |

Canonical network metadata: [`op-stack/addresses.json`](op-stack/addresses.json).
Lane7 live-demo/devnet overrides live in [`op-stack/addresses.lane7.json`](op-stack/addresses.lane7.json) and are only for `GOODCHAIN_LANE=lane7` or lane7 smoke tooling.

## Release status — 2026-05-24

_Last refreshed 2026-05-24 12:20 UTC after lane7 proof/status fixes, frontend deploy, and push-prep. Supersedes older status rows where they conflict._

### Latest demo checkpoint — 2026-05-24 12:20 UTC

- **Live frontend:** `goodswap` is deployed and serving BUILD_ID `tDSHfi4rQnym103Jy7G3l` on https://goodswap.goodclaw.org.
- **Public proof routes:** `/live-prices-proof`, `/api/status`, `/api/oracle/status`, and `/api/status/quotes` all return HTTP `200` locally and publicly.
- **Oracle status:** `/api/oracle/status` reports `healthy: true`, `degraded: false`, fresh `TSLA`/`NVDA` quotes, `StockOracleV2` `0x5FbDB2315678afecb367f032d93F642f64180aa3`, and a live lane7 `/proof` payload with no stock submission failures.
- **Gates:** strict BUILD_ID sync and served chunk checks pass; `./scripts/testnet/health-gate.sh` and `scripts/testnet/internal-smoke.sh` both report **GREEN-with-warnings** with `0` blockers.
- **Warning semantics:** `/api/status` can still show `overall: "degraded"` because excluded/health-only services are surfaced honestly as warnings. This is not a demo blocker for the live-prices/proof path.
- **Fix commits:** main repo `8edd26ff` + `b9ebf156`; lane7 source repo `4085bf36`.

### Live-prices lane integration (merged into local `main`)

- **HEAD includes lanes 1–7:** eToro connectivity, price-service, oracle publishing, app integration, hedging demo, QA proof/release, and internal testnet smoke.
- **Local merge commits on `main`:** lane1 `d3e3b3fa`, lane2 `ccee9ee8`, lane3 `ac651865`, lane4 `fecfb3c9`, lane5 `784dd7d6`, lane6 `9d2d0e11`, lane7 `272fccf3`.
- **Lane proof commits included:** lane1 `2ea6ee37`, lane2 `e41d4e46`, lane4 `eb5dcdfe`, lane5 `08a85a72`, lane6 `76d9dbff`, lane7 `32844221` plus lane7 source fix `ae153c6c`.
- **Lane7 internal smoke:** `scripts/testnet/internal-smoke.sh` reports **GREEN-with-warnings**, exit code `0`, blockers `0`; default ports now target lane7 (`49300`, `49107`, `49106`, `49200`).
- **Remaining warnings before public promotion:** `hedge-engine` is intentionally allowed to run **health-only / excluded** when risk-engine addresses are absent. The lane7 `oracle-signer` proof endpoint is live; any excluded signer warning must be explicitly accepted or configured before broad public testnet promotion.


### Post-merge validation baseline (2026-05-24 UTC)

- `main` now contains the local merge commits for lanes 1–7 plus the lane7 proof/status deploy-gate fixes. This README checkpoint accompanies the remote push of the accumulated main history.
- `npm run test:lane1` passes end-to-end across `backend/etoro-client`, `backend/price-service`, `backend/oracle-signer`, and `backend/hedge-engine`.
- `backend/hedge-engine` specifically is green after reconciliation of lane-5/6/7 API drift: **22 suites / 153 tests passed**.
- Safety defaults remain fenced in operator-copy env: `REAL_TRADING_ENABLED=false`, `ETORO_MODE=mock`, `HEDGE_DRY_RUN=true`; demo trading still requires explicit demo mode and explicit hedge-trading enablement.
- The expected lane7 status remains **GREEN-with-warnings**: unconfigured `hedge-engine` and any explicitly excluded services are surfaced as health-only/excluded warnings, not hidden as success.

### What works now across the app suite

| Area | What works now | Current boundary |
|------|----------------|------------------|
| Live prices | `@goodchain/etoro-client` can feed `price-service`; `price-service` exposes normalized REST `/status/quotes` and WS `:9301`; frontend status hooks normalize public/proxy URLs. | Real trading remains fenced off. Missing credentials degrade to health-only/manual-ingest instead of pretending to be live. |
| Oracle publishing | `oracle-signer` reads price-service quotes and submits to `StockOracleV2`; `StockOracleV2.lastUpdated()` has fallback freshness support used by smoke tests. | Requires `ORACLE_SIGNER_KEY` and RPC env for active publishing; otherwise health-only/excluded is non-blocking but visible. |
| GoodStocks | `/stocks`, `/stocks/[ticker]`, `/stocks/watchlist`, and stock cards render source/provenance, oracle freshness, watchlist controls, no-data honesty, and status panels. | Synthetic stock trading still depends on deployed oracle/collateral addresses and wallet availability. |
| GoodPerps | `/perps` keeps the demo/synthetic perps UI, crypto oracle surfaces, history panels, funding/order-book components, and wallet guards. | Perps matching/settlement remain devnet/demo until backend and contracts are promoted together. |
| Hedging demo | `hedge-engine` maps GoodChain exposure into capped demo hedge intents and has a `hedge:demo` proof path plus UI receipt/export surfaces. | Health-only unless `RISK_ENGINE_ADDRESS` and demo credentials are configured; real-money hedging is not enabled. |
| Status/observability | `/api/status`, `/status`, `/api/status/quotes`, `/api/oracle/status`, and status-aggregator understand operational, degraded, health-only, and excluded service states. `/api/oracle/status` merges price-service quotes with signer proof (`service`, `chain`, `rails`, `failures`, `counts`, `ingest`). | Public status must keep showing exclusions honestly; do not hide red/yellow states in demos. |
| Testnet smoke | Lane7 scripts bring up local RPC/price fixture/status checks and validate the live-price pipeline contract. | Public promotion still needs explicit signer/hedge acceptance and a fresh production frontend build/deploy. |

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

## Live-prices lanes 1–7 — eToro prices, oracle publishing, UI proof, demo hedging

The merged live-prices work is now a full internal pipeline: market data → normalized quote service → oracle signer → `StockOracleV2` → app/status surfaces → demo hedge proof → lane7 smoke. **Demo/testnet only** — real-money trading and real-money hedging remain fenced off.

| Package / surface | Path | Role |
|-------------------|------|------|
| `@goodchain/etoro-client` | [`backend/etoro-client/`](backend/etoro-client/) | TypeScript SDK with mode resolution, demo/read-only fences, symbol/instrument helpers, quote/trading tests. |
| `@goodchain/price-service` | [`backend/price-service/`](backend/price-service/) | Normalizes quotes, risk-filters stale/outlier data, serves REST `:9300` + WS `:9301`, and exposes source/audit health. |
| `oracle-signer` | [`backend/oracle-signer/`](backend/oracle-signer/) | Consumes price-service quotes and publishes signed batches to `StockOracleV2`; lane7 exposes `GET /proof` with canonical `service`/`rails`/`stocks`/`failures`/`counts` shape. |
| `@goodchain/hedge-engine` | [`backend/hedge-engine/`](backend/hedge-engine/) | Maps GoodChain exposure to capped demo hedge intents and proof receipts; health-only when risk engine is unset. |
| Frontend status/proof | [`frontend/src/app/(app)/status/`](frontend/src/app/%28app%29/status/), [`frontend/src/app/api/status/quotes/`](frontend/src/app/api/status/quotes/) | Shows quote freshness, oracle provenance, service health, exclusions, and live-prices proof. |
| Internal smoke | [`scripts/testnet/internal-smoke.sh`](scripts/testnet/internal-smoke.sh) | Verifies the lane7 contract and reports GREEN-with-warnings when only accepted exclusions remain. |

Operator gates:

```bash
npm run install:lane1   # idempotent install across eToro/price/oracle/hedge packages
npm run test:lane1      # backend lane suites
./scripts/release/lane6-qa-gate.sh      # proof bundle, when env is configured
./scripts/testnet/internal-smoke.sh     # lane7 internal smoke
```

Current smoke baseline: **GREEN-with-warnings**. Warnings are expected until `RISK_ENGINE_ADDRESS` and any intentionally excluded services are configured or explicitly accepted for the target testnet stage.

Operator references:

- Live-prices proof: [`docs/runbooks/lane1-live-prices-on-chain.md`](docs/runbooks/lane1-live-prices-on-chain.md).
- Demo-hedge proof: [`docs/runbooks/lane1-demo-hedge-proof.md`](docs/runbooks/lane1-demo-hedge-proof.md).
- eToro adapter contract: [`docs/ETORO_GOODCHAIN_ADAPTER.md`](docs/ETORO_GOODCHAIN_ADAPTER.md).
- Lane3 oracle runbook: [`docs/lane3-oracle-publishing-runbook.md`](docs/lane3-oracle-publishing-runbook.md).
- Lane6 QA checklist: [`docs/release/lane6-qa-gate-checklist.md`](docs/release/lane6-qa-gate-checklist.md).


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

### Lane 6 — Live prices & demo hedge proof

A single command exercises the full live-prices pipeline (eToro → price-service
→ oracle → chain → hedge) and writes auditable evidence:

```bash
./scripts/release/lane6-qa-gate.sh
```

The reviewer checklist lives at [`docs/release/lane6-qa-gate-checklist.md`](docs/release/lane6-qa-gate-checklist.md);
the visible artifact is the [`/live-prices-proof`](frontend/src/app/%28app%29/live-prices-proof/page.tsx)
page (`/proof` alias) — open it in the running app to verify the safety
banner, on-chain oracle reads, recent tx hashes, and the latest demo hedge.

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
- **GOO-1846:** Removed `setMinter` extcodesize guard to allow admin-authorized EOAs (see [`docs/release/RC_COORDINATOR_20260522.md`](docs/release/RC_COORDINATOR_20260522.md)).
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
