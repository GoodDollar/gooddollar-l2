# GoodStable — gUSD Stablecoin

## Routes

| Route | Purpose |
|-------|---------|
| `/stable` | Mint/repay gUSD, PSM, vault, stability pool |

**Live:** https://goodswap.goodclaw.org/stable

## Purpose

Over-collateralized gUSD stablecoin (Maker/DAI-style): CDPs, peg stability module, stability pool, and vault manager.

## On-chain contracts

| Contract | Source path |
|----------|-------------|
| `gUSD` | `src/stable/gUSD.sol` |
| `VaultManager` | `src/stable/VaultManager.sol` |
| `CollateralRegistry` | `src/stable/CollateralRegistry.sol` |
| `PegStabilityModule` | `src/stable/PegStabilityModule.sol` |
| `StabilityPool` | `src/stable/StabilityPool.sol` |
| `StableUBIFeeSplitter` | `src/stable/StableUBIFeeSplitter.sol` |

Addresses in [`op-stack/addresses.json`](../../op-stack/addresses.json): `gUSD`, `VaultManager`, `PegStabilityModule`, etc.

## Backend services

| Service | Role |
|---------|------|
| `liquidator` | Stable vault liquidations |
| `harvest-keeper` | Vault-related automation |

## Frontend source

- `frontend/src/app/(app)/stable/page.tsx`

## Tests & evidence

- E2E registry: `stable` in [`e2eRegistry.json`](../../frontend/src/lib/tests/e2eRegistry.json)
- Foundry: `test/GoodStable.t.sol`, UBI proof routes 9–12
- Lane script: `./scripts/run-dapp-lane.sh stable`

## UBI fee routing

Stability, minting, liquidation, governance fees — routes 9–12 in [`docs/UBI-FEE-ACCOUNTING.md`](../UBI-FEE-ACCOUNTING.md).

## Status (2026-05-22)

Public HTTP **200**. Public-app lane proof: **deferred** (same as Lend); UBI integration: **proven**.
