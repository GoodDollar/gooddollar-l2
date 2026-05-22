# GoodYield — Vault Strategies

## Routes

| Route | Purpose |
|-------|---------|
| `/yield` | Yield vaults / harvest surface |

**Live:** https://goodswap.goodclaw.org/yield

## Purpose

Yield aggregation UI for GoodVault strategies (lending + stablecoin strategies on-chain).

## On-chain contracts

| Contract | Source path |
|----------|-------------|
| `GoodVault` | `src/yield/GoodVault.sol` |
| `VaultFactory` | `src/yield/VaultFactory.sol` |
| `LendingStrategy` | `src/yield/strategies/LendingStrategy.sol` |
| `StablecoinStrategy` | `src/yield/strategies/StablecoinStrategy.sol` |

Addresses: `VaultFactory` in [`op-stack/addresses.json`](../../op-stack/addresses.json).

## Backend services

| Service | Role |
|---------|------|
| `harvest-keeper` | Automated harvest lane (`backend/harvest-keeper/`) |

## Frontend source

- `frontend/src/app/(app)/yield/page.tsx`

## Tests & evidence

- E2E registry: `yield` in [`e2eRegistry.json`](../../frontend/src/lib/tests/e2eRegistry.json)
- Foundry: `test/GoodYield.t.sol`, `test/YieldStrategies.t.sol`, `test/GoodYieldStrategies.t.sol`

## UBI fee routing

Yield strategies interact with Lend/Stable protocols; underlying fee paths are covered in UBI routes 9–12.

## Status (2026-05-22)

Public HTTP **200**; harvest-keeper reported healthy in `/api/status` snapshots.
