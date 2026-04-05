/**
 * ActivityReporter — Core engine
 *
 * Polls protocol contracts for trading events (Swap, PositionOpened, Supply, etc.)
 * and calls AgentRegistry.recordActivity() to update on-chain agent stats.
 *
 * Architecture:
 *   1. For each protocol, create an ethers.Contract with its event ABI
 *   2. Every POLL_INTERVAL_MS, query getLogs from lastBlock+1 to latest
 *   3. Parse each log → extract (trader, volume, fee)
 *   4. Batch-call recordActivity on AgentRegistry
 *   5. Track lastProcessedBlock in memory (and optionally to disk)
 */
export interface ActivityRecord {
    protocol: string;
    trader: string;
    volume: bigint;
    fees: bigint;
    txHash: string;
    blockNumber: number;
    eventName: string;
}
export interface ReporterStats {
    totalReported: number;
    totalErrors: number;
    lastBlock: number;
    startedAt: number;
    protocols: Record<string, number>;
}
export declare class ActivityReporter {
    private provider;
    private signer;
    private registry;
    private protocolContracts;
    private lastBlock;
    private running;
    private stats;
    constructor(rpcUrl?: string, reporterKey?: string);
    start(): Promise<void>;
    stop(): void;
    getStats(): ReporterStats;
    private poll;
    scanAndReport(): Promise<ActivityRecord[]>;
    private scanProtocolEvent;
    private extractTrader;
    private extractVolume;
    private computeFees;
    private batchReport;
    private ensureReporter;
}
