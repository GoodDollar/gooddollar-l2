# Agents — Agent Wallets & Automation

## Routes

| Route | Purpose |
|-------|---------|
| `/agents` | Agent leaderboard / discovery |
| `/agents/register` | Register an agent |
| `/agents/[address]` | Agent detail |

**Live:** https://goodswap.goodclaw.org/agents

**External dashboard:** https://paperclip.goodclaw.org

## Purpose

Entry point for the agent economy: registered agents that transact on-chain and route fees to UBI. Integrates with Paperclip control plane and the TypeScript agent SDK.

## On-chain contracts

| Contract | Source path |
|----------|-------------|
| `AgentRegistry` | `src/AgentRegistry.sol` |

## Backend services

| Service | Role |
|---------|------|
| `activity-reporter` | Agent/protocol activity (`AGENT_REGISTRY` env) |
| `goodagent-*` PM2 prototypes | **Unstable** — flapping with high restart counts per 2026-05-22 status (not production-ready) |

## SDK & tooling

- [`sdk/README.md`](../../sdk/README.md) — `@gooddollar/agent-sdk`
- Examples: `sdk/examples/trading-bot.ts`, `sdk/examples/arbitrage-agent.ts`

## Frontend source

- `frontend/src/app/(app)/agents/page.tsx`
- `frontend/src/app/(app)/agents/register/page.tsx`
- `frontend/src/app/(app)/agents/[address]/page.tsx`

## Tests & evidence

- E2E registry: `agents`, `agents-register`
- Foundry: `test/AgentRegistry.t.sol`
- Unit: `frontend/src/app/__tests__/agents.test.tsx`, `agents-register.test.tsx`

## UBI fee routing

Agent transactions use the same protocol fee paths as human users.

## Status (2026-05-22)

Public HTTP **200** for agent routes. Paperclip dashboard HTTP **200**. Agent prototype PM2 processes: **not stable** — do not depend on them for RC demos.
