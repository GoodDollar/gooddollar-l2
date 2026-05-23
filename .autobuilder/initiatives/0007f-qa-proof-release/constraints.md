
<!-- YONI-PRICE-FLOW-OVERRIDE 2026-05-23T18:50Z -->

## URGENT OVERRIDE — prices flowing on testnet is the goal

Yoni asked directly: "Are prices flowing on testnet? That should be the goal of all cursor clis."

For every Cursor/autobuilder lane, the priority is now end-to-end testnet price flow:

`eToro/demo or safe fixture quote -> price-service -> oracle-signer -> on-chain oracle/testnet status -> frontend/proof page shows source/timestamp/freshness`

Do not spend cycles on cosmetic polish, unrelated UX, fabricated analyst/news content, or extra abstractions unless they directly unblock that path. If a task does not move real/safe testnet price flow forward, stop and create/execute a task that does.

Required evidence before considering the lane useful:
- price-service reachable and serving non-empty normalized quotes,
- oracle-signer reachable and consuming/publishing or health-only with explicit blocker,
- on-chain freshness checked or explicitly blocked by missing `LANE7_RPC` / signer key,
- proof/status UI shows the live source, timestamp, stale state, and tx/freshness status,
- real trading remains fenced (`REAL_TRADING_ENABLED=false`; demo/read-only only).

<!-- /YONI-PRICE-FLOW-OVERRIDE -->

# Initiative Constraints — 0007 eToro Live Prices and Hedging

- Use Cursor executor with model `claude-opus-4-7-thinking-high`.
- Work in this worktree only. Do not edit /home/goodclaw/gooddollar-l2 directly.
- Do not push from autobuilder lanes; commits stay local for integration review.
- Protect secrets: never echo credential values or write them to tracked files/logs.
- Treat demo eToro trading as the maximum allowed external side effect; real trading must remain impossible.
- Prefer small, testable commits. Each executed task must include verification evidence.

## Mandatory Clean-Code Gate (Yoni / 2026-05-23)

Before every commit, read and apply `.cursor/skills/autobuilder/thermo-nuclear-code-quality-review/SKILL.md`. Treat the thermo-nuclear review as a blocker gate, not a suggestion: delete complexity rather than move it, avoid file sprawl past ~1k lines, reject spaghetti/special-case branching, remove thin wrappers, keep feature logic in canonical layers, and tighten type boundaries. Do not commit code that merely works but makes the codebase messier.


## Official eToro API docs / price-source correction (added 2026-05-23)

Before any remaining eToro, price-service, oracle, app integration, hedge, or proof task, read `.autobuilder/OFFICIAL_ETORO_API_PRICE_SOURCE.md` and use the official MCP server in `.cursor/mcp.json` (`etoro-api-docs` -> `https://api-portal.etoro.com/mcp`).

Do not guess eToro endpoints or rely on internal wrappers if they conflict with official docs. Correct current-price source is `GET https://public-api.etoro.com/api/v1/market-data/instruments/rates?instrumentIds=...` after resolving IDs with `GET /market-data/search` and required `fields`. The final proof must show real demo/API quotes for crypto and stocks flowing through price-service into chain oracle; fixture tests are acceptable only until demo keys are available.
