# @goodchain/price-service

Normalized, risk-filtered price service consuming eToro market data.

Part of [Lane 1 — eToro live prices & demo hedging](../../docs/ETORO_GOODCHAIN_ADAPTER.md).
**Demo only** — backed by `@goodchain/etoro-client` whose `REAL_TRADING_ENABLED`
source-level fence guarantees no real-money path. This service performs reads
only.

## Install / test

```bash
npm install
npm run build      # tsc → dist/
npm run typecheck  # tsc --noEmit
npm test           # jest --verbose; offline
npm start          # node dist/index.js (uses ETORO_MODE)
npm run dev        # ts-node src/index.ts
```

From the repo root: `npm run install:lane1` / `npm run test:lane1`.

## Run locally

```bash
# Mock mode — no credentials required:
ETORO_MODE=mock npm start

# Demo-readonly — real demo quotes, no orders:
ETORO_MODE=demo-readonly \
  ETORO_DEMO_KEY=… ETORO_DEMO_SECRET=… ETORO_DEMO_USER_KEY=… \
  npm start
```

### Smoke check

After `npm start`, confirm quotes are flowing:

```bash
curl -s http://localhost:9300/health | jq .
# {"status": "ok", "freshQuotes": <≥1>, "totalCached": <≥1>,
#  "configuredSymbols": <N>, "timestamp": <epoch ms>}

curl -s http://localhost:9300/quotes | jq '.quotes | keys'
# ["AAPL", "BTC", ...]   (subset of ORACLE_SYMBOLS or DEFAULT_LANE_SYMBOLS)

curl -s http://localhost:9300/quotes/BTC | jq '{mid,bid,ask,timestamp,stale}'
# {"mid": <positive number>, "bid": <number>, "ask": <number>,
#  "timestamp": <epoch ms>, "stale": false}
```

If `/health` returns `503 {"status": "degraded"}` after 10 s the
upstream eToro source isn't producing fresh quotes (mock mode produces
them within one tick; demo-readonly may take longer on first auth —
see [`docs/ETORO_GOODCHAIN_ADAPTER.md`](../../docs/ETORO_GOODCHAIN_ADAPTER.md)).

## Endpoints

| Surface | Default port | Source |
|---------|--------------|--------|
| REST (`/quotes`, `/health`) | `9300` | `DEFAULT_CONFIG.port` in [`src/types.ts`](src/types.ts) |
| WebSocket (normalized stream) | `9301` | `DEFAULT_CONFIG.wsPort` in [`src/types.ts`](src/types.ts) |

Downstream `oracle-signer` connects to the WS port by default
(`PRICE_SERVICE_URL=ws://localhost:9301`; see
[`backend/oracle-signer`](../oracle-signer/)).

## Env (this package)

| Var | Default | Notes |
|-----|---------|-------|
| `ORACLE_SYMBOLS` | `DEFAULT_LANE_SYMBOLS` | Comma-separated symbol subset. Unknown symbols mark the service `degraded`. |
| `PRICE_SERVICE_STRICT_MODE` | unset | `'true'` makes missing demo creds a boot failure; default tolerates. |

The SDK env (modes, credentials, caps, instrument overrides) is read by
`@goodchain/etoro-client`; see the deep contract:
[`docs/ETORO_GOODCHAIN_ADAPTER.md`](../../docs/ETORO_GOODCHAIN_ADAPTER.md).

## Where to go next

- Live-prices-on-chain proof runbook: [`docs/runbooks/lane1-live-prices-on-chain.md`](../../docs/runbooks/lane1-live-prices-on-chain.md)
- Full lane contract: [`docs/ETORO_GOODCHAIN_ADAPTER.md`](../../docs/ETORO_GOODCHAIN_ADAPTER.md)
- SDK package: [`backend/etoro-client/README.md`](../etoro-client/README.md)
- Lane scripts: `npm run install:lane1`, `npm run test:lane1`
