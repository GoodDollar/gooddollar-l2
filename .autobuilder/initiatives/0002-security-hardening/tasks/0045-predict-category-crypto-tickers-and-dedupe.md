---
id: gooddollar-l2-predict-category-crypto-tickers-and-dedupe
title: "Predict — Fix Bitcoin Market Miscategorization (BTC/ETH Tickers) and Deduplicate inferCategory Across 3 Files"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P1
labels: [frontend, predict, ux-flows, deduplication, data-integrity]
---

# Predict — Fix Bitcoin Market Miscategorization (BTC/ETH Tickers) and Deduplicate inferCategory Across 3 Files

> Note: This task is outside the formal Phase 1 security-hardening scope but is filed per
> the product-review skill: it is a clear, reproducible UX/data-integrity bug observed in
> iteration #20's `ux-flows` walkthrough of the Predict page (a Bitcoin market is rendered
> as "Culture" with a music-note icon).

## Problem statement

Walking through the realistic user journey "user explores prediction markets and looks at
the featured Bitcoin market", the **featured hero** on `/predict` displays a Bitcoin
market labelled with the **Culture** category and a **music-note icon**. This is wrong:
a Bitcoin price market should be `Crypto` with the crypto icon.

Two underlying problems combine to produce this bug:

### 1. `inferCategory()` does not recognize the most common crypto tickers

The function only checks for the **full words** `"bitcoin"` / `"ethereum"`, not for the
**tickers** `"BTC"` / `"ETH"` that frequently appear in market titles (and that the spec's
own example uses: `"Will BTC hit 100K?"`).

Result: any market whose question uses `BTC`, `ETH`, `SOL`, `BNB`, etc. instead of the full
chain name **falls through every branch and lands in the default `Culture` bucket**, which
maps to a music-note icon — clearly nonsensical for a crypto-price question.

### 2. `inferCategory()` is duplicated across **three** files with **inconsistent** keyword lists

Three independent copies exist in the frontend:

| File | Has `'congress'`? | Has `'fifa'/'world cup'`? | Has `'apple'`? | Has `'pandemic'/'who '`? |
|------|------|------|------|------|
| `frontend/src/app/(app)/predict/page.tsx` | yes | yes | yes | yes |
| `frontend/src/app/(app)/predict/[marketId]/page.tsx` | **no** | **no** | **no** | **no** |
| `frontend/src/lib/useOnChainPredict.ts` | yes | yes | yes | yes |

Same input → potentially different category depending on which page rendered it. This is
a classic "three sources of truth" bug that will silently drift further over time, and it
already produces visible inconsistency between the list page and the detail page.

### Where it shows up

- `/predict` featured hero card (`page.tsx`) — `MarketIcon[category]` reads the wrong
  category and renders a `Music` icon for a crypto market.
- Category filter chips at the top of `/predict` — categorize markets into the wrong bucket
  (a BTC market is hidden from `Crypto` filter and shown under `Culture`).
- `/predict/[marketId]` detail page — uses its own divergent copy, so the same market can
  display with a different category than on the list page (drift bug).

## Acceptance criteria

- A market question containing any of `BTC`, `ETH`, `SOL`, `BNB`, `XRP`, `DOGE`, `ADA`,
  `AVAX`, `MATIC` (case-insensitive, **whole word** match — not as a substring of another
  word) is categorized as `Crypto`.
- Existing keyword categorizations (`bitcoin`, `ethereum`, `crypto`, `gooddollar`, `etoro`,
  `election`, `fed `, `regulation`, `legislation`, `congress`, `stablecoin`, `champion`,
  `nba`, `fifa`, `world cup`, `olympic`, `ai `, `agi`, `gpt`, `openai`, `nvidia`, `apple`,
  `agent`, `spacex`, `mars`, `climate`, `pandemic`, `who `) continue to behave identically.
- There is exactly **one** canonical `inferCategory` implementation, exported from
  `frontend/src/lib/predictData.ts`. Both predict pages and `useOnChainPredict.ts` import
  this shared implementation.
- The featured hero on `/predict` for the existing demo market `"Will Bitcoin exceed
  $100,000 by end of 2025?"` shows the **Crypto** badge and the crypto icon (not a music
  note).
- A unit test in `frontend/src/lib/__tests__/predictData.test.ts` (or sibling) covers each
  category branch plus the new ticker keywords.
- All existing predict tests continue to pass (`npm test -- predict`).
- `npx -y react-doctor@latest . --verbose --diff` ≥ 75.

## Planning

### Research notes

**Root cause of the visible bug.** The featured market on `/predict` is selected by
`useMemo` over `allMarkets`, sorting by volume. The current top-volume active market in the
fallback set is `demo-1` (`"Will Bitcoin exceed $100,000 by end of 2025?"`), which already
has `category: 'Crypto'` set explicitly in `FALLBACK_MARKETS`. So why does the hero render
as `Culture`? Because **on-chain markets** (not the FALLBACK seed) carry **no category
field** from the chain — `MarketFactory.getMarket()` only returns the question string, end
date, and resolution data. The hook then re-derives category client-side via
`inferCategory(question)`. The **on-chain demo market** that's currently top-volume in this
devnet was created with question text using ticker `BTC` (per the spec's own example
`createMarket(... "Will BTC hit 100K?")`), which falls through to `'Culture'`.

So fixing `inferCategory` to match `BTC`/`ETH` directly fixes the visible bug, *and* fixes
the consistency between the list and detail pages.

**Why three copies exist.** Looking at git blame would clarify, but the practical effect is
the same regardless of how it happened: three independent copies of category inference
logic. Two of them (`page.tsx` and `useOnChainPredict.ts`) currently agree word-for-word;
the third (`[marketId]/page.tsx`) is a stripped-down older version. Consolidating to one
shared function in `predictData.ts` (which already exports `MarketCategory` and is the
natural home) closes the drift hole permanently.

**Whole-word matching.** Naively `q.includes('eth')` would also match the literal string
"the" or "ethics" etc., causing false positives. The fix uses a regex with word boundaries:
`\b(btc|eth|sol|bnb|xrp|doge|ada|avax|matic)\b`. We do this once at the top of the
function and short-circuit the same way `q.includes('bitcoin')` does today.

**Scope discipline.** This task **only** changes:
- The body of `inferCategory` (add ticker recognition).
- The location of `inferCategory` (move into `predictData.ts`, export, import in 3 callers).
- Add a small unit test.

It does **not** touch UI markup, styling, market data shape, or any contract logic. No
new affordances, no new categories.

### Architecture diagram

```
                Before (3 copies, drift, missing tickers)
┌─────────────────────────────────────────────────────────────────────────┐
│ predict/page.tsx                inferCategory v1  (full lists)          │
│ predict/[marketId]/page.tsx     inferCategory v2  (subset, no tickers)  │
│ lib/useOnChainPredict.ts        inferCategory v3  (full lists)          │
│                                                                          │
│   None of the three recognise BTC, ETH, SOL, etc. as crypto tickers.    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                After (one source of truth, recognises tickers)
┌─────────────────────────────────────────────────────────────────────────┐
│ lib/predictData.ts                                                      │
│   export function inferCategory(question: string): MarketCategory       │
│     ├── crypto:  bitcoin|ethereum|crypto|gooddollar|etoro|etor          │
│     │        OR \b(btc|eth|sol|bnb|xrp|doge|ada|avax|matic)\b   ← NEW  │
│     ├── politics: election|fed |regulation|...                          │
│     └── ...                                                             │
│                       ▲                ▲                ▲                │
│                       │                │                │                │
│   predict/page.tsx ───┘   [marketId]/page.tsx ──┘   useOnChainPredict ──┘
└─────────────────────────────────────────────────────────────────────────┘
```

### One-week decision

**Yes — this fits in well under one week.** It is a tightly scoped frontend-only change:
move one function, extend its keyword list, replace three imports, add one unit test. No
schema, contract, or UI-component changes. Estimated effort: < 1 hour to implement, ~30
minutes to verify with a test and a manual `/predict` walkthrough.

No need to split.

### Implementation plan

1. **Add to `frontend/src/lib/predictData.ts`** (single source of truth):

   ```ts
   // Whole-word ticker regex — \b ensures we match 'BTC' but not 'BTCusd' or 'matched'.
   const CRYPTO_TICKER_RE = /\b(btc|eth|sol|bnb|xrp|doge|ada|avax|matic)\b/i

   export function inferCategory(question: string): MarketCategory {
     const q = question.toLowerCase()
     if (
       q.includes('bitcoin') ||
       q.includes('ethereum') ||
       q.includes('crypto') ||
       q.includes('gooddollar') ||
       q.includes('etoro') ||
       q.includes('etor') ||
       CRYPTO_TICKER_RE.test(question)        // ← test against original-case `question` because
                                              //    the regex is /i; this avoids re-lowercasing.
     ) return 'Crypto'
     if (q.includes('election') || q.includes('fed ') || q.includes('regulation') || q.includes('legislation') || q.includes('congress') || q.includes('stablecoin')) return 'Politics'
     if (q.includes('champion') || q.includes('nba') || q.includes('fifa') || q.includes('world cup') || q.includes('olympic')) return 'Sports'
     if (q.includes('ai ') || q.includes('agi') || q.includes('gpt') || q.includes('openai') || q.includes('nvidia') || q.includes('apple') || q.includes('agent')) return 'AI & Tech'
     if (q.includes('spacex') || q.includes('mars') || q.includes('climate') || q.includes('pandemic') || q.includes('who ')) return 'World Events'
     return 'Culture'
   }
   ```

2. **Replace inline copies in three files** with `import { inferCategory } from '@/lib/predictData'`:
   - `frontend/src/app/(app)/predict/page.tsx` — delete the local `function inferCategory`.
   - `frontend/src/app/(app)/predict/[marketId]/page.tsx` — delete the local copy.
   - `frontend/src/lib/useOnChainPredict.ts` — delete the local copy.

3. **Add unit test** `frontend/src/lib/__tests__/predictData.test.ts` (create the
   `__tests__` folder if it doesn't exist; project already uses Vitest/Jest — match the
   existing convention found in the repo):

   ```ts
   import { describe, expect, test } from 'vitest'
   import { inferCategory } from '../predictData'

   describe('inferCategory', () => {
     test('classifies BTC ticker as Crypto', () => {
       expect(inferCategory('Will BTC hit 100K?')).toBe('Crypto')
       expect(inferCategory('btc dominance > 60%?')).toBe('Crypto')
     })
     test('classifies ETH ticker as Crypto', () => {
       expect(inferCategory('ETH ETF inflows over $1B?')).toBe('Crypto')
     })
     test('still classifies bitcoin/ethereum full names as Crypto', () => {
       expect(inferCategory('Will Bitcoin exceed $100,000?')).toBe('Crypto')
       expect(inferCategory('Ethereum upgrade by Q3?')).toBe('Crypto')
     })
     test('does not match BTC inside another word', () => {
       expect(inferCategory('Will the wretched system survive?')).toBe('Culture')
     })
     test('classifies politics keywords', () => {
       expect(inferCategory('Will Congress pass stablecoin bill?')).toBe('Politics')
     })
     test('falls back to Culture for unmatched questions', () => {
       expect(inferCategory('Will Beyoncé tour Europe?')).toBe('Culture')
     })
   })
   ```

4. **Verify**:
   - `cd frontend && npm test -- predictData` → new tests pass.
   - `cd frontend && npm test` → no regressions.
   - Visit `/predict` in dev mode and confirm the Bitcoin market hero shows `Crypto` badge.
   - `npx -y react-doctor@latest . --verbose --diff` ≥ 75.

5. **Update `README.md`** per the initiative's mandatory README rule:
   - Bump commit count.
   - Update `Updated:` date.

6. **Commit** with message:
   `predict: dedupe inferCategory + match BTC/ETH/SOL tickers (fix featured hero category)`.

### Risks / mitigations

- **Risk:** Importing a non-`'use client'` function into a `'use client'` file. **Mitigation:**
  `predictData.ts` already exports types/data consumed by both server and client components,
  and `inferCategory` is pure. No `'use client'` directive needed on the function itself.
- **Risk:** Whole-word regex causes a false positive (e.g., a question containing "ETH" as
  part of a brand). **Mitigation:** `\b` boundaries prevent substring matches; ticker list
  is intentionally short and limited to top-9 well-known symbols. New tickers can be added
  later behind the same well-tested function.
- **Risk:** Tree-shake / circular import between `predictData.ts` and `useOnChainPredict.ts`.
  **Mitigation:** `useOnChainPredict.ts` already imports types from `predictData.ts`; adding
  a function import is in the same direction and creates no cycle.
- **Risk:** Existing `[marketId]/page.tsx` had a *different* (smaller) keyword list, so
  consolidating to the bigger list might recategorize edge-case markets on the detail page.
  **Mitigation:** This is the *desired* outcome (a market should not change category just
  because you click into it). The unit tests freeze the canonical behavior.
