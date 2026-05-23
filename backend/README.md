# GoodDollar L2 — Backend Services

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
| `hedge-engine` | `hedge-engine/` | `9106` | Risk hedging (disabled until `RISK_ENGINE_ADDRESS` set — see Lane 1 section) |
| `oracle-signer` | `oracle-signer/` | `9107` | Oracle submission (disabled until `ORACLE_SIGNER_KEY` set — see Lane 1 section) |
| `goodswap` | `../frontend/` | `3100` | Next.js production app |
| `perps` / `goodperps` | `perps/` | `8082` | Perps order book API — see package |
| `predict` / `goodpredict` | `predict/` | `3040` | Predict CLOB — [`predict/README.md`](predict/README.md) |

Additional packages (not always in PM2 ecosystem): `price-service/`, `trading-bot/`, `etoro-client/`.

## Status aggregation

```
backend services → GET /health (each)
       ↓
status-aggregator:9200/status.json
       ↓
frontend GET /api/status  →  https://goodswap.goodclaw.org/api/status
```

Service list defined in [`status-aggregator/src/index.ts`](status-aggregator/src/index.ts).

**2026-05-22 note:** `hedge-engine` and `oracle-signer` may report **unreachable** or degraded when running in health-only mode (empty `RISK_ENGINE_ADDRESS` / `ORACLE_SIGNER_KEY`). This is expected per [`ecosystem.config.js`](ecosystem.config.js) comments.

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
