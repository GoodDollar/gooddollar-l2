# GoodChain L2 — App & Route Index

Every user-facing protocol surface in the GoodDollar L2 web app lives under a single Next.js deployment at [goodswap.goodclaw.org](https://goodswap.goodclaw.org). Routes are grouped by product family; each page below links to a focused README grounded in repository sources.

**Canonical route registry:** [`frontend/src/lib/tests/e2eRegistry.json`](../../frontend/src/lib/tests/e2eRegistry.json) (29 registered Playwright routes as of 2026-05-16).

**Live base URL:** `https://goodswap.goodclaw.org`

## What works now (2026-05-24 main merge)

The app suite is still one Next.js deployment, but the live-prices lanes add a stronger runtime contract around prices, status, and demo hedging. Current working scope by product:

| Product | Working surface | Important boundary |
|---------|-----------------|--------------------|
| GoodSwap | Landing/swap card, wallet connection, quote UI, route-level status/error handling. | Production swap execution still depends on canonical deployed router/address freshness. |
| GoodPerps | `/perps` renders pair selector, funding/order-book/trade history panels, crypto oracle badges, demo overlay, and wallet/safety guards. | Matching/settlement are devnet/demo; do not present as production trading. |
| GoodPredict | Discovery/create/portfolio/detail surfaces and backend CLOB package remain documented and testable. | Market resolution and real liquidity still require backend/operator setup. |
| GoodLend / GoodStable / Yield | Supply/borrow, gUSD, vault/yield pages are present with wallet/on-chain read paths. | Oracle and collateral assumptions are devnet-grade until external audit. |
| GoodStocks | Listing, detail, watchlist, portfolio and market/status panels render oracle provenance, no-data honesty, source badges, and live-price status. | Synthetic stock execution needs healthy stock oracle/collateral services. |
| Portfolio / Claim | Portfolio and UBI claim pages render wallet/on-chain state and no-wallet honesty. | Claim success depends on deployed UBI contracts and faucet/test balances. |
| Status / QA | `/status`, `/api/status`, `/api/status/quotes`, `/api/oracle/status`, `/tests`, `/test-dashboard`, and `/live-prices-proof` expose service health, quote health, proof receipts, and test dashboards. | Health-only/excluded `oracle-signer` and `hedge-engine` are warnings, not hidden successes. |
| Faucet / Testnet guide | Testnet onboarding, RPC metadata, faucet route, and developer links are documented. | Public promotion still requires fresh deploy/build proof and explicit warning acceptance. |


### App-level status after the lane merge

- The web app remains a single Next.js deployment, but its visible price/status claims now have a backend proof path: `price-service` → `oracle-signer` → `StockOracleV2` → frontend status/proof surfaces.
- The stock and perps UIs can show source/provenance/freshness instead of silently rendering placeholder prices. When backend inputs are absent, the UX should show no-data/degraded states rather than fake success.
- The QA/status surfaces (`/status`, `/api/status`, `/api/status/quotes`, `/api/oracle/status`, `/live-prices-proof`) are the operator truth surface for demos. A yellow health-only/excluded service is acceptable for internal demos only if it is explicitly acknowledged.
- No app should claim real-money trading. GoodStocks, GoodPerps, and hedge proof flows are demo/devnet/testnet surfaces until the signer, risk engine, contracts, and deploy manifest are promoted together.

## Core trading & liquidity

| App | Route(s) | Doc |
|-----|----------|-----|
| GoodSwap (landing + swap) | `/` | [swap.md](./swap.md) |
| Explore | `/explore`, `/explore/[symbol]` | [explore.md](./explore.md) |
| Pool | `/pool` | [pool.md](./pool.md) |
| Yield | `/yield` | [yield.md](./yield.md) |
| Bridge | `/bridge` | [bridge.md](./bridge.md) |

## Protocol terminals

| App | Route(s) | Doc |
|-----|----------|-----|
| GoodPerps | `/perps`, `/perps/leaderboard`, `/perps/portfolio` | [perps.md](./perps.md) |
| GoodPredict | `/predict`, `/predict/create`, `/predict/portfolio`, `/predict/[marketId]` | [predict.md](./predict.md) |
| GoodLend | `/lend` | [lend.md](./lend.md) |
| GoodStable (gUSD) | `/stable` | [stable.md](./stable.md) |
| GoodStocks | `/stocks`, `/stocks/markets`, `/stocks/[ticker]`, `/stocks/portfolio`, `/stocks/watchlist` | [stocks.md](./stocks.md) |

## Wallet, governance & agents

| App | Route(s) | Doc |
|-----|----------|-----|
| Portfolio / Claim | `/portfolio` | [portfolio.md](./portfolio.md) |
| Governance | `/governance`, `/governance/analytics` | [governance.md](./governance.md) |
| Agents | `/agents`, `/agents/register`, `/agents/[address]` | [agents.md](./agents.md) |

## Observability & tester surfaces

| App | Route(s) | Doc |
|-----|----------|-----|
| UBI Impact | `/ubi-impact` | [ubi-impact.md](./ubi-impact.md) |
| Activity | `/activity` | [activity.md](./activity.md) |
| Analytics | `/analytics` | [analytics.md](./analytics.md) |
| Faucet | `/faucet` | [faucet.md](./faucet.md) |
| Testnet guide | `/testnet-guide` | [testnet-guide.md](./testnet-guide.md) |
| QA / tests | `/tests`, `/test-dashboard`, `/invite` | [qa.md](./qa.md) |

## Frontend implementation map

| Concern | Location |
|---------|----------|
| App Router pages | `frontend/src/app/` and `frontend/src/app/(app)/` |
| Contract addresses (devnet) | `frontend/src/lib/devnet.ts` → `op-stack/addresses.json` |
| API routes | `frontend/src/app/api/` (`status`, `faucet`, `feedback`, `analytics`, …) |
| E2E registry | `frontend/src/lib/tests/e2eRegistry.json` |
| Playwright suites | `frontend/e2e/` |

## UBI fee routing

All protocol fee paths into the UBI pool are enumerated in [`docs/UBI-FEE-ACCOUNTING.md`](../UBI-FEE-ACCOUNTING.md) (14 routes, integration-proven on devnet via Foundry proofs in `test/integration/`).
