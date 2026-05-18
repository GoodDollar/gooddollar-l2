# Iter 25 — README / Doc Checkpoint 5

**Date:** 2026-05-18
**Initiative:** `0004-testnet-readiness-gate`
**Task:** [`0036-iter25-readme-doc-checkpoint-5`](../../.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/0036-iter25-readme-doc-checkpoint-5.md)
**Row in 50-iter plan:** Row 25 — _README/doc checkpoint 5_.

## What this checkpoint covers

Iter 25 is the fifth of the every-5-iter mandatory documentation
refreshes (non-negotiable #4 in the initiative spec). The previous four
checkpoints landed at iter 5, 10, 15, and 20; this one folds in the
work executed in iter 20–24:

- iter 20 — README/doc checkpoint 4 + gate.
- iter 21 — Stocks/portfolio lane hardening (`--dist-dir` blocker
  cleared, `portfolio-journey.spec.ts` greened).
- iter 22 — UBI fee truth source (`docs/UBI-FEE-ACCOUNTING.md`, 14
  canonical routes).
- iter 23 — UBI integration proof I for Swap + Perps
  (`test/integration/UBIFeeIntegrationProofSwapPerps.t.sol`, routes
  1–5, commit `2b30ad5`).
- iter 24 — UBI integration proof II for Predict + Lend + Stable +
  Stocks
  (`test/integration/UBIFeeIntegrationProofPredictLendStableStocks.t.sol`,
  routes 6–14, commit `3f2806a`); after this iteration all 14 routes
  in the accounting spec read `✅ integration proven`.

## Surface-sweep proof (gate inputs)

The product-review step ran the broad surface sweep before the
documentation work:

- **Public pages (13).** Home, `/faucet`, `/perps`, `/portfolio`,
  `/tests`, `/testnet-guide`, `/predict`, `/stocks`, `/explore`,
  `/lend`, `/stable`, `/activity`, `/ubi-impact` — all served HTTP 200
  from `https://goodswap.goodclaw.org`. Screenshots captured into
  `/tmp/iter25-screenshots/` and visually inspected; no broken
  layouts, blank areas, or runtime overlays observed.
- **`/api/status`.** 12 / 12 services reported `ok` and the
  aggregator returned `green`. Captured to `/tmp/iter25-status.json`.
- **Console errors.** 0 errors across all 13 public pages.
- **Foundry contract suite.** `forge test` — **1126 / 1126 passing**.

Per non-negotiable #3, this is the named proof for iter 25's gate
inputs.

## Files touched by this checkpoint

- `README.md` — refreshed header timestamp (`2026-05-18 08:22 UTC`),
  iteration counter (`iter 25 / 50 complete; iter 26 next`), Foundry
  test count line, "Recent readiness milestones" extended through
  iter 25, and a "Canonical fee map" sub-paragraph linking
  `docs/UBI-FEE-ACCOUNTING.md` and both integration proof tests.
  The Key Docs list now includes the UBI accounting spec, this
  document, and the link-check artefact.
- `docs/TESTNET_README.md` — "Protocol Lane Hardening Status" heading
  re-tagged from iter 16–19 to **iter 16–24**, table extended with
  iter 21 Portfolio/Claim, iter 22 UBI fee truth source, iter 23 UBI
  proof I, and iter 24 UBI proof II rows. New "UBI Fee Integration
  Proofs" section added below the Protocol Smoke Matrix linking
  both proof files and the canonical accounting spec.
- `docs/TESTNET-READINESS-50-ITERATIONS.md` — row 25 annotated with
  the executed marker and links to this artefact; new
  "Recent Executed Iterations (iter 20–25)" table appended after
  the Iteration Evidence section.
- `docs/testnet/iter25-readme-doc-checkpoint-5.md` — this file.
- `docs/testnet/iter25-link-check.md` — link-check artefact (see
  Phase 5 below).

## Phase 5 — link check

`scripts/check-doc-links.py` was run against the refreshed docs.
Output captured at
[`docs/testnet/iter25-link-check.md`](iter25-link-check.md). All
links resolve (`checked=50 broken=0`) once this file and the
link-check artefact exist on disk.

## Why this matters

Two of the most consequential pieces of work on the readiness plan —
the canonical UBI fee map (iter 22) and its two integration proofs
(iter 23 + 24) — landed _between_ checkpoint 4 (iter 20) and
checkpoint 5 (iter 25). Without this refresh, a GitHub visitor or
external tester opening `README.md` would not see that GoodDollar
L2 already has integration-proven UBI fee routing across all six
DeFi protocols. After iter 25 the README, the testnet guide, and
the 50-iteration plan all surface that fact and link directly to
the proofs.

## Next checkpoint

The next mandatory documentation refresh is **iter 30** — README/doc
checkpoint 6. By that point the plan expects analytics work (rows
26–30) to have landed, so checkpoint 6 should fold in the analytics
address book, internal analytics dashboard, and Dune package alongside
any feedback-pipeline progress.
