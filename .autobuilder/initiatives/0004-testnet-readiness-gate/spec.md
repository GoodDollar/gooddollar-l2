---
title: "Testnet Readiness Gate — 50 Iterations"
priority: P0
owner: autobuilder
model: claude-opus-4-7-thinking-high
executor: cursor
---

# Testnet Readiness Gate — 50 Iterations

## Goal
Complete the work required to move GoodDollar L2 from internal devnet demo to public testnet release candidate.

This initiative is driven by `docs/TESTNET-READINESS-50-ITERATIONS.md` and must treat that file as the canonical 50-iteration plan.

## Non-Negotiable Requirements

1. Stabilize before adding features.
2. Use Cursor CLI / Opus 4.7 for autonomous work unless explicitly changed for cost management.
3. Every iteration must end with named proof: tests, command output, health JSON, screenshots, tx hash, or explicit blocker.
4. Every 5 iterations refresh `README.md`, `docs/TESTNET_README.md`, and architecture/doc links.
5. README must stay comprehensive enough for GitHub visitors and include links to architecture files and diagrams of apps running on top of the chain.
6. Public URLs and production behavior matter more than localhost.
7. Canonical contract addresses come from `op-stack/addresses.json`; no stale hardcoded fallbacks.
8. Do not hide degraded services; fix them or document why they are intentionally excluded from release gates.
9. Keep cost under control: do not spawn unnecessary long-running agents, do not rerun expensive gates without a reason, and summarize progress every 5 iterations.

## Acceptance Criteria

- `https://goodswap.goodclaw.org` is production-built, PM2-managed, and stable.
- Public app pages `/`, `/faucet`, `/perps`, `/portfolio`, `/tests`, `/testnet-guide` return 200 and render without runtime overlays.
- `/api/status` is green, or any non-green service is formally removed from the public gate with documented reason.
- Public RPC, explorer, faucet, and docs are linked and verified.
- Swap, Perps, Predict, Lend, Stable, Stocks, Portfolio/Claim all have smoke or E2E evidence.
- UBI fee routing is documented and tested across protocols.
- `README.md` links to `docs/ARCHITECTURE.md`, `docs/TESTNET_README.md`, `docs/TESTNET-READINESS-50-ITERATIONS.md`, status/test evidence, and release/runbook docs.
- Architecture diagrams explain apps running on top of the chain: GoodSwap, GoodPerps, GoodPredict, GoodLend, GoodStable, GoodStocks, Bridge/Claim, Agent wallets, AntSeed compute.
- A release candidate manifest/tag recommendation is produced.

## Execution Plan

Follow the 50 rows in `docs/TESTNET-READINESS-50-ITERATIONS.md` in order. If an iteration discovers a blocker, fix the blocker before advancing. If the original row is already complete, verify it and move to the next row with proof.

## First Iteration

Start by running the baseline inventory from iteration 1:

- `git status --short`
- PM2 status
- port ownership for 3100
- public page checks
- `/api/status` health summary
- current chain block
- README/doc gap list

Then plan/execute the next smallest task from the 50-iteration plan.
