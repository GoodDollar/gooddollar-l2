/**
 * UBI Revenue Tracker Keeper
 *
 * Periodically queries each protocol's fee-generating contracts on GoodDollar L2
 * and reports cumulative fee data to the UBIRevenueTracker contract. Also takes
 * daily snapshots for the UBI Impact Dashboard charting.
 *
 * Architecture:
 *   1. ProtocolFeeCollector — reads fee data from each protocol's contracts
 *   2. RevenueReporter — calls UBIRevenueTracker.reportFees() + takeSnapshot()
 *   3. Main loop — runs every INTERVAL_MS, aggregates and reports
 *
 * Protocols tracked:
 *   - GoodSwap:    Pool trade volume → UBI fee routing
 *   - GoodPerps:   PerpEngine trading fees
 *   - GoodPredict: MarketFactory resolution fees
 *   - GoodLend:    Pool interest spread
 *   - GoodStable:  VaultManager stability fees
 *   - GoodStocks:  SyntheticAssetFactory mint/redeem fees
 *   - GoodBridge:  FastWithdrawalLP + MultiChainBridge fees
 */
import { ethers } from 'ethers';
interface ProtocolConfig {
    id: number;
    name: string;
    category: string;
    contracts: {
        address: string;
        abi: string[];
        feeField?: string;
        txField?: string;
    }[];
}
declare const PROTOCOLS: ProtocolConfig[];
interface FeeReport {
    protocolId: number;
    name: string;
    totalFees: bigint;
    ubiPortion: bigint;
    txCount: bigint;
}
/**
 * Query a protocol's contracts for cumulative fee data.
 * Gracefully handles missing functions (devnet contracts may not all expose fee getters).
 */
declare function collectProtocolFees(provider: ethers.JsonRpcProvider, protocol: ProtocolConfig): Promise<FeeReport>;
/**
 * Compute delta from last reported values.
 * Only report incremental changes (not cumulative totals).
 */
declare function computeDelta(report: FeeReport): {
    fees: bigint;
    ubi: bigint;
    txs: bigint;
} | null;
declare class RevenueReporter {
    private provider;
    private wallet;
    private tracker;
    private lastSnapshotTime;
    constructor(rpcUrl: string, operatorKey: string, trackerAddress: string);
    /**
     * Initialize — read current tracker state to avoid re-reporting.
     */
    init(): Promise<void>;
    /**
     * Collect fees from all protocols and report deltas to the tracker.
     */
    runCycle(): Promise<void>;
    /**
     * Take a daily snapshot for historical charting.
     */
    takeSnapshot(): Promise<void>;
    /**
     * Print current dashboard summary (for status reports).
     */
    printStatus(): Promise<void>;
}
export { RevenueReporter, collectProtocolFees, computeDelta, PROTOCOLS };
//# sourceMappingURL=index.d.ts.map