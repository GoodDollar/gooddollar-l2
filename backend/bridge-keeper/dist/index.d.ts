/**
 * GoodDollar Bridge Keeper
 *
 * Watches the LiFiBridgeAggregator + MultiChainBridge contracts for
 * SwapRequested / BridgeInitiated events, then:
 *   1. Fetches the best route from Li.Fi REST API
 *   2. Executes the cross-chain swap via Li.Fi
 *   3. Calls completeSwap() on the aggregator contract to finalize
 *
 * Also monitors pending fast withdrawals and matches them with LPs.
 */
export {};
//# sourceMappingURL=index.d.ts.map