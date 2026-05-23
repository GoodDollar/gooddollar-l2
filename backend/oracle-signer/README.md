# `@goodchain/oracle-signer`

Off-chain oracle signer service. Subscribes to `price-service` quote streams
and publishes batched price updates to the on-chain oracles.

## Routing

- Equities / ETFs / indices → `StockOracleV2.batchUpdatePrices` (single rail today).
- Crypto rail is added in a follow-up slice (see initiative tasks).

## Environment

| Env var | Default | Notes |
|---|---|---|
| `ORACLE_SIGNER_KEY` | *(required)* | Devnet keeper key. Service degrades (no exit) when missing. |
| `PRICE_SERVICE_URL` | `ws://localhost:4001` | WS quote stream. |
| `L2_RPC_URL` / `RPC` | `http://localhost:8545` | JSON-RPC endpoint. |
| `STOCK_ORACLE_V2_ADDRESS` | `''` | Stocks oracle address. |
| `ORACLE_UPDATE_INTERVAL` | `5000` | ms between submission attempts. |
| `ORACLE_MIN_DEVIATION` | `10` | basis points; smaller moves are filtered. |
| `ORACLE_TX_TIMEOUT` | `60000` | ms before `tx.wait()` is considered dropped. |
| `ORACLE_SYMBOLS` | `AAPL,TSLA,…` | Allowlist of stock symbols. |
| `ORACLE_SIGNER_ALLOWED_CHAIN_IDS` | `31337,1337` | **Devnet allowlist.** The submission loop refuses to start when `provider.getNetwork().chainId` is not in this list. Defence-in-depth against accidental mainnet pushes. Malformed values fall back to the default. |
| `HEALTH_PORT` / `ORACLE_SIGNER_PORT` | `9107` | Health server port. |

## Health and refusal semantics

The health server binds **before** config is loaded, so a missing key or a
refused chain id leaves the process reachable on `/health` instead of
restart-looping. On refusal:

- `SERVICE_HEALTH_STATUS=degraded`
- `SERVICE_DISABLED_REASON=refused: non-devnet chain id <id>` (or the
  missing-key reason)
- No `setInterval` is scheduled, no WS connection is opened.
- The process continues running so PM2 and the status aggregator see `degraded`
  rather than `unreachable`.

## Tests

```bash
npm test
```

The chain-guard tests live in `src/__tests__/chain-guard.test.ts` and
exercise both the pure parser and the start-time refusal flow.
