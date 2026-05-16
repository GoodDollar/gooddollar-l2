---
id: gooddollar-l2-swap-fake-price-impact
title: "Swap — Replace Synthetic priceImpact Formula With Real On-Chain Reserve-Based Calculation (slippage / sandwich protection)"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: true
priority: P0
labels: [frontend, security, mev, sandwich, swap, price-impact]
---

# Swap — Replace Synthetic priceImpact Formula With Real On-Chain Reserve-Based Calculation (slippage / sandwich protection)

> Note: this is a frontend change filed inside the security-hardening
> initiative because the displayed price impact is what users base their
> slippage decision on, and slippage is the user's only defense against
> sandwich attacks. A misleading number here = misconfigured slippage =
> real economic loss. The Non-Goals section of the initiative spec
> explicitly allows frontend changes when they fix a security issue.

## Problem

The "Price Impact" number rendered in `SwapDetails.tsx` and used to
gate the red **"Swap Anyway — High Price Impact"** warning button in
`SwapWalletActions.tsx` is **fabricated from the input amount alone**.
It has no relationship to the actual liquidity available in
`GoodSwapRouter` on chain.

From `frontend/src/components/SwapCard.tsx:102-109`:

```ts
const priceImpact = useMemo(() => {
  const amt = parseFloat(inputAmount)
  if (!amt || isNaN(amt)) return 0
  if (amt < 1) return 0.01
  if (amt < 10) return 0.1 + (amt / 10) * 0.2
  if (amt < 100) return 0.3 + (amt / 100) * 1.5
  return Math.min(0.3 + (amt / 100) * 1.5, 15)
}, [inputAmount])
```

This is a hand-tuned curve over the *input amount*. It does not look at
pool reserves, it does not look at the on-chain quote we already fetch
via `useSwapQuote(...)` (see `useOnChainSwap.ts`), and it does not
depend on the input or output token. Swapping 50 G$ for ETH and
swapping 50 ETH for G$ produce the *same* "price impact" number, even
though the two trades drain wildly different fractions of their
respective pools.

### Why this is a security issue

1. **Sandwich-attack resistance depends on slippage. Slippage decisions
   depend on price impact.** The whole point of showing price impact
   is "if this is high, raise your slippage tolerance / split the
   trade / abort." We currently lie to the user about whether they are
   in a thin or deep pool. A user who sees "0.6%" and accepts the
   default 0.5% slippage will get filled by a sandwich every time on a
   pool where the real impact is, say, 8%.
2. **The default slippage is 0.5%.** Combined with a fake "looks safe"
   price-impact display, a routine swap on a thin pair can revert in
   the best case (annoying) or partial-fill at a worse-than-shown price
   in the worst case (real loss).
3. **The red ≥10% warning is decorative.** `SwapWalletActions.tsx`
   relabels the button to "Swap Anyway — High Price Impact" when
   `priceImpact >= 10`, but `priceImpact` is capped at `15` by the
   formula's `Math.min(..., 15)` regardless of input size. So a user
   trying to dump 1,000,000 G$ into a pool with 10,000 G$ of liquidity
   sees the same warning as someone trying 200 G$ — and below the
   `>= 10` threshold (which kicks in around `amt ≈ 650`) they see
   *no warning at all*. The protective gate is performative.
4. **Audit-prep gap.** Same as task 0052 — any external auditor will
   call out a "Price Impact" indicator that is not derived from real
   pool state. It is the kind of finding that gets quoted in writeups.

### Where the data we need already exists

`useSwapQuote(amountIn, tokenInSym, tokenOutSym)` in
`useOnChainSwap.ts` already calls `GoodSwapRouter.getAmountsOut(...)`
on chain and returns `{ amountOut, amountOutFormatted, isSupported }`.
We already use `amountOut` as the basis for `onChainAmountOutMin` (the
slippage-discounted minimum we sign). We are *one extra read* away from
also getting a real price-impact number:

```
spotRate    = quoteFor(amountIn = 1 unit) / 1
executedRate = quoteFor(amountIn = userAmount) / userAmount
priceImpact = (spotRate - executedRate) / spotRate     // for sells
```

For Uniswap-V2-style constant-product pools (which `GoodSwapRouter` is
modeled on), this is exact: `getAmountsOut(small)` gives the marginal
price, `getAmountsOut(actual)` gives the realized price, and the ratio
is the slippage caused by the trade *given current reserves*. No
contract change needed; the existing ABI is sufficient.

## Scope

### 1. Add a "spot quote" fetch alongside the executed quote

In `useOnChainSwap.ts`, extend `useSwapQuote` (or add a sibling
`useSwapPriceImpact`) to also fetch a tiny reference quote:

```ts
// Reference quote: 1 input unit (in the input token's smallest decimal
// representation, scaled the same way the user's quote is). We use a
// fixed small amount rather than `actualAmount / N` to avoid feedback
// loops when the user's amount changes.
const REFERENCE_AMOUNT = parseUnits('1', tokenIn.decimals)

const { data: refAmountsOut } = useReadContract({
  address: ROUTER,
  abi: GoodSwapRouterABI,
  functionName: 'getAmountsOut',
  args: [REFERENCE_AMOUNT, [tokenIn.address, tokenOut.address]],
  query: { enabled: isSupported, staleTime: 15_000 },
})
```

Compute the impact from the two reads:

```ts
function computePriceImpactBps(
  refAmountIn: bigint, refAmountOut: bigint,
  actualAmountIn: bigint, actualAmountOut: bigint,
): number {
  if (refAmountIn === 0n || actualAmountIn === 0n) return 0
  // Spot rate (out per in) and executed rate (out per in) in 1e18-scaled fixed point
  const SCALE = 10n ** 18n
  const spotRate = refAmountOut * SCALE / refAmountIn
  const execRate = actualAmountOut * SCALE / actualAmountIn
  if (spotRate <= execRate) return 0  // executed better than spot (rounding) — clamp to 0
  const diffBps = (spotRate - execRate) * 10000n / spotRate
  // Clamp to [0, 10000] bps (= 100%); past 100% is meaningless
  return Number(diffBps > 10000n ? 10000n : diffBps)
}
```

Return `priceImpactPct = bps / 100` to keep the existing UI contract
(numeric percent, e.g. `2.34`).

### 2. Replace the synthetic formula in `SwapCard.tsx`

Delete the `useMemo` block on lines 102-109 and consume the value from
the hook:

```ts
const { amountOutFormatted, amountOut, isSupported, priceImpactPct } =
  useSwapQuote(inputAmount, inputToken.symbol, outputToken.symbol)

// ... downstream:
const priceImpact = pairOnChain ? priceImpactPct : 0
```

For unsupported pairs (where `useSwapQuote` returns `isSupported:
false`), keep `priceImpact = 0` and hide the price-impact UI row
entirely (rather than show a synthetic number that pretends to be
real). The current code shows a fabricated number in that case too,
which is arguably worse than showing nothing.

### 3. Tighten the warning thresholds with real numbers

Today, `SwapWalletActions.tsx` uses `priceImpact >= 10` to flip the
button red. With a real number, replace the single threshold with the
industry-standard tiered scale that `PriceImpactWarning` already
implies but does not fully use:

| Real price impact | Severity      | Behavior                                                         |
| ----------------- | ------------- | ---------------------------------------------------------------- |
| `< 1%`            | normal        | no warning, normal green button                                  |
| `1% - 3%`         | notice        | yellow text under the rate, no button change                     |
| `3% - 5%`         | warning       | yellow `PriceImpactWarning` banner shown even in non-Advanced UI |
| `5% - 15%`        | high          | orange banner + button text "Confirm — High Price Impact"        |
| `>= 15%`          | extreme       | red banner + button "Swap Anyway — Extreme Price Impact (>15%)" + require a second click within the confirm modal |

The "second click" requirement on `>=15%` is the key behavioral fix:
the current implementation lets a user blast through a 50% impact
trade with a single click as long as the synthetic formula caps at
15%. Add a checkbox in `SwapConfirmModal.tsx` ("I understand this
trade has a price impact of X%") that must be ticked before
`onConfirm` is enabled, *only* when impact ≥15%.

### 4. Remove the cap in the warning logic

`SwapCard.tsx`'s `Math.min(..., 15)` cap goes away with the synthetic
formula. The new value is uncapped (well, capped at 100% by
`computePriceImpactBps`). Update `PriceImpactWarning.tsx` to render the
percent verbatim (e.g. "47.2%") rather than relying on the synthetic
ceiling.

### 5. Confirm-modal should show the live impact

`SwapConfirmModal.tsx` already displays `priceImpact` as a row. Once it
is real, surface it more prominently when ≥5%: bold the row, color it
(yellow ≥3%, orange ≥5%, red ≥15%), and add a one-line tooltip
explaining "Your trade is large enough relative to the pool that the
executed price will be ~X% worse than the marginal price. Consider
splitting the trade or raising slippage tolerance."

### 6. Tests

Add `frontend/src/lib/__tests__/useSwapPriceImpact.test.ts`:

1. Mock `useReadContract` to return a known `(refIn, refOut, actualIn,
   actualOut)` quad where the math gives a known impact (e.g.
   refOut/refIn = 1.0, actualOut/actualIn = 0.95 → expect `5.0%`).
2. Edge case: `actualIn = 0` → expect `0`.
3. Edge case: executed rate slightly above spot (rounding) → expect
   `0`, not negative.
4. Edge case: 100% drain (`actualOut = 0`) → expect `100.0`.
5. Sanity: same-token swap (refIn = refOut, actualIn = actualOut) →
   expect `0`.

Add a render test for `SwapConfirmModal.tsx` that verifies the
"I understand…" gate is present and `onConfirm` is wired to the
checkbox state when `priceImpact >= 15`.

## Out of scope

- Fixing the deadline bypass in `useOnChainSwap.ts`. Tracked in task
  0052.
- Wiring `recordTransaction` from `useSwapSettings.ts` into the swap
  completion path. Dead-code UX issue, not in this initiative's scope.
- Auto-suggesting slippage based on the new real price impact.
  Tempting and natural follow-on, but a separate UX task.
- Any change to `GoodSwapRouter.sol` or its ABI.

## Verification

1. **Unit:** `cd frontend && npm test -- useSwapPriceImpact` ≥5 cases
   passing.
2. **Manual e2e (devnet):** open `https://goodswap.goodclaw.org/`,
   enable Advanced. Pick a supported pair (G$/WETH). Use `cast call
   <ROUTER> "getAmountsOut(uint256,address[])(uint256[])" ...` from
   the terminal to compute the expected impact for a chosen amount,
   then verify the UI shows the same number to within ±0.05%.
3. **Manual e2e (large trade):** enter an amount large enough to hit
   ≥15% impact (or temporarily lower the threshold for testing). Open
   the confirm modal — verify the "I understand…" checkbox appears and
   the Confirm button is disabled until checked.
4. **Manual e2e (unsupported pair):** pick a pair `useSwapQuote`
   reports as unsupported (`isSupported: false`). Verify the price
   impact row is *hidden* (not zero, hidden) and the slippage warning
   path stays sane.
5. **No regressions:** `npm run test --prefix frontend` all green.
6. **react-doctor:** `npx -y react-doctor@latest . --verbose --diff`
   ≥75 on touched files.

## One-week decision

**One-shot.** The data source (`getAmountsOut`) is already wired,
existing slippage plumbing shows the pattern. Touched files:
`useOnChainSwap.ts`, `SwapCard.tsx`, `SwapWalletActions.tsx`,
`SwapConfirmModal.tsx`, `PriceImpactWarning.tsx`, plus one new test
file. No new dependencies, no contract changes, no new ABI methods.
Largest risk is misreading the constant-product math; the unit-test
table above pins the expected outputs for review.

## Architecture diagram

```
                          ┌──────────────────────────────────┐
                          │  GoodSwapRouter on chain 42069   │
                          │  getAmountsOut(amount, [in,out]) │
                          └─────────────┬────────────────────┘
                                        │
                  ┌─────────────────────┴─────────────────────┐
                  │                                           │
                  ▼                                           ▼
       ┌─────────────────────┐                     ┌──────────────────────┐
       │  refAmountsOut      │                     │  actualAmountsOut    │
       │  args: [1 token,    │                     │  args: [userAmount,  │
       │         path]       │                     │         path]        │
       │  cached 15s         │                     │  refetched on input  │
       └────────┬────────────┘                     └──────────┬───────────┘
                │                                             │
                └──────────────────┬──────────────────────────┘
                                   ▼
                ┌────────────────────────────────────────┐
                │ computePriceImpactBps(                 │
                │   refIn, refOut, actualIn, actualOut)  │
                │   spot   = refOut/refIn                │
                │   exec   = actualOut/actualIn          │
                │   impact = (spot - exec) / spot        │
                │   clamp [0, 10000] bps                 │
                │ )                                      │
                └────────────────┬───────────────────────┘
                                 │ priceImpactPct (real number)
                                 ▼
        ┌────────────────────────────────────────────────────┐
        │            SwapCard.tsx                            │
        │ const { priceImpactPct } = useSwapQuote(...)       │  ◄── replaces synthetic useMemo
        │ const priceImpact = pairOnChain ? priceImpactPct:0 │
        └────────────┬───────────────────────────────────────┘
                     │ priceImpact (real %)
        ┌────────────┴────────────┬─────────────────────────┐
        ▼                         ▼                         ▼
 ┌────────────────┐    ┌─────────────────────┐    ┌──────────────────────┐
 │ SwapDetails    │    │ PriceImpactWarning  │    │ SwapWalletActions    │
 │  shows row     │    │  tiered colors      │    │  >=15% → require     │
 │  bolds @≥5%    │    │  uncapped           │    │  checkbox in modal   │
 └────────────────┘    └─────────────────────┘    └──────────────────────┘
```
