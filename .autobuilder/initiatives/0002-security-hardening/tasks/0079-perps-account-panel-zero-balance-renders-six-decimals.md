---
id: gooddollar-l2-perps-account-panel-zero-balance-renders-six-decimals
title: "Perps Account Panel — Disconnected/Zero Balance Renders Six Decimals ($0.000000), Inconsistent With Unrealized P&L ($0.00)"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P3
labels: [frontend, perps, polish, formatting, decimals, visual-quality]
---

# Perps Account Panel — Disconnected/Zero Balance Renders Six Decimals

> Scope note: This is a frontend visual-polish defect filed under the Phase 1
> initiative because it directly affects the "Integration Testing — Real
> On-Chain Transactions" acceptance criterion. The QA Bot (per project context)
> repeatedly navigates to `/perps` while verifying perps open and close
> on-chain, and `goodswap.goodclaw.org` is the demo surface used to evaluate
> production readiness. The Account panel currently renders zero-state USD
> values with six trailing zeroes, which looks broken and undermines the
> impression of polish during UAT. Priority P3 because no on-chain logic, no
> Foundry tests, and no Slither finding is affected — only the perceived
> quality of the live UI changes.

## Problem statement

When viewing `/perps` while disconnected, on the wrong chain, or with a fresh
wallet that has no margin deposited, the right-rail **Account** panel renders:

```
Balance        $0.000000
Equity         $0.000000
Unrealized P&L $0.00          ← different formatter
Margin Used    $0.000000
Available      $0.000000
Margin Ratio   0.0%
```

Four of the five USD amounts use six decimal places, while **Unrealized P&L**
in the same panel uses two decimal places. This is jarring: the values are all
USD account balances and should follow a single, consistent format. Six
decimals on a USD balance also looks like a bug to a first-time user
("…why is it showing micro-dollars?") and clashes with how every other USD
total in the app is rendered (Portfolio summary cards, Stocks, Predict, etc.,
all use 2 decimals).

Captured during iteration #38 visual-polish review at
`/tmp/iter38-screenshots/perps.png` against the live deployment
`https://goodswap.goodclaw.org/perps`.

## Root cause

`AccountPanel` in `frontend/src/app/(app)/perps/page.tsx` (around lines 509–547)
formats four of the five values with `formatPerpsPrice(account.balance)`,
`formatPerpsPrice(account.equity)`, `formatPerpsPrice(account.marginUsed)`, and
`formatPerpsPrice(account.available)`. Only **Unrealized P&L** uses the shared
`<PriceDisplay value={account.unrealizedPnl} prefix="$" showSign size="sm" … />`
component.

`formatPerpsPrice` lives in `frontend/src/lib/perpsData.ts` (lines 102–116) and
is designed for **token prices** across a wide magnitude range (BTC at $70K
down to memecoins at $0.000023):

```ts
export function formatPerpsPrice(price: number): string {
  const abs = Math.abs(price)
  const sign = price < 0 ? '-' : ''
  for (const [threshold, suffix] of PRICE_TIERS) { /* B / M / K abbrev */ }
  if (abs >= 1000) return `${sign}$${abs.toLocaleString(...)}`  // 2 decimals
  if (abs >= 1)    return `${sign}$${abs.toFixed(2)}`           // 2 decimals
  if (abs >= 0.01) return `${sign}$${abs.toFixed(4)}`           // 4 decimals
  return                  `${sign}$${abs.toFixed(6)}`           // 6 decimals  ← falls here for $0
}
```

For a zero-balance account every value is `0`, so it falls through every
threshold and lands on the 6-decimal branch, producing `$0.000000`. The
function is correct for its **intended** use (small token prices) — the bug is
that the Account panel is reusing it for **USD account balances**, where the
universal expected format is 2 decimals.

`PriceDisplay` (`frontend/src/components/ui/price-display.tsx`) is the
existing project-wide component documented as "Used across: GoodSwap,
GoodStocks, GoodPredict, GoodPerps" with `decimals=2` default — exactly what
USD account amounts need. The same panel already uses it for Unrealized P&L,
proving compatibility.

## Impact

- Visible inconsistency between Unrealized P&L (`$0.00`) and the four
  surrounding USD values (`$0.000000`) in the same panel.
- Disconnected or fresh users see what looks like a buggy zero state on the
  most-trafficked Perps surface.
- Once a user deposits margin, the values typically land in the `>= 1` branch
  (2 decimals) — so the bug **only** manifests on the empty state, which is
  ironically the first impression for new users at `goodswap.goodclaw.org`.
- No on-chain consequence: Margin Ratio and on-chain math are unaffected; this
  is purely a `Number → string` rendering issue.

## Acceptance criteria

1. On `/perps`, the Account panel renders Balance, Equity, Margin Used, and
   Available with **2 decimal places** when the value is below $1000 — i.e.
   `$0.00`, `$1,234.56` — matching the existing Unrealized P&L style and the
   rest of the app's USD totals.
2. Large values still abbreviate sensibly (`$1.23M`, `$10.5K`) so the existing
   "wide magnitude" affordance for power users is preserved. Account balances
   can legitimately reach this range.
3. Negative values (Unrealized P&L is the only signed field, but Equity can
   technically go negative on bad debt) still render with a leading `-`.
4. Visual diff at the disconnected state: `Balance $0.000000 → $0.00`,
   `Equity $0.000000 → $0.00`, `Margin Used $0.000000 → $0.00`,
   `Available $0.000000 → $0.00`. Margin Ratio (already `0.0%`) unchanged.
5. Token-price call sites of `formatPerpsPrice` (markets list, position rows,
   chart axis labels — anything that renders a **price**, not an **account
   balance**) keep their existing precision behaviour. The fix is scoped to
   the four Account panel call sites, not a global rewrite of
   `formatPerpsPrice`.
6. Existing unit tests for `formatPerpsPrice` continue to pass unchanged
   (the function itself is not modified — only its call sites in
   `AccountPanel` are replaced with `<PriceDisplay … />`).

## Out of scope

- Re-architecting `formatPerpsPrice`. It is correct for token prices; only the
  Account panel misuses it. Touching the function risks regressions across
  perps markets, position rows, and charts.
- Introducing a new `formatUsdAccount` helper. `<PriceDisplay value={x}
  prefix="$" />` already exists, is used in this exact panel for Unrealized
  P&L, and is the documented project-wide USD primitive. Adding a parallel
  helper would re-introduce the inconsistency this task is fixing.
- Empty-state copy or visual treatment of the panel when disconnected — that
  is a separate polish concern (Portfolio empty states are filed as task
  0080). This task only changes the **number formatting** of the four USD
  values.
- Changes to Margin Ratio formatting, position row formatting, or the
  Open Positions empty state.

## Files likely to change

- `frontend/src/app/(app)/perps/page.tsx` — `AccountPanel` component,
  ~4 lines: replace `{formatPerpsPrice(account.balance)}` etc. with
  `<PriceDisplay value={account.balance} prefix="$" size="sm" />` (and the
  same for `equity`, `marginUsed`, `available`).

## Verification

1. Manual: open `/perps` while disconnected from MetaMask and confirm Balance,
   Equity, Margin Used, Available all read `$0.00` (not `$0.000000`).
2. Manual: connect a wallet on chain 42069 with deposited margin; confirm
   values render with 2 decimals (`$1,234.56`) and large balances abbreviate
   (`$1.23M`).
3. Visual: side-by-side screenshot of Account panel before/after — Unrealized
   P&L and the four other USD rows should now share the same formatting.
4. `npm test` in `frontend/` — existing perps tests pass; in particular,
   `formatPerpsPrice` unit tests are unchanged.
5. `react-doctor` score ≥ 75 with no new errors.

## Planning

### Research notes

- `formatPerpsPrice(price: number)` lives at `frontend/src/lib/perpsData.ts`
  lines 102–116. It is a tiered token-price formatter: ≥1B → "X.XXB",
  ≥1M → "X.XXM", ≥1K → "X.XXK", ≥1000 → 2 decimals with locale, ≥1 → 2
  decimals, ≥0.01 → 4 decimals, **else 6 decimals**. The 6-decimal branch is
  what produces `$0.000000` for a fresh disconnected account.
- `<PriceDisplay value={x} prefix="$" />` lives at
  `frontend/src/components/ui/price-display.tsx`. Default `decimals=2`,
  uses `toLocaleString('en-US', { minimumFractionDigits, maximumFractionDigits })`,
  and supports `compact` mode (which renders `1.2M` for ≥1M values via
  `Intl.NumberFormat` with `notation: 'compact'`). It already supports
  `showSign`, prefix/suffix, and is the documented project-wide USD primitive.
- Same panel — `AccountPanel` in `frontend/src/app/(app)/perps/page.tsx` —
  already imports and uses `PriceDisplay` at line 525 for `unrealizedPnl`,
  proving compatibility and import is in scope.
- AC #2 ("large values still abbreviate sensibly") is satisfied by passing
  `compact` to `PriceDisplay` so that `$1.23M` style still renders for
  power users with deep accounts. Without `compact` the values would render
  in full (`$1,234,567.89`), which is also acceptable but less compact than
  current `formatPerpsPrice` output. We choose `compact` to preserve the
  current "wide magnitude" affordance.
- `formatPerpsPrice` itself is **not** modified: token markets, the price
  chart axis, the position rows in `/perps/portfolio`, and the markets list
  all use it correctly. Searching the repo (`grep -rn formatPerpsPrice
  frontend/src/`) shows ~12 call sites; only the four in `AccountPanel`
  conflate "USD account balance" with "token price" semantics.

### Architecture

```mermaid
flowchart LR
  Engine[useOnChainAccountSummary]
    -->|account: { balance, equity, unrealizedPnl, marginUsed, available, marginRatio }|
    Panel[AccountPanel]

  Panel -->|"<PriceDisplay value={balance}\n prefix='$' compact size='sm' />"| Balance[Balance row]
  Panel -->|"<PriceDisplay value={equity}\n prefix='$' compact size='sm' />"| Equity[Equity row]
  Panel -->|already PriceDisplay| Pnl[Unrealized P&L row]
  Panel -->|"<PriceDisplay value={marginUsed}\n prefix='$' compact size='sm' />"| MarginUsed[Margin Used row]
  Panel -->|"<PriceDisplay value={available}\n prefix='$' compact size='sm' />"| Available[Available row]
  Panel -->|"toFixed(1) + '%'"| Ratio[Margin Ratio row — unchanged]

  classDef changed fill:#1f3a1f,stroke:#4ade80,color:#fff;
  class Balance,Equity,MarginUsed,Available changed;
```

Flow: hook → panel → 4 rows changed (green), 1 row unchanged (P&L already
correct), 1 row unchanged (Margin Ratio is a percentage, not USD).

### One-week decision

**YES** — single-file, ~4-line replacement. `<PriceDisplay>` is already
imported in this file. No new component, no new hook, no test infrastructure
changes. Estimated 30 minutes incl. visual verification at the disconnected
state. `split: false`.

### Implementation plan

1. **Edit** `frontend/src/app/(app)/perps/page.tsx`. In `AccountPanel`,
   replace each of the four `{formatPerpsPrice(account.X)}` call sites with
   `<PriceDisplay value={account.X} prefix="$" compact size="sm" />`. Keep
   the existing wrapping `<span className="text-white font-medium">`
   (verify `PriceDisplay`'s className API supports `text-white font-medium`
   pass-through; if not, wrap the component instead of replacing the
   `<span>`).
2. **Verify import** of `PriceDisplay` is already present (it is — used on
   line 525 for Unrealized P&L). Confirm no unused-import lint when
   `formatPerpsPrice` is removed; if no other site in this file uses
   `formatPerpsPrice` after the change, also remove its import line.
3. **Visual check** at disconnected state: open `/perps`, screenshot
   Account panel, confirm 5 USD rows now render `$0.00` consistently and
   Margin Ratio still reads `0.0%`.
4. **Visual check** at connected state with deposited margin: confirm
   non-zero balances render with 2 decimals (`$1,234.56`) and large values
   abbreviate (`$1.23M`).
5. **Tests:** run `npm test` in `frontend/`. No tests assert the
   `$0.000000` string, so nothing should break. If `formatPerpsPrice` has
   dedicated unit tests, they remain green (function unchanged).
6. **react-doctor:** `npx -y react-doctor@latest . --verbose --diff` from
   project root. Target score ≥ 75; commit only if ≥ 50.
7. **README:** update `Updated:` date and increment commit count per the
   initiative's mandatory README update rule.
8. **Commit:** `git commit -m "Perps Account Panel — render zero-balance USD
   with 2 decimals (was $0.000000)"`. No `git push`.
