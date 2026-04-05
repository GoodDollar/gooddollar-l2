/**
 * Li.Fi REST API client for cross-chain route finding and execution.
 *
 * API docs: https://docs.li.fi/li.fi-api/li.fi-api
 * Base URL: https://li.quest/v1
 *
 * Supported chains: Ethereum (1), Arbitrum (42161), Optimism (10),
 *   Polygon (137), Base (8453), BNB (56), Avalanche (43114), etc.
 */
import type { Logger } from 'pino';
export interface LiFiQuoteParams {
    fromChain: number;
    toChain: number;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    fromAddress: string;
    toAddress?: string;
    slippage?: number;
}
export interface LiFiStep {
    type: string;
    tool: string;
    toolDetails: {
        name: string;
        logoURI: string;
    };
    action: {
        fromToken: {
            symbol: string;
            address: string;
            decimals: number;
            chainId: number;
        };
        toToken: {
            symbol: string;
            address: string;
            decimals: number;
            chainId: number;
        };
        fromAmount: string;
        slippage: number;
        fromChainId: number;
        toChainId: number;
    };
    estimate: {
        fromAmount: string;
        toAmount: string;
        toAmountMin: string;
        executionDuration: number;
        gasCosts: Array<{
            amountUSD: string;
        }>;
    };
}
export interface LiFiRoute {
    id: string;
    fromChainId: number;
    toChainId: number;
    fromAmount: string;
    toAmount: string;
    toAmountMin: string;
    gasCostUSD: string;
    steps: LiFiStep[];
    transactionRequest?: {
        to: string;
        data: string;
        value: string;
        gasLimit: string;
        from: string;
        chainId: number;
    };
}
export interface LiFiStatus {
    status: 'NOT_FOUND' | 'PENDING' | 'DONE' | 'FAILED';
    substatus?: string;
    sending?: {
        txHash: string;
        chainId: number;
    };
    receiving?: {
        txHash: string;
        chainId: number;
        amount: string;
    };
}
export declare const CHAIN_TOKEN_ADDRESSES: Record<string, Record<number, string>>;
export declare class LiFiClient {
    private log;
    constructor(log: Logger);
    /**
     * Fetch the best route/quote from Li.Fi API
     */
    getQuote(params: LiFiQuoteParams): Promise<LiFiRoute>;
    /**
     * Get advanced routes (multiple options)
     */
    getRoutes(params: LiFiQuoteParams & {
        order?: 'RECOMMENDED' | 'FASTEST' | 'CHEAPEST' | 'SAFEST';
    }): Promise<LiFiRoute[]>;
    /**
     * Check status of a Li.Fi transaction
     */
    getStatus(txHash: string, fromChain: number, toChain: number): Promise<LiFiStatus>;
    /**
     * Get supported chains from Li.Fi
     */
    getChains(): Promise<Array<{
        id: number;
        name: string;
        key: string;
    }>>;
    /**
     * Get supported tokens on a chain
     */
    getTokens(chainId: number): Promise<Array<{
        address: string;
        symbol: string;
        decimals: number;
    }>>;
}
//# sourceMappingURL=lifi-client.d.ts.map