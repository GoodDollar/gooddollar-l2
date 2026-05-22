# Activity — Live Chain Timeline

## Routes

| Route | Purpose |
|-------|---------|
| `/activity` | Block/RPC timeline and infra heartbeat |

**Live:** https://goodswap.goodclaw.org/activity

## Purpose

Shows recent chain activity and connection health so testers can confirm the devnet is live before trading.

## Backend services

| Service | Role |
|---------|------|
| `indexer` | Event/block indexing (`backend/indexer/`, port `4200`) |
| `activity-reporter` | Protocol activity reports |
| `monitor` | Chain/contract health |

## Frontend source

- `frontend/src/app/activity/page.tsx`
- `frontend/src/app/activity/block-timeline.ts`

## Tests & evidence

- E2E registry: `activity`
- Unit: `frontend/src/app/activity/__tests__/`

## UBI fee routing

Display only.

## Status (2026-05-22)

Public HTTP **200**; `indexer` and `activity-reporter` healthy in status API snapshots.
