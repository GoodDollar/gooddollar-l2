# GoodChain L2 — App & Route Index

Every user-facing protocol surface in the GoodDollar L2 web app lives under a single Next.js deployment at [goodswap.goodclaw.org](https://goodswap.goodclaw.org). Routes are grouped by product family; each page below links to a focused README grounded in repository sources.

**Canonical route registry:** [`frontend/src/lib/tests/e2eRegistry.json`](../../frontend/src/lib/tests/e2eRegistry.json) (29 registered Playwright routes as of 2026-05-16).

**Live base URL:** `https://goodswap.goodclaw.org`

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
