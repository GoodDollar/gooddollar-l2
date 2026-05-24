# eToro / ProductClaw Design Guide for GoodDollar L2

> Repo-local operating guide distilled from the available eToro/ProductClaw brand-token references. The authenticated ProductClaw zip/page returned `401` from this runtime, so this file captures the actionable design system needed to keep all GoodDollar L2 apps aligned now.

## Core product feel

- **Confident, clean, trustworthy.** Product UI should feel like a serious trading app, not a crypto toy.
- **Dark by default.** Use the afterhours surface family for primary app screens.
- **Green is signal.** eToro green marks CTAs, live/positive status, selected navigation, and proof highlights. Do not use random neon colors.
- **Glass is restrained.** Use translucent/glass panels for controls and high-level cards; do not put long body text on blurred glass.
- **Numbers deserve their own rhythm.** Prices, balances, APYs, blocks, and proof metrics use the eToro numeric font stack.

## Tokens

| Role | Token | Value | Usage |
|---|---:|---:|---|
| Background | `--etoro-afterhours` | `#10110E` | App shell, header, primary surfaces |
| Deep field | `--etoro-void` | `#0A0A0A` | Page edges / gradient anchor |
| Raised surface | `--etoro-carbon` | `#15170F` | Cards and panels |
| Panel | `--etoro-graphite` | `#1C1E16` | Higher-emphasis panels |
| Text | `--etoro-intelligence` | `#ECEAD1` | Warm brand text on dark |
| Primary text | `--etoro-text-primary` | `#FFFFFF` | Maximum contrast |
| Secondary text | `--etoro-text-secondary` | `rgba(255,255,255,0.65)` | Supporting copy |
| Brand green | `--etoro-official-green` | `#13C636` | Primary CTA, live status, selected states |
| Signal green | `--etoro-signal` | `#6DFF8A` | Small proof/signal accents only |
| Deep green | `--etoro-collective` | `#075434` | Borders, hover fields, secondary green surfaces |
| Negative | `--etoro-red` | `#E31937` | Losses/errors/sell |

## Typography

- Primary family: `eToro`, loaded from `https://marketing.etorostatic.com/cache1/fonts/etoro/eToro-VF-v0.7.ttf` with system fallbacks.
- Numeric family: `eToro Numbers`, used through `.etoro-number` or Tailwind `font-mono` where appropriate.
- Keep sections to **two type sizes**, three only when an eyebrow/status label is needed.
- Prefer sentence case. Use uppercase only for small labels/pills.

## Components

### Buttons
- Pill shape (`9999px`) by default.
- Primary: `#13C636`, dark text, semibold.
- Secondary: transparent/glass panel with subtle warm border.
- Destructive: eToro red, not generic neon red.

### Cards / panels
- Radius: `16px`.
- Border: `1px solid rgba(255,255,255,0.12)`.
- Background: `rgba(255,255,255,0.04)` or carbon/graphite.
- Shadow: restrained glass/elevation, no heavy drop shadows.

### Header / navigation
- Sticky-feeling dark glass bar.
- Active nav uses warm text + green underline/field.
- Condensed menus must look like the same surface system, not a separate dropdown style.

## GoodDollar-specific adaptation

GoodDollar keeps its UBI mission and G$ identity, but the visual shell should use eToro discipline:

- UBI impact = green signal + concise proof line.
- Public testnet/proof pages = trading-grade status surfaces, with exact health/proof values.
- All product verticals (Swap, Stocks, Perps, Predict, Lend, Stable, Yield, Governance, Agents, Analytics) share the same shell, nav, typography, CTA, and panel treatment.

## Implementation anchors

- Global tokens live in `frontend/src/app/globals.css`.
- Tailwind aliases live in `frontend/tailwind.config.ts`.
- Shared primitives should be preferred over page-local one-off styles:
  - `frontend/src/components/ui/button.tsx`
  - `.etoro-card`
  - `.etoro-chip`
  - `.etoro-number`
  - `.etoro-page-shell`
