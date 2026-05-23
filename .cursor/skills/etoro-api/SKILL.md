---
name: etoro-api
description: Official eToro Public API guidance for GoodChain live prices and demo hedging. Use for eToro market data, instrument search, rates, portfolio, and demo execution code.
---

# eToro API — GoodChain 0007 subset

Use official docs through MCP server `etoro-api-docs` at `https://api-portal.etoro.com/mcp` before implementing endpoints.

Base URL: `https://public-api.etoro.com/api/v1`.

Required headers: `x-request-id` UUID, `x-api-key`, `x-user-key`.

Price endpoints:
- Resolve instruments: `GET /market-data/search` with required `fields` query.
- Current prices: `GET /market-data/instruments/rates?instrumentIds=<ids>`.
- Rates response has `rates[]` with `instrumentID`, `bid`, `ask`, `lastExecution`, conversion fields, `date`, and `priceRateID`.

Normalize price as mid `(bid+ask)/2` when bid/ask are valid, fallback to `lastExecution` with lower confidence, and reject stale/wide-spread rates. Never publish mocks/CoinGecko as eToro-sourced.

Trading/hedging endpoints must be demo only (`/trading/execution/demo/...`) and hard-fenced against real endpoints.
