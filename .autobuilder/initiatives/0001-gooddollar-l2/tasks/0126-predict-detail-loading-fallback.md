---
id: gooddollar-l2-predict-detail-loading-fallback
title: "Predict — Add Loading Timeout Fallback and Accessible Spinner on Market Detail Page"
parent: gooddollar-l2
deps: []
split: false
planned: true
executed: false
---

# Predict — Add Loading Timeout Fallback and Accessible Spinner on Market Detail Page

## Problem

The `/predict/[marketId]` detail page gets stuck in an infinite loading state for ALL market IDs (valid and invalid). The page renders a spinner `<div>` that:
1. Has no `role`, `aria-label`, or text content — completely invisible to screen readers and assistive technology
2. Spins indefinitely because the `useOnChainMarket` wagmi hook's `useReadContract` call never resolves when the MarketFactory contract has no deployed bytecode

**Impact**: The entire `/predict/[marketId]` route is effectively broken — no user can view any prediction market detail page.

## Observed via

Edge-case testing with `agent-browser`. Navigated to `/predict/1`, `/predict/99999`, and `/predict/abc`. All three show only the `PredictSectionNav` header with an empty main content area. Verified the MarketFactory contract has no bytecode via `eth_getCode` RPC call (returns `0x`).

## Research Notes

- `useReadContract` (wagmi v2 / @tanstack/react-query) sets `isLoading: true` during initial fetch. If the target address has no code, the RPC call may hang or return an error. In either case, the hook can stay in `isLoading: true` indefinitely, or cycle through states on the 15-second refetch interval.
- The component at `frontend/src/app/predict/[marketId]/page.tsx` checks `isLoading` first (line 228), then `!market` (line 236). The spinner is a CSS-only div with no accessible text.
- The `useOnChainMarket` hook at `frontend/src/lib/useMarkets.ts` (line 48-95) does NOT expose `isError` — only `market` and `isLoading`.
- Invalid non-numeric IDs (e.g., "abc") already get `parsedId = BigInt(0)` due to the guard added in task 0125, so they still hit the same loading issue.
- `loading.tsx` (Next.js Suspense fallback) is for the route-level loading skeleton — it works correctly. The issue is in the client component's own loading state.

## Assumptions

- The MarketFactory contract may or may not be deployed depending on devnet state. The fix must handle both scenarios gracefully.
- We should not change the contract deployment; we fix the frontend to degrade gracefully.

## Architecture Diagram

```mermaid
flowchart TD
    A[User visits /predict/marketId] --> B{isValidId?}
    B -- No --> C[Show "Market Not Found" immediately]
    B -- Yes --> D[useOnChainMarket hook]
    D --> E{isError?}
    E -- Yes --> C
    D --> F{isLoading && timeout < 5s?}
    F -- Yes --> G[Accessible spinner with role=status]
    F -- timeout exceeded --> C
    D --> H{market exists?}
    H -- No --> C
    H -- Yes --> I[Render market detail page]
```

## One-Week Decision

**YES** — This is a focused fix touching 2 files: the hook and the page component. Changes are small and well-scoped:
1. Expose `isError` from the hook
2. Add a 5-second timeout with `useEffect` + `useState`
3. Short-circuit invalid IDs
4. Add accessibility attributes to spinner

## Implementation Plan

### Phase 1: Update `useOnChainMarket` hook (useMarkets.ts)
- Expose `isError` from the wagmi `useReadContract` result alongside `market` and `isLoading`
- Return type becomes `{ market: OnChainMarket | null; isLoading: boolean; isError: boolean }`

### Phase 2: Update MarketDetailPage component ([marketId]/page.tsx)
1. Destructure `isError` from the updated hook
2. Add `isValidId` short-circuit: if `!isValidId`, render "Market Not Found" immediately without calling the hook (skip loading entirely)
3. Add a loading timeout: use `useState(false)` for `isTimedOut` and a `useEffect` that sets it to `true` after 5 seconds when `isLoading` is true. Reset when `isLoading` becomes false.
4. Update the loading check: `if (isLoading && !isTimedOut)` → show accessible spinner. `if (isError || isTimedOut || !market)` → show "Market Not Found" with a note about the data source being unavailable.
5. Make the spinner accessible: wrap in `<div role="status" aria-label="Loading market data">` and add a visually-hidden `<span>` with "Loading…" text.

### Phase 3: Tests
- Verify the component renders "Market Not Found" for non-numeric IDs
- Verify the spinner has proper ARIA attributes
- Verify timeout behavior works

## Files

- `frontend/src/lib/useMarkets.ts` — expose `isError`
- `frontend/src/app/predict/[marketId]/page.tsx` — timeout, short-circuit, accessible spinner
