
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

# GoodChain / GoodDollar L2 Product Context

GoodChain is the GoodDollar L2 financial app stack: Swap, Perps, Stocks, Portfolio, Analytics, GoodLend, GoodStable, bridge, oracle keepers, and agent/wallet infrastructure. This initiative exists to replace mock prices with eToro demo-fed market data flowing through price-service, oracle-signer, on-chain oracles, apps, and a capped demo hedging proof.

Primary success metric: open GoodChain and see eToro demo prices for crypto/stocks coming from chain oracle, plus one capped demo hedge proof.

Critical safety: demo/read-only by default; no real account trading path may be enabled by autobuilder work.
