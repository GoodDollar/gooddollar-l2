# Governance — DAO, Timelock & veG$

## Routes

| Route | Purpose |
|-------|---------|
| `/governance` | Proposals and voting |
| `/governance/analytics` | Governance metrics |

**Live:** https://goodswap.goodclaw.org/governance

## Purpose

On-chain governance for GoodDollar L2: `GoodDAO`, timelock, and vote-escrowed G$ (veG$).

## On-chain contracts

| Contract | Source path |
|----------|-------------|
| `GoodDAO` | `src/governance/GoodDAO.sol` |
| `GoodTimelock` | `src/governance/GoodTimelock.sol` |
| `VoteEscrowedGD` | `src/governance/VoteEscrowedGD.sol` |

Addresses in [`op-stack/addresses.json`](../../op-stack/addresses.json): `GoodDAO`, `VoteEscrowedGD`.

## Backend services

None dedicated — reads via RPC/indexer.

## Frontend source

- `frontend/src/app/(app)/governance/page.tsx`
- `frontend/src/app/(app)/governance/analytics/page.tsx`

## Tests & evidence

- E2E registry: `governance`, `governance-analytics`
- Foundry: `test/governance/`

## UBI fee routing

Governance can adjust fee splits via `UBIFeeSplitter.setFeeSplit` — see [`docs/UBI-FEE-ACCOUNTING.md`](../UBI-FEE-ACCOUNTING.md) §3.

## Status (2026-05-22)

Public HTTP **200**. Active proposal volume on devnet: **unknown** — verify on-chain.
