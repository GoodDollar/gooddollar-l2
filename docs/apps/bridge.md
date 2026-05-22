# Bridge — L1/L2 & Cross-Chain

## Routes

| Route | Purpose |
|-------|---------|
| `/bridge` | Bridge UX for L1/L2 and multichain test flows |

**Live:** https://goodswap.goodclaw.org/bridge

## Purpose

Move assets between GoodDollar L2 and external chains. Combines native OP Stack bridge UX with Li.Fi aggregator integration.

## On-chain contracts

| Contract | Source path |
|----------|-------------|
| `LiFiBridgeAggregator` | `src/swap/LiFiBridgeAggregator.sol` |
| `GoodDollarBridgeL1` / `GoodDollarBridgeL2` | `src/bridge/` |
| `FastWithdrawalLP` | `src/bridge/FastWithdrawalLP.sol` |
| `MultiChainBridge` | `src/bridge/MultiChainBridge.sol` |

Canonical bridge address in JSON: `LiFiBridgeAggregator`.

## Backend services

| Service | Role |
|---------|------|
| `bridge-keeper` | Bridge support/health (`backend/bridge-keeper/`) |

## Frontend source

- `frontend/src/app/(app)/bridge/page.tsx`

## Tests & evidence

- E2E registry: `bridge` in [`e2eRegistry.json`](../../frontend/src/lib/tests/e2eRegistry.json)
- Foundry: `test/bridge/`, `test/GoodDollarBridge.t.sol`

## UBI fee routing

Li.Fi bridge fee path — route 2 in [`docs/UBI-FEE-ACCOUNTING.md`](../UBI-FEE-ACCOUNTING.md).

## Status (2026-05-22)

Public HTTP **200**; `bridge-keeper` healthy in status API snapshots. End-to-end mainnet bridge flows: **not verified in this doc** — devnet/testnet only.
