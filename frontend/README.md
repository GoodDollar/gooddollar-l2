# GoodSwap Frontend — GoodChain L2 Web App

<!-- GOODCHAIN_STATUS:START -->
> **Public testnet checkpoint (2026-05-24 16:47 UTC):** `main@6e329ad3` is deployed to `goodswap.goodclaw.org`. Public health gate and lane-7 internal smoke are **GREEN-with-warnings** with `0` blockers. Explorer/RPC were repaired without wiping Blockscout DB; final verification showed RPC/explorer at block `13777`, and a live follow-up probe saw the explorer advancing past `14029`. Remaining warnings are accepted/excluded health-only services or optional `LANE7_RPC` freshness config. See root `README.md` and `docs/ARCHITECTURE.md`.
<!-- GOODCHAIN_STATUS:END -->


> Next.js 14 app serving every protocol surface at [goodswap.goodclaw.org](https://goodswap.goodclaw.org).

**Per-app route docs:** [`docs/apps/README.md`](../docs/apps/README.md)

## Quick start

```bash
cd frontend
npm install
npm run dev          # http://localhost:3100 — uses isolated .next.dev
npm run build        # atomic production build (scripts/atomic-build.mjs)
npm run start        # production server :3100
npm run deploy       # ONLY supported production rollout (build + pm2 reload)
```

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 App Router |
| Styling | Tailwind CSS |
| Web3 | wagmi + viem + RainbowKit |
| i18n | next-intl |
| Unit tests | Vitest + Testing Library |
| E2E | Playwright |

## Route map

All pages live under `src/app/`. Protocol routes use the `(app)` route group.

| Area | Paths | Doc |
|------|-------|-----|
| Swap / landing | `/` | [swap](../docs/apps/swap.md) |
| Explore | `/explore`, `/explore/[symbol]` | [explore](../docs/apps/explore.md) |
| Pool / Yield / Bridge | `/pool`, `/yield`, `/bridge` | [pool](../docs/apps/pool.md), [yield](../docs/apps/yield.md), [bridge](../docs/apps/bridge.md) |
| Perps | `/perps`, `/perps/leaderboard`, `/perps/portfolio` | [perps](../docs/apps/perps.md) |
| Predict | `/predict`, `/predict/create`, `/predict/portfolio`, `/predict/[marketId]` | [predict](../docs/apps/predict.md) |
| Lend / Stable | `/lend`, `/stable` | [lend](../docs/apps/lend.md), [stable](../docs/apps/stable.md) |
| Stocks | `/stocks`, `/stocks/markets`, `/stocks/[ticker]`, `/stocks/portfolio`, `/stocks/watchlist` | [stocks](../docs/apps/stocks.md) |
| Portfolio / Governance / Agents | `/portfolio`, `/governance`, `/agents` | [portfolio](../docs/apps/portfolio.md), [governance](../docs/apps/governance.md), [agents](../docs/apps/agents.md) |
| Observability / QA | `/analytics`, `/activity`, `/ubi-impact`, `/faucet`, `/testnet-guide`, `/tests` | [docs/apps/](../docs/apps/README.md) |

**E2E registry (29 routes):** `src/lib/tests/e2eRegistry.json`

## API routes

| Path | Method | Purpose |
|------|--------|---------|
| `/api/status` | GET | Proxies `status-aggregator` health JSON |
| `/api/analytics/overview` | GET | Protocol KPI aggregate |
| `/api/feedback` | POST | Redacted tester feedback → JSONL |
| `/api/faucet` | POST | Testnet faucet claims |
| `/api/prices` | GET | Price helper |
| `/api/rpc` | POST | RPC proxy (rate-limited) |
| `/api/predict/comments` | * | Predict comment proxy |

## Configuration

Contract addresses and RPC: `src/lib/devnet.ts` → [`op-stack/addresses.json`](../op-stack/addresses.json).

**Do not** run `next dev` against the production `frontend/` tree served by PM2 — use a separate worktree or rely on `distDir` isolation (see [`docs/TESTNET_README.md`](../docs/TESTNET_README.md#frontend-health-iter-19)).

## Testing

```bash
npx tsc --noEmit
npx vitest run
npm run test:e2e              # app-regression registry (chromium)
npm run test:e2e:all            # full suite (E2E_PROD_SERVER=1)
npm run check:perf              # local/static perf checks
npm run check:perf:live         # local/static checks + strict BUILD_ID/chunk probes
```

Key E2E journeys: `e2e/perps-journey.spec.ts`, `e2e/predict-journey.spec.ts`, `e2e/portfolio-journey.spec.ts`, `e2e/faucet-reliability.spec.ts`, `e2e/analytics.spec.ts`.

## Deploy model (PM2)

Production deploy **must** use:

```bash
cd frontend && npm run deploy
```

This runs `npm ci`, `npm run build`, `pm2 reload goodswap --update-env`, and `check-buildid-sync.mjs --strict`. See [`scripts/deploy.sh`](scripts/deploy.sh) and [`docs/runbooks/frontend-rebuild.md`](../docs/runbooks/frontend-rebuild.md).

PM2 launcher fence: [`scripts/pm2-launch-next.mjs`](scripts/pm2-launch-next.mjs) validates `.next/` before `next start`.

Watchdog (optional): [`scripts/goodswap-watchdog.mjs`](scripts/goodswap-watchdog.mjs) — reloads after stale chunk failures.

## Related docs

- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)
- [`backend/README.md`](../backend/README.md)
- Root [`README.md`](../README.md)
