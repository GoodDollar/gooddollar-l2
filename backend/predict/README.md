# GoodPredict Backend

<!-- GOODCHAIN_STATUS:START -->
> **Public testnet checkpoint (2026-05-24 16:47 UTC):** `main@6e329ad3` is deployed to `goodswap.goodclaw.org`. Public health gate and lane-7 internal smoke are **GREEN-with-warnings** with `0` blockers. Explorer/RPC were repaired without wiping Blockscout DB; final verification showed RPC/explorer at block `13777`, and a live follow-up probe saw the explorer advancing past `14029`. Remaining warnings are accepted/excluded health-only services or optional `LANE7_RPC` freshness config. See root `README.md` and `docs/ARCHITECTURE.md`.
<!-- GOODCHAIN_STATUS:END -->


CLOB matching engine and API for GoodPredict prediction markets on GoodDollar L2.

## Architecture

```
┌─────────────────────────────────────────┐
│  REST API (Express)  │  WebSocket (/ws) │
├──────────────────────┴──────────────────┤
│           CLOB Matching Engine           │
│  ┌────────┐ ┌────────┐ ┌────────────┐  │
│  │ Order  │ │ Trade  │ │ Complement │  │
│  │ Books  │ │ Match  │ │ Matching   │  │
│  └────────┘ └────────┘ └────────────┘  │
├──────────────────────────────────────────┤
│  Polymarket Feed  │  Market Resolver    │
└──────────────────────────────────────────┘
```

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

## API

Base URL: `http://localhost:3040/api/v1`

### Markets
- `GET /markets` — List all markets
- `GET /markets/:id` — Get market with orderbook
- `POST /markets` — Create market
- `POST /markets/:id/resolve` — Resolve market
- `POST /markets/:id/void` — Void market

### Orders
- `POST /orders` — Place order
- `DELETE /orders/:id` — Cancel order
- `GET /orders/:id` — Get order
- `GET /orders/maker/:address` — Get orders by maker

### Order Book
- `GET /orderbook/:marketId/:token` — Get order book (YES/NO)
- `GET /midpoint/:marketId/:token` — Get midpoint price

### Price Feeds
- `GET /feeds` — All Polymarket feeds
- `GET /feeds/:marketId` — Feed for specific market
- `POST /feeds/:marketId/link` — Link to Polymarket tokens

### WebSocket
Connect to `ws://localhost:3040/ws`

Subscribe to channels:
```json
{ "type": "subscribe", "channels": ["market:btc-100k", "orderbook:btc-100k:YES"] }
```

Message types: `orderbook_snapshot`, `trade`, `order_update`, `price_update`, `market_update`

## Tests

```bash
npm test
```
