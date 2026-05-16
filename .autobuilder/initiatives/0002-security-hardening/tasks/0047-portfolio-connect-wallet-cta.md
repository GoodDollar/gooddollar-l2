---
id: gooddollar-l2-portfolio-connect-wallet-cta
title: "Portfolio — Show 'Connect Wallet' CTA Banner When Disconnected (Empty State Has No Affordance Today)"
parent: gooddollar-l2
deps: []
split: false
depth: 1
planned: true
executed: false
priority: P1
labels: [frontend, portfolio, ux-flows, empty-state]
---

# Portfolio — Show "Connect Wallet" CTA Banner When Disconnected (Empty State Has No Affordance Today)

> Note: This task is outside the formal Phase 1 security-hardening scope but is filed per
> the product-review skill: it is a clear, reproducible UX dead-end observed in
> iteration #20's `ux-flows` walkthrough of the Portfolio page. A new user lands on
> `/portfolio`, sees an all-zeros dashboard, and has no indication that connecting a
> wallet would change anything.

## Problem statement

Walking through the realistic user journey "user checks their portfolio after exploring
the app": the user navigates to `/portfolio` while disconnected from a wallet (the most
common entry state). They see:

- Three summary cards: `Total Value: $0.00`, `Unrealized P&L: +$0.00`,
  `Active Positions: 0`.
- Empty Stocks / Predict / Perps sections each saying "No stock holdings", "No predict
  positions", "No perps positions".
- **No prominent affordance to connect a wallet.** No banner, no button, no explanation.

The visual signal is identical to "this user genuinely has no positions" — but the user
has not even tried to connect yet. There is no path forward except guessing that the
small wallet button in the global header (which does exist via `WalletButtonConnected`)
might do something.

### Root cause

`frontend/src/app/(app)/portfolio/page.tsx` wraps the page in
`<ConnectWalletEmptyState>`:

```tsx
return (
  <ConnectWalletEmptyState>
    <div ...>
      <PortfolioOnChain />
      ... summary cards, sections ...
    </div>
  </ConnectWalletEmptyState>
)
```

But `frontend/src/components/ConnectWalletEmptyState.tsx` is a **no-op pass-through**
(stuck in "demo mode" — see comment in source):

```tsx
export function ConnectWalletEmptyState({
  title: _title,
  description: _description,
  children,
}: ConnectWalletEmptyStateProps) {
  // In demo mode, always show children (no wallet gate)
  return <>{children}</>
}
```

So the props (`title`, `description`) are silently discarded and the children render
unconditionally. Combined with `PortfolioOnChain` returning `null` when
`!address || chainId !== CHAIN_ID`, the user sees an all-zeros UI with no guidance.

### Where it shows up

- `/portfolio` — the most affected page, since it is *entirely* about user-specific
  on-chain state.
- (Any other future page that uses `ConnectWalletEmptyState` will inherit the same
  pass-through behaviour.)

## Acceptance criteria

- When the user is disconnected (wagmi `useAccount().isConnected === false`), the
  Portfolio page renders a prominent banner near the top with:
  - A short heading (e.g. "Connect your wallet").
  - One sentence of context (e.g. "See your live on-chain positions across Stocks,
    Predict, Perps, Lend, Stable, and Swap.").
  - A primary CTA button labelled "Connect Wallet" that opens the RainbowKit connect
    modal via `ConnectButton.Custom` → `openConnectModal`.
- When the user is connected to the **wrong chain** (wagmi `chainId !== CHAIN_ID`), the
  banner instead reads "Switch to the Good Chain devnet" with the same primary CTA
  pattern (using `openChainModal` from `ConnectButton.Custom`).
- When the user is connected to the **correct chain**, the banner is hidden — existing
  layout is unchanged.
- The rest of the portfolio UI (summary cards, empty section placeholders) continues to
  render in all states (preserves the demo mode the project deliberately enabled). The
  banner is **additive**, not gating — no `return null` for the page.
- Banner uses existing design tokens (`bg-goodgreen`, `text-white`, `rounded-2xl`,
  `border border-goodgreen/30`) — same visual language as `PortfolioOnChain`. No new
  colours.
- The `ConnectWalletEmptyState` component is left untouched (it is shared and changing
  it might surprise other call sites). Banner is a new local component (or inlined
  JSX) on the Portfolio page only.
- No new dependencies. No new env vars.
- All existing portfolio tests pass.
- `npx -y react-doctor@latest . --verbose --diff` ≥ 75.

## Planning

### Research notes

**Library is already wired up.** RainbowKit's `ConnectButton.Custom` and wagmi's
`useAccount` are already used elsewhere in this codebase — see
`frontend/src/app/(app)/perps/page.tsx` lines 5–32 for the canonical pattern:

```tsx
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const { isConnected } = useAccount()
if (!isConnected) {
  return (
    <ConnectButton.Custom>
      {({ openConnectModal }) => (
        <button type="button" onClick={openConnectModal} className="...">
          Connect Wallet to Trade
        </button>
      )}
    </ConnectButton.Custom>
  )
}
```

We reuse this exact pattern verbatim, sized as a banner instead of a full-width button.

**Why not just fix `ConnectWalletEmptyState`?** Two reasons:

1. The project deliberately set it to no-op "demo mode" so unauthenticated users can
   browse — changing the global component might re-gate other pages that depend on the
   demo behaviour.
2. The Portfolio page wants a *banner* (additive), not a *gate* (replacing). A banner is
   a different UX shape.

A future task can revisit `ConnectWalletEmptyState` to make the demo-vs-gated behaviour
explicit per call site, but that is out of scope here.

**Why not use the existing `WalletButtonConnected`?** That component is already in the
global header. Adding another button to the header doesn't help — the header button is
small and visually disconnected from the all-zeros dashboard. The fix is to put a CTA
**inside the dashboard area** so the user's eye, already focused on the empty content,
sees the affordance immediately.

**`CHAIN_ID` is a known constant.** It is already used in
`frontend/src/components/PortfolioOnChain.tsx`:
`if (!address || chainId !== CHAIN_ID) return null`. Same import path
(`@/lib/wagmi-config` or wherever `PortfolioOnChain` imports it from — match
`PortfolioOnChain`'s import to keep consistency).

### Architecture diagram

```
                            Before
┌──────────────────────────────────────────────────────────────────┐
│ /portfolio  (disconnected user)                                  │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │  Portfolio Overview                                         │   │
│ │  [Total $0.00]   [P&L +$0.00]   [Positions 0]               │   │
│ │  Stocks: No stock holdings                                  │   │
│ │  Predict: No predict positions                              │   │
│ │  Perps: No perps positions                                  │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ← no affordance, dead-end                                       │
└──────────────────────────────────────────────────────────────────┘

                            After
┌──────────────────────────────────────────────────────────────────┐
│ /portfolio  (disconnected user)                                  │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │  Portfolio Overview                                         │   │
│ │ ┌──────────────────────────────────────────────────────┐    │   │
│ │ │ ✦ Connect your wallet                                 │    │   │
│ │ │   See your live on-chain positions across Stocks,     │    │   │
│ │ │   Predict, Perps, Lend, Stable, and Swap.             │    │   │
│ │ │                              [ Connect Wallet ]       │    │   │
│ │ └──────────────────────────────────────────────────────┘    │   │
│ │  [Total $0.00]   [P&L +$0.00]   [Positions 0]               │   │
│ │  Stocks: No stock holdings                                  │   │
│ │  ... (rest unchanged) ...                                   │   │
│ └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘

                  After (connected, wrong chain)
┌──────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────┐         │
│ │ ⚠ Switch to the Good Chain devnet                     │         │
│ │   Your wallet is on a different network.              │         │
│ │                              [ Switch Network ]       │         │
│ └──────────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────────┘
```

### One-week decision

**Yes — fits well within one week.** Single-file change to
`frontend/src/app/(app)/portfolio/page.tsx`: add ~30 lines for a banner component, gated
by `useAccount()` state. No backend, no ABI, no shared component changes.

Estimated effort: ~30 minutes implementation, ~15 minutes verification.

No need to split.

### Implementation plan

1. **Edit `frontend/src/app/(app)/portfolio/page.tsx`**:

   a. Add imports at top of file:

   ```ts
   import { useAccount } from 'wagmi'
   import { ConnectButton } from '@rainbow-me/rainbowkit'
   import { CHAIN_ID } from '@/lib/wagmi-config'   // match PortfolioOnChain's import
   ```

   (If `PortfolioOnChain` imports `CHAIN_ID` from a different path, use that exact path
   for consistency.)

   b. Define a local component above `PortfolioPage`:

   ```tsx
   function ConnectWalletBanner() {
     const { isConnected, chainId } = useAccount()
     // Connected to correct chain → hide.
     if (isConnected && chainId === CHAIN_ID) return null

     const wrongChain = isConnected && chainId !== CHAIN_ID
     return (
       <ConnectButton.Custom>
         {({ openConnectModal, openChainModal }) => (
           <div className={`flex items-center justify-between gap-4 rounded-2xl border p-4 mb-6 ${
             wrongChain
               ? 'bg-amber-500/10 border-amber-500/30'
               : 'bg-goodgreen/10 border-goodgreen/30'
           }`}>
             <div className="flex items-start gap-3 min-w-0">
               <span aria-hidden className={`mt-0.5 ${wrongChain ? 'text-amber-300' : 'text-goodgreen'}`}>
                 {wrongChain ? '⚠' : '✦'}
               </span>
               <div className="min-w-0">
                 <p className="text-sm font-semibold text-white">
                   {wrongChain ? 'Switch to the Good Chain devnet' : 'Connect your wallet'}
                 </p>
                 <p className="text-xs text-gray-400 mt-0.5">
                   {wrongChain
                     ? 'Your wallet is on a different network.'
                     : 'See your live on-chain positions across Stocks, Predict, Perps, Lend, Stable, and Swap.'}
                 </p>
               </div>
             </div>
             <button
               type="button"
               onClick={wrongChain ? openChainModal : openConnectModal}
               className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                 wrongChain
                   ? 'bg-amber-500 text-black hover:bg-amber-400'
                   : 'bg-goodgreen text-white hover:bg-goodgreen/90'
               }`}
             >
               {wrongChain ? 'Switch Network' : 'Connect Wallet'}
             </button>
           </div>
         )}
       </ConnectButton.Custom>
     )
   }
   ```

   c. Render `<ConnectWalletBanner />` inside the page JSX, immediately after the
      `<h1>` and **before** `<PortfolioOnChain />`:

   ```tsx
   return (
     <ConnectWalletEmptyState>
       <div className="w-full max-w-5xl mx-auto">
         <h1 className="text-2xl font-bold text-white mb-6">Portfolio Overview</h1>
         <ConnectWalletBanner />
         <PortfolioOnChain />
         ... existing summary + sections ...
       </div>
     </ConnectWalletEmptyState>
   )
   ```

2. **Add a unit test** at
   `frontend/src/app/(app)/portfolio/__tests__/connect-banner.test.tsx` (match repo
   convention: most pages already have a `__tests__` folder; if not, create it):

   ```tsx
   import { render, screen } from '@testing-library/react'
   import { describe, expect, test, vi } from 'vitest'

   // mock wagmi useAccount; pattern is already used elsewhere in the repo —
   // copy from any existing portfolio/predict test that mocks wagmi.
   vi.mock('wagmi', () => ({
     useAccount: vi.fn(),
     useReadContract:  () => ({ data: undefined, isLoading: false }),
     useReadContracts: () => ({ data: undefined, isLoading: false }),
   }))

   import { useAccount } from 'wagmi'
   import PortfolioPage from '../page'

   describe('Portfolio — Connect Wallet banner', () => {
     test('shows Connect Wallet CTA when disconnected', () => {
       (useAccount as unknown as vi.Mock).mockReturnValue({ isConnected: false })
       render(<PortfolioPage />)
       expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument()
       expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument()
     })

     test('shows Switch Network CTA when on wrong chain', () => {
       (useAccount as unknown as vi.Mock).mockReturnValue({ isConnected: true, chainId: 1 })
       render(<PortfolioPage />)
       expect(screen.getByText(/switch to the good chain devnet/i)).toBeInTheDocument()
     })

     test('hides banner when connected to correct chain', () => {
       (useAccount as unknown as vi.Mock).mockReturnValue({ isConnected: true, chainId: 42069 })
       render(<PortfolioPage />)
       expect(screen.queryByText(/connect your wallet/i)).not.toBeInTheDocument()
     })
   })
   ```

   (If the existing test infrastructure mocks wagmi differently — e.g. via
   `frontend/src/test/setup.ts` — adapt this test to that convention rather than
   inventing a new one. The intent is: three render cases, three different
   `useAccount` returns, three different banner expectations.)

3. **Verify**:
   - `cd frontend && npm test -- portfolio` → new test passes, no regressions.
   - `cd frontend && npm test` → no other regressions.
   - `npm run dev` → visit `/portfolio` while disconnected → banner appears with
     "Connect your wallet" + green CTA. Click it → RainbowKit modal opens.
   - Connect a wallet on a non-42069 chain (or use Anvil with wrong chain in env) →
     banner switches to amber "Switch to the Good Chain devnet" + amber CTA.
   - Connect to chain 42069 → banner disappears, `PortfolioOnChain` becomes visible
     below the (now hidden) banner.
   - `npx -y react-doctor@latest . --verbose --diff` ≥ 75.

4. **Update `README.md`** per the initiative's mandatory README rule:
   - Bump commit count.
   - Update `Updated:` date.

5. **Commit** with message:
   `portfolio: add Connect Wallet / Switch Network banner when disconnected (was dead-end)`.

### Risks / mitigations

- **Risk:** `CHAIN_ID` import path differs from what `PortfolioOnChain` uses, causing a
  resolve error. **Mitigation:** before editing, open `PortfolioOnChain.tsx` and copy
  the exact `CHAIN_ID` import path verbatim.
- **Risk:** Banner pushes content down for connected-correct-chain users (cosmetic
  regression). **Mitigation:** when connected on the right chain, the component
  `return null`s immediately — zero DOM, zero margin.
- **Risk:** Test environment does not provide a RainbowKit context, so
  `ConnectButton.Custom` throws during render. **Mitigation:** the existing perps and
  lend pages already mount under the same test infrastructure with the same RainbowKit
  imports — match the existing test setup. If the test still flakes, render the banner
  in isolation by extracting it into a sibling file `ConnectWalletBanner.tsx` that the
  test imports directly without the `RainbowKitProvider` wrapper, mocking
  `ConnectButton.Custom` to a passthrough render-prop.
- **Risk:** `useAccount()` returns `chainId: undefined` while wagmi is hydrating, which
  briefly flashes the wrong-chain banner during SSR/hydration. **Mitigation:** treat
  `undefined` as "not yet connected" — the existing logic
  `(isConnected && chainId !== CHAIN_ID)` already handles this: if `isConnected` is
  false (the hydration default), we show the friendly green "Connect your wallet"
  banner, not the warning amber one.
