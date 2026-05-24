# GoodDollar L2 — Backend Services

<!-- GOODCHAIN_STATUS:START -->
> **Public testnet checkpoint (2026-05-24 16:47 UTC):** `main@6e329ad3` is deployed to `goodswap.goodclaw.org`. Public health gate and lane-7 internal smoke are **GREEN-with-warnings** with `0` blockers. Explorer/RPC were repaired without wiping Blockscout DB; final verification showed RPC/explorer at block `13777`, and a live follow-up probe saw the explorer advancing past `14029`. Remaining warnings are accepted/excluded health-only services or optional `LANE7_RPC` freshness config. See root `README.md` and `docs/ARCHITECTURE.md`.
<!-- GOODCHAIN_STATUS:END -->


PM2-managed keepers, indexers, protocol APIs, and health aggregation for the GoodChain L2 devnet. The frontend proxies public health at `GET /api/status` from the status aggregator.

## Quick start

```bash
# Build all services (each package has its own build step)
cd backend/swap-oracle && npm ci && npm run build
# … repeat per service, or use repo deploy scripts

# Start full backend stack + frontend (from repo root)
pm2 start backend/ecosystem.config.js
```

Canonical PM2 configs:

| File | Scope |
|------|-------|
| [`backend/ecosystem.config.js`](ecosystem.config.js) | 14 backend services + `goodswap` Next.js |
| [`pm2-ecosystem.config.js`](../pm2-ecosystem.config.js) | Slimmer set: `goodswap`, `goodperps`, `goodpredict` |
| [`frontend/ecosystem.watchdog.config.cjs`](../frontend/ecosystem.watchdog.config.cjs) | `goodswap-watchdog` static-chunk probe |

## Service catalog

| PM2 name | Directory | Default health port | Role |
|----------|-----------|---------------------|------|
| `swap-oracle` | `swap-oracle/` | `9100` | Swap price oracle updates on-chain |
| `stocks-keeper` | `stocks-keeper/` | `9105` | Synthetic stock oracle upkeep |
| `activity-reporter` | `activity-reporter/` | `9101` | Agent/protocol activity reporting |
| `bridge-keeper` | `bridge-keeper/` | `3006` | Bridge monitoring/support |
| `harvest-keeper` | `harvest-keeper/` | `9102` | Yield vault harvest automation |
| `indexer` | `indexer/` | `4200` | Chain/event indexing API |
| `liquidator` | `liquidator/` | `9103` | Perps/lend/stable liquidations |
| `monitor` | `monitor/` | `4201` | Contract & chain health monitor |
| `revenue-tracker` | `revenue-tracker/` | `9104` | UBI revenue tracking |
| `rpc-balancer` | `rpc-balancer/` | `8546`–`8547` | RPC proxy/balancer |
| `status-aggregator` | `status-aggregator/` | `9200` | Polls all `/health` → `/status.json` |
| `hedge-engine` | `hedge-engine/` | `9106` | Risk hedging (disabled until `RISK_ENGINE_ADDRESS` set) |
| `price-service` | `price-service/` | `9300` REST · `9301` WS | Lane-1 price broadcaster — defaults to `ETORO_MODE=mock` |
| `oracle-signer` | `oracle-signer/` | `9107` | Oracle submission (disabled until `ORACLE_SIGNER_KEY` set) |
| `goodswap` | `../frontend/` | `3100` | Next.js production app |
| `perps` / `goodperps` | `perps/` | `8082` | Perps order book API — see package |
| `predict` / `goodpredict` | `predict/` | `3040` | Predict CLOB — [`predict/README.md`](predict/README.md) |

Additional packages (not always in PM2 ecosystem): `trading-bot/`, `etoro-client/`.

## Status aggregation

```
backend services → GET /health (each)
       ↓
status-aggregator:9200/status.json
       ↓
frontend GET /api/status  →  https://goodswap.goodclaw.org/api/status
```

Service list and health-contract classification live in [`status-aggregator/src/index.ts`](status-aggregator/src/index.ts), [`status-aggregator/src/statusBuilder.ts`](status-aggregator/src/statusBuilder.ts), and [`status-aggregator/src/parseHealthStatus.ts`](status-aggregator/src/parseHealthStatus.ts).

**2026-05-24 note:** `status-aggregator` now treats health-only services as operational-with-context instead of hard failures. `hedge-engine` and `oracle-signer` may be marked **excluded** when `RISK_ENGINE_ADDRESS` / `ORACLE_SIGNER_KEY` are absent. That is acceptable for internal smoke and controlled demos, but must be explicitly accepted or replaced with configured services before public testnet promotion.

## Live-prices backend lane

The merged live-prices lane adds a four-service pipeline:

| Package | Default ports | Works now | Boundary |
|---------|---------------|-----------|----------|
| `etoro-client/` | library | Mode resolution, instrument mapping, demo/read-only trading fences, quote/trading test coverage. | Real trading is source-fenced off. |
| `price-service/` | REST `9300`, WS `9301` | Normalized quote cache, risk/staleness rejection, source status, audit stats, `/status/quotes`, WS snapshots. | Missing eToro credentials degrade to manual-ingest/health-only mode. |
| `oracle-signer/` | health `9107` | Reads price-service quotes, signs/batches stock-oracle updates, exposes health/proof endpoints. | Needs `ORACLE_SIGNER_KEY` and RPC env for active publishing. |
| `hedge-engine/` | health `9106` | Demo hedge mapping, dry-run/capped proof path, receipt data for UI proof pages. | Needs `RISK_ENGINE_ADDRESS` for full health; no real-money hedge execution. |

Internal testnet smoke is in [`../scripts/testnet/internal-smoke.sh`](../scripts/testnet/internal-smoke.sh). The current merged baseline is **GREEN-with-warnings** because `oracle-signer` and `hedge-engine` are excluded by contract in health-only mode.


### Backend validation baseline — 2026-05-24

The post-merge backend gate is now green:

```bash
npm run test:lane1
# [ok] all lane-1 backend suites passed
```

What this proves:

- `etoro-client` builds and tests the canonical mode contract, demo/public URLs, env examples, instrument map, normalized quote shape (`spread`, `spreadPct`), and source-level real-trading fence.
- `price-service` builds and tests quote ingestion/cache, risk rejection metrics, REST/WS health, quote status payloads, and startup/degraded behavior.
- `oracle-signer` builds and tests quote WebSocket ingestion, malformed-frame counters, signer startup guards, proof/health endpoints, chain guards, and submitter receipt handling.
- `hedge-engine` builds and passes **22 suites / 153 tests**, including load config, adapter selection, cap enforcement, kill switch, receipt/proof writing, and reconciliation-loop integration.

Real-money execution is still intentionally unavailable: eToro real mode resolves to `real-disabled`, `REAL_TRADING_ENABLED` remains hardcoded false in the SDK, and hedge execution requires both `ETORO_MODE=demo-trading` and `HEDGE_TRADING_ENABLED=true` before demo orders are allowed.

## Environment & addresses

PM2 loads env from (precedence in `pick()`):

1. `op-stack/addresses.json` (canonical)
2. `.autobuilder/addresses.env`
3. Repo-root `.env`
4. Hardcoded devnet fallbacks (Anvil account #0 key — **dev only**)

Refresh addresses after redeploy:

```bash
python3 scripts/refresh-addresses.py   # if script exists on your checkout
```

## Protocol-specific docs

- [`predict/README.md`](predict/README.md) — REST/WS API on port 3040
- Perps backend: `backend/perps/` (Express + order book; port `8082`)

## Tests

Each service package typically exposes `npm test`. Repo-level gates:

```bash
bash scripts/health-check.sh
curl -s http://localhost:9200/status.json | jq .overall
```

## Related docs

- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — runtime topology
- [`docs/runbooks/frontend-rebuild.md`](../docs/runbooks/frontend-rebuild.md) — frontend PM2 deploy
- [`docs/apps/README.md`](../docs/apps/README.md) — frontend routes per protocol
