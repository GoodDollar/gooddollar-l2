# `@goodchain/oracle-signer`

<!-- GOODCHAIN_STATUS:START -->
> **Public testnet checkpoint (2026-05-24 16:47 UTC):** `main@6e329ad3` is deployed to `goodswap.goodclaw.org`. Public health gate and lane-7 internal smoke are **GREEN-with-warnings** with `0` blockers. Explorer/RPC were repaired without wiping Blockscout DB; final verification showed RPC/explorer at block `13777`, and a live follow-up probe saw the explorer advancing past `14029`. Remaining warnings are accepted/excluded health-only services or optional `LANE7_RPC` freshness config. See root `README.md` and `docs/ARCHITECTURE.md`.
<!-- GOODCHAIN_STATUS:END -->


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
| `ORACLE_PROOF_CAPACITY` | `50` | Per-rail in-memory proof ring buffer size. |
| `ORACLE_AUDIT_LOG_DIR` | `.autobuilder/logs/oracle-signer/` | jsonl audit log directory. Created on first write. |
| `HEALTH_PORT` / `ORACLE_SIGNER_PORT` | `9107` | Health server port. |

## HTTP endpoints

- `GET /health` — service status (existing).
- `GET /proof` — most-recent on-chain submissions per rail; the frontend
  status API consumes this and merges it with price-service freshness data:
  ```json
  {
    "generatedAt": 1716100000000,
    "chain": {
      "chainId": 31337,
      "rpcEndpoint": "http://localhost:8545/",
      "signerAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "oracleAddresses": {
        "stocks": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        "crypto": "0x59b670e9fA9D0A427751Af201D676719a970857b"
      }
    },
    "rails": {
      "stocks": {
        "enabled": true,
        "lastSuccessAtMs": 1716099998800,
        "lastSuccessAgeMs": 1200,
        "lastFailureAtMs": null,
        "lastFailureAgeMs": null
      },
      "crypto": {
        "enabled": false,
        "lastSuccessAtMs": null,
        "lastSuccessAgeMs": null,
        "lastFailureAtMs": null,
        "lastFailureAgeMs": null
      }
    },
    "stocks": [{
      "rail": "stocks", "txHash": "0x…", "blockNumber": 123,
      "gasUsed": "150000", "symbols": ["AAPL"], "roundTripMs": 80,
      "submittedAtMs": 1716100000000, "mids": { "AAPL": 191.5 }
    }],
    "crypto": [/* same shape */]
  }
  ```

  The `rails` block answers "is the rail configured?" (`enabled`) and "how
  fresh is it right now?" (`lastSuccessAgeMs` / `lastFailureAgeMs`) without
  the operator having to subtract `submittedAtMs` from `generatedAt`. The
  timestamps are tracked independently of the bounded entry/failure rings,
  so they stay correct even when 50+ failures push all successes off the
  ring. Older signer builds may omit `rails`; consumers default each rail
  to `{ enabled: false, …nulls }`.

  The `chain` block carries the static deployment context so dashboards can
  render explorer URLs (`https://explorer/<chainId>/tx/<txHash>`) without
  any chain-specific config on the dashboard side. `chainId` is `null`
  until `assertDevnetChain` runs successfully. `signerAddress` is the
  wallet's PUBLIC address derived from `ORACLE_SIGNER_KEY` — the private
  key is never serialised. Addresses use ethers v6's checksum casing.
  `rpcEndpoint` is run through `redactRpcEndpoint` (strips `user:pass@`
  from URLs, drops IPC paths). Each rail's `oracleAddresses.<rail>` is
  `null` when that rail's address isn't configured.

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
- `/proof` returns **HTTP 503** with `service.status: "degraded"` (and a
  redacted `service.reason`) merged into the canonical proof body — operators
  can poll a single endpoint instead of `/health` + `/proof` to triage. The
  body shape is identical between the healthy 200 path and the degraded 503
  path, so consumers use one parser regardless.

## Tests

```bash
npm test
```

The chain-guard tests live in `src/__tests__/chain-guard.test.ts` and
exercise both the pure parser and the start-time refusal flow.
