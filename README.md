# GoodDollar L2 — The UBI Chain

![GoodDollar L2 logo](docs/assets/gooddollar-l2-logo.svg)

GoodDollar L2 is an OP Stack-style EVM chain where useful financial activity routes protocol fees into universal basic income for verified humans. The project combines a public-good chain, a DeFi app suite, backend keepers, analytics, and agent-wallet infrastructure into one testnet-ready ecosystem.

## Live Links

- Landing site: https://goodclaw.org
- Web app: https://goodswap.goodclaw.org
- Status API: https://goodswap.goodclaw.org/api/status
- Public RPC: https://rpc.goodclaw.org — chain ID `42069` / `0xa455`
- Explorer: https://explorer.goodclaw.org
- Agents / Paperclip dashboard: https://paperclip.goodclaw.org
- Active readiness plan: [`docs/TESTNET-READINESS-50-ITERATIONS.md`](docs/TESTNET-READINESS-50-ITERATIONS.md)
- Architecture diagrams: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Testnet guide: [`docs/TESTNET_README.md`](docs/TESTNET_README.md)

## Current Status

_Last refreshed: 2026-05-18 08:22 UTC. `main` was fetched from origin and confirmed current at commit `1c9e179` before this README/doc checkpoint 5 refresh._

GoodDollar L2 is running as a persistent public devnet and is being hardened into a public testnet release candidate.

- Public health: `healthy`, `12 / 12` services OK from `https://goodswap.goodclaw.org/api/status`.
- Public pages verified: `/`, `/faucet`, `/perps`, `/portfolio`, `/tests`, `/testnet-guide`, `/predict`, `/lend`, `/stable`, `/stocks`, `/bridge`, `/agents` all returned HTTP `200`.
- Public RPC verified: `eth_chainId = 0xa455`.
- Active initiative: Testnet Readiness Gate — 50 iterations (iter 25 / 50 complete; iter 26 next).
- Active priorities: stability, public tester onboarding, protocol smoke evidence, UBI-fee accounting, and release-candidate packaging.
- Security hardening status: Slither high/medium cleanup complete in the prior security initiative; release gates still require continuous security checks before public testnet.
- Foundry contract test suite: `1126 / 1126` passing as of iter 25 surface sweep.

### Recent readiness milestones (iter 15–25)

- **Iter 15 — README/doc checkpoint 3.** Refreshed `README.md`, `docs/ARCHITECTURE.md`, and `docs/TESTNET_README.md` after the iter 10–14 work landed; added the doc-link CI gate (`python3 scripts/check-doc-links.py`) to keep cross-doc references honest.
- **Iter 16 — Swap lane hardening.** Re-pointed the stale `SwapGD` / `SwapWETH` / `SwapUSDC` constants in `frontend/src/lib/devnet.ts` at the canonical addresses from `op-stack/addresses.json`, unblocking the swap happy-path and dust/error proof on the public app.
- **Iter 17 — Perps lane hardening.** Unblocked the Playwright E2E port collision and re-ran the full open/close flow via `frontend/e2e/perps-journey.spec.ts`, producing on-chain `PerpEngine.positions(...)` proof of a margin-funded trade.
- **Iter 18 — Predict lane + PM2 build-less-start fence.** Stabilised the public `/predict` market grid so it surfaces meaningful markets even when on-chain seeds are empty, and shipped the iter 18 BLOCKER fix that fences PM2 against build-less starts (`frontend/scripts/pm2-launch-next.mjs` refuses to launch `next start` if `.next/` is missing a manifest or contaminated by a `next dev` tree).
- **Iter 19 — `next dev` clobber recurrence #3 closed.** Removed the upstream cause of three production outages via `distDir` isolation for Playwright + added the `goodswap-watchdog` PM2 process that probes `/_next/static/chunks/*.js` every 60 s and reloads `goodswap` after a 3-failure streak (`frontend/scripts/goodswap-watchdog.mjs`, `frontend/ecosystem.watchdog.config.cjs`, [frontend health runbook](docs/TESTNET_README.md#frontend-health-iter-19)). Note: the Lend/Stable lane hardening originally mapped to row 19 of the 50-iteration plan is **deferred** to a future iteration — iter 19's slot was consumed by closing the production-down recurrence.
- **Iter 20 — README/doc checkpoint 4 + testnet gate.** Re-ran the public surface sweep, refreshed `README.md` / `docs/TESTNET_README.md` / `docs/ARCHITECTURE.md`, and re-greened the doc link checker after the iter 16–19 lane and watchdog work.
- **Iter 21 — Stocks/portfolio lane hardening.** Added Playwright E2E proof for the `/portfolio` lane (`frontend/e2e/portfolio-journey.spec.ts`) so wallet-state, balances, and claim UX have named proof on the public app; in-flight blocker (`--dist-dir` CLI flag unsupported) was fixed in the same iteration so the lane could be greened.
- **Iter 22 — UBI fee truth source.** Shipped [`docs/UBI-FEE-ACCOUNTING.md`](docs/UBI-FEE-ACCOUNTING.md), the canonical 14-route map from every protocol fee path (Swap V4, Swap Li.Fi, Perps trading/funding/liquidation, Predict factory + resolver, Lend reserve factor, Stable stability/minting/liquidation/governance, Stocks trading + liquidation remnant) into the UBI revenue tracker, with addresses sourced from `op-stack/addresses.json`.
- **Iter 23 — UBI integration proof I (Swap + Perps).** Added [`test/integration/UBIFeeIntegrationProofSwapPerps.t.sol`](test/integration/UBIFeeIntegrationProofSwapPerps.t.sol) proving routes 1–5 by event + balance-delta receipts (commit `2b30ad5`); the matching rows in `docs/UBI-FEE-ACCOUNTING.md` flipped from `⏳ proof needed` to `✅ integration proven (iter 23)`.
- **Iter 24 — UBI integration proof II (Predict + Lend + Stable + Stocks).** Added [`test/integration/UBIFeeIntegrationProofPredictLendStableStocks.t.sol`](test/integration/UBIFeeIntegrationProofPredictLendStableStocks.t.sol) proving routes 6–14 with the same event + balance-delta methodology (commit `3f2806a`); all 14 fee routes now read `✅ integration proven` and the spec records the closeout in its §6 summary.
- **Iter 25 — README/doc checkpoint 5.** This refresh. `README.md`, `docs/TESTNET_README.md`, and `docs/TESTNET-READINESS-50-ITERATIONS.md` were updated to surface the iter 20–24 milestones, link the UBI fee accounting spec and its two integration proofs from the canonical entry points, and re-run the intra-repo link check ([iter25 checkpoint summary](docs/testnet/iter25-readme-doc-checkpoint-5.md), [link-check artefact](docs/testnet/iter25-link-check.md)).

## Logo and Brand

The logo in `docs/assets/gooddollar-l2-logo.svg` is the current project mark for the repository README and testnet documentation.

- `G$` circle: the GoodDollar economic primitive and verified-human UBI claim path.
- Green gradient: public-good finance, sustainability, and real value flowing back to people.
- Blue/green L2 ring: the OP Stack-style Layer 2 network wrapping GoodDollar with cheaper, faster execution.
- Connected nodes: apps, keepers, agents, bridges, and analytics all writing to one shared chain.
- Tagline: **The UBI Chain** — every useful transaction should create a measurable contribution to UBI.

This is intentionally simple enough to render well in GitHub, docs, social previews, and release notes. The source is plain SVG so it can be versioned and edited without binary design tooling.

## What the Project Contains

GoodDollar L2 is not just a token or a single dapp. It is a full stack:

1. **Chain layer** — local/persistent OP Stack-style EVM devnet with chain ID `42069`.
2. **Protocol layer** — Solidity contracts for swaps, perps, prediction markets, lending, gUSD, synthetic stocks, bridges, governance, validators, and UBI routing.
3. **App layer** — a Next.js frontend at `goodswap.goodclaw.org` exposing every protocol surface to users and testers.
4. **Backend services** — PM2-managed keepers, indexers, monitors, oracles, health checks, and protocol service APIs.
5. **SDK and automation** — TypeScript SDK, scripts, lane tests, health gates, and autonomous builder workflow.
6. **Agent economy** — Paperclip/agent-wallet integration and AntSeed compute lane for agent-driven transactions.
7. **Analytics and proof** — status API, test dashboard, UBI impact pages, integration receipts, and Dune dashboard specification.

## Apps Running on GoodDollar L2

| App | Route | Purpose | UBI Link |
|---|---:|---|---|
| GoodSwap | `/` | Swap tokens and route value through GoodSwap contracts. | Swap/router fees flow into UBI accounting. |
| Faucet | `/faucet` | Give testers gas/test assets with boundary and capacity checks. | Enables public testing without manual funding. |
| GoodPerps | `/perps` | Perpetual futures UX backed by `PerpEngine`, margin vault, funding, and liquidation logic. | Trading, funding, and liquidation fees fund UBI. |
| GoodPredict | `/predict` | Prediction markets using conditional tokens, market factory, resolver, and CLOB-style backend work. | Market fees route into Predict UBI splitter. |
| GoodLend | `/lend` | Supply, borrow, debt tokens, interest-rate model, and liquidation lane. | Interest/spread/liquidation fees route to UBI. |
| GoodStable | `/stable` | gUSD stablecoin, collateral registry, vault manager, PSM, and stability pool. | Stability and PSM fees route to UBI. |
| GoodStocks | `/stocks` | Synthetic stock assets with price oracle and collateral vault. | Mint/burn/trading fees route to UBI. |
| Bridge | `/bridge` | L1/L2 and multichain bridge UX for future public testnet flows. | Bridge fees and routing fees can fund UBI. |
| Portfolio / Claim | `/portfolio` | Wallet overview, positions, balances, and claim-oriented UX. | Shows the user-facing impact of the UBI economy. |
| Pool / Yield | `/pool`, `/yield` | Liquidity and yield surfaces for testers. | Liquidity activity supports protocol depth and fees. |
| Explore | `/explore` | Token and market discovery. | Makes useful protocol activity easier to find. |
| Agents | `/agents` | Agent-wallet and automation entry point. | Agent transactions become another UBI-fee source. |
| UBI Impact | `/ubi-impact` | Impact and analytics narrative. | Shows transactions → fees → UBI outcomes. |
| Governance | `/governance` | DAO/timelock/veG$ governance surface. | Long-term protocol stewardship. |
| Tests | `/tests`, `/test-dashboard` | Public QA evidence and test status. | Makes readiness transparent. |
| Testnet Guide | `/testnet-guide` | Tester onboarding and network instructions. | Converts visitors into useful test activity. |
| Invite | `/invite` | Alpha tester invitation page. | Helps recruit testnet users. |

## System Architecture

```mermaid
flowchart TB
  User[Users / Testers / Agents] --> App[Next.js Web App\ngoodswap.goodclaw.org]
  App --> Wallet[Injected Wallets / WalletConnect / Reown]
  Wallet --> RPC[Public RPC\nrpc.goodclaw.org]
  RPC --> Chain[GoodDollar L2\nChain ID 42069]
  Chain --> Explorer[Explorer\nexplorer.goodclaw.org]

  Chain --> Swap[GoodSwap]
  Chain --> Perps[GoodPerps]
  Chain --> Predict[GoodPredict]
  Chain --> Lend[GoodLend]
  Chain --> Stable[GoodStable / gUSD]
  Chain --> Stocks[GoodStocks]
  Chain --> Bridge[Bridge / Claim]
  Chain --> Governance[DAO / Timelock / veG$]

  Swap --> UBI[UBI Fee Splitters + Revenue Tracker]
  Perps --> UBI
  Predict --> UBI
  Lend --> UBI
  Stable --> UBI
  Stocks --> UBI
  Bridge --> UBI
  Governance --> UBI

  UBI --> Analytics[Status / UBI Impact / Dune Spec]
  User --> Agents[Paperclip Agents / Agent Wallets]
  Agents --> App
  Agents --> Chain
```

More diagrams live in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), including runtime services and test layers.

## Protocol Contracts

The Solidity contracts are organized by protocol:

- `src/GoodDollarToken.sol`, `src/GoodDollarTokenSecure.sol` — G$ token implementations.
- `src/UBIFeeSplitter.sol`, `src/UBIRevenueTracker.sol`, `src/UBIClaimV2.sol` — UBI routing, revenue tracking, and claim infrastructure.
- `src/GoodSwap.sol`, `src/swap/GoodSwapRouter.sol`, `src/swap/LimitOrderBook.sol`, `src/hooks/UBIFeeHook.sol` — swap and fee hook layer.
- `src/perps/*` — perpetuals engine, margin vault, funding, price oracle, and UBI fee splitter.
- `src/predict/*` — conditional tokens, market factory, optimistic resolver, and Predict UBI fee splitter.
- `src/lending/*` — GoodLend pool, tokens, debt tokens, oracle, addresses provider, and rate model.
- `src/stable/*` — gUSD, collateral registry, vault manager, PSM, stability pool, and stable UBI fee splitter.
- `src/stocks/*` — synthetic asset factory, collateral vault, stock oracle, and stocks UBI fee splitter.
- `src/bridge/*` — OP-style portal/bridge contracts and multichain bridge helpers.
- `src/governance/*` — DAO, timelock, and vote-escrowed G$.
- `src/AgentRegistry.sol`, `src/ValidatorStaking*.sol` — agent and validator infrastructure.

Canonical deployed addresses must come from [`op-stack/addresses.json`](op-stack/addresses.json). Do not add stale frontend fallbacks when the registry has an address.

## Backend and Runtime Services

The live stack is PM2-managed. `/api/status` aggregates the public readiness state from the runtime services.

| Service | Role |
|---|---|
| `goodswap` | Next.js frontend server on port `3100`. |
| `swap-oracle` | Swap pricing and on-chain price support. |
| `indexer` | Chain/event indexing and API data source. |
| `monitor` | Contract and chain-health monitor. |
| `revenue-tracker` | Tracks UBI-routed protocol revenue. |
| `activity-reporter` | Reports user/protocol activity. |
| `harvest-keeper` | Yield/harvest automation lane. |
| `liquidator` | Lending/stable liquidation automation. |
| `stocks-keeper` | Synthetic-stock upkeep lane. |
| `rpc-balancer` | Public RPC proxy/balancer health. |
| `bridge-keeper` | Bridge support/health lane. |
| `perps`, `predict` | Protocol-specific backend services. |

## Repository Layout

```text
.
├── src/                         # Solidity contracts
├── script/                      # Foundry deploy/read scripts
├── test/                        # Foundry tests, fuzz, and invariants
├── frontend/                    # Next.js app, API routes, Playwright/Vitest tests
├── backend/                     # PM2 services, keepers, indexers, monitors
├── sdk/                         # TypeScript SDK package
├── op-stack/                    # Chain config and canonical addresses
├── docs/                        # Architecture, readiness, runbooks, analytics specs
├── scripts/                     # Health gates, lane tests, doc checks, deployment helpers
├── research/                    # Protocol research notes and imported references
└── .autobuilder/                # Autonomous build-loop plans, evidence, screenshots, receipts
```

## How Fees Become UBI

The design goal is intentionally measurable:

```text
User or agent activity
  → protocol transaction
  → protocol fee
  → protocol UBI fee splitter
  → UBI revenue tracker
  → verified-human claim / UBI funding pool
  → public analytics evidence
```

Release work must preserve this path for every app. A feature is not complete just because it renders; it needs contract wiring, test evidence, and UBI-fee accounting or an explicit reason it is excluded from the public gate.

**Canonical fee map.** Every protocol's fee path is enumerated in [`docs/UBI-FEE-ACCOUNTING.md`](docs/UBI-FEE-ACCOUNTING.md) — 14 routes covering Swap (V4 + Li.Fi), Perps (trading, funding, liquidation), Predict (factory + resolver), Lend (reserve factor), Stable (stability/minting/liquidation/governance), and Stocks (trading + liquidation remnant). All 14 routes are **`✅ integration proven`** on devnet via:

- [`test/integration/UBIFeeIntegrationProofSwapPerps.t.sol`](test/integration/UBIFeeIntegrationProofSwapPerps.t.sol) — routes 1–5 (iter 23).
- [`test/integration/UBIFeeIntegrationProofPredictLendStableStocks.t.sol`](test/integration/UBIFeeIntegrationProofPredictLendStableStocks.t.sol) — routes 6–14 (iter 24).

## Test and Release Gates

Before a release-candidate push or deploy, run the relevant gates:

```bash
export PATH="$HOME/.foundry/bin:$HOME/.nvm/versions/node/v22.22.1/bin:$PATH"

# Contracts
forge build
forge test -vvv

# SDK
cd sdk
npm run build
npm test
cd ..

# Frontend
cd frontend
npx tsc --noEmit
npx vitest run --reporter=verbose
npx playwright test e2e/app-regression.spec.ts --project=chromium
cd ..

# Dapp smoke lanes
for lane in swap perps predict lend stable stocks portfolio-claim explore; do
  ./scripts/run-dapp-lane.sh "$lane"
done

# Public health and docs
bash scripts/health-check.sh
python3 scripts/check-doc-links.py README.md docs/TESTNET_README.md docs/ARCHITECTURE.md
```

Recent historical full local release pass:

- Foundry: `1026 / 1026` tests passing.
- SDK: `79 / 79` tests passing.
- Frontend Vitest: `834` passing, `1` skipped.
- Dapp lanes: all lanes green.
- Public health: now `12 / 12` services healthy.

## Deploy

Frontend deploys must use the supported script so the Next.js build and PM2 process stay in sync:

```bash
cd frontend
npm run deploy
```

`npm run build` is now wrapped by [`frontend/scripts/atomic-build.mjs`](frontend/scripts/atomic-build.mjs), which snapshots `.next/` via `cp -al` before invoking `next build` and atomically rolls back on a non-zero exit or a missing/empty `BUILD_ID`. This structurally prevents the iter 14 outage pattern where a partial build wiped `.next/` while PM2 kept serving stale asset hashes. The same wrapper also recovers cleanly from the failure mode 4 (`next dev` contamination of the production tree) documented in the runbook — never run `next dev` against the live `frontend/` tree; use a separate worktree.

Operations playbooks:

- [`docs/runbooks/frontend-rebuild.md`](docs/runbooks/frontend-rebuild.md) — routine rebuild, emergency restore of `goodswap.goodclaw.org`, manual BUILD_ID drift diagnosis.
- [`scripts/testnet/iter14-restore-goodswap.sh`](scripts/testnet/iter14-restore-goodswap.sh) — one-shot recovery script invoked by the runbook.

Relevant workflows:

- `.github/workflows/ci.yml` — CI checks.
- `.github/workflows/deploy.yml` — deploy latest `main` or a selected tag by SSH.
- `.github/workflows/dapp-parallel-tests.yml` — independent dapp lane matrix.

## Testnet Release Path

The active plan is [`docs/TESTNET-READINESS-50-ITERATIONS.md`](docs/TESTNET-READINESS-50-ITERATIONS.md):

1. Iterations 1–10 — infra health, PM2/process hygiene, public RPC/explorer/faucet stability.
2. Iterations 11–20 — address/env freeze, onboarding, and protocol lane hardening.
3. Iterations 21–30 — UBI fee accounting, analytics package, feedback/debug loop.
4. Iterations 31–40 — security, risk controls, runbooks, deploy hardening.
5. Iterations 41–50 — load tests, tester gates, release-candidate manifest, final GitHub README/doc refresh.

Every five iterations the README, testnet guide, architecture docs, status proof, and known limitations should be refreshed.

## Known Boundaries Before Public Testnet

- The current network is a persistent public devnet, not final mainnet infrastructure.
- Public testnet release still needs final release-candidate manifest and tag recommendation.
- Analytics/Dune indexing remains a release artifact; if public Dune indexing is not available on day one, internal analytics must be shipped and Dune marked pending.
- WalletConnect/Reown Cloud origin allowlist should include production/testnet origins to remove SDK remote-config noise at the source.
- External audit and bug bounty are still required before mainnet.

## Key Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architecture, app diagrams, runtime services, test layers.
- [`docs/TESTNET_README.md`](docs/TESTNET_README.md) — current public testnet guide and operator notes.
- [`docs/TESTNET-READINESS-50-ITERATIONS.md`](docs/TESTNET-READINESS-50-ITERATIONS.md) — active readiness sprint.
- [`docs/PRODUCTION-ROADMAP-50-ITERATIONS.md`](docs/PRODUCTION-ROADMAP-50-ITERATIONS.md) — previous production roadmap.
- [`docs/UBI-FEE-ACCOUNTING.md`](docs/UBI-FEE-ACCOUNTING.md) — canonical 14-route UBI fee map (all routes integration-proven on devnet, iter 22–24).
- [`analytics/address-book.json`](analytics/address-book.json) + [`analytics/README.md`](analytics/README.md) — machine-readable chain/protocol/fee-route address book (iter 26 truth source for indexers).
- [`analytics/dune-package/README.md`](analytics/dune-package/README.md) — Dune / indexing-request package: SQL pack, `INDEXING_MANIFEST.json`, decoding cookbook (iter 28).
- [`docs/DUNE-DASHBOARD-SPEC.md`](docs/DUNE-DASHBOARD-SPEC.md) — analytics dashboard spec.
- [`docs/SECURITY-AUDIT.md`](docs/SECURITY-AUDIT.md) — security audit notes.
- [`docs/runbooks/frontend-rebuild.md`](docs/runbooks/frontend-rebuild.md) — frontend rebuild, restore, and BUILD_ID drift diagnosis runbook.
- [`docs/testnet/iter25-readme-doc-checkpoint-5.md`](docs/testnet/iter25-readme-doc-checkpoint-5.md) — iter 25 documentation checkpoint summary.
- [`docs/testnet/iter25-link-check.md`](docs/testnet/iter25-link-check.md) — iter 25 link-check artefact (`scripts/check-doc-links.py`).
- [`.autobuilder/integration-results.md`](.autobuilder/integration-results.md) — integration smoke matrix.
- [`scripts/check-doc-links.py`](scripts/check-doc-links.py) — README/docs link checker.

## Development Rules

- Keep `main` merged with `origin/main` before readiness or deploy work.
- Use canonical addresses from `op-stack/addresses.json`.
- Treat public URL behavior as release-critical; localhost-only success is not enough.
- Never hide degraded services in `/api/status`; fix them or document why they are excluded.
- Every major feature needs proof: unit test, Foundry test, E2E, smoke script, health JSON, screenshot, tx hash, or explicit blocker.
- Keep docs accurate enough that a GitHub visitor can understand the chain, the apps, the logo, how to test it, and how fees become UBI.
