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
