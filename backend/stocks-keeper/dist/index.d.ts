/**
 * GoodStocks Price Keeper
 *
 * Fetches real-time stock prices from Yahoo Finance (via free API) and
 * pushes them to the on-chain PriceOracle contract on GoodDollar L2.
 *
 * Architecture:
 *   1. PriceFetcher — fetches prices from Yahoo Finance v8 API (no key needed)
 *   2. OracleUpdater — calls PriceOracle.setManualPrice() for each ticker
 *   3. Main loop — runs every INTERVAL_MS, updates all configured tickers
 *
 * On devnet (Anvil), this replaces Chainlink feeds with real market prices.
 * On mainnet, this serves as a fallback / backup oracle.
 */
declare const TICKERS: string[];
interface StockQuote {
    ticker: string;
    price: number;
    priceChainlink: bigint;
    timestamp: number;
}
/**
 * Fetch stock prices from Yahoo Finance v8 API (free, no key needed).
 * Falls back to a simple scraping approach if the API changes.
 */
declare function fetchPrices(tickers: string[]): Promise<StockQuote[]>;
declare class OracleUpdater {
    private provider;
    private wallet;
    private oracle;
    private lastPrices;
    constructor(rpcUrl: string, operatorKey: string, oracleAddress: string);
    /**
     * Check if a price has deviated enough to warrant an on-chain update.
     * Avoids unnecessary gas spending for tiny price movements.
     */
    shouldUpdate(ticker: string, newPrice: bigint): boolean;
    /**
     * Push a price update to the on-chain oracle.
     */
    updatePrice(quote: StockQuote): Promise<boolean>;
    /**
     * Read the current on-chain price for a ticker.
     */
    getOnChainPrice(ticker: string): Promise<bigint>;
    /**
     * Initialize lastPrices from on-chain state.
     */
    init(): Promise<void>;
}
export { fetchPrices, OracleUpdater, StockQuote, TICKERS };
