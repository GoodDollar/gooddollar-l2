# @gooddollar/agent-sdk

<!-- GOODCHAIN_STATUS:START -->
> **Public testnet checkpoint (2026-05-24 16:47 UTC):** `main@6e329ad3` is deployed to `goodswap.goodclaw.org`. Public health gate and lane-7 internal smoke are **GREEN-with-warnings** with `0` blockers. Explorer/RPC were repaired without wiping Blockscout DB; final verification showed RPC/explorer at block `13777`, and a live follow-up probe saw the explorer advancing past `14029`. Remaining warnings are accepted/excluded health-only services or optional `LANE7_RPC` freshness config. See root `README.md` and `docs/ARCHITECTURE.md`.
<!-- GOODCHAIN_STATUS:END -->


TypeScript SDK for AI agents to interact with all GoodDollar L2 protocols. Every transaction funds UBI.

## Install

```bash
npm install @gooddollar/agent-sdk
```

## Quick Start

```typescript
import { GoodDollarSDK, ADDRESSES } from '@gooddollar/agent-sdk'
import { parseEther } from 'viem'

const sdk = new GoodDollarSDK({
  privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
})

// Check balances
const eth = await sdk.getEthBalance()
const gd = await sdk.getBalance('GoodDollarToken')

// Trade perpetuals
await sdk.perps.depositMargin(parseEther('10'))
await sdk.perps.openLong(0n, parseEther('1'))

// Prediction markets
const market = await sdk.predict.getMarket(0n)
await sdk.predict.buy(0n, true, parseEther('100'))

// Lending
await sdk.lend.supply(ADDRESSES.MockUSDC as `0x${string}`, parseEther('1000'))
const account = await sdk.lend.getAccountData()

// Synthetic stocks
const tickers = await sdk.stocks.listTickers()
await sdk.stocks.mint('AAPL', parseEther('500'), parseEther('1'))

// UBI impact
const totalSwaps = await sdk.ubi.getTotalSwaps()
```

## Modules

| Module | Description | Key Methods |
|--------|-------------|-------------|
| `sdk.perps` | Perpetual futures | `openLong`, `openShort`, `closePosition`, `getPosition` |
| `sdk.predict` | Prediction markets | `buy`, `redeem`, `createMarket`, `getMarket` |
| `sdk.lend` | Lending & borrowing | `supply`, `withdraw`, `borrow`, `repay` |
| `sdk.stocks` | Synthetic equities | `mint`, `burn`, `listTickers`, `getPosition` |
| `sdk.swap` | DEX swap info | `getUBIFee`, `getTotalSwaps` |
| `sdk.ubi` | UBI fee tracking | `getTotalFees`, `getTotalSwaps` |

## Read-Only Mode

Omit `privateKey` for read-only access:

```typescript
const sdk = new GoodDollarSDK()
const markets = await sdk.predict.getMarketCount()
```

## Tests

```bash
# Unit tests (no chain required)
cd sdk && npx jest --testPathPattern=sdk.test --no-cache

# Integration tests (requires running devnet)
cd sdk && npx jest --testPathPattern=integration --no-cache
```

- **Unit tests:** 25 tests — ABIs, addresses, SDK construction, exports
- **Integration tests:** 28 tests — live reads/writes against all 6 protocol modules

## Examples

See `examples/` for complete agent implementations:

- **`trading-bot.ts`** — Portfolio overview, market scanning, position management
- **`arbitrage-agent.ts`** — Prediction market mispricing detection, lending rate arbitrage

```bash
AGENT_KEY=0x... npx ts-node examples/trading-bot.ts
```

## Chain Info

- **Chain ID:** 42069
- **RPC:** http://localhost:8545 (default)
- **Explorer:** https://explorer.goodclaw.org
