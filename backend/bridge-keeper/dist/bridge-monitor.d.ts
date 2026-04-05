/**
 * BridgeMonitor — watches on-chain events from LiFiBridgeAggregator and
 * MultiChainBridge, then processes pending cross-chain swaps via Li.Fi API.
 *
 * Flow:
 *  1. Poll for SwapRequested events on LiFiBridgeAggregator
 *  2. For each pending swap, fetch route from Li.Fi
 *  3. Execute the cross-chain transaction
 *  4. Call completeSwap() or refundSwap() based on outcome
 *  5. Track status of in-flight swaps
 */
import { ethers } from 'ethers';
import type { Logger } from 'pino';
import { LiFiClient, type LiFiRoute } from './lifi-client';
interface MonitorConfig {
    provider: ethers.JsonRpcProvider;
    wallet: ethers.Wallet;
    lifiClient: LiFiClient;
    lifiAggregatorAddress: string;
    multiChainBridgeAddress: string;
    lifiAggregatorAbi: string[];
    multiChainBridgeAbi: string[];
    pollIntervalMs: number;
    log: Logger;
}
interface PendingSwap {
    swapId: number;
    user: string;
    srcToken: string;
    srcAmount: bigint;
    destChainId: number;
    destToken: string;
    destReceiver: string;
    minDestAmount: bigint;
    deadline: number;
    lifiRoute?: LiFiRoute;
    status: 'pending' | 'routing' | 'executing' | 'completed' | 'failed';
    error?: string;
}
interface BridgeStats {
    totalSwapsProcessed: number;
    totalSwapsCompleted: number;
    totalSwapsFailed: number;
    pendingSwaps: number;
    lastProcessedBlock: number;
}
export declare class BridgeMonitor {
    private config;
    private log;
    private lifiAggregator;
    private multiChainBridge;
    private pendingSwaps;
    private stats;
    private swapInterval;
    private bridgeInterval;
    constructor(config: MonitorConfig);
    startSwapMonitor(): void;
    startBridgeMonitor(): void;
    stop(): void;
    scanPendingSwaps(): Promise<void>;
    processNextPendingSwap(): Promise<void>;
    private completeSwap;
    private refundSwap;
    scanBridgeRequests(): Promise<void>;
    getStats(): Promise<BridgeStats & {
        uptime: number;
    }>;
    getPendingSwaps(): Promise<PendingSwap[]>;
}
export {};
//# sourceMappingURL=bridge-monitor.d.ts.map