# `@goodchain/oracle-signer`

Off-chain oracle signer service. Subscribes to `price-service` quote streams
and publishes batched price updates to the on-chain oracles.

## Routing

Each incoming `NormalizedQuote` is dispatched by `assetClass`:

| `assetClass` | Rail | Contract call |
|---|---|---|
| `equity`, `etf`, `index` | stocks | `StockOracleV2.batchUpdatePrices(symbol[], price8[], ts[], session[], confidence[])` |
| `crypto` | crypto | `SwapPriceOracle.batchUpdatePrices(address[], price8[])` |
| unknown / missing | falls back to stocks if symbol is in stocks allowlist; otherwise dropped (warn-once) |

Each rail has its own buffer, deviation threshold, and `setInterval` cadence;
a stocks-rail failure does not block crypto-rail submissions or vice versa.
A rail is **enabled only** when its oracle address (and, for crypto, its
symbol map) is configured.

## Environment

| Env var | Default | Notes |
|---|---|---|
| `ORACLE_SIGNER_KEY` | *(required)* | Devnet keeper key. Service degrades (no exit) when missing. |
| `PRICE_SERVICE_URL` | `ws://localhost:4001` | WS quote stream. |
| `L2_RPC_URL` / `RPC` | `http://localhost:8545` | JSON-RPC endpoint. |
| `STOCK_ORACLE_V2_ADDRESS` | `''` | Stocks oracle address. Empty disables the stocks rail. |
| `ORACLE_UPDATE_INTERVAL` | `5000` | Stocks ms between submission attempts. |
| `ORACLE_MIN_DEVIATION` | `10` | Stocks basis points; smaller moves are filtered. |
| `ORACLE_TX_TIMEOUT` | `60000` | ms before `tx.wait()` is considered dropped. |
| `ORACLE_SYMBOLS` | `AAPL,TSLA,…` | Allowlist of stock symbols (empty = allow all). |
| `SWAP_PRICE_ORACLE_ADDRESS` | `''` | SwapPriceOracle address. Empty disables the crypto rail. |
| `CRYPTO_SYMBOL_MAP` | `''` | Crypto symbol→address map. Either a JSON object (`{"WETH":"0x…","USDC":"0x…"}`) or KEY=ADDR comma list (`WETH=0x..,USDC=0x..`). Case-insensitive on the symbol side; addresses must be 20-byte hex. Empty disables the crypto rail. |
| `ORACLE_CRYPTO_UPDATE_INTERVAL` | *(stocks interval)* | Optional crypto cadence override. |
| `ORACLE_CRYPTO_MIN_DEVIATION` | *(stocks deviation)* | Optional crypto deviation override. |
| `ORACLE_CRYPTO_SYMBOLS` | *(keys of CRYPTO_SYMBOL_MAP)* | Optional crypto allowlist. |
| `ORACLE_SIGNER_ALLOWED_CHAIN_IDS` | `31337,1337` | **Devnet allowlist.** Refuses to start when `provider.getNetwork().chainId` is not in this list. Malformed values fall back to the default. |
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
