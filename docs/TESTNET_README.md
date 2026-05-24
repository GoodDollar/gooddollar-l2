# GoodDollar L2 Testnet Readiness

<!-- GOODCHAIN_STATUS:START -->
> **Public testnet checkpoint (2026-05-24 16:47 UTC):** `main@6e329ad3` is deployed to `goodswap.goodclaw.org`. Public health gate and lane-7 internal smoke are **GREEN-with-warnings** with `0` blockers. Explorer/RPC were repaired without wiping Blockscout DB; final verification showed RPC/explorer at block `13777`, and a live follow-up probe saw the explorer advancing past `14029`. Remaining warnings are accepted/excluded health-only services or optional `LANE7_RPC` freshness config. See root `README.md` and `docs/ARCHITECTURE.md`.
<!-- GOODCHAIN_STATUS:END -->


_Last updated: 2026-05-18 10:30 UTC during iter 30 (README/doc checkpoint 6). The iter 26–30 work added the analytics + feedback loops surfaces (`/analytics`, `/api/analytics/overview`, the Dune package, `/api/feedback`) — see the new **Analytics + Feedback Loops (iter 26–29)** section below for the tester-facing walk-through. Iter 30 also caught and fixed a stale production build that was hiding iter 27/29 from the public app — see [`docs/testnet/iter30-stale-build-redeploy.md`](testnet/iter30-stale-build-redeploy.md). This doc has hand-curated sections (Sibling Apps, Protocol Lane Hardening Status, Analytics + Feedback Loops, Frontend health, operator runbook). **Do not re-run `scripts/update-testnet-readme.py` until its template is reconciled with those sections** — the generator currently overwrites them._

## Current Build

- Branch: `main`
- Snapshot source: committed README + GitHub Actions history for this branch
- Package version: `0.2.1`
- Autobuilder iteration: `6`
- Chain: GoodDollar L2 Devnet (`42069` configured, `42069` live)
- Latest local block: `176824`

## Public Endpoints

- Frontend: HTTP 200 — https://goodswap.goodclaw.org
- Landing: HTTP 200 — https://goodclaw.org
- Explorer: HTTP 200 — https://explorer.goodclaw.org
- RPC HTTPS: HTTP 200 chainId=0xa455 — https://rpc.goodclaw.org
- Paperclip: HTTP 200 — https://paperclip.goodclaw.org

## Release Gate Status

- CI: GitHub `CI` was green on latest pushed `main` before this README generation; every push must re-check.
- On-chain protocol smoke: 6/6 protocol smoke tx lanes green
- Frontend E2E: matrix workflow `Parallel Dapp Tests` covers each dapp lane independently.
- Deployment: devnet deployment workflow is `Deploy to Devnet`.
- Required before public testnet: persistent OP Stack chain, faucet, final canonical address sync, explorer indexing check, Dune dashboard/indexing.

## Protocol Lane Hardening Status (iter 16–30)

Per-lane status after the iter 16–30 hardening pass. "Hardened" means the
lane has named proof on the public app (or — for cross-protocol UBI work
— named proof on devnet) and is ready to feed the release candidate
manifest. "Deferred" means the slot was consumed by a blocker and the
work moves to a later row.

| Lane | Iter | State | Evidence |
|---|---|---|---|
| Swap | 16 | ✅ hardened | `frontend/src/lib/devnet.ts` constants re-pointed at `op-stack/addresses.json`; swap happy-path + dust/error proof captured. |
| Perps | 17 | ✅ hardened | `frontend/e2e/perps-journey.spec.ts` full open/close green; on-chain `PerpEngine.positions(...)` receipt. |
| Predict | 18 | ✅ hardened | `/predict` market grid surfaces meaningful markets when on-chain seeds are empty; `frontend/e2e/predict-journey.spec.ts` green. |
| Lend | 19 (target) | ⏳ deferred | Iter 19's slot was consumed by the `next dev` clobber recurrence #3 fix (see [Frontend health (iter 19)](#frontend-health-iter-19)). Lane proof scheduled for a follow-up iteration. |
| Stable | — | ⏳ deferred | Same deferral as Lend; will be picked up alongside it. |
| Stocks | — | ✅ stable (existing) | `/stocks` HTTP 200, smoke matrix green from prior iterations; no new hardening in iter 16–19. |
| Portfolio / Claim | 21 | ✅ hardened | `/portfolio` HTTP 200; `frontend/e2e/portfolio-journey.spec.ts` proves wallet-state + balances + claim UX on the public lane (iter 21 also fixed the `--dist-dir` CLI flag blocker so the lane could be greened). |
| UBI fee truth source | 22 | ✅ shipped | [`docs/UBI-FEE-ACCOUNTING.md`](UBI-FEE-ACCOUNTING.md) — canonical 14-route map from every protocol fee path into the UBI revenue tracker. |
| UBI integration proof I (Swap + Perps) | 23 | ✅ integration proven | [`test/integration/UBIFeeIntegrationProofSwapPerps.t.sol`](../test/integration/UBIFeeIntegrationProofSwapPerps.t.sol) — routes 1–5 proven by event + balance-delta receipts (commit `2b30ad5`). |
| UBI integration proof II (Predict + Lend + Stable + Stocks) | 24 | ✅ integration proven | [`test/integration/UBIFeeIntegrationProofPredictLendStableStocks.t.sol`](../test/integration/UBIFeeIntegrationProofPredictLendStableStocks.t.sol) — routes 6–14 proven; all 14 routes now read `✅ integration proven` in the accounting spec (commit `3f2806a`). |
| Analytics address book | 26 | ✅ shipped | [`analytics/address-book.json`](../analytics/address-book.json) + [`analytics/README.md`](../analytics/README.md) — machine-readable chain/protocol/fee-route truth source derived from `op-stack/addresses.json`. |
| Public analytics dashboard | 27 | ✅ hardened | [`/analytics`](https://goodswap.goodclaw.org/analytics) + [`/api/analytics/overview`](https://goodswap.goodclaw.org/api/analytics/overview) — KPIs (chain block, supply, UBI revenue, protocol activity) on the live app, restored to HTTP 200 in iter 30 after a stale-build redeploy. |
| Dune / indexing-request package | 28 | ✅ shipped | [`analytics/dune-package/`](../analytics/dune-package/README.md) — SQL pack, `INDEXING_MANIFEST.json`, decoding cookbook; ready to hand to external indexers (Dune, Goldsky, Allium). |
| Tester feedback ingest | 29 | ✅ hardened | Floating "Feedback" button on every page → `/api/feedback` (rate-limited, 16 KiB body cap, schema-validated, redacted) → `frontend/data/feedback.jsonl`. Vitest 17/17 + Playwright 3/3 + live POST proof in iter 30. See [`docs/testnet/iter29-feedback-pipeline.md`](testnet/iter29-feedback-pipeline.md). |
| Stale-prod-build fix + doc checkpoint 6 | 30 | ✅ shipped | iter 30 product review caught the live `/analytics` + `/api/feedback` schema were running an outdated build. `frontend/scripts/deploy.sh` redeployed the production tree; `BUILD_ID` re-synced. Evidence: [`docs/testnet/iter30-stale-build-redeploy.md`](testnet/iter30-stale-build-redeploy.md), checkpoint summary: [`docs/testnet/iter30-readme-doc-checkpoint-6.md`](testnet/iter30-readme-doc-checkpoint-6.md). |

Cross-cutting infra hardening that landed alongside the lane work:

- **Iter 18 BLOCKER — PM2 build-less-start fence.** `frontend/scripts/pm2-launch-next.mjs` refuses to launch `next start` if `.next/` is missing a manifest or contaminated by a `next dev` tree. This prevents the third class of "HTML 200 but every chunk 500" outages.
- **Iter 19 BLOCKER — `next dev` clobber recurrence #3 closed.** `distDir` isolation for Playwright + the `goodswap-watchdog` PM2 process that probes `/_next/static/chunks/*.js` every 60 s and reloads `goodswap` after a 3-failure streak. Full operator runbook in [Frontend health (iter 19)](#frontend-health-iter-19).
- **Iter 21 BLOCKER — `--dist-dir` CLI flag unsupported.** Removed the unsupported `--dist-dir` flag from the Playwright wrapper and switched to env-based isolation so the portfolio lane could be greened in the same iteration.
- **Iter 30 CRITICAL — stale production build.** Iter 30's product review caught `/analytics` (iter 27) returning HTTP 404 and `/api/feedback` (iter 29) running the old non-validating handler on the public app, while both passed locally. The fix was procedural — run `frontend/scripts/deploy.sh` (`npm ci && npm run build && pm2 reload goodswap --update-env && scripts/check-buildid-sync.mjs --strict`) — but it confirms why **non-negotiable #6** ("public URLs and production behavior matter more than localhost") has to be enforced every five iterations. See [`docs/testnet/iter30-stale-build-redeploy.md`](testnet/iter30-stale-build-redeploy.md).

The Lend/Stable lane deferral is intentionally visible here so a tester
reading this doc does not assume rows 19/20 of the 50-iteration plan
mean those lanes have public-app proof yet — the **UBI fee routing** for
Lend and Stable, however, is fully integration-proven (iter 24) even
though the public-app lane proof remains deferred.

## Analytics + Feedback Loops (iter 26–29)

The iter 26–29 work turned the chain into something testers can actually
look at and talk back to. Four loops, all live on the public app after
the iter 30 redeploy:

### 1. Address book (iter 26)

[`analytics/address-book.json`](../analytics/address-book.json) is the
machine-readable truth source for every chain ID, RPC, explorer,
protocol contract, and UBI fee route. It is derived from
[`op-stack/addresses.json`](../op-stack/addresses.json), so when
contracts redeploy the address book follows automatically and external
indexers do not have to scrape source code or guess at deployment
broadcast files. See [`analytics/README.md`](../analytics/README.md).

### 2. Public analytics dashboard (iter 27)

The live app exposes a tester-facing dashboard at
<https://goodswap.goodclaw.org/analytics>, backed by
<https://goodswap.goodclaw.org/api/analytics/overview>. The page reads
the address book and reports:

- Current chain block + chain ID
- G$ total supply
- UBI revenue tracker balance (the on-chain "how much fee revenue has
  reached UBI so far?" number)
- Recent protocol activity counters

The endpoint returns HTTP 200 JSON; the page renders the same numbers
in a polished card layout. Iter 30's stale-build CRITICAL caught that
this route was 404 on the public app between iter 27 and iter 30 — the
iter 30 redeploy restored it. Do not skip the public-URL probe on
future doc checkpoints.

### 3. Dune / indexing-request package (iter 28)

[`analytics/dune-package/`](../analytics/dune-package/README.md) is the
external-indexer onboarding kit. It contains:

- **`INDEXING_MANIFEST.json`** — the contracts + ABIs + fee routes an
  external indexer needs to subscribe to.
- **SQL pack** — a starter set of Dune queries against the manifest
  (network usage, protocol activity, UBI fee routing, agent economy,
  faucet funnel, success/revert rates).
- **Decoding cookbook** — protocol-by-protocol notes on event semantics
  and gotchas so an indexer can ship correct dashboards without reading
  the Solidity.

Use this when handing the chain off to Dune, Goldsky, Allium, or a
custom indexer.

### 4. Tester feedback ingest (iter 29)

Every page now has a floating **Feedback** button in the bottom-right.
Click it to open a modal that captures, automatically:

- Route + full URL the tester is on
- Connected wallet address (preserved — public identifier)
- Wallet chain ID
- Viewport size + user agent
- Anonymous `sessionId` (for cross-page correlation; no PII)
- Build SHA the production app is currently serving
- The last ≤ 20 console errors observed by `ConsoleErrorCapture`
  (truncated to 500 chars each)
- The tester's own `description` + `type` (`bug` / `ux` / `feature` /
  `other`)

The form `POST`s to `/api/feedback`, which is:

1. Rate-limited (`withApiRateLimit`).
2. Body-capped at 16 KiB **before** JSON parsing.
3. Schema-validated against
   [`FeedbackPayload`](../frontend/src/lib/feedbackContext.ts) — wrong
   field name, wrong type, or out-of-bounds value returns HTTP 400 with
   a per-field message.
4. **Redacted on every string leaf** by
   [`redactDeep`](../frontend/src/lib/redactSecrets.ts) — hex private
   keys, 12/24-word BIP-39 mnemonics, JWTs, `Bearer …` tokens,
   `password=`/`api_key=` form/query fragments, and emails are replaced
   with `[REDACTED]`. Wallet addresses are intentionally preserved.
5. Persisted as one JSON line per record to `FEEDBACK_LOG_FILE`
   (defaults to `frontend/data/feedback.jsonl`, gitignored). Disk-write
   failures are logged but never bubble up — feedback never 5xx.

The on-disk JSONL stream is the operator triage queue. Tail it with:

```bash
tail -n 20 frontend/data/feedback.jsonl | jq .
```

Tests pinning this contract: Vitest 17/17 in
`frontend/src/app/api/feedback/__tests__/route.test.ts`, Playwright 3/3
in `frontend/e2e/feedback-button.spec.ts`, plus a live production POST
proof in [`docs/testnet/iter30-stale-build-redeploy.md`](testnet/iter30-stale-build-redeploy.md).

Full implementation notes (architecture diagram, redaction policy,
schema, persistence format, all proofs) live in
[`docs/testnet/iter29-feedback-pipeline.md`](testnet/iter29-feedback-pipeline.md).

## Sibling Experimental Apps (Not in Release Gate)

These apps run on the same host and are publicly reachable but are **explicitly out of scope** for the testnet release gate. They share Caddy + PM2 with `goodswap.goodclaw.org` but their health is **not** counted in `/api/status` and a failure must not block a testnet tag.

| App | URL | Port | PM2 name | Source repo |
|---|---|---|---|---|
| GoodAgent prototype | https://goodagent.goodclaw.org | 3099 | `goodagent-prototype` | `/home/goodclaw/goodagent-prototype` |

Rules per non-negotiable #8 ("Do not hide degraded services; fix them or document why they are intentionally excluded"):

1. **Excluded from `/api/status`.** The 12 backend services tracked by `/api/status` are the only services that gate releases (`swap-oracle`, `activity-reporter`, `harvest-keeper`, `liquidator`, `revenue-tracker`, `stocks-keeper`, `indexer`, `monitor`, `rpc-balancer`, `bridge-keeper`, `perps`, `predict`). Sibling apps do not appear there and do not block the gate.
2. **Still must not degrade the host.** If a sibling app hot-loops (PM2 restart counter climbing, port held by an orphaned process, or `EADDRINUSE` on its assigned port), it must be fixed or stopped — its noise cannot mask gate-relevant problems. See `.autobuilder/test-evidence/iter15/goodagent-prototype-recovery/` for the iter15 recovery from an orphaned `next-server` on port 3099.
3. **Port ownership.** Each sibling app owns one port. The testnet gate owns port 3100 (frontend). If a sibling app collides with a gate port, the sibling app loses.
4. **Triage commands** (when a sibling app is misbehaving):
   ```bash
   pm2 describe <name>                       # restart count, uptime, current PID
   ss -tlnp 'sport = :<port>'                # who actually holds the port
   ps -p <pid> -o pid,ppid,uid,etime,cmd     # PPID=1 means orphan — kill it
   ```
   If PM2's tracked PID and the port owner PID differ AND the port owner has PPID=1, kill the orphan (`kill <pid>`), then `pm2 reset <name>` to clear the restart counter.

## Dune Public Analytics

- Status: included in the testnet move plan.
- Spec: `docs/DUNE-DASHBOARD-SPEC.md`.
- Launch requirement: public proof dashboard for network usage, protocol activity, UBI fee routing, agent economy, faucet funnel, and success/revert rates.
- Indexing note: local chain `42069` uses internal indexer until the public testnet is Dune-indexed or Dune indexing is requested.

## Protocol Smoke Matrix

- GoodSwap: `0x52c01d13f34c…` (✅ success)
- GoodPerps: `0x44e23761376c…` (✅ success)
- GoodLend: `0x6cda4eb0312a…` (✅ success)
- GoodStable: `0x2306c5aef499…` (✅ success)
- GoodStocks: `0xa8325cba97be…` (✅ success)
- GoodPredict: `0x899ceb32b4a5…` (✅ success)

## UBI Fee Integration Proofs

The on-chain leg of the UBI promise — "every protocol fee routes to the
UBI revenue tracker" — is enumerated in
[`docs/UBI-FEE-ACCOUNTING.md`](UBI-FEE-ACCOUNTING.md) (14 routes) and
proven on devnet by two integration tests:

| Protocols | Routes | Proof file | Iter / commit |
|---|---|---|---|
| Swap + Perps | 1–5 | [`test/integration/UBIFeeIntegrationProofSwapPerps.t.sol`](../test/integration/UBIFeeIntegrationProofSwapPerps.t.sol) | iter 23 (`2b30ad5`) |
| Predict + Lend + Stable + Stocks | 6–14 | [`test/integration/UBIFeeIntegrationProofPredictLendStableStocks.t.sol`](../test/integration/UBIFeeIntegrationProofPredictLendStableStocks.t.sol) | iter 24 (`3f2806a`) |

All 14 routes are marked `✅ integration proven` in the accounting spec
as of iter 24. Both proof files exercise the real protocol fee paths
end-to-end and assert UBI revenue tracker balance deltas rather than
relying on unit-test mocks.

Run the proofs locally:

```bash
forge test --match-path 'test/integration/UBIFeeIntegrationProof*'
```

## Canonical Contract Addresses

The canonical sources of truth are:

- `op-stack/addresses.json` — imported by the frontend (`frontend/src/lib/devnet.ts`).
- `.autobuilder/addresses.env` — sourced by deploy scripts, backend services, and tests.

Both files are regenerated from Foundry broadcast artifacts plus on-chain
bytecode by `scripts/refresh-addresses.py`. They are protected by two CI
gates that prevent silent drift:

### Gate 1 — Diff guard (`scripts/refresh-addresses.py --check`)

Runs the full pipeline in memory and compares the result against the
files on disk. Exit code `0` means the registry matches broadcast+chain
truth; exit code `1` prints a unified diff of every byte that would
change. Run after any redeploy:

```bash
python3 scripts/refresh-addresses.py --check
```

If it fails, drop `--check` to actually rewrite the files, then commit.

### Gate 2 — Stale address scanner (`scripts/check_no_stale_addresses.py`)

Walks `frontend/src/` (override with `--paths`) for every hex address
literal of the form `0x[0-9a-f]{40}` and fails on any address that is
neither:

1. In the canonical registry above, OR
2. On the bake-in allowlist (`0x0…0`, `0x…dead`, the four Anvil dev
   wallets, the OP Stack predeploy range `0x4200…00–0x4200…FF`), OR
3. Tagged on the line itself or within 20 preceding non-blank lines
   with one of: `STALE`, `hardcoded`, `redeploy`, or `allowlist:`.

Run it as:

```bash
python3 scripts/check_no_stale_addresses.py
python3 scripts/check_no_stale_addresses.py --json   # CI-friendly
```

This is what blocks "we redeployed everything but the frontend still
points at the old MarketFactory" from sneaking into a release.

Both gates are exercised by `scripts/test_refresh_addresses.py`.

### Live addresses

- GoodDollarToken: `0x8f86403a4de0bb5791fa46b8e795c547942fe4cf`
- UBIFeeSplitter: `0x809d550fca64d94bd9f66e60752a544199cfac3d`
- UBIClaimV2: `0x9d4454b023096f34b160d6b654540c56a1f81688`
- GoodSwapRouter: `0x975cdd867acb99f0195be09c269e2440aa1b1fa8`
- SwapPriceOracle: `0x19ceccd6942ad38562ee10bafd44776ceb67e923`
- PerpEngine: `0x084815d1330ecc3ef94193a19ec222c0c73dff2d`
- MarginVault: `0x82bbaa3b0982d88741b275ae1752db85cafe3c65`
- MarketFactory: `0xfaA7b3a4b5c3f54a934a2e33D34C7bC099f96CCE`
- GoodLendPool: `0xcbeaf3bde82155f56486fb5a1072cb8baaf547cc`
- VaultManager: `0x3489745eff9525ccc3d8c648102fe2cf3485e228`
- gUSD: `0xed12be400a07910e4d4e743e4cee26ab1fc9a961`
- CollateralVault: `0x276c216d241856199a83bf27b2286659e5b877d3`
- SyntheticAssetFactory: `0xfaaddc93baf78e89dcf37ba67943e1be8f37bb8c`
- UBIRevenueTracker: `0xfd6f7a6a5c21a3f503ebae7a473639974379c351`

## Parallel Test Plan

Run lanes independently so one dapp failure does not hide the others:

- Contracts: Foundry build, unit tests, gas report, Slither audit scope.
- Swap: quote, approve, execute, price-impact guard, UBI fee routing.
- Perps: deposit margin, open/close position, liquidation threshold, API market feed.
- Predict: create market, buy/sell outcome, resolve, market detail UI.
- Lend: supply, withdraw, borrow/repay health-factor checks.
- Stable: deposit collateral, mint/repay gUSD, PSM swap, stability pool.
- Stocks: deposit collateral, mint/burn synthetic equity, oracle freshness.
- Portfolio/Claim: wallet states, balances, UBI claim, explorer links.

## Wallet Onboarding (iter 13)

Public testers should never have to type RPC URLs into MetaMask by hand.
The frontend now ships a one-click **"Add GoodChain Testnet to wallet"**
button in two places:

- `/testnet-guide` → top of the "1. Add GoodChain Testnet" section, above
  the network table. Full-width CTA; success state offers an "Open
  Faucet →" follow-up link.
- `/faucet` → compact pill above the "Wallet Address" input, framed by a
  "First time here?" hint.

Implementation:

- Component: `frontend/src/components/AddNetworkButton.tsx`
- Unit tests: `frontend/src/components/__tests__/AddNetworkButton.test.tsx`
  (8 specs, covers idle / compact / no-wallet / success / rejected /
  error states and asserts the canonical EIP-3085 payload).
- E2E: `frontend/e2e/onboarding.spec.ts` clicks the button on both pages,
  captures before/after screenshots in `frontend/e2e/screenshots/`, and
  asserts the wallet received the canonical payload.
- Mock wallet: `frontend/e2e/fixtures/wallet.ts` records every
  `wallet_addEthereumChain` call on `window.__addEthereumChainCalls`
  so the spec can introspect what reached the wallet.

The button is wired to `frontend/src/lib/devnet.ts`, which sources
`chain_id`, `rpc_url`, and `explorer_url` directly from
`op-stack/addresses.json`. No hardcoded fallbacks — when the canonical
registry changes, the onboarding flow follows automatically.

EIP-3085 payload shape sent to the wallet:

```json
{
  "chainId": "0xa455",
  "chainName": "GoodChain Testnet",
  "rpcUrls": ["https://rpc.goodclaw.org"],
  "blockExplorerUrls": ["https://explorer.goodclaw.org"],
  "nativeCurrency": { "name": "GoodDollar", "symbol": "G$", "decimals": 18 }
}
```

A manual "Or add it manually" panel remains on `/testnet-guide` for
wallets that do not implement EIP-3085 (hardware wallets, some mobile
wallets without injected providers).

### For developers (iter 14)

The in-app guide (`/testnet-guide`) now includes a **For developers** section
with a copy-pasteable RPC reachability `curl` command and direct links to
`op-stack/addresses.json`, `docs/ARCHITECTURE.md`, and this README on GitHub.
The section appears in the sticky TOC under `#for-developers`.

The frontend production build is wrapped by `frontend/scripts/atomic-build.mjs`,
which builds into a temporary `.next.tmp` directory and atomically swaps it
in only on success. Partial or failed builds can no longer corrupt the
deployed `.next/` directory. See `docs/runbooks/frontend-rebuild.md` for the
operator workflow.

## Operator runbook

### Frontend health (iter 19)

`goodswap` (port 3100) is supervised by **two** layers:

1. **PM2 launcher** (`frontend/scripts/pm2-launch-next.mjs`) — refuses to
   start `next start` if `.next/` is missing a manifest or has been clobbered
   by a `next dev` tree (`.next/static/development/`). This is the
   "fail-fast on broken build" gate; see iter19 blocker task
   `0029-iter19-blocker-playwright-clobber-recurrence-3-distdir-isolation.md`
   for the full diagnosis of the recurrence.
2. **Watchdog** (`frontend/scripts/goodswap-watchdog.mjs`, PM2 process
   `goodswap-watchdog`) — the runtime probe. Every `PROBE_INTERVAL_MS`
   (default 60s) it hits `PROBE_URL` (default `http://localhost:3100/`),
   parses the served HTML for `/_next/static/chunks/*.js` URLs, samples up
   to `chunkSampleLimit` of them, and HEADs each one. If the page is
   unreachable, returns non-200, or **any sampled chunk 404s**, the probe
   counts as a failure.

The watchdog never reloads on the first failure. It increments a streak
counter, requires the streak to reach `FAILURE_THRESHOLD` (default 3)
within the recent window, then calls `pm2 reload goodswap` and enters a
`reloadCooldownMs` window (default 5 min) before it will fire again.
A clean probe inside the recovery window resets the streak.

**Why it exists.** Three times now (iters 17/18/19) `next dev` clobbered
the production `.next/` and the only signal was 404s on
`/_next/static/chunks/*.js`. The 200 on `/` alone was not enough — the
HTML shell loaded fine while the JS bundles were gone. The watchdog
probes the same chunk URLs `check-served-chunks.mjs` uses for one-shot
verification, so the recovery check used after `atomic-build` and the
runtime watchdog see the world the same way.

**Config knobs** (all env-driven, no rebuild required):

| Env var               | Default                       | Meaning                                    |
|-----------------------|-------------------------------|--------------------------------------------|
| `PROBE_URL`           | `http://localhost:3100/`      | URL to fetch + parse for chunk references  |
| `PROBE_INTERVAL_MS`   | `60000`                       | How often to probe                         |
| `FAILURE_THRESHOLD`   | `3`                           | Consecutive failures before reload         |
| `RELOAD_COOLDOWN_MS`  | `300000`                      | Min gap between two reloads                |
| `RECOVERY_DELAY_MS`   | `30000`                       | Grace period after reload before reprobing |
| `PM2_TARGET`          | `goodswap`                    | PM2 process to reload                      |
| `WATCHDOG_LOG_FILE`   | (unset)                       | If set, mirror every JSON event to file    |

**Start / stop / inspect:**

```bash
# start (or reload if already running)
pm2 startOrReload frontend/ecosystem.watchdog.config.cjs
pm2 save

# live status + last 50 events
pm2 describe goodswap-watchdog
pm2 logs goodswap-watchdog --lines 50 --nostream

# file log (configured via WATCHDOG_LOG_FILE in the ecosystem)
tail -n 50 frontend/.autobuilder-logs/goodswap-watchdog.log
```

**Dry-run mode** (operator wants to simulate a failure without reloading
production):

```bash
PROBE_URL=http://localhost:3999/ PROBE_INTERVAL_MS=300 \
  node frontend/scripts/goodswap-watchdog.mjs --dry-run
```

This emits `reload-start` / `reload-end` events with `dryRun:true` and
exit code 0 instead of invoking `pm2 reload`, so the streak and cooldown
logic can be exercised against a deliberately unreachable port without
touching the live `goodswap` process.

**Single-shot mode** (`--once`) is used by smoke tests / CI:

```bash
node frontend/scripts/goodswap-watchdog.mjs --once
# exit 0 — current probe OK
# exit 2 — current probe failed (reason in stdout JSON)
```

**Manual recovery when the watchdog fires.** If the watchdog reloads
`goodswap` and the next probe is still failing, the `.next/` directory
is structurally broken — a `pm2 reload` alone cannot fix it. Run the
atomic rebuild from `docs/runbooks/frontend-rebuild.md` instead.

### WalletConnect / Reown Cloud allowlist

Production origin: `https://goodswap.goodclaw.org`

When deploying a new public origin (preview environment, staging,
new domain) the SDK will log a red `Origin ... not found on
Allowlist` error and a `[Reown Config] Failed to fetch remote
project configuration` warning on every page load until the origin
is added to the WalletConnect Cloud project.

To add the origin permanently (replaces the runtime suppression in
`frontend/src/lib/wagmi.ts`):

1. Log into <https://cloud.reown.com> with the project owner
   account.
2. Open the project that matches `NEXT_PUBLIC_WC_PROJECT_ID` in
   `frontend/.env.local` (last four chars: `97d1`).
3. Under **Settings → Allowed origins**, add the production URL
   (and any preview/staging URLs).
4. Reload the app and confirm the console no longer logs the
   allowlist error even with the suppression filter removed.

The runtime suppression in `wagmi.ts` is a stopgap so the public
app ships clean while waiting for cloud-side access; it is
narrowly scoped to those two exact log patterns and silences no
other Reown logging.

## Update Cadence

- Group update: every 5 autobuilder commits/iterations via `autobuilder-progress-monitor`.
- This README: regenerate with `python3 scripts/update-testnet-readme.py` before each 5-iteration push/deploy update.
- After deploy: run `bash scripts/health-check.sh` and `bash scripts/verify-onchain-integration.sh`, then regenerate this file.
