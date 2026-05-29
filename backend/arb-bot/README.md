# GoodChain Arbitrage Bot

Dry-run-first scaffold for arbitrage across GoodChain spot, perps, and prediction markets.

Current GoodChain defaults:

- RPC: `https://rpc.goodclaw.org`
- Chain ID: `42069` / `0xa455`
- Status API: `https://goodswap.goodclaw.org/api/status`
- Explorer: `https://explorer.goodclaw.org`

## What this is

A generic production-shaped bot skeleton:

- checks GoodChain RPC chain ID and block height
- checks GoodSwap status API
- loads venue/market definitions from JSON
- supports pluggable adapters for REST and EVM contracts
- detects generic opportunities:
  - spot/spot cross-venue arbitrage
  - spot/perp basis trades
  - binary prediction YES/NO basket mispricing
- enforces safety limits
- defaults to `DRY_RUN=true`
- refuses live execution unless every leg has explicit `to` + `calldata`

## Market-making and arbitrage logic

The bot is designed as a conservative cross-market market maker for the GoodChain L2 app suite. It does not assume one venue is “correct”; instead, each adapter normalizes spot, perps, prediction, lending, stable, and stock venues into comparable quotes, then the engine looks for trades that both improve market consistency and can be executed safely.

The initial engine supports three concrete strategy families:

1. **Spot ↔ spot cross-venue arbitrage**
   - Example: buy WETH/USDC where GoodSwap or another spot venue is cheaper, sell where it is richer.
   - This tightens prices across venues and gives users better effective liquidity.
   - Execution should eventually be atomic where possible, or inventory-aware when legs cannot settle in one transaction.

2. **Spot ↔ perp basis market making**
   - Example: if the GoodPerps ETH perp trades above spot, the bot can long spot and short perp; if the perp trades below spot, the reverse strategy can be added.
   - This narrows perp basis, improves mark/index alignment, and creates more stable liquidity around the perp books.
   - The engine explicitly labels funding, oracle/index, liquidation, and non-atomic execution risks because this is not risk-free arbitrage.

3. **Prediction-market basket arbitrage**
   - Example: for a binary GoodPredict market, buy YES + NO when the combined ask is below 1.0, or later add the reverse when combined bids exceed 1.0.
   - This keeps prediction prices internally consistent and helps complete-market liquidity.
   - The bot highlights resolution-rule, invalidation, liquidity-withdrawal, and settlement-delay risks.

The important design choice is that market making is treated as **quote normalization + risk-gated execution**, not hardcoded one-off scripts. Each GoodChain venue gets an adapter that emits `MarketQuote` objects. The opportunity engine compares those quotes under common limits:

- maximum notional per trade
- minimum expected profit in USD
- minimum expected profit in basis points
- maximum slippage budget
- dry-run/live execution mode

Live execution is deliberately blocked unless every leg includes exact transaction calldata and target addresses. That means the bot can be used safely today for health checks, quote ingestion, UI review, and strategy validation, while future GoodSwap / GoodPerps / GoodPredict / GoodStocks adapters can become live only after their execution paths are explicit and audited.

## Current integration level

This service is intentionally dry-run-first. It is useful today for local health checks, adapter development, and validating opportunity-detection logic without risking funds. Live venue adapters still need machine-readable market APIs or contract ABIs/addresses. Fill `markets.example.json` with:

- GoodSwap router/factory/quoter contracts or quote API
- GoodPerps reader/order/router contracts or REST quote endpoints
- GoodPredict market factory/orderbook/AMM contracts or REST quote endpoints
- token addresses/decimals
- market IDs and pair mappings

Once those are known, implement one adapter per venue under `src/adapters/`.

## Install

```bash
cd backend/arb-bot
npm install
cp .env.example .env
npm run build
```

## Health check

```bash
npm run health
```

## Run the UI

```bash
npm run ui
# open http://127.0.0.1:8787
```

The UI provides:

- chain/status health
- bot running/stopped state
- enabled venues
- quote count
- detected opportunities
- dry-run execution button
- recent errors/notes

## One dry-run scan

```bash
npm run scan
```

## Live trading safety

Do **not** set `DRY_RUN=false` until:

1. adapters generate exact calldata,
2. slippage protection is encoded on-chain,
3. wallet has only test funds / small hot-wallet funds,
4. every venue has allowance limits,
5. you have tested on tiny trades,
6. you understand prediction-market settlement/invalidation risk.

`.env` controls:

```env
DRY_RUN=true
MAX_TRADE_USD=10
MIN_PROFIT_USD=0.05
MIN_PROFIT_BPS=30
MAX_SLIPPAGE_BPS=50
PRIVATE_KEY=
```

## Adapter quote format

Adapters normalize every venue into `MarketQuote`:

```ts
{
  venueId: 'goodswap-spot',
  venueType: 'spot', // spot | perp | prediction
  marketId: 'WETH/USDC',
  base: 'WETH',
  quote: 'USDC',
  side: 'buy', // buy means taker can buy base at price
  price: 2500,
  size: 1.2,
  feeBps: 5,
  timestamp: Date.now()
}
```

Prediction markets should emit binary assets as:

- `MARKET_ID:YES`
- `MARKET_ID:NO`

The engine can then detect `YES ask + NO ask < 1` basket arb.

## Files

- `src/config.ts` — env parsing and safety checks
- `src/core/health.ts` — chain/status checks
- `src/core/opportunity-engine.ts` — generic arb detection
- `src/adapters/generic-rest.ts` — REST quote adapter template
- `src/adapters/generic-evm.ts` — EVM contract adapter template
- `src/exec/executor.ts` — dry-run/live execution guard
- `markets.example.json` — venue config placeholder

## PR safety notes

- This package is isolated under `backend/arb-bot`; it does not alter contracts, deployed services, PM2 config, frontend routes, or SDK exports.
- Defaults use public GoodChain endpoints and `DRY_RUN=true`.
- Live execution requires both `DRY_RUN=false` and a wallet key, then still refuses any leg without explicit transaction target/calldata.
- `GOODCHAIN_*` env names are preferred; legacy `GOODCLAW_*` aliases are accepted for local compatibility.
