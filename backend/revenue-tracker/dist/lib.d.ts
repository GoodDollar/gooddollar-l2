/**
 * Revenue Tracker — Pure functions and configuration (testable without side effects).
 */
export interface ProtocolConfig {
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
export interface FeeReport {
    protocolId: number;
    name: string;
    totalFees: bigint;
    ubiPortion: bigint;
    txCount: bigint;
}
export declare const PROTOCOLS: ProtocolConfig[];
/**
 * Compute delta from last reported values.
 * Only report incremental changes (not cumulative totals).
 */
export declare function computeDelta(report: FeeReport): {
    fees: bigint;
    ubi: bigint;
    txs: bigint;
} | null;
/**
 * Calculate UBI portion of fees (33%).
 */
export declare function calcUBI(fees: bigint): bigint;
/**
 * Reset tracking state (for testing).
 */
export declare function resetLastReported(): void;
/**
 * Set last reported values (for testing / initialization).
 */
export declare function setLastReported(protocolId: number, fees: bigint, txs: bigint): void;
//# sourceMappingURL=lib.d.ts.map