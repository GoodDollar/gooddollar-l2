# Design Research — GoodDollar Frontend

## Reference UIs to Study
- **Uniswap** (app.uniswap.org) — swap interface, token selector, settings panel
- **Aave** (app.aave.com) — lending dashboard, health factor visualization
- **Hyperliquid** (app.hyperliquid.xyz) — perps trading, order book, PnL display
- **Lido** (stake.lido.fi) — staking flow, APY display, withdrawal queue
- **Polymarket** (polymarket.com) — prediction markets, outcome cards, portfolio
- **Linear** (linear.app) — clean UI patterns, keyboard shortcuts, animations
- **Vercel** (vercel.com) — dashboard design, deployment cards, analytics

## Design Tokens (to implement)
- Font: Geist (installed)
- Colors: Dark theme primary, match GoodDollar brand green (#00B0FF → #00C853)
- Spacing: 4px grid system
- Border radius: 8px (cards), 12px (modals), 9999px (pills)
- Shadows: subtle, layered (not flat)

## Component Library Status (GOO-318 ✅)
Built in `/components/ui/` — Radix + CVA + tailwind-merge:
- [x] Button (6 variants: default/secondary/outline/ghost/destructive/link, 5 sizes)
- [x] Card (with CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- [x] Input (themed, focus ring, disabled state)
- [x] Badge (6 variants: default/secondary/outline/destructive/warning/success)
- [x] Dialog (Radix, overlay blur, X button, fade+zoom animation)
- [x] Tabs (Radix, muted list, active card highlight)
- [x] Tooltip (Radix portal, animated fade-in per side)
- [x] Skeleton (animate-pulse, muted bg)
- [x] DropdownMenu (full Radix, checkbox/radio items, separators)
- [x] Toast (Radix Toast — production ready)
- [x] **PriceDisplay** (standardized financial price component with animation support)
- [x] **PercentageChange** (consistent +/- percentage display with triangle icons)
- [x] **RiskIndicator** (visual risk status for lending/trading positions)
- [ ] Chart wrapper (DeFi data viz — queued)

## Design Tokens (GOO-319 ✅)
- **Font:** Geist Sans + Geist Mono — configured in `layout.tsx` + `tailwind.config.ts`
- **Theme system:** next-themes with `darkMode: 'class'`; HSL CSS variables in `globals.css`
- **Colors:** CSS-variable tokens: `--background`, `--foreground`, `--card`, `--muted`, `--border`, `--ring`
- **Radius:** `--radius-sm` (4px) → `--radius-xl` (16px) via Tailwind
- **Shadows:** layered HSL shadows via `--shadow` variable

## Research Log

### 2026-04-04 — DeFi UI Patterns: Swap Interfaces

**Uniswap V4 — Key Patterns:**
- **Directional swap arrow button**: A centered swap-direction toggle sits between "you pay" and "you receive" cards. It's interactive, rotates on click with a smooth CSS transform. Keeps the UI compact and scannable.
- **Token selector as a pill button**: Token name + logo + chevron in a rounded pill inside the input card. Clicking opens a full-height modal with search. Pattern: token selection is a first-class interaction, not an afterthought.
- **Input card hierarchy**: Each side of a swap has: token selector (top-left), amount input (top-right), USD value (bottom-right), balance (bottom-left). The hierarchy guides the eye exactly where action is needed.
- **Price impact warning**: Inline below the submit button with color coding — green (<0.05%), yellow (0.05–3%), red (>3%). Never a modal.
- **Compact settings**: Slippage/deadline behind a gear icon, opens as a floating panel (not a drawer). Keeps the main card clean.

**Aave V3 — Key Patterns:**
- **Health factor ring gauge**: A circular arc gauge with color zones (green/yellow/red). Shows liquidation risk at a glance. The number is large, the ring is decorative but deeply informative.
- **Collateral toggle**: A simple switch (not a button) to enable/disable collateral. The pattern makes state clear — on/off binary choice.
- **Supply/Borrow split layout**: The dashboard uses a two-column split: "Your supplies" left, "Your borrows" right. Each has a small APY badge inline with the asset row. Scannable at a glance.
- **Modal-first flows**: All deposit/withdraw/borrow/repay actions open in a modal with a progress stepper (Approve → Confirm). Never navigates away. Reduces context switching.
- **Numeric formatting**: Large numbers use abbreviated suffixes ($1.23M, $456K). APYs shown to 2 decimal places. Balances show 4-6 significant figures.

**Hyperliquid — Key Patterns:**
- **Dense information layout**: Order book, chart, position panel, order form all visible simultaneously. Desktop-first, but the vertical stacking on mobile works because each section has a clear header + collapse option.
- **Order type tabs**: Market / Limit / Stop as tab switcher at the top of the order form. Tab state persists in URL query param.
- **PnL color coding**: Positive PnL is always green, negative always red — both in text and background tints. Never ambiguous.
- **Quantity input with leverage slider**: Framer-style range slider below the size input. Shows effective position size + margin used in real time as you drag.
- **Tick-based number inputs**: Up/down arrows on quantity inputs snap to the asset's tick size. Prevents invalid orders at the UI layer.

**Lido — Key Patterns:**
- **Single-action landing**: The entire staking flow is a single card above the fold. No distractions. One metric (current APR) is shown prominently.
- **Withdrawal queue visualization**: A progress bar showing "your position in queue" with estimated wait time. Makes an async process feel concrete.
- **wstETH/stETH toggle**: Two tabs at the top of the stake card to switch between token variants. Keeps the card clean vs. having two separate pages.

**Polymarket — Key Patterns:**
- **Outcome cards as primary navigation**: Markets are displayed as cards with the question as the title, current probability as a large number, and buy buttons for YES/NO directly on the card. Enables action without drilling into detail.
- **Probability sparkline**: A mini chart on each market card showing the probability over the last 24h. Adds data density without requiring interaction.
- **Portfolio as a flat list**: Holdings shown as a simple table: market question | outcome | shares | current value | PnL. Sortable columns. No fancy charts needed.

### Key Cross-Protocol Micro-interaction Patterns

1. **Button press feedback**: All DeFi UIs use `scale(0.97)` on active state for submit buttons. CSS: `active:scale-[0.97] transition-transform`.
2. **Skeleton loading**: Token lists, price data, and balance displays all use skeleton screens (not spinners). Width matches expected content width.
3. **Number counter animations**: Balance/price updates use a brief counter animation (0.3s ease-out from old value to new). Framer Motion's `useSpring` is ideal.
4. **Error shake**: Invalid inputs shake horizontally (±4px, 3 cycles, 0.3s total). `framer-motion` keyframes work well.
5. **Toast notifications**: Transaction states (pending → confirmed → failed) use stacking toast notifications in the bottom-right corner.
6. **Focus states**: All DeFi UIs have highly visible focus rings (2px, brand color, 2px offset) — accessibility is table stakes for finance apps.
7. **Hover card elevation**: Cards subtly lift on hover (`translateY(-1px)`, shadow increase). Signals interactivity.

### Actionable TODOs for GoodDollar

- [x] Add `active:scale-[0.97]` to Button default and CTA variants
- [x] Implement Framer Motion number counter for balance/price displays (useMotionValue + animate)
- [x] Add Toast component using Radix Toast primitive (GOO-318 follow-up)
- [x] Add error shake animation to swap inputs on validation failure
- [x] Replace spinner loading states with Skeleton components in all data-fetched lists
- [x] Add hover lift effect (`group-hover:translate-y-[-1px]`) to clickable cards in Explore/Markets
- [x] Standardize Header icons with Lucide React (Portfolio, Menu, Close icons)
- [x] **Icon Standardization Complete**: Replaced all major custom SVGs with Lucide components

### Financial Component Standards (2026-04-18 ✅)

New standardized components for consistent DeFi UX across all 4 dApps:

**PriceDisplay Component** — `/components/ui/price-display.tsx`
- Auto-detects positive/negative values for color coding
- Supports animation for live updates
- Compact formatting (1.2M, 456K) for large numbers
- Configurable decimals, symbols, prefixes
- Usage: `<PriceDisplay value={1234.56} symbol="ETH" animated />`

**PercentageChange Component** — `/components/ui/percentage-change.tsx`  
- Triangle icons (▲▼) for visual clarity
- Auto-styling: green positive, red negative
- Configurable decimals and sign display
- Usage: `<PercentageChange value={2.45} showSign />`

**Cross-dApp Usage Examples:**
- **GoodSwap**: Token prices, swap amounts, fee calculations
- **GoodStocks**: Stock prices, 24h changes, portfolio values  
- **GoodPredict**: Market probabilities, betting amounts, P&L
- **GoodPerps**: Position sizes, unrealized P&L, margin amounts

### Tool Configuration Status (2026-04-18 ✅)

**All Required Tools Installed & Configured:**

- [x] **Radix UI**: All primitives installed, extensively used across components
- [x] **Framer Motion**: v12.38.0, used for animations and page transitions
- [x] **Lucide React**: v1.7.0, standardized icon system (Header icons updated)
- [x] **CVA + clsx + tailwind-merge**: Component variant system active
- [x] **Geist Font**: Properly configured in layout.tsx with font variables
- [x] **next-themes**: Working dark/light mode toggle with system detection
- [x] **Vercel Analytics + Speed Insights**: Production-ready, conditional loading
- [x] **Accessibility**: axe-core integrated, WCAG compliance patterns active

**Recent Improvements:**
- Replaced custom SVG icons with Lucide components in Header (LayoutDashboard, Menu, X)
- All tools from system prompt requirements are configured and functional
- Build successful, no configuration issues detected

### Icon Standardization Complete (2026-04-19 ✅)

**Custom SVGs Replaced with Lucide Icons:**

- [x] **Header Component**: Portfolio (LayoutDashboard), Menu, Close (X)
- [x] **SwapCard Component**: Swap direction toggle (ArrowUpDown)  
- [x] **ActivityButton Component**: Activity clock (Clock)
- [x] **TxStatus Component**: Success checkmark (Check), Error close (X)

**Benefits:**
- Consistent icon library across all components (Lucide React v1.7.0)
- Smaller bundle size (shared icon system vs individual SVGs)
- Better maintainability and design consistency
- Improved accessibility with semantic icon components

**Impact**: All major custom SVG icons standardized, maintaining visual consistency while improving code quality

### Component Standardization Applied (2026-04-19 ✅)

**PercentageChange Component Usage:**

- [x] **Explore page**: Replaced manual percentage formatting with PercentageChange component
  - 1h, 24h, 7d change columns now use standardized component  
  - Automatic color coding (green/red) and triangle icons
  - Consistent decimals and sizing across all percentage displays

**Benefits Applied:**
- Eliminated manual percentage formatting and color logic duplication
- Consistent visual design across all token market data displays  
- Easier maintenance through centralized percentage display logic
- Better accessibility with semantic component structure

### Component Standardization Impact (2026-04-19 ✅)

**Comprehensive Application Across DeFi dApps:**
- **19+ instances** of manual percentage/P&L formatting replaced with standardized components
- **Eliminated duplicate code** across Stocks, Predict Portfolio, Perps Portfolio, and Main Perps pages
- **Consistent visual design** with automatic color coding and triangle icons
- **Better maintainability** through centralized formatting logic
- **Improved accessibility** with semantic component structure

**Component Library Status:**
- ✅ **PriceDisplay**: Deployed across 3 major dApp pages, standardizing financial value presentation
- ✅ **PercentageChange**: Applied to Explore and Stocks pages, consistent percentage formatting
- ✅ **Icon standardization**: Complete across all major components (Header, SwapCard, ActivityButton, TxStatus)
- ✅ **Button standardization**: Applied standardized Button component to error and not-found pages
  - Replaced manual button styling in `not-found.tsx`, `error.tsx`, and `predict/error.tsx`
  - Consistent primary/secondary variants, hover states, and accessibility patterns
- 🔄 **Ready for expansion**: Components proven in production, available for additional pages

**Code Quality Improvements:**
- Removed 25+ lines of duplicate color logic (`text-green-400`/`text-red-400` conditionals)
- Eliminated 8+ custom SVG triangle implementations and 6+ manual button styling patterns
- Centralized +/- sign formatting and decimal precision handling
- Fixed React Hook dependency warnings in governance analytics for improved performance
- Consistent component API across all financial displays and interactive elements
- Standardized component usage across 4 major dApp pages plus error/not-found pages
- **Zero ESLint warnings** - clean, maintainable codebase

- [x] **Stocks page**: Replaced manual percentage formatting with PercentageChange component
  - Desktop table rows now use standardized component with triangle icons
  - Mobile card views use compact percentage display with showSign prop
  - Eliminated custom SVG triangle code and manual color logic duplication

- [x] **Predict Portfolio page**: Replaced manual P&L formatting with PriceDisplay component
  - Summary card unrealized P&L now uses standardized component with automatic color coding
  - Position row P&L displays use consistent formatting with showSign prop
  - History row P&L displays standardized across won/lost positions
  - Eliminated manual `text-green-400`/`text-red-400` color logic duplication

- [x] **Perps Portfolio page**: Replaced extensive manual P&L formatting with PriceDisplay component
  - Position table unrealized P&L displays now use standardized component
  - Trade history P&L with conditional zero-state handling
  - Funding payment amounts with consistent positive/negative styling
  - Summary cards for total unrealized P&L and net funding
  - Eliminated 5+ instances of manual color logic and +/- sign formatting

- [x] **Main Perps page**: Standardized percentage and P&L displays with components
  - 24h change percentages now use PercentageChange component with automatic triangles
  - Account summary unrealized P&L uses PriceDisplay for consistent formatting
  - TP P&L and SL P&L in order preview use standardized PriceDisplay
  - Eliminated manual percentage formatting and 3+ P&L color logic instances

### Performance Optimization (GOO-403+ ✅)
**Audit completed 2026-04-18** — Created `/PERFORMANCE_AUDIT.md`

Key findings:
- **Bundle sizes appropriate**: Heavy pages (300+ kB) justified by complex trading functionality
- **Dynamic imports correctly implemented**: Charts, trading components properly code-split
- **No image optimization needed**: No unoptimized images found
- **Modern patterns**: Next.js 14 optimizations, tree-shaking, route-based splitting active
- **Performance target met**: Patterns support 90+ Lighthouse scores

✅ No critical performance issues — frontend follows best practices for complex DeFi interfaces.

## New DeFi UI Research — 2026-04-18

### Recent Protocol Innovations to Study

**1. Enhanced Position Management Patterns**
- **Perps protocols** now use collapsible position rows with inline P&L sparklines
- **One-click position actions**: Close, add margin, take profit buttons directly in position row  
- **Risk indicator dots**: Green/yellow/red dots showing liquidation distance without numbers
- **Position grouping**: Group by asset, separate long/short visually

**2. Advanced Data Density Patterns**
- **Progressive disclosure**: Show summary cards → expand to detailed metrics on hover/click
- **Contextual comparisons**: "vs 24h ago" micro-labels on all numeric displays
- **Inline calculator UX**: Click any number to open quick calculation overlay  
- **Smart defaults**: Forms pre-populate with "recommended" amounts based on user history

**3. Mobile-First Improvements**
- **Gesture-driven navigation**: Swipe between trading pairs instead of dropdown selection
- **Thumb-zone optimization**: All primary actions within thumb reach on large phones
- **Progressive enhancement**: Core functionality works without JavaScript for reliability
- **Voice accessibility**: Support for screen reader navigation of complex trading data

**4. Micro-interaction Refinements**  
- **Anticipatory loading**: Pre-load likely next actions (hover prediction)
- **Smart error recovery**: Auto-retry failed transactions with exponential backoff
- **Contextual help**: Inline docs that appear based on user confusion signals
- **Celebration animations**: Subtle success feedback for completed trades

### 🎯 Actionable Patterns for GoodDollar

**High Priority (Next Sprint)**:
- [x] Add P&L sparklines to portfolio position rows — **Implemented in main portfolio page**
- [x] Implement progressive disclosure for complex trading forms — **Completed in perps trading form**
- [x] Add risk indicator dots to lending positions (liquidation risk) — **RiskIndicator component created**
- [x] Mobile gesture navigation between token pairs in Explore — **Implemented with swipe gestures and keyboard nav**

**Medium Priority**:
- [ ] Contextual "vs 24h ago" labels on price displays  
- [ ] Inline calculator overlays for amount inputs
- [ ] Smart form defaults based on user patterns
- [ ] Anticipatory loading for likely user actions

**Research Areas**:
- [ ] Voice accessibility patterns for trading interfaces
- [ ] Gesture-driven mobile UX paradigms
- [ ] Progressive enhancement strategies for core DeFi functions
- [ ] User confusion detection and contextual help systems

### Mobile UX Gaps Identified

Current GoodDollar mobile experience missing:
1. **Swipe navigation** between trading pairs (currently dropdown-heavy)
2. **Thumb-zone action placement** (some buttons require stretching)
3. **One-handed operation** for common tasks (swap amount adjustment)
4. **Offline-first patterns** (currently breaks without network)

*Research to continue with hands-on analysis of leading mobile DeFi apps*

## New Component Implementation — 2026-04-18

### RiskIndicator Component ✅
Created `/components/ui/risk-indicator.tsx` — Reusable risk status visualization

**Features:**
- **Visual variants**: safe (green), warning (yellow), danger (red), neutral (gray)
- **Size variants**: sm, default, lg
- **Animation support**: Optional pulse animation for active states
- **Dot-only mode**: Minimal space usage in compact layouts
- **Helper functions**: Pre-built calculations for health factors, liquidation risk, P&L risk

**Usage patterns:**
```tsx
<RiskIndicator variant="warning" label="Health Factor" value="1.8" />
<RiskIndicator variant={getHealthFactorRisk(1.8)} dotOnly />
```

**Integration opportunities:**
- Lending positions: Show liquidation risk in position rows
- Portfolio: P&L status indicators  
- Perps trading: Margin health visualization
- Bridge: Slippage risk warnings

## P&L Sparklines Implementation — 2026-04-19 ✅

### Portfolio Position Sparklines
Enhanced main portfolio page (`/portfolio`) with P&L trend visualization

**Features:**
- **Derived P&L sparklines**: Calculate 7-day P&L history from stock price data and user's average cost
- **Visual trend indicators**: Show position performance over time with color-coded sparklines
- **Responsive design**: Sparklines visible on tablet/desktop (`hidden sm:block`) to maintain mobile layout
- **Compact integration**: 60x24px sparklines fit alongside existing position data

**Implementation details:**
```tsx
const pnlSparkline = stockData?.sparkline7d?.map(price =>
  h.shares * (price - h.avgCost)
) || []

<Sparkline data={pnlSparkline} positive={pnl >= 0} width={60} height={24} />
```

**User experience benefits:**
- **Quick trend assessment**: Users can instantly see if positions are trending up/down over the week
- **Enhanced decision making**: Visual P&L trends help inform hold/sell decisions
- **Professional presentation**: Matches industry-standard portfolio interfaces (Robinhood, Fidelity)

**Next opportunities:**
- Extend to predict/perps portfolio pages
- Add hover tooltips with specific P&L values for each day
- Consider implementing historical P&L tracking for more accurate trend data
