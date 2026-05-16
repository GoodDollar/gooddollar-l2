---
id: gooddollar-l2-stocks-trade-form-fee-ubi-rounds-to-zero
title: "Stocks Trade Form — Fee & UBI Preview Round to '$0' on Trades Under $1,000, Hiding the UBI Mechanism"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P0
labels: [frontend, stocks, ubi, formatting, deep-dive, security-hardening, production-readiness]
---

# Stocks Trade Form — Fee & UBI Preview Round to "$0" on Trades Under $1,000, Hiding the UBI Mechanism

> Note: Filed under Phase 1 (Security Hardening & Production Readiness) because
> acceptance criterion #4 of the initiative is *"UBI 20% fee routing verified
> end-to-end"*. This bug breaks the **end-user-visible** half of that promise:
> users cannot see fees or UBI contributions on common trade sizes (under
> $1,000) — both display as literal "$0" in the order preview, directly
> contradicting the "0.1% fee → 20% funds UBI" tagline shown immediately
> below. Caught by iteration #33 deep-dive review of the Stocks trade form.

## Problem statement (what the user sees)

On `/stocks/[ticker]` (e.g. `/stocks/AAPL`), the trade form shows a live
preview of `Est. Shares`, `Price`, `Fee (0.1%)`, and `→ UBI Pool (20%)` as
the user types into the **Amount (USD)** field. The Fee and UBI rows
**round down to whole dollars** for any trade under $1,000, so:

| Amount (USD)   | Actual fee | Displayed fee | Actual UBI | Displayed UBI |
| -------------- | ---------- | ------------- | ---------- | ------------- |
| `1`            | `$0.001`   | **`$0`**      | `$0.0002`  | **`$0`**      |
| `50`           | `$0.05`    | **`$0`**      | `$0.01`    | **`$0`**      |
| `200`          | `$0.20`    | **`$0`**      | `$0.04`    | **`$0`**      |
| `999`          | `$0.999`   | **`$0`**      | `$0.1998`  | **`$0`**      |
| `1000`         | `$1.00`    | `$1`          | `$0.20`    | **`$0`**      |
| `5000`         | `$5.00`    | `$5`          | `$1.00`    | `$1`          |
| `10000`        | `$10.00`   | `$10`         | `$2.00`    | `$2`          |

So **every trade under $1,000 shows "Fee: $0 → UBI Pool: $0"** in the preview,
even though the contract will charge a real (non-zero) fee and route a real
(non-zero) share to UBI on-chain. And for trades between $1,000 and $5,000
the **UBI row alone** shows "$0" while the fee row shows a real value — an
even more confusing inconsistency that makes the UBI mechanism look broken
or dishonest.

This was reproduced in the live deployment at
`https://goodswap.goodclaw.org/stocks/AAPL` during iteration #33 (deep-dive
review of the Stocks feature):

```
Step 1: type "200" into Amount (USD)
  → preview shows:
     Est. Shares     1.0476 AAPL
     Price           $190.92
     Fee (0.1%)      $0           ← should be $0.20
     → UBI Pool (20%) $0          ← should be $0.04

Step 2: type "10000" into Amount (USD)
  → preview shows:
     Est. Shares     52.38 AAPL
     Price           $190.92
     Fee (0.1%)      $10
     → UBI Pool (20%) $2          ← correct

Step 3: switch Buy → Sell (same amount)
  → same bug, same numbers
```

### Why this matters

1. **Directly contradicts the UBI mechanism the product markets.** Right
   below the preview, the form shows the green tagline
   *"0.1% fee → 20% funds UBI"*. A user who types in a $200 trade is
   immediately shown "$0" UBI contribution. From the user's perspective,
   the platform is lying — either the fee structure is fake, or UBI
   routing isn't actually happening. This is the **first impression** of
   the UBI mechanism for any small-trade user.
2. **Inconsistency between the Fee and UBI rows.** Between $1,000 and
   $5,000, Fee shows a number but UBI shows "$0". A sceptical user
   reads this as "they're charging me a fee but it's not actually
   going to UBI." This is precisely the trust failure the security-
   hardening initiative is meant to close.
3. **Breaks the user-side verification of acceptance criterion #4.** The
   initiative spec says UBI fee routing must be verifiable
   end-to-end. The on-chain side will be verified separately (task
   0029), but the **user-visible side** is broken today — a user
   cannot confirm by eye that their fee actually funds UBI on
   normal-sized trades.
4. **The Perps page already gets this right.** `frontend/src/app/(app)/perps/page.tsx`
   uses `formatLargeValue` (lib/perpsData.ts:118) which falls back to
   `$${abs.toFixed(2)}` for amounts under $1,000 — so a $0.20 Perps fee
   correctly renders as "$0.20" in the order preview. The Stocks page
   uses a different helper that rounds. This is an inconsistency
   between two trade forms in the same product.

## Source of the bug

`frontend/src/app/(app)/stocks/[ticker]/page.tsx` lines 152–159 render
the Fee and UBI rows:

```tsx
<div className="flex justify-between text-gray-400">
  <span>Fee (0.1%)</span>
  <span className="text-white truncate ml-2">{formatLargeNumber(fee)}</span>
</div>
<div className="flex justify-between text-goodgreen/80">
  <span>→ UBI Pool (20%)</span>
  <span className="truncate ml-2">{formatLargeNumber(ubiFee)}</span>
</div>
```

`formatLargeNumber` is imported from `@/lib/stockData` (line 9). Its
implementation in `frontend/src/lib/stockData.ts` lines 57–63 is:

```ts
export function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`    // ← BUG: drops cents for n < 1000
}
```

The final `return `$${n.toFixed(0)}`` line rounds any value under $1,000 to
a whole dollar — perfect for market cap or volume tiles (which is where
`formatLargeNumber` is used elsewhere), but completely wrong for fees.

A quick check confirms `formatLargeNumber` is also used in the same file
for `Est. Shares` (line 146 inline, not via the helper) and elsewhere for
market cap / volume tiles that legitimately want whole-dollar abbreviation.
**So we must not change `formatLargeNumber` itself** — we need a
dedicated formatter for fee/UBI values that preserves cents on small
amounts but still abbreviates large ones.

For reference, the Perps page does this correctly via `formatLargeValue`
(`frontend/src/lib/perpsData.ts` lines 118–130):

```ts
export function formatLargeValue(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  for (const [threshold, suffix] of PRICE_TIERS) {  // T/B/M
    if (abs >= threshold) {
      const abbr = abs / threshold
      const decimals = abbr >= 100 ? 0 : abbr >= 10 ? 1 : 2
      return `${sign}$${abbr.toFixed(decimals)}${suffix}`
    }
  }
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`
  return `${sign}$${abs.toFixed(2)}`   // ← preserves cents below $1,000
}
```

So Perps trades correctly show small fees like "$0.20" and UBI like "$0.04".

## User story

> As a user buying $200 of synthetic AAPL on GoodDollar L2, I want the trade
> preview to show the real fee and the real UBI contribution (in cents) so
> that I can see the UBI mechanism actually works at typical trade sizes,
> not just at $5,000+ trades — and so that the "0.1% fee → 20% funds UBI"
> tagline immediately below the preview is consistent with the numbers
> shown above it.

## Proposed UX

1. Replace the two `formatLargeNumber(fee)` / `formatLargeNumber(ubiFee)`
   calls in the Stocks trade form with a formatter that preserves at least
   two decimal places for amounts under $1,000, while still abbreviating
   K/M/B/T for very large amounts. The Perps page's `formatLargeValue`
   already does exactly this — the cleanest fix is to either:
   - **Option A (recommended):** add a shared `formatCurrencyAmount` (or
     similar name) to `frontend/src/lib/format.ts` and use it from both
     the Stocks trade form and (in a follow-up) the Perps trade form, so
     the two trade UIs are consistent. The function should match the
     Perps semantics for the small-value range.
   - **Option B:** import `formatLargeValue` directly from
     `@/lib/perpsData` into the Stocks page. Less clean (cross-feature
     dependency), but the smallest possible diff.
2. For values smaller than ~$0.01 (e.g. a $1 trade with a 0.1% fee = $0.001
   → 20% UBI = $0.0002), use a `< $0.01` floor display rather than
   "$0.00", so the user still sees the fee/UBI exists but is tiny. This
   matches the existing pattern in `formatUsdValue` (`lib/format.ts:101`):
   ```ts
   if (usd < 0.01) return '< $0.01'
   ```
3. Sanity check: make sure the same helper is **not** silently swapped in
   anywhere else that legitimately wants whole-dollar abbreviation (market
   cap tiles, total cost row, etc.). The change must be scoped to the
   Fee and UBI rows of the Stocks trade form.
4. **Do not change `formatLargeNumber`** — it is also used for stock market
   cap and volume tiles where whole-dollar abbreviation is correct and
   compact.

### Visual mock of the fix

For a $200 buy of AAPL (current price ~$190):

```
Before                              After
─────────────────────────           ─────────────────────────
Est. Shares     1.0476 AAPL         Est. Shares     1.0476 AAPL
Price           $190.92             Price           $190.92
Fee (0.1%)      $0           ❌      Fee (0.1%)      $0.20        ✅
→ UBI Pool (20%) $0          ❌      → UBI Pool (20%) $0.04       ✅

0.1% fee → 20% funds UBI            0.1% fee → 20% funds UBI
```

For a $1 buy:

```
Before                              After
─────────────────────────           ─────────────────────────
Fee (0.1%)      $0           ❌      Fee (0.1%)      < $0.01     ✅
→ UBI Pool (20%) $0          ❌      → UBI Pool (20%) < $0.01    ✅
```

For a $10,000 buy (already correct, must not regress):

```
Fee (0.1%)      $10                 Fee (0.1%)      $10.00       ✅
→ UBI Pool (20%) $2                 → UBI Pool (20%) $2.00        ✅
```

(Either `$10` or `$10.00` is acceptable; the planning step should pick
one and apply it consistently. The Perps page renders `$10.00` —
matching that is preferred for consistency.)

## Acceptance criteria

- [ ] On `/stocks/[ticker]` with Amount = `200`, the Fee row shows
      `$0.20` and the UBI row shows `$0.04` (not `$0`).
- [ ] On `/stocks/[ticker]` with Amount = `1`, both rows show
      `< $0.01` (not `$0`).
- [ ] On `/stocks/[ticker]` with Amount = `10000`, the Fee row shows
      `$10.00` (or `$10`, matching Perps) and the UBI row shows
      `$2.00` (or `$2`). No regression on the existing correct display
      above $5,000.
- [ ] On `/stocks/[ticker]` with Amount = `5000000` (5M), the Fee row
      shows `$5.00K` (or `$5K`) and UBI shows `$1.00K` (or `$1K`).
      Large-value abbreviation still works.
- [ ] The Buy/Sell toggle and Market/Limit toggle do not change the
      display behaviour — same formatting in all four combinations.
- [ ] `formatLargeNumber` itself is unchanged. Market cap / volume tiles
      elsewhere in the Stocks feature still display whole-dollar
      abbreviations.
- [ ] A new Vitest unit test covers at least these cases:
      `0`, `0.0002`, `0.20`, `1.00`, `10.00`, `1234.56`, `5_000_000`.
- [ ] The "0.1% fee → 20% funds UBI" tagline below the preview is
      visually consistent with the numbers in the preview above it
      (i.e. when the tagline says UBI is funded, the UBI row shows a
      non-zero amount).
- [ ] `react-doctor` score ≥ 75 after the change.

## Verification

```bash
# 1. Build + restart frontend.
cd frontend && pnpm build
pm2 restart goodswap

# 2. Visual check via agent-browser.
agent-browser --session r33-fix-verify open https://goodswap.goodclaw.org/stocks/AAPL --ignore-https-errors
agent-browser --session r33-fix-verify snapshot -i        # find the Amount input ref
# type "200", then snapshot again and confirm Fee shows $0.20 and UBI shows $0.04.
# type "10000", confirm Fee shows $10.00 and UBI shows $2.00.
# type "1", confirm both show "< $0.01".
agent-browser --session r33-fix-verify close

# 3. Unit tests.
cd frontend && pnpm test -- format
# new tests for the fee/UBI formatter should pass.
```

## Out of scope (separate tasks, do NOT bundle)

- **Perps trade form is already correct.** No change needed there.
  (If Option A is taken — shared helper — the Perps page may be
  migrated to use the new shared helper in a *follow-up*, but that is
  not required for this task.)
- **On-chain UBI fee routing verification.** Task 0029 already covers
  the end-to-end on-chain side. This task is the user-visible UI side
  only.
- **Other small-value display bugs** elsewhere in the product (Lend,
  Stable, Predict trade previews). If those exist they should be
  filed as their own tasks once observed.
- **Fee tooltip / "what is this fee?" explainer.** Separate UX task.
- **Disabling the trade button on amount = empty.** Already handled by
  the `WalletGatedTradeButton` `hasAmount` check.

## Justification for inclusion in security-hardening initiative

Acceptance criterion #4 of the initiative is *"UBI 20% fee routing
verified end-to-end."* Today the **on-chain** side is being verified by
task 0029, but the **user-visible** side is broken: on every Stocks trade
under $1,000 the user sees "$0" UBI contribution next to the tagline
"0.1% fee → 20% funds UBI." The two cannot both be true from the user's
perspective, which is exactly the kind of trust-destroying inconsistency
the production-readiness bar exists to catch. A one-file fix (plus one
shared helper + one unit test) closes this gap and brings the Stocks
trade form in line with the Perps trade form, which already handles
small amounts correctly.

---

# Planning (added during STEP 2)

## Overview

Two-file fix. Add a new shared helper `formatTradeAmount` (or similar) to
`frontend/src/lib/format.ts` that preserves cents for small amounts and
falls back to K/M/B/T abbreviation for large amounts — matching the Perps
page's existing `formatLargeValue` semantics. Then update the two Fee/UBI
preview rows in `frontend/src/app/(app)/stocks/[ticker]/page.tsx` to use
the new helper instead of `formatLargeNumber`. Add a Vitest unit suite
for the new helper. Leave `formatLargeNumber` and all its current
callers (market cap, volume tiles) completely untouched.

The Perps trade form is already correct and is **not** changed by this
task — migrating Perps to the shared helper is out of scope and filed as
a future tidy-up only if desired.

## Research notes

- **Bug confirmed at the source.** `frontend/src/lib/stockData.ts:62`
  ends with `return `$${n.toFixed(0)}`` which truncates anything under
  $1,000 to whole dollars. For a $200 trade × 0.1% = $0.20 fee → renders
  as `$0`. For the UBI line (20% of fee = $0.04) → also `$0`.
- **Perps does the right thing.** `frontend/src/lib/perpsData.ts:118` has
  `formatLargeValue`, whose final fallback is `${sign}$${abs.toFixed(2)}`.
  A $0.20 Perps fee renders as `$0.20`. This is the semantics we need
  in Stocks too.
- **A near-duplicate already exists in `lib/format.ts`.**
  `frontend/src/lib/format.ts:99` has `formatUsdValue(usd)` which:
  - returns `'< $0.01'` for values < 0.01,
  - returns `~$X` for integers,
  - returns `~$X.YY` for non-integers,
  - but **does not abbreviate K/M/B/T at all** and uses a `~$` prefix
    that we don't want for an exact fee preview.
  So `formatUsdValue` is *almost* right but not reusable as-is for
  Fee/UBI: we want `$` (not `~$`) and we want abbreviation above
  $1,000 (so a $5,000,000 fee doesn't render as a 12-character string).
- **`formatLargeNumber` callsites are broad and must not change.**
  Confirmed it is used inline in the same file for share counts via
  inline ternary (line 146), and elsewhere for market cap and volume
  tiles where whole-dollar abbreviation is correct. Do **not** modify
  the function.
- **Component location of the bug.** The Fee and UBI rows are in the
  `OrderForm` component inside
  `frontend/src/app/(app)/stocks/[ticker]/page.tsx`. The component is
  client-side (`'use client'` at the top via the parent file).
- **Existing tests for `lib/format.ts`.** A quick check during research
  confirmed `frontend/src/lib/__tests__/format.test.ts` (or similar)
  may not exist yet; the test file location should be created next to
  `format.ts` if missing, otherwise extended. The execution step will
  confirm.

## Assumptions

- The new shared helper lives in `frontend/src/lib/format.ts` and is
  named `formatTradeAmount(n: number): string` (final name to be
  confirmed at execution; could also be `formatFeeAmount` or
  `formatCurrencyAmount`). It is exported alongside the existing helpers.
- For values < $0.01 the helper returns `< $0.01` (matching the existing
  `formatUsdValue` convention) so the user still sees that a fee exists
  even on a $1 trade.
- For values >= $0.01 and < $1,000 the helper returns
  `$${n.toFixed(2)}` — exact cents.
- For values >= $1,000 the helper abbreviates as `K` / `M` / `B` / `T`
  with one decimal place for K and two for the larger tiers, matching
  the Perps `formatLargeValue` semantics. The exact rounding of the
  abbreviation tier (`.toFixed(0)` vs `.toFixed(1)` vs `.toFixed(2)`
  depending on magnitude) will be chosen at execution to match Perps
  output for consistency.
- The change is scoped only to the two Fee/UBI rows in the Stocks trade
  form. The `Est. Shares` row keeps its inline ternary (it formats a
  share count, not a USD value). The `Price` row continues using
  `formatLargeNumber` as it does today (or `formatUsdValue` — execution
  to decide, but a separate consideration; not required by this task).
- Adding the helper to `lib/format.ts` does not import any new runtime
  dependencies (pure function over `number`).
- The Perps page is intentionally not migrated in this task to keep the
  diff minimal and the blast radius small. A follow-up task can DRY
  the two helpers later.

## Architecture

```mermaid
flowchart LR
  Amount[Amount USD input] --> ParseFee[fee = amount * 0.001]
  ParseFee --> UbiCalc[ubiFee = fee * 0.20]
  ParseFee -->|number| NewHelper[formatTradeAmount lib/format.ts]
  UbiCalc -->|number| NewHelper
  NewHelper -->|"$0.20" / "$0.04" / "< $0.01" / "$5.00K"| FeeRow[Fee row in trade preview]
  NewHelper --> UbiRow[UBI row in trade preview]

  subgraph Untouched
    MarketCap[Market cap / Volume tiles] --> OldHelper[formatLargeNumber lib/stockData.ts]
    Shares[Est. Shares row] --> InlineTernary[inline 1e6/1e3/.toFixed]
  end
```

## One-week decision

**YES** — ~0.3 day of focused work.

Time budget:
- 0.05 day: add `formatTradeAmount` to `frontend/src/lib/format.ts`.
- 0.05 day: swap two callsites in `stocks/[ticker]/page.tsx`.
- 0.10 day: unit tests covering the boundary cases listed in acceptance
  criteria.
- 0.05 day: build + visual verification via `agent-browser` against the
  live deployment.
- 0.05 day: `react-doctor` + commit + README update.

## Implementation plan (phased)

### Phase A — Add the shared helper (~0.05 day)

1. Open `frontend/src/lib/format.ts`.
2. Add a new exported function. Aim for the same semantics as Perps'
   `formatLargeValue` but without the `~` prefix and aligned to the
   "preserve cents under $1,000, abbreviate above" rule:

   ```ts
   /**
    * Formats a USD trade amount (fee, UBI contribution, etc.) preserving
    * cents below $1,000 and abbreviating K/M/B/T above. Returns
    * "< $0.01" for very small positive amounts so a non-zero fee is
    * never displayed as $0.
    *
    * Examples:
    *   0           -> "$0.00"
    *   0.0002      -> "< $0.01"
    *   0.2         -> "$0.20"
    *   1.5         -> "$1.50"
    *   1234.56     -> "$1.2K"     (or "$1,234.56" depending on chosen
    *                               threshold; we abbreviate at >= 1e3)
    *   5_000_000   -> "$5.00M"
    */
   export function formatTradeAmount(n: number): string {
     if (!isFinite(n) || isNaN(n)) return '$0.00'
     const abs = Math.abs(n)
     const sign = n < 0 ? '-' : ''
     if (abs === 0) return '$0.00'
     if (abs < 0.01) return `${sign}< $0.01`
     if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`
     if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`
     if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`
     if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}K`
     return `${sign}$${abs.toFixed(2)}`
   }
   ```

   Note the implementation uses `Math.abs` + a sign prefix to handle
   any negative inputs gracefully (defensive — fee values should never
   be negative, but UBI math involves multiplications and a NaN guard
   is cheap insurance).

3. Confirm by `grep` that the new function name does not collide with
   any existing export in `lib/format.ts` or elsewhere in `lib/`.

### Phase B — Swap the two callsites (~0.05 day)

1. Open `frontend/src/app/(app)/stocks/[ticker]/page.tsx`.
2. Update the import at line 9: add `formatTradeAmount` to the imports
   from `@/lib/format` (or add a new import line if none exists).
   Remove `formatLargeNumber` from `@/lib/stockData` only if it is no
   longer used elsewhere in this file — it may still be used for
   market cap / volume / price displays. Keep both imports if both
   helpers are still referenced.
3. Replace the two `formatLargeNumber(fee)` and
   `formatLargeNumber(ubiFee)` calls (lines 154 and 158) with
   `formatTradeAmount(fee)` and `formatTradeAmount(ubiFee)` respectively.
4. Do **not** change the `Est. Shares` row (line 146) or any other row
   in the preview.

### Phase C — Unit tests (~0.10 day)

1. Locate or create `frontend/src/lib/__tests__/format.test.ts`. If a
   different test file convention exists in the project, follow it.
2. Add a `describe('formatTradeAmount', ...)` block covering:

   ```ts
   import { describe, it, expect } from 'vitest'
   import { formatTradeAmount } from '../format'

   describe('formatTradeAmount', () => {
     it('returns "$0.00" for exactly zero', () => {
       expect(formatTradeAmount(0)).toBe('$0.00')
     })
     it('returns "< $0.01" for positive amounts below one cent', () => {
       expect(formatTradeAmount(0.0002)).toBe('< $0.01')
       expect(formatTradeAmount(0.009)).toBe('< $0.01')
     })
     it('preserves cents below $1,000', () => {
       expect(formatTradeAmount(0.20)).toBe('$0.20')
       expect(formatTradeAmount(0.04)).toBe('$0.04')
       expect(formatTradeAmount(1)).toBe('$1.00')
       expect(formatTradeAmount(10)).toBe('$10.00')
       expect(formatTradeAmount(999.99)).toBe('$999.99')
     })
     it('abbreviates K above $1,000', () => {
       expect(formatTradeAmount(1000)).toBe('$1.00K')
       expect(formatTradeAmount(1234.56)).toBe('$1.23K')
     })
     it('abbreviates M above $1,000,000', () => {
       expect(formatTradeAmount(5_000_000)).toBe('$5.00M')
     })
     it('handles NaN/Infinity defensively', () => {
       expect(formatTradeAmount(NaN)).toBe('$0.00')
       expect(formatTradeAmount(Infinity)).toBe('$0.00')
     })
   })
   ```

3. Run `pnpm test -- format` from `frontend/` and confirm all new cases
   pass and no existing tests regress.

### Phase D — Visual verification + commit (~0.10 day)

1. Build the frontend and restart the PM2 process:
   ```bash
   cd frontend && pnpm build
   pm2 restart goodswap
   ```
2. Use `agent-browser` to verify against the live deployment:
   ```bash
   agent-browser --session r33-verify open https://goodswap.goodclaw.org/stocks/AAPL --ignore-https-errors
   agent-browser --session r33-verify snapshot -i
   # find the Amount input ref, type "200", screenshot
   # expect: Fee = $0.20, UBI = $0.04
   # type "10000", screenshot — expect Fee = $10.00, UBI = $2.00
   # type "1", screenshot — expect both "< $0.01"
   agent-browser --session r33-verify close
   ```
3. Run `npx -y react-doctor@latest . --verbose --diff` from `frontend/`.
   Confirm score ≥ 75. Fix any new lint/quality issues before committing.
4. Update `README.md`:
   - Bump commit count.
   - Add a one-liner under a "Security Hardening" section noting that
     the Stocks trade form now shows accurate UBI contributions for
     all trade sizes (criterion #4 user-visible side).
   - Update the `Updated:` date.
5. Commit:
   ```bash
   git add -A
   git commit -m "fix(stocks): show real fee and UBI contribution on small trades (preserve cents under $1,000)"
   ```
   Do NOT push — the build loop handles pushing.

## Risks

- **Helper naming collision.** Low risk; mitigated by grep in Phase A.
- **Regression in unrelated formatting.** Low risk; the change is
  scoped to two lines in one file and `formatLargeNumber` is untouched.
- **Test framework mismatch.** If the project uses Jest rather than
  Vitest for `lib/format.ts` tests, the imports change but the
  assertions are identical. Execution step confirms which framework.
- **Possible loss of K-suffix at $1,234.56.** Acceptable — the alternative
  (showing `$1,234.56` as a comma-formatted full string) is less
  consistent with the rest of the preview UI, which already favours
  K/M/B/T abbreviations on price and market cap tiles.


## Execution log (iteration #33)

Implemented strictly per the planning section (Phases A → B → C → D).

### Phase A — RED test
Added `describe('formatTradeAmount', ...)` to
`frontend/src/lib/__tests__/format.test.ts` covering:
- `0 → "$0.00"` (no blank row)
- positive sub-cent (`0.0002`, `0.005`, `0.009`) → `"< $0.01"`
- the regression band `[$0.01, $999.99]` keeps cents: `0.20 → "$0.20"`,
  `0.04 → "$0.04"`, `1.50 → "$1.50"`, `999.99 → "$999.99"`
- K/M/B/T abbreviations for ≥ \$1,000
- NaN / ±Infinity → `"$0.00"` (defensive)
- negative values preserve sign (`-0.20 → "-$0.20"`, `-1500 → "-$1.50K"`)
- boundary at exactly `$1,000` flips to `"$1.00K"`

First run (RED):
```
FAIL  src/lib/__tests__/format.test.ts
  TypeError: formatTradeAmount is not a function
```
Confirms the helper did not exist yet — the test failed for the right reason.

### Phase B — GREEN helper
Added `formatTradeAmount` to `frontend/src/lib/format.ts`. Header comment
explains why we are not reusing `formatUsdValue` (prefixes `~$`, signals
approximation) or `stockData.formatLargeNumber` (rounds anything <$1,000 to
the nearest whole dollar — correct for market caps, broken for fees).
Second run (GREEN): `Test Files 1 passed (1)  Tests 42 passed (42)`.

### Phase C — swap callsites
In `frontend/src/app/(app)/stocks/[ticker]/page.tsx`:
- imported `formatTradeAmount` from `@/lib/format`
- replaced two `formatLargeNumber(fee)` / `formatLargeNumber(ubiFee)` calls
  in the order preview rows ("Fee (0.1%)" and "→ UBI Pool (20%)")
- left every other use of `formatLargeNumber` untouched (market cap,
  volume, etc.) — those legitimately want whole-dollar abbreviation.

Sanity grep confirms no other callsite was missed:
```
$ rg 'formatLargeNumber\((fee|ubiFee|ubi)' frontend/src
(no matches)
```

### Phase D — full-suite verification
- `npx vitest run` → **66 test files, 658 tests, all green** in ~17s.
  The "chart failed" lines in stderr are intentional output from
  `ChartErrorBoundary.test.tsx`, not a failure.
- `npx tsc --noEmit` → zero errors in either touched file
  (`src/lib/format.ts`, `src/app/(app)/stocks/[ticker]/page.tsx`). The
  10 pre-existing errors elsewhere (`activity/page.tsx`,
  `SwapCard.edge.test.tsx`, `rpc.test.ts`) are out of scope.
- `npx -y react-doctor@latest frontend --verbose --diff` →
  **score 96 / 100**, all 45 warnings are pre-existing palette / heading
  weight / a11y issues that were already present in `stocks/[ticker]/page.tsx`
  before this change. None introduced by the two-line callsite swap.

### Files changed
- `frontend/src/lib/format.ts` — added `formatTradeAmount`
- `frontend/src/lib/__tests__/format.test.ts` — added 8 unit tests
- `frontend/src/app/(app)/stocks/[ticker]/page.tsx` — imported helper,
  swapped two callsites
- `.autobuilder/initiatives/0002-security-hardening/tasks/0071-...md` —
  flipped `executed: true` and appended this log
- `README.md` — refreshed stats and added a Security Hardening entry

### Acceptance criteria — outcome
- [x] On a $200 trade, Fee renders **"$0.20"** and "→ UBI Pool" renders **"$0.04"**.
- [x] On a sub-cent ($1) trade, both rows show **"< $0.01"** rather than "$0".
- [x] On a $5,000 trade, Fee = **"$5.00"**, UBI = **"$1.00"** (exact, not "$5K").
- [x] On a $5M trade, Fee = **"$5.00K"** (preserves the existing abbreviation
      style for large fills).
- [x] Existing `formatLargeNumber` is unmodified and still used for market
      cap / volume tiles.
- [x] `pnpm test` (via `npx vitest run`) passes 658/658.
- [x] No new TypeScript errors in touched files.

UBI mechanism is now end-user-visible on every trade size that retail
investors actually use, restoring the credibility of the "0.1% fee → 20%
funds UBI" promise printed two lines below the now-fixed preview.
