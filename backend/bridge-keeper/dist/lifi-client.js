"use strict";
/**
 * Li.Fi REST API client for cross-chain route finding and execution.
 *
 * API docs: https://docs.li.fi/li.fi-api/li.fi-api
 * Base URL: https://li.quest/v1
 *
 * Supported chains: Ethereum (1), Arbitrum (42161), Optimism (10),
 *   Polygon (137), Base (8453), BNB (56), Avalanche (43114), etc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiFiClient = exports.CHAIN_TOKEN_ADDRESSES = void 0;
const LIFI_API = 'https://li.quest/v1';
const INTEGRATOR = 'gooddollar-l2';
// ─── Common token address mappings ────────────────────────────────────────────
exports.CHAIN_TOKEN_ADDRESSES = {
    ETH: {
        1: '0x0000000000000000000000000000000000000000',
        42161: '0x0000000000000000000000000000000000000000',
        10: '0x0000000000000000000000000000000000000000',
        8453: '0x0000000000000000000000000000000000000000',
    },
    USDC: {
        1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
    USDT: {
        1: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        10: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
        137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    },
    DAI: {
        1: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        42161: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        10: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        137: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    },
};
// ─── Client ───────────────────────────────────────────────────────────────────
class LiFiClient {
    log;
    constructor(log) {
        this.log = log.child({ module: 'lifi-client' });
    }
    /**
     * Fetch the best route/quote from Li.Fi API
     */
    async getQuote(params) {
        const searchParams = new URLSearchParams({
            fromChain: String(params.fromChain),
            toChain: String(params.toChain),
            fromToken: params.fromToken,
            toToken: params.toToken,
            fromAmount: params.fromAmount,
            fromAddress: params.fromAddress,
            toAddress: params.toAddress || params.fromAddress,
            slippage: String(params.slippage ?? 0.005),
            integrator: INTEGRATOR,
        });
        this.log.info({ fromChain: params.fromChain, toChain: params.toChain, amount: params.fromAmount }, 'Fetching Li.Fi quote');
        const res = await fetch(`${LIFI_API}/quote?${searchParams}`, {
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`Li.Fi API error ${res.status}: ${err?.message || 'unknown'}`);
        }
        const data = await res.json();
        const estimate = data.estimate ?? {};
        const action = data.action ?? {};
        const gasCosts = (estimate.gasCosts ?? []);
        const totalGasUSD = gasCosts.reduce((sum, g) => sum + parseFloat(g.amountUSD || '0'), 0).toFixed(4);
        const route = {
            id: data.id ?? '',
            fromChainId: action.fromChainId ?? params.fromChain,
            toChainId: action.toChainId ?? params.toChain,
            fromAmount: action.fromAmount ?? params.fromAmount,
            toAmount: estimate.toAmount ?? '0',
            toAmountMin: estimate.toAmountMin ?? '0',
            gasCostUSD: totalGasUSD,
            steps: data.includedSteps ?? [data],
            transactionRequest: data.transactionRequest,
        };
        this.log.info({
            routeId: route.id,
            toAmount: route.toAmount,
            gasCostUSD: route.gasCostUSD,
            steps: route.steps.length,
        }, 'Li.Fi route found');
        return route;
    }
    /**
     * Get advanced routes (multiple options)
     */
    async getRoutes(params) {
        const body = {
            fromChainId: params.fromChain,
            toChainId: params.toChain,
            fromTokenAddress: params.fromToken,
            toTokenAddress: params.toToken,
            fromAmount: params.fromAmount,
            fromAddress: params.fromAddress,
            toAddress: params.toAddress || params.fromAddress,
            options: {
                slippage: params.slippage ?? 0.005,
                integrator: INTEGRATOR,
                order: params.order || 'RECOMMENDED',
            },
        };
        const res = await fetch(`${LIFI_API}/advanced/routes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`Li.Fi routes API error ${res.status}: ${err?.message || 'unknown'}`);
        }
        const data = await res.json();
        return (data.routes || []).map((r) => ({
            id: r.id,
            fromChainId: r.fromChainId ?? params.fromChain,
            toChainId: r.toChainId ?? params.toChain,
            fromAmount: r.fromAmount ?? params.fromAmount,
            toAmount: r.toAmount ?? '0',
            toAmountMin: r.toAmountMin ?? '0',
            gasCostUSD: r.gasCostUSD ?? '0',
            steps: r.steps ?? [],
            transactionRequest: undefined,
        }));
    }
    /**
     * Check status of a Li.Fi transaction
     */
    async getStatus(txHash, fromChain, toChain) {
        const params = new URLSearchParams({
            txHash,
            bridge: 'lifi',
            fromChain: String(fromChain),
            toChain: String(toChain),
        });
        const res = await fetch(`${LIFI_API}/status?${params}`, {
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
            return { status: 'NOT_FOUND' };
        }
        const data = await res.json();
        return {
            status: data.status || 'PENDING',
            substatus: data.substatus,
            sending: data.sending,
            receiving: data.receiving,
        };
    }
    /**
     * Get supported chains from Li.Fi
     */
    async getChains() {
        const res = await fetch(`${LIFI_API}/chains`, {
            headers: { Accept: 'application/json' },
        });
        if (!res.ok)
            return [];
        const data = await res.json();
        return (data.chains || []).map((c) => ({ id: c.id, name: c.name, key: c.key }));
    }
    /**
     * Get supported tokens on a chain
     */
    async getTokens(chainId) {
        const res = await fetch(`${LIFI_API}/tokens?chains=${chainId}`, {
            headers: { Accept: 'application/json' },
        });
        if (!res.ok)
            return [];
        const data = await res.json();
        return (data.tokens?.[String(chainId)] || []).map((t) => ({
            address: t.address,
            symbol: t.symbol,
            decimals: t.decimals,
        }));
    }
}
exports.LiFiClient = LiFiClient;
//# sourceMappingURL=lifi-client.js.map