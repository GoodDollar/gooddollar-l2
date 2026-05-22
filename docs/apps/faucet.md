# Faucet — Testnet Funding

## Routes

| Route | Purpose |
|-------|---------|
| `/faucet` | Claim native gas and test assets |

**Live:** https://goodswap.goodclaw.org/faucet

## Purpose

Funds testers on GoodDollar L2 devnet without manual operator transfers. Server-side route enforces sanitization, rate limits, and capacity checks.

## On-chain contracts

Dispenses devnet tokens configured in faucet handler — reads from `op-stack/addresses.json` and deploy artifacts. See `frontend/src/app/api/faucet/route.ts`.

## Backend services

Faucet is implemented as a **Next.js API route**, not a separate PM2 service:

- `frontend/src/app/api/faucet/route.ts`
- `frontend/src/app/api/faucet/sanitize.ts`

## Tests & evidence

- E2E: `frontend/e2e/faucet-reliability.spec.ts` — **10 passed, 1 skipped** per RC coordinator report
- Vitest: `frontend/src/app/api/faucet/__tests__/`
- E2E registry: `faucet`

## UBI fee routing

Not applicable (faucet distributes test funds).

## Status (2026-05-22)

Public HTTP **200**. RC merge includes faucet validation hardening (burn/null/contract checks).

## Operator notes

- `GET /api/faucet` returns HTTP 405 (POST-only) — expected.
- Do not expose operator keys in client-side env; server uses configured signer (exact env var names: **see `frontend/.env.example` if present, otherwise operator runbook** — not documented in repo root).
