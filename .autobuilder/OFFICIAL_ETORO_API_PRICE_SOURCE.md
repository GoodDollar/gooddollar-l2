# Official eToro API price source — mandatory for initiative 0007

Source checked: 2026-05-23 from builders.etoro.com and api-portal.etoro.com.

## Cursor MCP

Every lane must expose official eToro API docs to Cursor via `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "etoro-api-docs": {
      "url": "https://api-portal.etoro.com/mcp"
    }
  }
}
```

Use this MCP for endpoint schemas before changing eToro client, price-service, oracle-signer, or hedge execution code. Do not invent endpoints.

## Official skill / API docs

- Skill page: `https://api-portal.etoro.com/ai-agents/etoro-skill.md`
- Skill install source: `https://skills.bullaware.com/etoro-api/SKILL.md`
- Docs index: `https://api-portal.etoro.com/llms.txt`
- API base URL: `https://public-api.etoro.com/api/v1`

Required headers for all public API requests:

- `x-request-id`: unique UUID per request
- `x-api-key`: eToro public API key
- `x-user-key`: user/account key for the selected environment

Keys are not committed. Demo/virtual keys only for this initiative.

## Correct price flow

Final live price path must be:

`eToro Public API / market data -> price-service -> oracle-signer -> on-chain oracle -> app reads chain/status proof`

No final proof may rely on CoinGecko, hardcoded mocks, static fixture prices, or browser-only frontend fetches.

## Instrument discovery

Use official endpoint:

`GET /market-data/search`

Required query field:

- `fields` is required and comma-separated.

Recommended lookup query:

```text
/market-data/search?internalSymbolFull=<SYMBOL>&fields=instrumentId,internalSymbolFull,displayname,symbol,instrumentType,isCurrentlyTradable,isExchangeOpen,isBuyEnabled,currentRate&pageSize=10&pageNumber=1
```

Resolution rules:

1. Resolve and cache instrument IDs before rates polling.
2. Verify exact `internalSymbolFull` or `symbol` match; do not accept first fuzzy result blindly.
3. Track both `instrumentId` and `instrumentID` casing defensively.
4. Include the initial symbol set: `BTC`, `ETH`, `SOL`, `AAPL`, `TSLA`, `NVDA`, `META`, `SPY`, plus current lane stocks `MSFT`, `AMZN`, `GOOGL`, `QQQ`, `AMD` when available.
5. Store the resolved map in a generated/cache artifact that is ignored by git unless it is a deliberate checked-in fixture for tests.

## Rates endpoint

Use official endpoint:

`GET /market-data/instruments/rates?instrumentIds=<comma-separated-ids>`

Constraints:

- `instrumentIds` is required.
- Up to 100 IDs per request.
- Response envelope has `rates` array.
- Per-rate fields include: `instrumentID`, `ask`, `bid`, `lastExecution`, `conversionRateAsk`, `conversionRateBid`, `date`, `priceRateID`.

Normalization rules:

- `bid`, `ask`, `lastExecution` must be parsed as decimal numbers, never integers with guessed decimals.
- Preferred mid price: `(bid + ask) / 2` only when both are positive finite numbers.
- Fallback price: `lastExecution` only when bid/ask are unavailable; mark confidence lower.
- Timestamp: use rate `date`; reject stale rates.
- Spread: compute `(ask - bid) / mid`; reject or degrade if spread exceeds configured threshold.
- Symbol status: stocks can be closed/stale outside market hours; crypto should remain 24/7 unless API says otherwise.
- Price-service schema must include: `symbol`, `instrumentId`, `bid`, `ask`, `mid`, `lastExecution`, `spreadBps`, `timestamp`, `source`, `confidence`, `stale`, `reason`.

## Hedging / demo trading only

Demo endpoints contain `/demo/`, for example:

- `POST /trading/execution/demo/market-open-orders/by-amount`
- `POST /trading/execution/demo/market-open-orders/by-units`
- Demo portfolio/PnL: `/trading/info/demo/*`

Hard fences:

- No real execution endpoints in autobuilder.
- Require `ETORO_MODE=demo` or `demo-readonly` / `demo-trading`.
- Require explicit capped demo notional env before demo order placement.
- Keep `REAL_TRADING_ENABLED=false` and fail closed if any real endpoint is selected.

## Acceptance test before lane completion

A lane is not complete until it can show one of these proofs:

1. With valid demo keys: non-zero `rates[]` from official rates endpoint for at least one crypto and one stock, normalized into price-service.
2. Without keys: deterministic unit/integration test using an official-schema `rates` fixture that proves parsing, validation, stale rejection, spread rejection, and no mock price gets published as eToro-sourced.

The final release proof must use real demo keys and live API data, not only fixtures.
