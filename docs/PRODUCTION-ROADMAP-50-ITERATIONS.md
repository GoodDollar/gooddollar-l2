# GoodDollar L2 — Next 50 Iterations to Production + Dune Analytics

_Last updated: 2026-05-16 UTC._

Current baseline: autobuilder iteration 46, devnet chain `42069`, public frontend/explorer/RPC live, six protocol smoke lanes green, Dune dashboard spec drafted.

## Production Definition

We call this production-ready when all of the following are true:

1. Persistent public testnet is stable for 7+ days with no state resets.
2. Public RPC, explorer, faucet, frontend, status page, and docs are live.
3. Canonical `addresses.json` and verified contracts are published.
4. Swap, Perps, Predict, Lend, Stable, Stocks, Bridge, Claim all have passing smoke + E2E lanes.
5. UBI fee routing emits one standardized analytics event across every fee-producing protocol.
6. Dune or interim analytics dashboard publicly proves usage, UBI fees, faucet funnel, and reliability.
7. Security gates are green: Slither, Foundry fuzz/invariants, dependency audit, manual bridge review.
8. Mainnet launch runbook, incident runbook, multisig/governance setup, and rollback plan are approved.
9. First real-utility lane is live: G$ bridge / AntSeed compute bridge beta with strict caps.
10. Production tag is cut and release notes are published.

## Iteration Plan

### Phase 1 — Public Testnet Foundation (47–56)

| Iter | Goal | Exit Criteria |
|---:|---|---|
| 47 | Freeze persistent OP Stack testnet topology | Sequencer/proposer/batcher/RPC state persisted; no disposable devnet reset path in public config. |
| 48 | Canonical address registry | `addresses.json` generated from deploy artifacts and consumed by frontend/backend/tests. |
| 49 | Public faucet MVP | Rate-limited faucet for test ETH + test G$; faucet events indexed. |
| 50 | Explorer verification pass | Core contracts verified; explorer shows readable txs/events for all six dapps. |
| 51 | Status page | Public status page shows RPC, block height, explorer, frontend, faucet, indexer, CI/deploy. |
| 52 | Frontend environment freeze | One production-like `.env.testnet`; no local fallback addresses in browser bundle. |
| 53 | Wallet onboarding | Add “add network”, “get test tokens”, and first-action CTA flow. |
| 54 | Release gate automation | `testnet:gate` script runs health-check, smoke, E2E matrix, address sync, docs update. |
| 55 | Testnet launch docs | User docs + developer quickstart + contract address page + known-risk page. |
| 56 | Tag public testnet beta | Tag `testnet-0.1`; publish beta announcement only if gates pass. |

### Phase 2 — Dune + Analytics Proof Layer (57–66)

| Iter | Goal | Exit Criteria |
|---:|---|---|
| 57 | Standardize `UBIFeeRouted` event | Event added to shared interface/library with stable protocol IDs. |
| 58 | Wire `UBIFeeRouted` in GoodSwap + bridge fees | Swap/bridge fee paths emit canonical event; tests assert payload. |
| 59 | Wire `UBIFeeRouted` in Perps | Open/close/funding/liquidation fee paths emit canonical event. |
| 60 | Wire `UBIFeeRouted` in Lend/Stable/Stocks/Predict | All remaining fee-producing protocols emit canonical event. |
| 61 | Analytics address book | Publish machine-readable contract labels, protocol IDs, ABI refs, event signatures. |
| 62 | Internal indexer dashboard | Interim SQL/API dashboard covers txs, DAW, protocol activity, UBI fees, reverts. |
| 63 | Dune indexing request/package | Submit chain/indexing request or map to Dune-supported environment; include metadata + ABIs. |
| 64 | Dune query pack v1 | Queries: address book, active wallets, classifier, UBI daily/by-protocol, claims, reverts. |
| 65 | Dune funnel + agent economy | Faucet-to-first-tx, D1/D7 retention, agent activity leaderboard, agent UBI contribution. |
| 66 | Public analytics launch | Dune dashboard live or interim dashboard published as `pending Dune indexing`; linked from app/docs. |

### Phase 3 — Protocol Hardening + Economic Safety (67–76)

| Iter | Goal | Exit Criteria |
|---:|---|---|
| 67 | Foundry invariant suite | Invariants for UBI split, vault solvency, bridge accounting, no unauthorized mint/burn. |
| 68 | Fuzz critical protocol inputs | Swap, perps order sizing, stable mint/repay, lend borrow/repay, predict buy/sell fuzzed. |
| 69 | Oracle safety layer | Staleness checks, bounds, fallback behavior, and monitoring for every oracle-dependent module. |
| 70 | Treasury/risk caps | Global/per-user caps for faucet, bridge, AntSeed compute, perps leverage, stable minting. |
| 71 | Liquidity bootstrap plan | Testnet liquidity scripts + mainnet seed liquidity assumptions documented and simulated. |
| 72 | Slither/CodeQL clean baseline | Known false positives filtered; new high/critical findings fail CI. |
| 73 | Dependency/security audit | Frontend/API dependency audit clean or accepted-risk file with owners/dates. |
| 74 | Manual bridge review | L1/L2 bridge, fast withdrawal, messenger assumptions documented and patched. |
| 75 | Fee accounting reconciliation | UBI fees in events, contract balances, and dashboard totals reconcile within tolerance. |
| 76 | Security beta tag | Tag `testnet-0.2-security`; publish hardening report. |

### Phase 4 — Real Utility: G$ Bridge + AntSeed Compute (77–86)

| Iter | Goal | Exit Criteria |
|---:|---|---|
| 77 | GoodDollar V1 bridge integration design | Final V1→Base/L2 route selected; trust assumptions and contracts documented. |
| 78 | G$ bridge testnet implementation | Users can bridge/mint test G$ through canonical UI path. |
| 79 | AntSeed compute bridge repo integration | `good-ai-compute-bridge` wired into GoodDollar L2 docs/app as experimental lane. |
| 80 | AntSeed treasury vault controls | USDC inventory/deposit flow with caps, reserve threshold, pause, operator roles. |
| 81 | G$→AI credits contract deploy | `AntSeedCreditVault` deployed on testnet; G$ deposit mints non-withdrawable credits. |
| 82 | Usage metering backend | Lock/settle/refund usage sessions against AntSeed calls; all sessions auditable. |
| 83 | GoodAgent wallet connect | GoodAgent auth + funding/onboarding path documented and tested. |
| 84 | Compute UX | App lane: “Spend G$ on AI compute”; quote, deposit, run model, show cost/refund. |
| 85 | Abuse controls | Per-wallet limits, velocity limits, allowlist/beta mode, error handling, anti-drain tests. |
| 86 | Real-utility beta tag | Tag `testnet-0.3-utility`; invite small beta group. |

### Phase 5 — Production Operations + Mainnet Candidate (87–96)

| Iter | Goal | Exit Criteria |
|---:|---|---|
| 87 | Observability pack | Grafana/Prometheus or equivalent for chain, RPC, app, indexer, faucet, bridge, AntSeed. |
| 88 | Incident runbooks | RPC down, sequencer stuck, faucet drained, bridge paused, oracle stale, frontend broken. |
| 89 | Governance/multisig setup | Owners moved to multisig/timelock where appropriate; emergency guardian documented. |
| 90 | Backup/restore drill | Restore chain/indexer/app state from backup in staging; RTO/RPO measured. |
| 91 | Load testing | RPC/frontend/faucet/indexer tested under launch traffic assumptions. |
| 92 | External audit prep | Audit packet: architecture, threat model, contracts, tests, deployment scripts, known risks. |
| 93 | Fix audit/blocker findings | All critical/high findings fixed; medium findings owned with launch decision. |
| 94 | Mainnet launch rehearsal | Full deploy rehearsal from clean env; generate addresses, verify, run gates, rollback. |
| 95 | Production candidate freeze | Tag `rc-1`; only release-blocker fixes allowed; analytics and docs frozen. |
| 96 | Production launch decision | Go/no-go checklist signed; production tag + release notes + Dune dashboard published. |

## Dune Analytics Workstream Details

Dune is a launch artifact, not a post-launch report. The analytics workstream must produce:

- **Address book:** all canonical protocol contracts, deployments, ABIs, labels, protocol IDs.
- **Transaction classifier:** maps every tx to Swap, Perps, Predict, Lend, Stable, Stocks, Bridge, Claim, Faucet, Agent.
- **UBI fee truth table:** canonical `UBIFeeRouted` events by protocol/token/payer/action.
- **Faucet funnel:** recipients, first tx, first dapp tx, 3+ tx conversion, D1/D7 retention.
- **Reliability:** indexed block lag, success/revert rate, failed method selectors, RPC latency if available.
- **Agent economy:** agent registrations, agent txs, agent volume, agent UBI contribution.

If Dune does not index the chain by public testnet day, launch with the internal dashboard and mark the Dune dashboard as `pending indexing`. Do not block all product testing on Dune indexing, but do block production on having a public analytics proof layer.

## Cadence

- Keep the current autobuilder cadence: one group update every 5 iterations/commits.
- Every 10 iterations: cut a milestone tag and regenerate `docs/TESTNET_README.md`.
- Every phase: run full gates and publish a concise risk/update note.
- Production is not a date; production is the checklist above turning green.
