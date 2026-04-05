# E2E Delta Summary — 2026-04-03/05 (updated 2026-04-05)

## Pass Rate Trend

| Run | Timestamp | Total | Passed | Failed | Pass Rate | Notes |
|-----|-----------|-------|--------|--------|-----------|-------|
| 1 | 2026-04-03T17:30Z | 12 | 9 | 3 | 75.0% | Initial run |
| 2 | 2026-04-03T17:35Z | 12 | 9 | 3 | 75.0% | |
| 3 | 2026-04-03T17:55Z | 12 | 10 | 2 | 83.3% | |
| 4 | 2026-04-03T18:05Z | 20 | 18 | 2 | 90.0% | +8 new tests |
| 5 | 2026-04-03T19:57Z | 20 | 19 | 1 | 95.0% | |
| 6 | 2026-04-03T20:10Z | 24 | 23 | 1 | 95.8% | +4 new tests |
| 7 | 2026-04-03T22:05Z | 24 | 22 | 2 | 91.7% | Oracle redeployed |
| 8 | 2026-04-03T22:25Z | 25 | 19 | 6 | 76.0% | **GOO-209 detected** |
| 9 | 2026-04-04T00:05Z | 25 | 23 | 2 | 92.0% | GOO-209+202 fixed |
| 10 | 2026-04-04T00:25Z | 24 | 20 | 4 | 83.3% | **GOO-219 detected** |
| 11 | 2026-04-04T02:08Z | 25 | 22 | 3 | 88.0% | **GOO-233: 6 chunks 400** + GOO-232 filed |
| 12 | 2026-04-04T04:01Z | 29 | 25 | 4 | 86.2% | +4 new tests; **GOO-236: /ubi-impact 404** |
| 13 | 2026-04-04T04:30Z | 32 | 26 | 6 | 81.3% | +3 tests; GOO-236 fixed; GOO-233 partial (new chunks) |
| 14 | 2026-04-04T05:20Z | 33 | 31 | 2 | 93.9% | GOO-232+233 fixed; **GOO-276** filed; +1 hydration test |
| 15 | 2026-04-04T06:00Z | 39 | 37 | 2 | 94.9% | +6 sub-page tests; all pass |
| 16 | 2026-04-04T06:20Z | 41 | 39 | 2 | 95.1% | +2 tests (predict/portfolio, agents/[address]) |
| 17 | 2026-04-04T07:00Z | 42 | 40 | 2 | 95.2% | +1 test (explore/ETH); full route coverage achieved |
| 18 | 2026-04-04T08:00Z | 44 | 40 | 4 | 90.9% | +2 canary tests (stocks live prices, activity block#) |
| 19 | 2026-04-04T09:00Z | 44 | 40 | 4 | 90.9% | No change — GOO-276 still unfixed |
| 20 | 2026-04-04T10:00Z | 44 | 40 | 4 | 90.9% | No change — GOO-276 still unfixed |
| 21 | 2026-04-04T14:30Z | 47 | 41 | 6 | 87.2% | +3 tests (404 page, swap redirect, meta tags); GOO-357 filed |
| 22 | 2026-04-04T15:30Z | 49 | 42 | 7 | 85.7% | +2 tests (perps trading UI canary, lend APY table); lend mock passes |
| 23 | 2026-04-04T16:30Z | 51 | 43 | 8 | 84.3% | +2 tests (home swap form canary, test-dashboard); 6 GOO-276 canaries total |
| 24 | 2026-04-05T00:00Z | 52 | 43 | 9 | 82.7% | +1 test (per-page titles); GOO-392 filed: 6/6 routes share root title |
| 25 | 2026-04-05T01:00Z | 55 | 45 | 10 | 81.8% | +3 tests (bridge chains ✅, explore count ✅, CoinGecko canary); 7 GOO-276 canaries |
| 26 | 2026-04-05T02:00Z | 56 | 45 | 11 | 80.4% | +1 test (a11y skip link); GOO-401 filed: 54 commits undeployed, pipeline stuck |
| 27 | 2026-04-05T03:00Z | 57 | 45 | 12 | 78.9% | +1 test (WalletConnect); GOO-401 assigned to DevOps; GOO-403 filed (WC placeholder) |
| 28 | 2026-04-05T10:15Z | 57 | 52 | 5 | 91.2% | **GOO-276 FIXED** — 7 canaries now pass; test fixes (activity, swap_form, no_errors, perps msg); GOO-414 filed |
| 29 | 2026-04-05T10:45Z | 57 | 52 | 5 | 91.2% | activity+portfolio layout.tsx added (GOO-392 fully fixed); GOO-403 assigned FE; GOO-414 assigned Protocol |
| 30 | 2026-04-05T11:00Z | 57 | 54 | 3 | 94.7% | GOO-414 resolved: stocks 18 tickers + perps 5 pairs live; page titles all unique (GOO-392 deployed) |
| 31 | 2026-04-05T11:15Z | 57 | 55 | 2 | 96.5% | Fix perps/no_broken_prices test (account $0 when no wallet = correct); all perps tests pass |
| 32 | 2026-04-05T11:30Z | 62 | 60 | 2 | 96.8% | +5 tests (perps order book, stocks oracle live, AAPL detail stats, predict markets, governance params) |
| 33 | 2026-04-05T14:30Z | 66 | 63 | 3 | 95.5% | +4 tests (GOO-445 canary, UBI contracts, stable vaults, pool pairs); GOO-472 filed (Vercel analytics 404) |
| 34 | 2026-04-05T15:00Z | 67 | 63 | 4 | 94.0% | +1 test (GOO-472 Vercel canary); GOO-472 fixed in code (f3a477f); GOO-451 confirmed (oracle returns 0) |
| 35 | 2026-04-05T15:15Z | 67 | 61 | 6 | 91.0% | Fix oracle tests — were false-positive passing; now correctly fail for GOO-451 |
| 36 | 2026-04-05T15:30Z | 67 | 61 | 6 | 91.0% | No change — oracle/deploy pipeline still stuck |
| 37 | 2026-04-05T15:45Z | 69 | 61 | 8 | 88.4% | +2 tests (bridge token selector ✅, lend mock disclaimer ✅); canary failures expected |

## Current Failures (Run 37)

| Page | Check | Status | Root Cause | Ticket |
|------|-------|--------|------------|--------|
| stocks | live_prices_from_oracle | 🔴 HIGH | 48 RPC calls all return 0 — oracle not seeded; page shows hardcoded fallback prices | [GOO-451](/GOO/issues/GOO-451) |
| stocks | oracle_rpc_nonzero | 🔴 HIGH | All RPC responses zero — setManualPrice() not called against correct oracle | [GOO-451](/GOO/issues/GOO-451) |
| stocks | disclaimer_updated_goo445 | ✅ PASS | Deployed — "sourced from on-chain oracle" copy live | [GOO-445](/GOO/issues/GOO-445) |
| infra | no_vercel_analytics_404 | ✅ PASS | Deployed — no Vercel 404s detected | [GOO-472](/GOO/issues/GOO-472) |
| infra | walletconnect_project_id | 🔴 HIGH | Code fixed (2df9cd2) but env var NEXT_PUBLIC_WC_PROJECT_ID not set | [GOO-403](/GOO/issues/GOO-403) |
| explorer/address | transactions_visible | Known bug | Blockscout infra issue | [GOO-193](/GOO/issues/GOO-193) |

> **Key finding Run 37:** +2 new tests added — bridge token selector (6/6 tokens ETH/USDC/USDT/DAI/WETH/WBTC ✅) and lend mock-data disclaimer ✅. GOO-445 and GOO-472 now passing — those fixes deployed. GOO-451 (oracle seeding) and GOO-403 (WalletConnect env var) remain open.

> **GOO-276 fully resolved.** **GOO-392 fully resolved.** **GOO-472 deployed** (f3a477f). **GOO-445 deployed** (862d5f6).

**GOO-236 resolved** (ubi-impact now deploys correctly).  
**GOO-232 resolved** (rpc.goodclaw.org now in connect-src).  
**GOO-233 fully resolved** (all chunks now 200, JS+CSS OK).  
**GOO-276 newly filed** (CRITICAL) — script-src blocks RSC inline scripts, React hydration fails, 0 RPC calls made.

## 🚨 NEW: GOO-219 — Tailwind Utility CSS Missing

**Root cause confirmed via CSS inspection:**

Deployed CSS files on goodswap.goodclaw.org:
- `edbafff9265fa3e8.css` (5KB) — Tailwind base reset + CSS vars ONLY
- `dd4e55cdc5ced9d2.css` (30KB) — RainbowKit component styles ONLY

**MISSING:** Tailwind utility classes (`.hidden`, `.flex`, `.sm:flex`, `.grid`, `.text-white`, `.p-4`, etc.)

**Playwright verification:**
- `<div class="hidden">` → `computedStyle.display = "block"` (should be `"none"`)
- `<nav class="hidden sm:flex">` → `computedDisplay: "block"` at 375px
- No `@media` breakpoints in either deployed CSS file (except RainbowKit's 768px)

**Impact:** 
- Responsive design broken (desktop nav shows on mobile = 99px scroll)
- All Tailwind responsive patterns fail (`sm:`, `md:`, `lg:` prefixes)
- Layout utilities possibly compromised (flex/grid/spacing)

**Fix:** Rebuild frontend ensuring `@tailwind utilities` output is included. Check `postcss.config.js` for missing tailwind plugin, or verify content scanning in `tailwind.config.ts` covers all source files.

**Likely cause:** The redeployment that fixed GOO-209 did not include Tailwind utilities in the CSS build. Possible `npm run build` ran without proper tailwind config, or CSS was partially replaced.

## Key Bugs Filed This Session

| Ticket | Title | Status | Priority |
|--------|-------|--------|----------|
| [GOO-209](/GOO/issues/GOO-209) | JS/CSS chunks 404 (stale deploy) | **done** | critical |
| [GOO-202](/GOO/issues/GOO-202) | Lend mock data no disclaimer | **done** | medium |
| [GOO-219](/GOO/issues/GOO-219) | Tailwind utilities missing from deploy | done | high |
| [GOO-232](/GOO/issues/GOO-232) | **CSP connect-src missing rpc.goodclaw.org** | backlog → FE | high |
| [GOO-233](/GOO/issues/GOO-233) | 6 App Router chunks 400 (incomplete deploy) | done | high |
| [GOO-236](/GOO/issues/GOO-236) | /ubi-impact route 404 (GOO-227 missing from build) | done | medium |
| [GOO-276](/GOO/issues/GOO-276) | **CSP script-src missing unsafe-inline — React hydration fails** | backlog → FE | critical |

## All Bugs History

| Ticket | Title | Status |
|--------|-------|--------|
| [GOO-179](/GOO/issues/GOO-179) | Home page error element (false positive) | done |
| [GOO-180](/GOO/issues/GOO-180) | Explorer SSR root cause analysis | done |
| [GOO-181](/GOO/issues/GOO-181) | Mobile scroll (hero glow div) | done |
| [GOO-192](/GOO/issues/GOO-192) | Mobile scroll dev task | done |
| [GOO-193](/GOO/issues/GOO-193) | Explorer SSR pre-fetch | blocked (Blockscout) |
| [GOO-194](/GOO/issues/GOO-194) | Explorer "Something went wrong" | blocked (Blockscout) |
| [GOO-202](/GOO/issues/GOO-202) | Lend mock data disclaimer | done |
| [GOO-203](/GOO/issues/GOO-203) | PriceOracle not seeded | done |
| [GOO-209](/GOO/issues/GOO-209) | JS/CSS chunks 404 (stale deploy) | done |
| [GOO-219](/GOO/issues/GOO-219) | Tailwind utilities missing | done |
| [GOO-232](/GOO/issues/GOO-232) | CSP connect-src missing rpc.goodclaw.org | **done** |
| [GOO-233](/GOO/issues/GOO-233) | 6 App Router chunks 400 (incomplete deploy) | **done** |
| [GOO-236](/GOO/issues/GOO-236) | /ubi-impact route 404 (GOO-227 missing from build) | **done** |
| [GOO-276](/GOO/issues/GOO-276) | **CSP script-src missing unsafe-inline — React hydration fails** | backlog |

## 🚨 NEW: GOO-232 — CSP connect-src Missing rpc.goodclaw.org

**Root cause confirmed via check_csp.js on 2026-04-04:**

Live `connect-src` directive on goodswap.goodclaw.org:
```
connect-src 'self' https://*.alchemyapi.io https://*.g.alchemy.com wss://*.alchemyapi.io
  wss://*.g.alchemy.com https://api.coingecko.com https://*.infura.io wss://*.infura.io
  https://api.walletconnect.com wss://*.walletconnect.com https://explorer-api.walletconnect.com
  https://rpc.gooddollar.org https://clapi.gooddollar.org
```

`rpc.gooddollar.org` (production domain) is listed. `rpc.goodclaw.org` (devnet) is **NOT listed**.

**Impact:**
- Browser silently blocks ALL `fetch()` calls to `https://rpc.goodclaw.org`
- wagmi `useReadContracts` makes 0 RPC calls — stocks page shows empty
- Perps, lend, any on-chain data page will also be empty
- CSP violations visible in console: `pulse.walletconnect.org`, `api.web3modal.org` also blocked

**Confirmed by:**
- `stocks_errors.js`: only 1 network request (HTML page), 0 RPC calls
- `stocks_live_check.js`: `rpcCalls: 0`, `hasTickerSymbols: false`, `hasDollarPrices: false`
- `check_csp.js`: `Allows rpc.goodclaw.org: false`

**Fix:** Add `https://rpc.goodclaw.org` and `wss://rpc.goodclaw.org` to `connect-src` in `next.config.js` headers section.

## On-Chain Verification

- Chain 42069, block ~26036
- All 6 contracts deployed
- StocksPriceOracle: 12 tickers live (AAPL $178.72 ... AMD $162.35)
- `rpc.goodclaw.org` = `localhost:8545` (same chain)

## Test Coverage (44 tests — full route coverage + 2 canary tests)

| Category | Tests | Passing | Notes |
|----------|-------|---------|-------|
| Homepage | 3 | 3 | |
| Navigation | 1 | 1 | |
| Stocks | 3 | 3 | Empty state (oracle ok, wagmi reads blocked by CSP — GOO-232) |
| Predict | 1 | 1 | |
| Perps | 2 | 2 | |
| Bridge | 2 | 2 | |
| Pool | 2 | 2 | |
| Explore | 1 | 1 | |
| Lend | 1 | 1 | Disclaimer added |
| Stable | 1 | 1 | |
| No-wallet state | 2 | 2 | |
| Activity | 1 | 1 | Loads (RPC calls blocked by CSP GOO-232) |
| Governance | 1 | 1 | Loads (on-chain data blocked by CSP GOO-232) |
| UBI Impact | 1 | 1 | GOO-236 fixed — now deployed |
| Portfolio | 1 | 1 | Loads |
| Agent Leaderboard | 1 | 0 | GOO-233: page chunk 404, agents feature not fully deployed |
| Agent Register | 1 | 0 | GOO-233: layout chunk 404 |
| Yield | 1 | 0 | GOO-233: page chunk 404, yield feature not deployed |
| Explorer home | 1 | 1 | Fixed (load vs networkidle) |
| Explorer address | 2 | 1 | 1 fails GOO-193/194 |
| Mobile responsive | 1 | 0 | GOO-233 (3 chunks 404) |
| Infra (JS+CSS) | 1 | 1 | GOO-233 resolved |
| Infra (CSP hydration) | 1 | 0 | GOO-276: script-src blocks RSC inline scripts |
| Perps Leaderboard | 1 | 1 | |
| Perps Portfolio | 1 | 1 | |
| Governance Analytics | 1 | 1 | |
| Stocks Portfolio | 1 | 1 | |
| Predict Create | 1 | 1 | |
| Stocks Detail (AAPL) | 1 | 1 | Dynamic route works |
| Predict Portfolio | 1 | 1 | |
| Agent Detail ([address]) | 1 | 1 | Dynamic route works |
| Explore Token Detail (ETH) | 1 | 1 | Dynamic route works |
| Stocks (live prices canary) | 1 | 0 | CANARY: will pass once GOO-276 fixed |
| Activity (live block# canary) | 1 | 0 | CANARY: will pass once GOO-276 fixed |
