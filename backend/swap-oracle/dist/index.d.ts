/**
 * GoodSwap Price Oracle Keeper
 *
 * Fetches crypto prices from CoinGecko (free API, no key needed) and pushes
 * them to the on-chain SwapPriceOracle contract on GoodDollar L2.
 *
 * Architecture:
 *   1. PriceFetcher — fetches USD prices from CoinGecko simple/price API
 *   2. OracleUpdater — calls SwapPriceOracle.batchUpdatePrices()
 *   3. Main loop — runs every INTERVAL_MS, batch-updates all tokens
 *
 * On devnet (Anvil), this provides real market prices for the DEX.
 * On mainnet, this serves as one of multiple oracle sources.
 */
export {};
