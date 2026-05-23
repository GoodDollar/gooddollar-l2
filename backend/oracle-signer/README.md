# @goodchain/oracle-signer

Off-chain oracle signer — consumes normalized price quotes from
`@goodchain/price-service` over WebSocket and submits batched `setPrice`
updates to `StockOracleV2` on L2.

Part of [Lane 1 — eToro live prices & demo hedging](../../docs/ETORO_GOODCHAIN_ADAPTER.md).
**Demo only** — this service performs reads + on-chain writes but never
trades on eToro. The WS feed it consumes comes from
[`@goodchain/etoro-client`](../etoro-client/README.md) whose source-level
`REAL_TRADING_ENABLED` fence in
[`src/auth.ts`](../etoro-client/src/auth.ts) guarantees no real-money
path.

## Install / test

```bash
npm install
npm run build      # tsc → dist/
npm run typecheck  # tsc --noEmit
npm test           # jest --verbose; offline
npm start          # node dist/index.js
npm run dev        # ts-node src/index.ts
```

From the repo root: `npm run install:lane1` / `npm run test:lane1`.

## Run locally

```bash
# Health-only mode — no signer key, no chain RPC:
# The health server stays bound on :9107 but the submission loop is
# disabled and /health reports `degraded`.
npm start

# Live with mock upstream + Anvil chain — boot the price-service in
# mock mode in another terminal, then:
ORACLE_SIGNER_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
STOCK_ORACLE_V2_ADDRESS=0x0000000000000000000000000000000000000001 \
RPC_URL=http://localhost:8545 \
  npm start
```

Leaving `PRICE_SERVICE_URL` unset is correct — the default tracks the
producer's canonical WS port.

## Endpoints

| Surface | Default port | Source |
|---------|--------------|--------|
| Health (`/health`) | `9107` | `process.env.HEALTH_PORT ?? ORACLE_SIGNER_PORT ?? '9107'` ([`src/index.ts`](src/index.ts)) |

## Env (this package)

| Var | Default | Notes |
|-----|---------|-------|
| `ORACLE_SIGNER_KEY` | unset (= disabled) | Private key for `StockOracleV2.setPrice`. Without it the service runs in health-only mode. |
| `STOCK_ORACLE_V2_ADDRESS` | unset (= disabled) | Target oracle contract address. |
| `PRICE_SERVICE_URL` | `ws://localhost:9301` | Upstream WS broadcaster from [`backend/price-service`](../price-service/README.md) (`DEFAULT_CONFIG.wsPort`). |
| `L2_RPC_URL` / `RPC` | `http://localhost:8545` | JSON-RPC URL for the L2 chain. |
| `ORACLE_UPDATE_INTERVAL` | `5000` | Submission tick cadence in ms. |
| `ORACLE_MIN_DEVIATION` | `10` | Minimum bps deviation to include a symbol in the next batch. |
| `ORACLE_TX_TIMEOUT` | `60000` | `tx.wait()` timeout in ms. |
| `ORACLE_SYMBOLS` | `DEFAULT_LANE_SYMBOLS` | Comma-separated subset. Unknown symbols degrade the service via `SERVICE_HEALTH_STATUS`. |
| `ORACLE_SIGNER_PORT` / `HEALTH_PORT` | `9107` | Health port override. |

SDK env (modes, credentials, instrument overrides) is read by
`@goodchain/etoro-client`; the canonical contract lives in
[`docs/ETORO_GOODCHAIN_ADAPTER.md`](../../docs/ETORO_GOODCHAIN_ADAPTER.md).

## Upstream / downstream wiring

```
price-service (ws://localhost:9301) → oracle-signer → StockOracleV2.setPrice (on-chain)
```

The signer subscribes to the price-service WS broadcaster, buffers
quotes per symbol, and at each `ORACLE_UPDATE_INTERVAL` tick submits a
single batched `setPrice` transaction containing every symbol that has
moved more than `ORACLE_MIN_DEVIATION` bps since the last submission.
Unknown `ORACLE_SYMBOLS` entries are filtered out and the service marks
itself `degraded` via `SERVICE_HEALTH_STATUS` so the status aggregator
surfaces the misconfiguration.

## Where to go next

- Full lane contract: [`docs/ETORO_GOODCHAIN_ADAPTER.md`](../../docs/ETORO_GOODCHAIN_ADAPTER.md)
- Upstream producer: [`backend/price-service/README.md`](../price-service/README.md)
- Sibling lane-1 consumer: [`backend/hedge-engine/README.md`](../hedge-engine/README.md)
- Demo-hedge proof runbook: [`docs/runbooks/lane1-demo-hedge-proof.md`](../../docs/runbooks/lane1-demo-hedge-proof.md)
- Lane scripts: `npm run install:lane1`, `npm run test:lane1`
