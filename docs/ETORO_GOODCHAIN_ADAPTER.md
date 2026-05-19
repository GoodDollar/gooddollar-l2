# eToro → GoodChain Price Adapter (Iterations 1–3)

This is the local adapter shape for safely consuming eToro-style market data in GoodChain services.

## What exists now

- `backend/stocks-keeper/src/etoro/credentials.ts`
  - Loads TSV credentials from `ETORO_CREDENTIALS_FILE` or the default secured workspace path.
  - Supports header-based TSVs and no-header test fixtures.
  - Provides `redactedCredentialSummary()` so logs can report capability flags without leaking secrets.
- `backend/stocks-keeper/src/etoro/client.ts`
  - Configurable eToro API client skeleton with injectable `fetch` for mocked tests.
  - Supports bearer token, API key, client ID, and account ID headers.
  - Endpoint paths are configurable because live endpoint details still need confirmation.
- `backend/stocks-keeper/src/etoro/normalize.ts`
  - Normalizes instruments and quotes into GoodChain-friendly records.
  - Converts market prices to the existing 8-decimal oracle format (`priceE8` / `priceChainlink`).

## Secret handling rules

- Do not commit credentials or generated `.env` files.
- Do not log raw credential records.
- Use `redactedCredentialSummary()` if operational logs need to show which auth fields are present.
- The default credential file remains outside the repo: `/home/goodclaw/.openclaw/workspace/.credentials/etoro-api-test-users.tsv`.

## Local verification

```bash
cd backend/stocks-keeper
npm test -- --runInBand src/etoro
npm run build
```

## Next iteration recommendation

Iteration 4 should confirm the actual eToro sandbox endpoint paths and auth flow, then add a live smoke test that only prints non-secret status, counts, normalized symbols, and oracle-ready prices.
