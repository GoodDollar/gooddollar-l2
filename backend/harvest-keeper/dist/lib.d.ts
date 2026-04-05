/**
 * Harvest Keeper Library — Auto-Compound Engine for GoodYield Vaults
 *
 * Periodically discovers all vaults from VaultFactory, checks if they have
 * harvestable yield, and calls harvest() to compound profits + route UBI fees.
 *
 * Harvest decision logic:
 *   - Only harvest if vault has > 0 totalDebt (assets deployed to strategy)
 *   - Only harvest if enough time has passed since lastReport (configurable)
 *   - Estimate gas cost vs expected profit to avoid unprofitable harvests
 *   - Track harvest history for analytics
 */
export declare const VaultFactoryABI: string[];
export declare const GoodVaultABI: string[];
export declare const StrategyABI: string[];
export declare const ERC20ABI: string[];
export interface VaultInfo {
    address: string;
    name: string;
    symbol: string;
    asset: string;
    assetSymbol: string;
    assetDecimals: number;
    totalAssets: bigint;
    totalDebt: bigint;
    totalSupply: bigint;
    lastReport: number;
    strategy: string;
    strategyAssets: bigint;
    paused: boolean;
    totalGain: bigint;
    totalUBIFunded: bigint;
}
export interface HarvestResult {
    vault: string;
    vaultName: string;
    profit: bigint;
    loss: bigint;
    txHash: string;
    gasUsed: bigint;
    timestamp: number;
}
export interface HarvestKeeperConfig {
    rpcUrl: string;
    privateKey: string;
    factoryAddress: string;
    minHarvestIntervalSeconds: number;
    minProfitThresholdBPS: number;
    dryRun: boolean;
    maxGasPrice: bigint;
}
export declare const DEFAULT_CONFIG: Partial<HarvestKeeperConfig>;
export declare class HarvestKeeper {
    private provider;
    private signer;
    private factory;
    private config;
    private harvestHistory;
    constructor(config: HarvestKeeperConfig);
    /** Discover all vaults from VaultFactory */
    discoverVaults(): Promise<VaultInfo[]>;
    /** Get detailed info for a single vault */
    getVaultInfo(address: string): Promise<VaultInfo>;
    /** Decide whether a vault should be harvested */
    shouldHarvest(vault: VaultInfo, now: number): {
        harvest: boolean;
        reason: string;
    };
    /** Execute harvest on a single vault */
    harvestVault(vaultAddress: string): Promise<HarvestResult | null>;
    /** Run one complete harvest cycle across all vaults */
    runCycle(): Promise<HarvestResult[]>;
    /** Get factory-level stats */
    getFactoryStats(): Promise<{
        tvl: bigint;
        ubiFunded: bigint;
        vaultCount: number;
    }>;
    /** Start continuous keeper loop */
    startLoop(intervalMs?: number): Promise<void>;
    getHistory(): HarvestResult[];
}
