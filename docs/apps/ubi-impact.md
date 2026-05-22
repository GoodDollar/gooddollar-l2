# UBI Impact — Fee → UBI Narrative

## Routes

| Route | Purpose |
|-------|---------|
| `/ubi-impact` | Shows how protocol fees fund UBI |

**Live:** https://goodswap.goodclaw.org/ubi-impact

## Purpose

User-facing explanation and metrics for the core product thesis: useful financial activity routes fees into universal basic income.

## On-chain contracts

Primary reads:

- `UBIRevenueTracker` — `src/UBIRevenueTracker.sol`
- `UBIFeeSplitter` — `src/UBIFeeSplitter.sol`
- `UBIClaimV2` — `src/UBIClaimV2.sol`
- `GoodDollarToken` — `src/GoodDollarToken.sol`

## Canonical fee map

All 14 fee routes documented and integration-proven:

- [`docs/UBI-FEE-ACCOUNTING.md`](../UBI-FEE-ACCOUNTING.md)
- [`test/integration/UBIFeeIntegrationProofSwapPerps.t.sol`](../../test/integration/UBIFeeIntegrationProofSwapPerps.t.sol)
- [`test/integration/UBIFeeIntegrationProofPredictLendStableStocks.t.sol`](../../test/integration/UBIFeeIntegrationProofPredictLendStableStocks.t.sol)

## Frontend source

- `frontend/src/app/(app)/ubi-impact/page.tsx`

## Tests & evidence

- E2E registry: `ubi-impact`

## Status (2026-05-22)

Public HTTP **200**. Default UBI split: **20%** via `UBIFeeSplitter` (2000 BPS) — governance can change; see accounting spec §3.
