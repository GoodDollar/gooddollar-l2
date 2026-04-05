/**
 * Liquidator bot configuration.
 *
 * Reads from environment variables with sensible devnet defaults.
 */
export declare const CONFIG: {
    /** JSON-RPC endpoint */
    readonly rpcUrl: string;
    /** Private key for the liquidator EOA (Anvil default deployer) */
    readonly privateKey: string;
    /** Polling interval in ms */
    readonly pollIntervalMs: number;
    /** Minimum profit threshold (in ETH terms) to execute a liquidation */
    readonly minProfitEth: number;
    readonly goodLendPool: string;
    readonly goodLendOracle: string;
    /** GoodLend reserve assets to monitor */
    readonly lendAssets: string[];
    readonly vaultManager: string;
    readonly collateralRegistry: string;
    readonly gUSD: string;
};
//# sourceMappingURL=config.d.ts.map