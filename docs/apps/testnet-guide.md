# Testnet Guide — Tester Onboarding

## Routes

| Route | Purpose |
|-------|---------|
| `/testnet-guide` | Scenarios, network config, onboarding steps |

**Live:** https://goodswap.goodclaw.org/testnet-guide

## Purpose

Primary tester-facing onboarding doc rendered in-app. Complements [`docs/TESTNET_README.md`](../TESTNET_README.md) (operator-oriented).

## Network facts (from repo)

| Field | Value | Source |
|-------|-------|--------|
| Chain ID | `42069` (`0xa455`) | `op-stack/addresses.json` |
| Public RPC | `https://rpc.goodclaw.org` | `op-stack/addresses.json` |
| Explorer | `https://explorer.goodclaw.org` | `op-stack/addresses.json` |
| Web app | `https://goodswap.goodclaw.org` | docs / e2e registry |

## Frontend source

- `frontend/src/app/(app)/testnet-guide/page.tsx`
- Screenshot asset: `docs/screenshots/testnet-guide.png` (hygiene note: bloated PNG flagged for revert in [`docs/release/RC_RELEASE_HYGIENE_20260522.md`](../release/RC_RELEASE_HYGIENE_20260522.md))

## Tests & evidence

- E2E registry: `testnet-guide` — expects "Testnet" and "Scenario" copy

## Related docs

- [`docs/TESTNET_README.md`](../TESTNET_README.md)
- [`docs/TESTNET-READINESS-50-ITERATIONS.md`](../TESTNET-READINESS-50-ITERATIONS.md)

## Status (2026-05-22)

Public HTTP **200**.
