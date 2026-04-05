/**
 * Activity Reporter — Configuration
 *
 * Contract addresses and protocol event definitions for all
 * GoodDollar L2 protocols whose trading activity should be
 * reported to the AgentRegistry.
 */
export declare const RPC_URL: string;
export declare const CHAIN_ID = 42069;
export declare const REPORTER_KEY: string;
export declare const POLL_INTERVAL_MS: number;
export declare const INITIAL_LOOKBACK: number;
export declare const ADDRESSES: {
    readonly AgentRegistry: string;
    readonly GoodSwapRouter: string;
    readonly PerpEngine: string;
    readonly GoodLendPool: string;
    readonly MarketFactory: string;
    readonly CollateralVault: string;
    readonly VaultFactory: string;
};
export interface ProtocolDef {
    name: string;
    address: string;
    events: EventDef[];
}
export interface EventDef {
    /** Solidity event signature (for topic0 hash) */
    signature: string;
    /** How to extract the trader address from decoded log */
    traderField: string;
    /** How to compute volume in wei from decoded log */
    volumeField: string;
    /** Fee BPS applied to volume to estimate fees (or a field name) */
    feeBPS?: number;
    /** Direct fee field name in the event */
    feeField?: string;
}
export declare const PROTOCOLS: ProtocolDef[];
