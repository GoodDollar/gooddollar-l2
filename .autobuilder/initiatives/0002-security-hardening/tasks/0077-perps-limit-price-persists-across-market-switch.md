---
id: gooddollar-l2-perps-limit-price-persists-across-market-switch
title: "Perps — Limit/Trigger/TP/SL Prices From Previous Market Persist When Switching Pairs, Enabling Accidental Wrong-Price Orders"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P1
labels: [frontend, perps, production-readiness, financial-safety, state-leak, bug]
---

# Perps — Limit/Trigger/TP/SL Prices From Previous Market Persist When Switching Pairs

> Scope note: This is a production-readiness bug with real financial-safety
> implications (the kind of UX trap that can cost a user money in a single
> click), filed under the Phase 1 initiative per its "verify every protocol
> works" objective. It is in-scope as a frontend defect that blocks the
> "Integration Testing — Real On-Chain Transactions" criterion: if a user
> can fat-finger the wrong market at a stale price, the integration test
> story is incomplete. Priority P1, not P0, because `forge test` and
> `slither` are unaffected and the bug requires the user to switch markets
> mid-compose.

## Problem statement

Reproduction (observed on `/perps` in iteration #36, ETH → SOL switch):

1. Land on `/perps`, ETH-USD selected, mark price $1,820.00.
2. Click **Limit** order type. The limit price field appears empty with
   placeholder `$1,820.00`.
3. Type `1900` into the limit price field. The field shows `1900`. The
   nearby TP/SL placeholders update to `Below $1,900.00` / `Above $1,900.00`
   based on this user-entered limit price.
4. Click **SOL-USD** in the `PairSelector`. The market header, mark price,
   chart, max-leverage, and pair-info bar all update correctly to SOL.
5. **BUG:** The limit price input still shows `1900`. The SOL placeholder
   `$134.50` is hidden behind the stale value. The TP/SL placeholders still
   read `Below $1,900.00` / `Above $1,900.00` — relative to the ETH limit
   price, not SOL's market price.
6. If the user now clicks **Buy / Long**, they submit a SOL-USD limit order
   at $1,900 — ~14× SOL's actual price. On a real DEX with a deep enough
   order book or with a poorly-tuned cross-book router, this is a
   user-funded gift to whoever's resting an ask.

Same state-leak applies to:

- `triggerPrice` (Stop-Limit mode)
- `tp` (Take Profit)
- `sl` (Stop Loss)

These four fields are all per-market quantities, but the component holds
them in `useState` and never resets them when the pair changes.

## Root cause

`frontend/src/app/(app)/perps/page.tsx`:

- Line 200: `function OrderForm({ pair, account, marketId }: ...)`
- Lines 204–212: `useState` for `limitPrice`, `triggerPrice`, `tp`, `sl`,
  `size`, `leverage`, `marginMode`, etc.
- Line 597 area: parent `PerpsPage` renders `<OrderForm pair={pair} ... />`
  **without** a `key={pair.symbol}` prop and **without** any `useEffect` in
  `OrderForm` that watches `pair.symbol`.

So when the parent's `selectedSymbol` flips ETH→SOL, React updates the
`pair` prop in place; the component does not unmount, and all internal
state persists. This is a textbook stale-state-on-prop-change bug. The
`useEffect` at line 216 only clamps `leverage` to `pair.maxLeverage`; it
does nothing about prices.

## Proposed fix

Add a single `useEffect` inside `OrderForm` that resets the four
market-relative price strings whenever `pair.symbol` changes:

```ts
useEffect(() => {
  setLimitPrice('')
  setTriggerPrice('')
  setTp('')
  setSl('')
  // intentionally keep: size, side, orderType, leverage, marginMode,
  // showTpSl, showAdvanced — these are user preferences, not prices.
}, [pair.symbol])
```

Rationale for the partial reset:

- **Prices (limit, trigger, tp, sl)** are denominated against the selected
  market and have no meaning across pairs → MUST reset.
- **Size** is in base units of the pair (e.g. "0.05 BTC" → "0.05 SOL"),
  which is a different asset, so resetting is also defensible — however,
  this PR keeps `size` unchanged to match the existing UX where users
  often want to keep "small / medium / large" intent across markets. The
  existing `exceedsMargin`/`maxSize` checks already guard against
  oversize-after-switch submissions; this is a deliberate scope keep.
- **Side / orderType / leverage / marginMode** are clearly preferences,
  not market-bound, and must be preserved.

Do NOT use `key={pair.symbol}` on the `<OrderForm>` instance in the parent
as the fix. That would also reset `submitted`, `showTpSl`, `showAdvanced`,
and tear down `useWalletReady` / `useOpenPosition` subscriptions on every
switch, which is wasteful and would re-trigger any in-flight wallet
phase. A targeted `useEffect` on `pair.symbol` is the minimal surgical
change.

## Acceptance criteria

1. After typing a limit price for ETH-USD and switching to SOL-USD, the
   limit-price input is empty and shows the SOL placeholder.
2. Same for trigger price (in Stop-Limit mode).
3. Same for Take Profit and Stop Loss (with the TP/SL panel expanded).
4. Switching markets does NOT reset: `side`, `orderType`, `leverage`,
   `marginMode`, `size`, `showTpSl`, `showAdvanced`.
5. A new unit/integration test in
   `frontend/__tests__/perps-page.test.tsx` (or equivalent location)
   verifies the reset-on-symbol-change behaviour by rendering `OrderForm`
   with `pair.symbol="BTC-USD"`, setting limit price to `100000`,
   re-rendering with `pair.symbol="SOL-USD"`, and asserting the limit
   input is empty.
6. `react-doctor` score ≥ 75 on the modified file.
7. No regressions in existing perps tests (`npm test -- perps`).

## Out of scope

- The independent (also-observed) bug where the size input silently
  strips a leading `-` with no user feedback. That's a separate UX bug
  (P3) and can be filed in a future iteration.
- The independent (also-observed) cosmetic bug where TP/SL placeholders
  read `$0.000000` in Limit mode when no limit price is entered yet —
  this is fixed implicitly by the reset effect (the placeholder will be
  the new market's mark price once the user re-engages, same as today).
- Any change to `formatPerpsPrice` or other formatters.
- Any change to on-chain `openPosition` logic.

## Test plan

Manual:

```
1. Start frontend, open /perps
2. ETH-USD → Limit → type 1900 → see "1900" in input
3. Click SOL-USD → input should be empty, placeholder "$134.50" visible
4. Click ETH-USD → input should still be empty (no resurrection of "1900")
5. Type 2000 → switch to BTC-USD → input empty, BTC placeholder visible
6. Repeat for Stop-Limit (trigger price) and TP/SL panel
7. Verify: side stays Long/Short, orderType stays Limit, leverage stays
   wherever the user set it, size stays as typed
```

Automated:

```
npm test -- perps
forge test --match-path '*PerpEngine*' -vv   # smoke; no contract change
```
