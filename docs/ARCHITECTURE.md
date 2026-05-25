# GoodDollar L2 Architecture

_Last updated: 2026-05-24 16:47 UTC after deploying `main@6e329ad3`, repairing Blockscout non-destructively, and rerunning public + lane-7 verification gates. This checkpoint records the live public testnet architecture: eToro → price-service → oracle → app/status → hedge/testnet-smoke, public RPC/explorer, Blockscout indexing repair, Paperclip testers, and health-gate warning semantics._

GoodDollar L2 is the Good Chain: an OP Stack-style EVM chain where useful app activity routes protocol fees into UBI funding.

## Live Surfaces

- App: https://goodswap.goodclaw.org
- RPC: https://rpc.goodclaw.org
- Explorer: https://explorer.goodclaw.org
- Agent / dashboard: `paperclip.goodclaw.org` (operator surface; not a GoodSwap release gate)
- Testnet guide: `docs/TESTNET_README.md`
- Readiness plan: `docs/TESTNET-READINESS-50-ITERATIONS.md`

## Current Public Testnet State — 2026-05-24 16:47 UTC

| Layer | State | Notes |
|---|---|---|
| Git / deploy | `main@6e329ad3` deployed locally; remote push approved for this docs checkpoint | This update records the public testnet state being pushed to remote `main`. |
| Public gate | **GREEN-with-warnings**, exit `0`, blockers `0`, warnings `5` | Warnings are excluded or health-only services: `activity-reporter`, `harvest-keeper`, `revenue-tracker`, `monitor`, `hedge-engine`. |
| Lane-7 smoke | **GREEN-with-warnings**, exit `0`, blockers `0`, warnings `3` | `oracle-signer` and `hedge-engine` are accepted exclusions; `LANE7_RPC` was unset so on-chain freshness was skipped. |
| RPC / explorer | Synced and advancing | Final verification: RPC/explorer block `13777`; follow-up public probe showed explorer advancing past `14029`. |
| Blockscout | Repaired without wiping DB | Future consensus blocks were marked non-consensus, future unfetched coin balances were skipped, cache was flushed, and `backend`/`proxy` restarted. |
| Docker RPC access | PM2 `rpc-docker-bridge-8545` online | Bridges Docker containers to host Anvil at `127.0.0.1:8545` through `host.docker.internal:8545`. |
| Paperclip | Continuous testers + status publisher online | Operator/tester plane; not a GoodSwap release blocker. |


## System Topology

```mermaid
flowchart TB
  Users[Users / Testers / Agents] --> Frontend[GoodDollar L2 Web App\ngoodswap.goodclaw.org]
  Frontend --> Wallet[Wallet / EIP-1193 / WalletConnect]
  Wallet --> RPC[Public RPC\nrpc.goodclaw.org]
  RPC --> Chain[GoodDollar L2 Chain\nChain ID 42069]
  Chain --> Explorer[Explorer\nexplorer.goodclaw.org]
  RPCBridge[PM2 rpc-docker-bridge-8545\nhost.docker.internal:8545] --> RPC
  Explorer --> RPCBridge

  Chain --> Swap[GoodSwap]
  Chain --> Perps[GoodPerps]
  Chain --> Predict[GoodPredict]
  Chain --> Lend[GoodLend]
  Chain --> Stable[GoodStable / gUSD]
  Chain --> Stocks[GoodStocks]
  Chain --> Bridge[Bridge / Claim]
  Chain --> Agents[Agent Wallets / AntSeed Compute]

  Swap --> UBI[UBI Fee Splitter / Revenue Tracker]
  Perps --> UBI
  Predict --> UBI
  Lend --> UBI
  Stable --> UBI
  Stocks --> UBI
  Bridge --> UBI
  Agents --> UBI

  UBI --> AnalyticsAPI[/api/analytics/overview\niter 27]
  AnalyticsAPI --> AnalyticsPage[/analytics dashboard\niter 27]
  Chain --> AddressBook[analytics/address-book.json\niter 26]
  AddressBook --> AnalyticsAPI
  AddressBook --> DunePackage[analytics/dune-package/\niter 28]

  Frontend --> FeedbackButton[Feedback button\niter 29]
  FeedbackButton --> FeedbackAPI[/api/feedback\nrate-limit + 16KiB cap\nschema-validated\nredacted]
  FeedbackAPI --> FeedbackJSONL[frontend/data/feedback.jsonl]
```

## Apps Running on Top of the Chain

```mermaid
flowchart LR
  subgraph Chain[GoodDollar L2]
    GDT[G$ Token]
    Fees[UBI Fee Router]
  end

  subgraph Dapps[User-Facing Apps]
    Swap[GoodSwap\nSwap tokens]
    Perps[GoodPerps\nTrade perpetuals]
    Predict[GoodPredict\nPrediction markets]
    Lend[GoodLend\nSupply / borrow]
    Stable[GoodStable\nMint / repay gUSD]
    Stocks[GoodStocks\nSynthetic stocks]
    Faucet[Testnet Faucet]
    Portfolio[Portfolio / Claim]
  end

  subgraph AgentLayer[Agent Economy]
    AgentWallets[Agent wallets]
    AntSeed[AntSeed compute lane]
    Paperclip[Paperclip dashboard]
  end

  GDT --> Swap
  GDT --> Perps
  GDT --> Predict
  GDT --> Lend
  GDT --> Stable
  GDT --> Stocks
  GDT --> AgentWallets
  AgentWallets --> AntSeed
  Dapps --> Fees
  AgentLayer --> Fees
```

## Runtime Services

```mermaid
flowchart TB
  PM2[PM2 Process Manager] --> Frontend[goodswap / Next.js]
  PM2 --> SwapOracle[swap-oracle]
  PM2 --> Indexer[indexer]
  PM2 --> Monitor[monitor]
  PM2 --> Revenue[revenue-tracker]
  PM2 --> Activity[activity-reporter]
  PM2 --> Harvest[harvest-keeper]
  PM2 --> Liquidator[liquidator]
  PM2 --> StocksKeeper[stocks-keeper]
  PM2 --> RPCBalancer[rpc-balancer]
  PM2 --> BridgeKeeper[bridge-keeper]
  PM2 --> OracleSigner[oracle-signer]
  PM2 --> HedgeEngine[hedge-engine]
  PM2 --> Paperclip[paperclip-continuous-testers
paperclip-tests-status-publisher]
  PM2 --> RPCBridge[rpc-docker-bridge-8545]

  Frontend --> StatusAPI[/api/status]
  StatusAPI --> PM2
  SwapOracle --> ChainRPC[Chain RPC]
  Indexer --> ChainRPC
  Revenue --> ChainRPC
  Monitor --> ChainRPC
```

## Paperclip runners

`paperclip-continuous-testers` and `paperclip-tests-status-publisher` run inside PM2, but the `scripts/paperclip-continuous-testers-loop.sh` helper keeps them alive between restarts. The wrapper loops forever, sleeping `PAPERCLIP_TESTER_INTERVAL_SECONDS` (default 120s) between invocations of `paperclip-continuous-testers.mjs --once` and bailing out after `PAPERCLIP_TESTER_TIMEOUT_SECONDS` (default 240s) so status publishing recovers without manual intervention.

## Explorer and RPC Indexing

Blockscout sits behind `explorer.goodclaw.org` and indexes the same Anvil-backed GoodDollar L2 RPC exposed publicly at `rpc.goodclaw.org`. Because the current devnet RPC is non-archive, the explorer must not assume old/future block ranges are fetchable forever. The current runtime contract is:

- Blockscout backend/proxy run from `/home/goodclaw/blockscout/docker-compose`.
- Anvil listens on host `127.0.0.1:8545`; Docker services reach it through the PM2-managed `rpc-docker-bridge-8545` bridge and `host.docker.internal:8545`.
- Historical/archive-only fetchers stay disabled for the public devnet, while realtime coin-balance fetching is enabled and the empty-block sanitizer is disabled to avoid non-archive range scans.
- If the chain is reset or rolls back, repair is non-destructive by default: mark stale future consensus blocks non-consensus, skip stale future unfetched coin-balance rows, flush Blockscout cache by restarting `backend`/`proxy`, then verify `/api/v2/blocks?type=block` against RPC height. Do **not** wipe/reset the Blockscout DB without explicit operator approval.

## Live Price, Oracle, Hedge, and Smoke Pipeline (lanes 1–7)

The 2026-05-24 lane merge adds a concrete live-prices data plane. The goal is not to enable real-money trading; it is to make every visible price/status claim traceable and testable from source feed through chain and UI.

```mermaid
flowchart LR
  Etoro[eToro / demo market data
@goodchain/etoro-client] --> PriceService[price-service
REST :9300 / WS :9301]
  PriceService --> FrontendQuotes[/api/status/quotes
frontend proxy]
  PriceService --> OracleSigner[oracle-signer
health :9107]
  OracleSigner --> StockOracle[StockOracleV2
lastUpdated fallback]
  StockOracle --> StocksUI[GoodStocks
/stocks + /stocks/[ticker]]
  StockOracle --> PerpsUI[GoodPerps
/perps crypto oracle surfaces]
  FrontendQuotes --> StatusUI[/status + badges + banners]
  StatusAggregator[status-aggregator
:9200/status.json] --> StatusUI
  HedgeEngine[hedge-engine
health :9106] --> HedgeProof[demo hedge receipts
/live-prices-proof]
  StockOracle --> HedgeEngine
  Smoke[scripts/testnet/internal-smoke.sh] --> PriceService
  Smoke --> OracleSigner
  Smoke --> HedgeEngine
  Smoke --> StatusAggregator
  Smoke --> StockOracle
```

**Working contracts and runtime behavior.**

- `price-service` normalizes symbols, rejects stale/risky quotes, exposes health/source metadata, serves REST and WebSocket consumers, and can run without live eToro credentials via explicit degraded/manual-ingest mode.
- `oracle-signer` consumes price-service data and can publish to `StockOracleV2`; without `ORACLE_SIGNER_KEY` it reports health-only/excluded instead of silently faking writes.
- `StockOracleV2.lastUpdated()` now has fallback freshness behavior so the on-chain smoke can prove recent data without relying on one narrow timestamp field.
- `hedge-engine` maps GoodChain exposure to capped demo hedge intents and exposes demo proof/receipt surfaces; without `RISK_ENGINE_ADDRESS` it is health-only rather than failed.
- `status-aggregator` classifies `operational`, `degraded`, `health-only`, and `excluded` states so `/api/status` can distinguish real blockers from accepted testnet exclusions.
- Frontend status URLs are normalized through `resolvePriceServiceStatusUrl` / `resolvePriceStatusEndpoint`, preventing double-path or localhost-only assumptions when deployed behind GoodSwap proxies.

**Promotion rule.** Lane7 smoke is green-with-warnings, not silent green. Before broad public testnet promotion, explicitly configure or accept the `oracle-signer` and `hedge-engine` exclusions.

**Validation contract after merge.** The merged `main` lane gate is `npm run test:lane1`, which exercises the eToro SDK, price-service, oracle-signer, and hedge-engine packages together. As of the 2026-05-24 checkpoint this gate passes locally. The hedge-engine now resolves canonical `ETORO_MODE` values (`mock`, `demo-readonly`, `demo-trading`, `real-disabled`), filters unknown hedge symbols against `INSTRUMENT_MAP`, supports read-only adapter branches, and enforces cap/kill-switch checks inside the reconciliation loop before any demo hedge order can leave the process.

## Analytics + Feedback Pipeline (iter 26–29)

Iter 26–29 added the two observability loops the public testnet needs: a
**read loop** so testers and external analysts can see what the chain is
doing, and a **write loop** so testers can report what they actually hit on
the app. Both loops landed in iter 26–29 and were restored to the public
deployment by the iter 30 stale-build redeploy
([`docs/testnet/iter30-stale-build-redeploy.md`](testnet/iter30-stale-build-redeploy.md)).

```mermaid
flowchart LR
  subgraph ReadLoop[Read loop: chain → analysts]
    AddressBook[analytics/address-book.json\niter 26: canonical contract index]
    OverviewAPI[/api/analytics/overview\niter 27: live JSON aggregate]
    DashboardPage[/analytics page\niter 27: public dashboard]
    DunePackage[analytics/dune-package/\niter 28: indexer-ready ABIs + manifest]
    AddressBook --> OverviewAPI
    OverviewAPI --> DashboardPage
    AddressBook --> DunePackage
  end

  subgraph WriteLoop[Write loop: testers → maintainers]
    FloatingButton[Feedback button\nframework wrapper on every page]
    ClientContext[feedbackContext.ts\nFEEDBACK_LIMITS cap + redact]
    FeedbackRoute[/api/feedback route\niter 29]
    RateLimit[withApiRateLimit]
    SchemaCheck[FeedbackPayload schema]
    ServerRedact[redactDeep — redactSecrets.ts]
    JSONL[frontend/data/feedback.jsonl\nappend-only, gitignored]
    FloatingButton --> ClientContext
    ClientContext --> FeedbackRoute
    FeedbackRoute --> RateLimit
    RateLimit --> SchemaCheck
    SchemaCheck --> ServerRedact
    ServerRedact --> JSONL
  end

  Testers[Public testers + agents] --> FloatingButton
  Testers --> DashboardPage
  Analysts[External analysts] --> DunePackage
  Analysts --> OverviewAPI
```

**Read loop — what testers and analysts can see.**

- [`analytics/address-book.json`](../analytics/address-book.json) (iter 26)
  is the canonical, per-protocol contract index derived from
  [`op-stack/addresses.json`](../op-stack/addresses.json). Both the public
  dashboard and the Dune package depend on it instead of hardcoding
  addresses, so a redeploy of the chain only requires regenerating the
  address book.
- [`/api/analytics/overview`](../frontend/src/app/api/analytics/overview/route.ts)
  (iter 27) aggregates chain reads (block height, UBI splitter totals,
  per-protocol volume) into one cacheable JSON document.
  [`/analytics`](../frontend/src/app/%28app%29/analytics/page.tsx) is the public,
  no-wallet dashboard that renders it.
- [`analytics/dune-package/`](../analytics/dune-package/) (iter 28) ships
  the ABIs, deployment metadata, and
  [`INDEXING_MANIFEST.json`](../analytics/dune-package/INDEXING_MANIFEST.json)
  needed by external indexers (Dune, Goldsky, Subsquid) so we are not the
  only source of truth for chain analytics.

**Write loop — how testers tell us what broke.**

The feedback pipeline is a deliberate trust boundary: the client builds a
rich payload (route, console errors ring buffer, browser metadata, optional
free-text), but the server treats every field as untrusted and enforces a
hard contract before anything reaches disk.

- **Transport.** `POST /api/feedback` only. The floating Feedback button is
  the only first-party caller. There is no GET path and no admin UI yet —
  surfacing feedback is intentionally deferred (see
  [`docs/TESTNET_README.md` → Known Boundaries](TESTNET_README.md#known-boundaries-before-public-testnet)).
- **Rate + size limits.** Wrapped in
  [`withApiRateLimit`](../frontend/src/lib/withApiRateLimit.ts) and capped
  at 16 KiB request body. Anything bigger is rejected with 413 before the
  schema check.
- **Schema.** The `FeedbackPayload` interface and `FEEDBACK_LIMITS`
  constants live in
  [`frontend/src/lib/feedbackContext.ts`](../frontend/src/lib/feedbackContext.ts).
  `pathname` must be a string starting with `/`. Free-text fields, console
  error arrays, and metadata each have explicit length and shape caps.
- **Redaction.** Every accepted payload is recursively scrubbed by
  [`redactDeep` in `frontend/src/lib/redactSecrets.ts`](../frontend/src/lib/redactSecrets.ts)
  before persistence. Regexes cover private keys, mnemonics, JWTs, bearer
  tokens, generic `api_key=` parameters, and bare email addresses. Test
  vectors live in
  [`frontend/src/app/api/feedback/__tests__/route.test.ts`](../frontend/src/app/api/feedback/__tests__/route.test.ts) (redaction is exercised via the route integration tests; see the `redacts private keys, mnemonics, JWTs, bearer tokens, emails` case).
- **Persistence.** Redacted payloads are appended to
  `frontend/data/feedback.jsonl` via `appendFileSync` with `mkdirSync` on
  first write. The directory is gitignored so testers' content never enters
  the public history.
- **Proofs.** Vitest unit suite for redactor + route, Playwright spec for
  the floating-button → JSONL flow, plus live `curl` probes captured in
  [`docs/testnet/iter29-feedback-pipeline.md`](testnet/iter29-feedback-pipeline.md).

## Recent Readiness Milestones (iter 10–14)

These five iterations harden the boundary between the canonical registry,
the runtime, and the public app — so a redeploy or env drift can no longer
silently land in production.

- **Iter 10 — Reown / WalletConnect allowlist hygiene.** WalletConnect
  Cloud's `Origin not on Allowlist` console pair is suppressed at runtime
  in [`frontend/src/lib/wagmi.ts`](../frontend/src/lib/wagmi.ts) so the
  production console stays clean for testers. The permanent
  cloud-allowlist fix is documented in
  [`docs/TESTNET_README.md` → Operator runbook](TESTNET_README.md#operator-runbook).
- **Iter 11 — Address registry freeze.** `op-stack/addresses.json` and
  `.autobuilder/addresses.env` are now treated as a single canonical
  registry, regenerated from Foundry broadcast artifacts plus on-chain
  bytecode by [`scripts/refresh-addresses.py`](../scripts/refresh-addresses.py).
  Two CI gates protect against drift:
  `python3 scripts/refresh-addresses.py --check` (diff guard) and
  [`scripts/check_no_stale_addresses.py`](../scripts/check_no_stale_addresses.py)
  (stale-address scanner over `frontend/src/`). Both are exercised by
  `scripts/test_refresh_addresses.py`.
- **Iter 12 — Frontend env freeze.** A canonical `frontend/.env.production`
  plus an env-drift gate ensure the public build always points at the
  canonical RPC, explorer, chain ID, and contract registry. Together
  with iter 11 this means `op-stack/addresses.json` is the single source
  of truth from contracts → env → frontend.
- **Iter 13 — Wallet onboarding.** A reusable EIP-3085
  [`AddNetworkButton`](../frontend/src/components/AddNetworkButton.tsx) is
  embedded in `/testnet-guide` and `/faucet`. Coverage:
  [`frontend/src/components/__tests__/AddNetworkButton.test.tsx`](../frontend/src/components/__tests__/AddNetworkButton.test.tsx)
  (8 unit specs) and
  [`frontend/e2e/onboarding.spec.ts`](../frontend/e2e/onboarding.spec.ts)
  (Playwright, captures before/after screenshots and asserts the
  canonical EIP-3085 payload reached the wallet via the
  `frontend/e2e/fixtures/wallet.ts` mock).
- **Iter 14 — Atomic build wrapper + developer guide.**
  [`frontend/scripts/atomic-build.mjs`](../frontend/scripts/atomic-build.mjs)
  builds into `.next.tmp` and atomically renames it to `.next` only on
  success, so partial or failed builds cannot corrupt deployed assets.
  Operator workflow lives in
  [`docs/runbooks/frontend-rebuild.md`](runbooks/frontend-rebuild.md).
  In parallel, `/testnet-guide` gained a `#for-developers` section with
  a copy-pasteable RPC `curl`, a GitHub feedback link, and direct links
  to `op-stack/addresses.json` and this architecture document.

## Canonical Data Sources

- Contract addresses: `op-stack/addresses.json`
- Frontend devnet config: `frontend/src/lib/devnet`
- Integration receipts: `.autobuilder/integration-receipts/`
- Integration matrix: `.autobuilder/integration-results.md`
- Status API: `https://goodswap.goodclaw.org/api/status`
- Testnet readiness gate: `scripts/testnet-health-gate.sh` (to be finalized in the readiness sprint)

## Test Layers

```mermaid
flowchart TB
  Unit[Unit tests\nVitest / TS] --> Gate[Testnet Gate]
  E2E[Playwright app lanes] --> Gate
  Foundry[Foundry contracts + fuzz + invariants] --> Gate
  Smoke[On-chain smoke scripts] --> Gate
  Health[PM2 + public URL health] --> Gate
  Docs[README / docs link checks] --> Gate
  Gate --> RC[Testnet Release Candidate]
```

## Security and Reliability Principles

- Public status must reflect real readiness, not aspirational service names.
- All production browser paths must use public RPC/proxy URLs, never localhost-only assumptions.
- Every protocol fee path must be mapped to UBI accounting evidence.
- Deployments must be reproducible from `op-stack/addresses.json`, Git commit SHA, and release manifest.
- README must always point to the latest architecture, status, testnet guide, and known limitations.
