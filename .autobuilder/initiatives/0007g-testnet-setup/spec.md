---
title: "Lane 7 — Internal Testnet Setup + Integration"
---

# Lane 7 — Internal Testnet Setup + Integration

## Mission
Set up a parallel internal testnet candidate for initiative `0007-etoro-live-prices-and-hedging` while lanes 1–6 continue running. Work only in this worktree: `/home/goodclaw/goodchain-live-prices-lanes/lane7-testnet-setup`.

## Context
Yoni asked on 2026-05-23 17:31 UTC: “run another parallel lane to setup testnet”. The target from the coordinator is:
1. Internal testnet candidate ASAP.
2. Public/shareable testnet only after smoke + health gate soak.

Known clean lane heads at bootstrap:
- lane1 `6b99f069` — register price-service in backend/ecosystem.config.js
- lane2 `ee8ead66` — align ENDPOINT_CATALOG responseShape strings to timestamp/timestampIso wire
- lane3 `94de9037` — surface oracle provenance in status badge
- lane4 `5b120e67` — keep ticker chart spot price aligned with oracle badge age
- lane5 `60919c44` — in-app hedge proof viewer page
- lane6 `de7a4b44` — cover pipeline flow diagram state colors

Known dirty/skipped work in active lanes at bootstrap:
- lane2 has failing `server-symbol-not-configured-suggestions.test.ts`: APLE expected didYouMean AAPL but got undefined.
- lane3 has failing `OracleStatusBadge.test.tsx` provenance/block-link expectations.
Do not blindly cherry-pick failing dirty work. Only integrate commits that pass relevant tests or document precise blockers.

## Definition of Done
- A local integration/testnet branch exists in this lane with safe commits only.
- Clean lane commits are cherry-picked or merged in a controlled order, or conflicts/blockers are documented precisely.
- `oracle-signer` and `hedge-engine` are classified in the testnet health contract/status dashboards so they are not invisible.
- Internal testnet runbook exists with exact commands for build, deploy, start/reload, smoke, rollback.
- Smoke gate covers: price-service health, oracle-signer health/status, on-chain oracle freshness, frontend proof/status page, no real-trading path enabled.
- If deploy is safe without touching production/main worktree, prepare or run internal-only testnet start commands. If any step would affect production services, stop and write the exact approval needed.
- Leave evidence in `.autobuilder/status.md`, `.autobuilder/journal.jsonl`, and commits.

## Safety Gates
- Never push.
- Never touch `/home/goodclaw/gooddollar-l2` main worktree.
- Real trading must remain fenced: `REAL_TRADING_ENABLED=false`; no real eToro execution endpoints.
- Demo-only: `ETORO_MODE=demo-readonly` or `demo-trading` only with strict caps; prefer dry-run/read-only for testnet setup.
- Do not print secrets. Use env presence checks and redacted diagnostics only.
- Do not restart production PM2 services (`goodswap`, `goodperps`, `goodpredict`) unless an explicit user approval is requested and received. Internal lane services may use lane-specific names/ports only.
- Preserve `.cursor/mcp.json` with the eToro API docs MCP.

## Suggested First Tasks
1. Inventory current testnet scripts/docs/health contract and PM2 configs without modifying main.
2. Create a lane-local integration plan and blocker list.
3. Cherry-pick clean lane heads in smallest safe batches, running targeted tests after each batch.
4. Add/adjust health contract classification for `oracle-signer` and `hedge-engine`.
5. Produce internal testnet runbook and smoke command.
