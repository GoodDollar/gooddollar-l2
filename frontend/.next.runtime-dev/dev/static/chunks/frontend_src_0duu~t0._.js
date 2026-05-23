(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/lib/stockData.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * stockData.ts — Types and formatting utilities for GoodStocks.
 *
 * MOCK DATA REMOVED — all data now comes from on-chain hooks:
 *   - useOnChainStocks() for stock listings + prices
 *   - useOnChainHoldings() for portfolio positions
 *   - useStockPrices() for live oracle prices
 *
 * This file retains types and formatting functions used by components.
 */ // ─── Types ────────────────────────────────────────────────────────────────────
__turbopack_context__.s([
    "DEFAULT_STOCK_SPREAD_BPS",
    ()=>DEFAULT_STOCK_SPREAD_BPS,
    "MAX_STOCK_ORDER_USD",
    ()=>MAX_STOCK_ORDER_USD,
    "formatLargeCount",
    ()=>formatLargeCount,
    "formatLargeNumber",
    ()=>formatLargeNumber,
    "formatStockPrice",
    ()=>formatStockPrice,
    "formatStockShares",
    ()=>formatStockShares,
    "getAllTickers",
    ()=>getAllTickers,
    "getPortfolioHoldings",
    ()=>getPortfolioHoldings,
    "getPortfolioSummary",
    ()=>getPortfolioSummary,
    "getStockByTicker",
    ()=>getStockByTicker,
    "getStockData",
    ()=>getStockData,
    "getStockFinancials",
    ()=>getStockFinancials,
    "getTradeHistory",
    ()=>getTradeHistory
]);
function formatStockPrice(price) {
    return `$${price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}
function _formatWithSuffix(n) {
    if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return n.toFixed(0);
}
function formatLargeNumber(n) {
    return `$${_formatWithSuffix(n)}`;
}
function formatLargeCount(n) {
    return _formatWithSuffix(n);
}
function formatStockShares(n) {
    if (!Number.isFinite(n)) return '0';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
    return `${sign}${abs.toFixed(4)}`;
}
const DEFAULT_STOCK_SPREAD_BPS = 15;
const MAX_STOCK_ORDER_USD = 10_000_000;
// ─── Ticker list (for oracle reads) ──────────────────────────────────────────
const TICKERS = [
    'AAPL',
    'TSLA',
    'NVDA',
    'MSFT',
    'AMZN',
    'GOOGL',
    'META',
    'JPM',
    'V',
    'DIS',
    'NFLX',
    'AMD'
];
function getAllTickers() {
    return TICKERS;
}
const FINANCIALS_DATA = {
    AAPL: {
        nextEarningsDate: 'Jul 31, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 94.8e9,
                eps: 1.65,
                epsEstimate: 1.60
            },
            {
                quarter: 'Q1 2026',
                revenue: 124.3e9,
                eps: 2.40,
                epsEstimate: 2.35
            },
            {
                quarter: 'Q4 2025',
                revenue: 89.5e9,
                eps: 1.46,
                epsEstimate: 1.47
            },
            {
                quarter: 'Q3 2025',
                revenue: 85.8e9,
                eps: 1.40,
                epsEstimate: 1.35
            }
        ]
    },
    TSLA: {
        nextEarningsDate: 'Jul 22, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 25.7e9,
                eps: 0.85,
                epsEstimate: 0.78
            },
            {
                quarter: 'Q1 2026',
                revenue: 21.3e9,
                eps: 0.52,
                epsEstimate: 0.58
            },
            {
                quarter: 'Q4 2025',
                revenue: 25.2e9,
                eps: 0.73,
                epsEstimate: 0.71
            },
            {
                quarter: 'Q3 2025',
                revenue: 23.4e9,
                eps: 0.62,
                epsEstimate: 0.60
            }
        ]
    },
    NVDA: {
        nextEarningsDate: 'Aug 20, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 44.1e9,
                eps: 0.89,
                epsEstimate: 0.84
            },
            {
                quarter: 'Q1 2026',
                revenue: 39.3e9,
                eps: 0.78,
                epsEstimate: 0.74
            },
            {
                quarter: 'Q4 2025',
                revenue: 35.1e9,
                eps: 0.68,
                epsEstimate: 0.64
            },
            {
                quarter: 'Q3 2025',
                revenue: 30.0e9,
                eps: 0.58,
                epsEstimate: 0.57
            }
        ]
    },
    MSFT: {
        nextEarningsDate: 'Jul 22, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 65.6e9,
                eps: 3.30,
                epsEstimate: 3.22
            },
            {
                quarter: 'Q1 2026',
                revenue: 69.6e9,
                eps: 3.46,
                epsEstimate: 3.30
            },
            {
                quarter: 'Q4 2025',
                revenue: 62.0e9,
                eps: 3.05,
                epsEstimate: 2.98
            },
            {
                quarter: 'Q3 2025',
                revenue: 56.5e9,
                eps: 2.93,
                epsEstimate: 2.82
            }
        ]
    },
    META: {
        nextEarningsDate: 'Jul 23, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 42.3e9,
                eps: 6.20,
                epsEstimate: 5.95
            },
            {
                quarter: 'Q1 2026',
                revenue: 40.1e9,
                eps: 5.85,
                epsEstimate: 5.70
            },
            {
                quarter: 'Q4 2025',
                revenue: 40.1e9,
                eps: 5.33,
                epsEstimate: 5.25
            },
            {
                quarter: 'Q3 2025',
                revenue: 34.1e9,
                eps: 4.50,
                epsEstimate: 4.39
            }
        ]
    },
    AMZN: {
        nextEarningsDate: 'Jul 24, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 158.9e9,
                eps: 1.45,
                epsEstimate: 1.38
            },
            {
                quarter: 'Q1 2026',
                revenue: 155.7e9,
                eps: 1.36,
                epsEstimate: 1.29
            },
            {
                quarter: 'Q4 2025',
                revenue: 170.0e9,
                eps: 1.48,
                epsEstimate: 1.46
            },
            {
                quarter: 'Q3 2025',
                revenue: 143.1e9,
                eps: 1.14,
                epsEstimate: 1.12
            }
        ]
    }
};
function getStockFinancials(ticker) {
    return FINANCIALS_DATA[ticker] ?? null;
}
function getStockData() {
    return [];
}
function getStockByTicker(_ticker) {
    return undefined;
}
function getPortfolioHoldings() {
    return [];
}
function getTradeHistory() {
    return [];
}
function getPortfolioSummary() {
    return {
        totalValue: 0,
        totalCost: 0,
        totalCollateral: 0,
        totalRequired: 0,
        unrealizedPnl: 0,
        pnlPercent: 0,
        healthRatio: 0
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/useOnChainStocks.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useOnChainHoldings",
    ()=>useOnChainHoldings,
    "useOnChainStocks",
    ()=>useOnChainStocks
]);
/**
 * useOnChainStocks — reads synthetic stock data from on-chain contracts.
 *
 * Replaces mock MOCK_STOCKS/MOCK_HOLDINGS/MOCK_TRADES from stockData.ts
 * with real reads from SyntheticAssetFactory, CollateralVault, and PriceOracle.
 *
 * Falls back to empty data when contracts are unavailable.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContracts.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-client] (ecmascript) <locals>");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
// ─── Fallback demo stocks when on-chain data is unavailable ──────────────────
const FALLBACK_STOCKS = [
    {
        ticker: 'AAPL',
        name: 'sAAPL',
        displayName: 'Apple Inc.',
        sector: 'Technology',
        description: 'Apple Inc. — smartphones, computers, services.',
        price: 218.27,
        change24h: 1.3,
        volume24h: 62_000_000,
        marketCap: 3_340_000_000_000,
        high52w: 237.49,
        low52w: 164.08,
        sparkline7d: [
            213,
            214,
            215,
            216,
            217,
            218,
            218.27
        ],
        peRatio: 33.8,
        eps: 6.46,
        dividendYield: 0.44,
        avgVolume: 58_000_000
    },
    {
        ticker: 'MSFT',
        name: 'sMSFT',
        displayName: 'Microsoft Corp.',
        sector: 'Technology',
        description: 'Microsoft Corp. — Windows, Azure, Office.',
        price: 388.45,
        change24h: 0.9,
        volume24h: 22_000_000,
        marketCap: 2_890_000_000_000,
        high52w: 420.82,
        low52w: 309.45,
        sparkline7d: [
            383,
            384,
            385,
            386,
            387,
            388,
            388.45
        ],
        peRatio: 34.2,
        eps: 11.36,
        dividendYield: 0.72,
        avgVolume: 20_000_000
    },
    {
        ticker: 'GOOGL',
        name: 'sGOOGL',
        displayName: 'Alphabet Inc.',
        sector: 'Technology',
        description: 'Alphabet Inc. — Google, YouTube, Cloud.',
        price: 161.12,
        change24h: -0.5,
        volume24h: 25_000_000,
        marketCap: 2_010_000_000_000,
        high52w: 191.75,
        low52w: 130.67,
        sparkline7d: [
            159,
            160,
            160.5,
            161,
            161.2,
            161,
            161.12
        ],
        peRatio: 22.1,
        eps: 7.29,
        dividendYield: 0.50,
        avgVolume: 23_000_000
    },
    {
        ticker: 'AMZN',
        name: 'sAMZN',
        displayName: 'Amazon.com',
        sector: 'Consumer',
        description: 'Amazon.com — e-commerce & AWS cloud.',
        price: 186.21,
        change24h: 1.8,
        volume24h: 48_000_000,
        marketCap: 1_950_000_000_000,
        high52w: 201.20,
        low52w: 151.61,
        sparkline7d: [
            182,
            183,
            184,
            185,
            185.5,
            186,
            186.21
        ],
        peRatio: 58.3,
        eps: 3.19,
        dividendYield: 0,
        avgVolume: 44_000_000
    },
    {
        ticker: 'NVDA',
        name: 'sNVDA',
        displayName: 'NVIDIA Corp.',
        sector: 'Technology',
        description: 'NVIDIA Corp. — GPUs & AI computing.',
        price: 104.75,
        change24h: 3.2,
        volume24h: 310_000_000,
        marketCap: 2_580_000_000_000,
        high52w: 153.13,
        low52w: 75.61,
        sparkline7d: [
            98,
            99,
            101,
            102,
            103,
            104,
            104.75
        ],
        peRatio: 60.1,
        eps: 1.74,
        dividendYield: 0.03,
        avgVolume: 280_000_000
    },
    {
        ticker: 'TSLA',
        name: 'sTSLA',
        displayName: 'Tesla Inc.',
        sector: 'Automotive',
        description: 'Tesla Inc. — electric vehicles & energy.',
        price: 272.18,
        change24h: -2.1,
        volume24h: 95_000_000,
        marketCap: 874_000_000_000,
        high52w: 488.54,
        low52w: 138.80,
        sparkline7d: [
            280,
            278,
            276,
            275,
            274,
            273,
            272.18
        ],
        peRatio: 150.2,
        eps: 1.81,
        dividendYield: 0,
        avgVolume: 88_000_000
    },
    {
        ticker: 'META',
        name: 'sMETA',
        displayName: 'Meta Platforms',
        sector: 'Technology',
        description: 'Meta Platforms — Facebook, Instagram, WhatsApp.',
        price: 567.89,
        change24h: 0.6,
        volume24h: 18_000_000,
        marketCap: 1_430_000_000_000,
        high52w: 602.95,
        low52w: 414.50,
        sparkline7d: [
            562,
            563,
            564,
            565,
            566,
            567,
            567.89
        ],
        peRatio: 25.7,
        eps: 22.10,
        dividendYield: 0.36,
        avgVolume: 16_000_000
    },
    {
        ticker: 'NFLX',
        name: 'sNFLX',
        displayName: 'Netflix',
        sector: 'Entertainment',
        description: 'Netflix — streaming entertainment.',
        price: 998.61,
        change24h: 1.1,
        volume24h: 5_200_000,
        marketCap: 428_000_000_000,
        high52w: 1040.00,
        low52w: 550.64,
        sparkline7d: [
            990,
            992,
            994,
            995,
            996,
            997,
            998.61
        ],
        peRatio: 48.9,
        eps: 20.42,
        dividendYield: 0,
        avgVolume: 4_800_000
    },
    {
        ticker: 'AMD',
        name: 'sAMD',
        displayName: 'AMD',
        sector: 'Technology',
        description: 'AMD — CPUs, GPUs, adaptive computing.',
        price: 101.32,
        change24h: -1.5,
        volume24h: 42_000_000,
        marketCap: 164_000_000_000,
        high52w: 187.28,
        low52w: 97.09,
        sparkline7d: [
            104,
            103,
            102.5,
            102,
            101.8,
            101.5,
            101.32
        ],
        peRatio: 102.3,
        eps: 0.99,
        dividendYield: 0,
        avgVolume: 38_000_000
    },
    {
        ticker: 'COIN',
        name: 'sCOIN',
        displayName: 'Coinbase Global',
        sector: 'Finance',
        description: 'Coinbase Global — crypto exchange platform.',
        price: 178.54,
        change24h: 4.2,
        volume24h: 12_000_000,
        marketCap: 43_500_000_000,
        high52w: 349.75,
        low52w: 146.12,
        sparkline7d: [
            170,
            172,
            174,
            175,
            176,
            177,
            178.54
        ],
        peRatio: 28.6,
        eps: 6.24,
        dividendYield: 0,
        avgVolume: 10_000_000
    }
];
const FACTORY = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].SyntheticAssetFactory;
const VAULT = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].CollateralVault;
const ORACLE = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].StocksPriceOracle;
// Static metadata for known stocks (sector/description/company name enrichment)
const STOCK_META = {
    AAPL: {
        sector: 'Technology',
        description: 'Apple Inc. — smartphones, computers, services.',
        companyName: 'Apple Inc.'
    },
    TSLA: {
        sector: 'Automotive',
        description: 'Tesla Inc. — electric vehicles & energy.',
        companyName: 'Tesla Inc.'
    },
    NVDA: {
        sector: 'Technology',
        description: 'NVIDIA Corp. — GPUs & AI computing.',
        companyName: 'NVIDIA Corp.'
    },
    MSFT: {
        sector: 'Technology',
        description: 'Microsoft Corp. — Windows, Azure, Office.',
        companyName: 'Microsoft Corp.'
    },
    AMZN: {
        sector: 'Consumer',
        description: 'Amazon.com — e-commerce & AWS cloud.',
        companyName: 'Amazon.com'
    },
    GOOGL: {
        sector: 'Technology',
        description: 'Alphabet Inc. — Google, YouTube, Cloud.',
        companyName: 'Alphabet Inc.'
    },
    META: {
        sector: 'Technology',
        description: 'Meta Platforms — Facebook, Instagram, WhatsApp.',
        companyName: 'Meta Platforms'
    },
    JPM: {
        sector: 'Finance',
        description: 'JPMorgan Chase — banking & financial services.',
        companyName: 'JPMorgan Chase'
    },
    V: {
        sector: 'Finance',
        description: 'Visa Inc. — global payments network.',
        companyName: 'Visa Inc.'
    },
    DIS: {
        sector: 'Entertainment',
        description: 'Walt Disney — media, parks, streaming.',
        companyName: 'Walt Disney'
    },
    NFLX: {
        sector: 'Entertainment',
        description: 'Netflix — streaming entertainment.',
        companyName: 'Netflix'
    },
    AMD: {
        sector: 'Technology',
        description: 'AMD — CPUs, GPUs, adaptive computing.',
        companyName: 'AMD'
    },
    COIN: {
        sector: 'Finance',
        description: 'Coinbase Global — crypto exchange platform.',
        companyName: 'Coinbase Global'
    }
};
// Known tickers (matches what DeployGoodStocks deployed)
const KNOWN_TICKERS = [
    'AAPL',
    'TSLA',
    'NVDA',
    'MSFT',
    'AMZN',
    'GOOGL',
    'META',
    'JPM',
    'V',
    'DIS',
    'NFLX',
    'AMD'
];
function useOnChainStocks() {
    _s();
    // Read prices for all known tickers from StocksPriceOracle
    const priceContracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useOnChainStocks.useMemo[priceContracts]": ()=>{
            if (!ORACLE) return [];
            return KNOWN_TICKERS.map({
                "useOnChainStocks.useMemo[priceContracts]": (ticker)=>({
                        address: ORACLE,
                        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceOracleABI"],
                        functionName: 'getPrice',
                        args: [
                            ticker
                        ]
                    })
            }["useOnChainStocks.useMemo[priceContracts]"]);
        }
    }["useOnChainStocks.useMemo[priceContracts]"], []);
    const { data: priceData, isLoading, refetch } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts: priceContracts,
        query: {
            enabled: priceContracts.length > 0,
            refetchInterval: 30_000,
            staleTime: 30_000
        }
    });
    const stocks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useOnChainStocks.useMemo[stocks]": ()=>{
            if (!priceData || priceData.length === 0) return [];
            return KNOWN_TICKERS.map({
                "useOnChainStocks.useMemo[stocks]": (ticker, i)=>{
                    const r = priceData[i];
                    const price = r?.status === 'success' && typeof r.result === 'bigint' ? Number(r.result) / 1e8 : 0;
                    if (price === 0) return null;
                    const meta = STOCK_META[ticker] ?? {
                        sector: 'Unknown',
                        description: `Synthetic ${ticker}`,
                        companyName: ticker
                    };
                    return {
                        ticker,
                        name: `s${ticker}`,
                        displayName: meta.companyName,
                        sector: meta.sector,
                        description: meta.description,
                        price,
                        change24h: 0,
                        volume24h: 0,
                        marketCap: 0,
                        high52w: price * 1.15,
                        low52w: price * 0.75,
                        sparkline7d: null,
                        peRatio: 0,
                        eps: 0,
                        dividendYield: 0,
                        avgVolume: 0
                    };
                }
            }["useOnChainStocks.useMemo[stocks]"]).filter(Boolean);
        }
    }["useOnChainStocks.useMemo[stocks]"], [
        priceData
    ]);
    const finalStocks = stocks.length > 0 ? stocks : FALLBACK_STOCKS;
    return {
        stocks: finalStocks,
        isLoading,
        isLive: stocks.length > 0,
        refetch
    };
}
_s(useOnChainStocks, "qxuuaQJVKP/OG0Ys+u6CBazYSHg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"]
    ];
});
function useOnChainHoldings() {
    _s1();
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    // Read positions for all tickers
    const posContracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useOnChainHoldings.useMemo[posContracts]": ()=>{
            if (!VAULT || !address) return [];
            return KNOWN_TICKERS.map({
                "useOnChainHoldings.useMemo[posContracts]": (ticker)=>({
                        address: VAULT,
                        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CollateralVaultABI"],
                        functionName: 'getPosition',
                        args: [
                            address,
                            ticker
                        ]
                    })
            }["useOnChainHoldings.useMemo[posContracts]"]);
        }
    }["useOnChainHoldings.useMemo[posContracts]"], [
        address
    ]);
    // Read prices
    const priceContracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useOnChainHoldings.useMemo[priceContracts]": ()=>{
            if (!ORACLE) return [];
            return KNOWN_TICKERS.map({
                "useOnChainHoldings.useMemo[priceContracts]": (ticker)=>({
                        address: ORACLE,
                        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceOracleABI"],
                        functionName: 'getPrice',
                        args: [
                            ticker
                        ]
                    })
            }["useOnChainHoldings.useMemo[priceContracts]"]);
        }
    }["useOnChainHoldings.useMemo[priceContracts]"], []);
    const { data: posData, isLoading: posLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts: posContracts,
        query: {
            enabled: posContracts.length > 0,
            refetchInterval: 15_000,
            staleTime: 15_000
        }
    });
    const { data: priceData } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts: priceContracts,
        query: {
            enabled: priceContracts.length > 0,
            refetchInterval: 30_000,
            staleTime: 30_000
        }
    });
    const holdings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useOnChainHoldings.useMemo[holdings]": ()=>{
            if (!posData) return [];
            const result = [];
            for(let i = 0; i < KNOWN_TICKERS.length; i++){
                const posR = posData[i];
                if (posR?.status !== 'success' || !posR.result) continue;
                const [collateralAmount, debtAmount] = posR.result;
                if (debtAmount === BigInt(0)) continue; // no position
                const shares = Number(debtAmount) / 1e18;
                const collateral = Number(collateralAmount) / 1e18;
                const priceR = priceData?.[i];
                const currentPrice = priceR?.status === 'success' && typeof priceR.result === 'bigint' ? Number(priceR.result) / 1e8 : 0;
                result.push({
                    ticker: KNOWN_TICKERS[i],
                    shares,
                    avgCost: currentPrice,
                    currentPrice,
                    collateralDeposited: collateral,
                    collateralRequired: shares * currentPrice * 0.5
                });
            }
            return result;
        }
    }["useOnChainHoldings.useMemo[holdings]"], [
        posData,
        priceData
    ]);
    return {
        holdings,
        isLoading: posLoading
    };
}
_s1(useOnChainHoldings, "tEChmSUI/DyTapQjTKabu43XYJM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/useStocksRebalanceStatus.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useStocksRebalanceStatus",
    ()=>useStocksRebalanceStatus
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
const POLL_MS = 10_000;
const inflightByUrl = new Map();
async function fetchRebalanceStatus(url) {
    const inflight = inflightByUrl.get(url);
    if (inflight) return inflight;
    const request = (async ()=>{
        const res = await fetch(url, {
            cache: 'no-store',
            signal: AbortSignal.timeout(5000)
        });
        if (!res.ok) throw new Error(`rebalance status ${res.status}`);
        return await res.json();
    })();
    inflightByUrl.set(url, request);
    request.then(()=>{
        if (inflightByUrl.get(url) === request) {
            inflightByUrl.delete(url);
        }
    }, ()=>{
        if (inflightByUrl.get(url) === request) {
            inflightByUrl.delete(url);
        }
    });
    return request;
}
function useStocksRebalanceStatus(symbols) {
    _s();
    const normalizedSymbols = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useStocksRebalanceStatus.useMemo[normalizedSymbols]": ()=>Array.from(new Set(symbols.map({
                "useStocksRebalanceStatus.useMemo[normalizedSymbols]": (s)=>s.trim().toUpperCase()
            }["useStocksRebalanceStatus.useMemo[normalizedSymbols]"]).filter(Boolean))).sort()
    }["useStocksRebalanceStatus.useMemo[normalizedSymbols]"], [
        symbols
    ]);
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useStocksRebalanceStatus.useEffect": ()=>{
            let cancelled = false;
            let timer = null;
            const query = normalizedSymbols.join(',');
            const url = query.length > 0 ? `/api/stocks/rebalance-status?symbols=${encodeURIComponent(query)}` : '/api/stocks/rebalance-status';
            const tick = {
                "useStocksRebalanceStatus.useEffect.tick": async ()=>{
                    try {
                        const next = await fetchRebalanceStatus(url);
                        if (cancelled) return;
                        setData(next);
                        setError(null);
                    } catch (err) {
                        if (cancelled) return;
                        setError(err instanceof Error ? err.message : 'rebalance status unavailable');
                    } finally{
                        if (!cancelled) setIsLoading(false);
                    }
                }
            }["useStocksRebalanceStatus.useEffect.tick"];
            void tick();
            timer = setInterval(tick, POLL_MS);
            return ({
                "useStocksRebalanceStatus.useEffect": ()=>{
                    cancelled = true;
                    if (timer) clearInterval(timer);
                }
            })["useStocksRebalanceStatus.useEffect"];
        }
    }["useStocksRebalanceStatus.useEffect"], [
        normalizedSymbols
    ]);
    const bySymbol = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useStocksRebalanceStatus.useMemo[bySymbol]": ()=>{
            const next = {};
            for (const entry of data?.symbols ?? []){
                next[entry.symbol] = entry;
            }
            return next;
        }
    }["useStocksRebalanceStatus.useMemo[bySymbol]"], [
        data
    ]);
    return {
        data,
        isLoading,
        error,
        bySymbol
    };
}
_s(useStocksRebalanceStatus, "8iulFpIWQhBwW5UGSUEa4INQX7k=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/stockInsights.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calcUpsidePercent",
    ()=>calcUpsidePercent,
    "getAnalystOutlook",
    ()=>getAnalystOutlook,
    "getStockNews",
    ()=>getStockNews
]);
const ANALYST_OUTLOOK_BY_TICKER = {
    AAPL: {
        consensus: 'Bullish',
        targetLow: 196,
        targetMean: 224,
        targetHigh: 248,
        asOf: 'May 2026',
        analystCount: 37,
        ratingDistribution: {
            buy: 73,
            hold: 24,
            sell: 3
        },
        revisionTrend: 'Up',
        source: 'Street consensus aggregate'
    },
    MSFT: {
        consensus: 'Bullish',
        targetLow: 418,
        targetMean: 451,
        targetHigh: 486,
        asOf: 'May 2026',
        analystCount: 34,
        ratingDistribution: {
            buy: 76,
            hold: 21,
            sell: 3
        },
        revisionTrend: 'Up',
        source: 'Street consensus aggregate'
    },
    NVDA: {
        consensus: 'Bullish',
        targetLow: 98,
        targetMean: 117,
        targetHigh: 138,
        asOf: 'May 2026',
        analystCount: 41,
        ratingDistribution: {
            buy: 79,
            hold: 18,
            sell: 3
        },
        revisionTrend: 'Up',
        source: 'Street consensus aggregate'
    },
    AMZN: {
        consensus: 'Bullish',
        targetLow: 176,
        targetMean: 204,
        targetHigh: 226,
        asOf: 'May 2026',
        analystCount: 45,
        ratingDistribution: {
            buy: 71,
            hold: 25,
            sell: 4
        },
        revisionTrend: 'Up',
        source: 'Street consensus aggregate'
    },
    GOOGL: {
        consensus: 'Bullish',
        targetLow: 154,
        targetMean: 176,
        targetHigh: 198,
        asOf: 'May 2026',
        analystCount: 38,
        ratingDistribution: {
            buy: 69,
            hold: 27,
            sell: 4
        },
        revisionTrend: 'Flat',
        source: 'Street consensus aggregate'
    },
    META: {
        consensus: 'Neutral',
        targetLow: 545,
        targetMean: 588,
        targetHigh: 633,
        asOf: 'May 2026',
        analystCount: 32,
        ratingDistribution: {
            buy: 53,
            hold: 39,
            sell: 8
        },
        revisionTrend: 'Flat',
        source: 'Street consensus aggregate'
    },
    TSLA: {
        consensus: 'Neutral',
        targetLow: 231,
        targetMean: 278,
        targetHigh: 338,
        asOf: 'May 2026',
        analystCount: 30,
        ratingDistribution: {
            buy: 46,
            hold: 40,
            sell: 14
        },
        revisionTrend: 'Down',
        source: 'Street consensus aggregate'
    },
    AMD: {
        consensus: 'Neutral',
        targetLow: 92,
        targetMean: 110,
        targetHigh: 136,
        asOf: 'May 2026',
        analystCount: 29,
        ratingDistribution: {
            buy: 48,
            hold: 42,
            sell: 10
        },
        revisionTrend: 'Flat',
        source: 'Street consensus aggregate'
    }
};
function getAnalystOutlook(ticker) {
    return ANALYST_OUTLOOK_BY_TICKER[ticker] ?? null;
}
function calcUpsidePercent(currentPrice, targetMean) {
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) return 0;
    return (targetMean - currentPrice) / currentPrice * 100;
}
const NEWS_BY_TICKER = {
    AAPL: [
        {
            id: 'aapl-earnings-refresh',
            ticker: 'AAPL',
            headline: 'Apple supply-chain update improves near-term iPhone shipment outlook',
            source: 'Market Wire',
            publishedAt: '2026-05-18T15:30:00Z',
            tag: 'Guidance',
            url: 'https://example.com/news/aapl-guidance'
        },
        {
            id: 'aapl-ai-suite',
            ticker: 'AAPL',
            headline: 'Apple expands on-device AI suite ahead of developer conference',
            source: 'Tech Ledger',
            publishedAt: '2026-05-17T10:15:00Z',
            tag: 'Product',
            url: 'https://example.com/news/aapl-ai-suite'
        },
        {
            id: 'aapl-services-rev',
            ticker: 'AAPL',
            headline: 'Services revenue tops $26B as App Store growth accelerates',
            source: 'Earnings Desk',
            publishedAt: '2026-05-15T08:20:00Z',
            tag: 'Earnings',
            url: 'https://example.com/news/aapl-services-rev'
        }
    ],
    MSFT: [
        {
            id: 'msft-cloud-demand',
            ticker: 'MSFT',
            headline: 'Azure enterprise demand remains strong in new channel checks',
            source: 'Street Brief',
            publishedAt: '2026-05-19T09:40:00Z',
            tag: 'Guidance',
            url: 'https://example.com/news/msft-azure-demand'
        },
        {
            id: 'msft-earnings-watch',
            ticker: 'MSFT',
            headline: 'Analysts raise earnings expectations for next quarter',
            source: 'Earnings Desk',
            publishedAt: '2026-05-16T20:05:00Z',
            tag: 'Earnings',
            url: 'https://example.com/news/msft-earnings-watch'
        },
        {
            id: 'msft-copilot-enterprise',
            ticker: 'MSFT',
            headline: 'Copilot enterprise adoption doubles as AI features ship across Office',
            source: 'Tech Ledger',
            publishedAt: '2026-05-14T11:30:00Z',
            tag: 'Product',
            url: 'https://example.com/news/msft-copilot'
        }
    ],
    NVDA: [
        {
            id: 'nvda-dc-capex',
            ticker: 'NVDA',
            headline: 'Hyperscaler capex plans point to sustained accelerator demand',
            source: 'Data Center Journal',
            publishedAt: '2026-05-18T13:05:00Z',
            tag: 'Macro',
            url: 'https://example.com/news/nvda-capex-demand'
        },
        {
            id: 'nvda-blackwell-ramp',
            ticker: 'NVDA',
            headline: 'Blackwell GPU production ramps faster than initially projected',
            source: 'Street Brief',
            publishedAt: '2026-05-16T09:10:00Z',
            tag: 'Product',
            url: 'https://example.com/news/nvda-blackwell'
        },
        {
            id: 'nvda-q1-beat',
            ticker: 'NVDA',
            headline: 'NVIDIA posts record Q1 revenue, data center segment up 150% YoY',
            source: 'Earnings Desk',
            publishedAt: '2026-05-14T16:05:00Z',
            tag: 'Earnings',
            url: 'https://example.com/news/nvda-q1-beat'
        }
    ],
    AMZN: [
        {
            id: 'amzn-aws-reinvent',
            ticker: 'AMZN',
            headline: 'AWS launches next-gen custom chips targeting AI inference workloads',
            source: 'Data Center Journal',
            publishedAt: '2026-05-19T14:20:00Z',
            tag: 'Product',
            url: 'https://example.com/news/amzn-aws-chips'
        },
        {
            id: 'amzn-prime-day',
            ticker: 'AMZN',
            headline: 'Prime membership hits record high ahead of summer sales event',
            source: 'Market Wire',
            publishedAt: '2026-05-17T07:45:00Z',
            tag: 'Guidance',
            url: 'https://example.com/news/amzn-prime-day'
        },
        {
            id: 'amzn-margins',
            ticker: 'AMZN',
            headline: 'Operating margins expand as fulfillment automation reduces costs',
            source: 'Earnings Desk',
            publishedAt: '2026-05-15T18:30:00Z',
            tag: 'Earnings',
            url: 'https://example.com/news/amzn-margins'
        }
    ],
    GOOGL: [
        {
            id: 'googl-gemini-update',
            ticker: 'GOOGL',
            headline: 'Google rolls out Gemini 2.5 across Search and Workspace products',
            source: 'Tech Ledger',
            publishedAt: '2026-05-19T10:00:00Z',
            tag: 'Product',
            url: 'https://example.com/news/googl-gemini'
        },
        {
            id: 'googl-cloud-growth',
            ticker: 'GOOGL',
            headline: 'Google Cloud crosses $40B annual run rate, narrows gap with Azure',
            source: 'Street Brief',
            publishedAt: '2026-05-17T14:15:00Z',
            tag: 'Earnings',
            url: 'https://example.com/news/googl-cloud-growth'
        },
        {
            id: 'googl-ad-rebound',
            ticker: 'GOOGL',
            headline: 'Digital ad spending rebounds as retail and travel sectors increase budgets',
            source: 'Market Wire',
            publishedAt: '2026-05-15T09:50:00Z',
            tag: 'Macro',
            url: 'https://example.com/news/googl-ad-rebound'
        }
    ],
    META: [
        {
            id: 'meta-threads-growth',
            ticker: 'META',
            headline: 'Threads reaches 300M monthly active users, ad rollout begins',
            source: 'Tech Ledger',
            publishedAt: '2026-05-18T08:30:00Z',
            tag: 'Product',
            url: 'https://example.com/news/meta-threads'
        },
        {
            id: 'meta-reality-labs',
            ticker: 'META',
            headline: 'Reality Labs narrows quarterly losses as Quest headset sales surge',
            source: 'Earnings Desk',
            publishedAt: '2026-05-16T15:40:00Z',
            tag: 'Earnings',
            url: 'https://example.com/news/meta-reality-labs'
        },
        {
            id: 'meta-ai-infra',
            ticker: 'META',
            headline: 'Meta commits $18B to AI infrastructure buildout through 2027',
            source: 'Data Center Journal',
            publishedAt: '2026-05-14T12:20:00Z',
            tag: 'Macro',
            url: 'https://example.com/news/meta-ai-infra'
        }
    ],
    TSLA: [
        {
            id: 'tsla-robotaxi-launch',
            ticker: 'TSLA',
            headline: 'Tesla begins supervised robotaxi operations in Austin and San Jose',
            source: 'Market Wire',
            publishedAt: '2026-05-19T16:00:00Z',
            tag: 'Product',
            url: 'https://example.com/news/tsla-robotaxi'
        },
        {
            id: 'tsla-deliveries',
            ticker: 'TSLA',
            headline: 'Q2 delivery guidance revised higher on Model Y refresh demand',
            source: 'Street Brief',
            publishedAt: '2026-05-17T11:30:00Z',
            tag: 'Guidance',
            url: 'https://example.com/news/tsla-deliveries'
        },
        {
            id: 'tsla-energy-record',
            ticker: 'TSLA',
            headline: 'Energy storage deployments set quarterly record at 12.4 GWh',
            source: 'Earnings Desk',
            publishedAt: '2026-05-15T14:50:00Z',
            tag: 'Earnings',
            url: 'https://example.com/news/tsla-energy-record'
        }
    ],
    AMD: [
        {
            id: 'amd-mi400-preview',
            ticker: 'AMD',
            headline: 'AMD previews MI400 accelerator targeting data center AI training',
            source: 'Data Center Journal',
            publishedAt: '2026-05-18T10:45:00Z',
            tag: 'Product',
            url: 'https://example.com/news/amd-mi400'
        },
        {
            id: 'amd-server-share',
            ticker: 'AMD',
            headline: 'EPYC server CPU market share gains continue in latest Mercury data',
            source: 'Street Brief',
            publishedAt: '2026-05-16T13:20:00Z',
            tag: 'Macro',
            url: 'https://example.com/news/amd-server-share'
        },
        {
            id: 'amd-guidance-raise',
            ticker: 'AMD',
            headline: 'AMD lifts full-year revenue guidance on data center strength',
            source: 'Earnings Desk',
            publishedAt: '2026-05-14T19:00:00Z',
            tag: 'Guidance',
            url: 'https://example.com/news/amd-guidance'
        }
    ],
    NFLX: [
        {
            id: 'nflx-ads-tier',
            ticker: 'NFLX',
            headline: 'Ad-supported tier surpasses 70M subscribers globally',
            source: 'Market Wire',
            publishedAt: '2026-05-18T12:00:00Z',
            tag: 'Earnings',
            url: 'https://example.com/news/nflx-ads-tier'
        },
        {
            id: 'nflx-live-sports',
            ticker: 'NFLX',
            headline: 'Netflix secures multi-year NFL package starting 2027 season',
            source: 'Tech Ledger',
            publishedAt: '2026-05-16T08:30:00Z',
            tag: 'Product',
            url: 'https://example.com/news/nflx-live-sports'
        },
        {
            id: 'nflx-content-spend',
            ticker: 'NFLX',
            headline: 'Content spending efficiency improves as licensed titles drive engagement',
            source: 'Street Brief',
            publishedAt: '2026-05-14T15:10:00Z',
            tag: 'Guidance',
            url: 'https://example.com/news/nflx-content-spend'
        }
    ],
    COIN: [
        {
            id: 'coin-base-layer',
            ticker: 'COIN',
            headline: 'Base L2 transaction volume overtakes Arbitrum for first time',
            source: 'Data Center Journal',
            publishedAt: '2026-05-19T07:15:00Z',
            tag: 'Product',
            url: 'https://example.com/news/coin-base-layer'
        },
        {
            id: 'coin-custody-growth',
            ticker: 'COIN',
            headline: 'Institutional custody AUM crosses $300B as ETF demand persists',
            source: 'Market Wire',
            publishedAt: '2026-05-17T13:40:00Z',
            tag: 'Earnings',
            url: 'https://example.com/news/coin-custody'
        },
        {
            id: 'coin-regulation',
            ticker: 'COIN',
            headline: 'Senate passes stablecoin framework bill, removing regulatory overhang',
            source: 'Street Brief',
            publishedAt: '2026-05-15T20:30:00Z',
            tag: 'Macro',
            url: 'https://example.com/news/coin-regulation'
        }
    ],
    JPM: [
        {
            id: 'jpm-trading-rev',
            ticker: 'JPM',
            headline: 'Fixed income trading revenue beats estimates on rate volatility',
            source: 'Earnings Desk',
            publishedAt: '2026-05-18T06:50:00Z',
            tag: 'Earnings',
            url: 'https://example.com/news/jpm-trading'
        },
        {
            id: 'jpm-ai-fraud',
            ticker: 'JPM',
            headline: 'JPMorgan deploys AI-powered fraud detection across consumer banking',
            source: 'Tech Ledger',
            publishedAt: '2026-05-16T10:15:00Z',
            tag: 'Product',
            url: 'https://example.com/news/jpm-ai-fraud'
        },
        {
            id: 'jpm-rate-outlook',
            ticker: 'JPM',
            headline: 'Dimon warns extended rates could slow lending growth into H2',
            source: 'Market Wire',
            publishedAt: '2026-05-14T08:00:00Z',
            tag: 'Macro',
            url: 'https://example.com/news/jpm-rate-outlook'
        }
    ],
    V: [
        {
            id: 'v-cross-border',
            ticker: 'V',
            headline: 'Cross-border transaction volumes up 18% as travel spending normalizes',
            source: 'Market Wire',
            publishedAt: '2026-05-18T09:30:00Z',
            tag: 'Earnings',
            url: 'https://example.com/news/v-cross-border'
        },
        {
            id: 'v-tokenization',
            ticker: 'V',
            headline: 'Visa expands tokenization network to support real-time B2B payments',
            source: 'Tech Ledger',
            publishedAt: '2026-05-16T14:45:00Z',
            tag: 'Product',
            url: 'https://example.com/news/v-tokenization'
        },
        {
            id: 'v-fintech-partner',
            ticker: 'V',
            headline: 'New fintech partnerships accelerate embedded finance adoption',
            source: 'Street Brief',
            publishedAt: '2026-05-14T11:20:00Z',
            tag: 'Guidance',
            url: 'https://example.com/news/v-fintech'
        }
    ],
    DIS: [
        {
            id: 'dis-streaming-profit',
            ticker: 'DIS',
            headline: 'Disney+ reaches sustained profitability ahead of schedule',
            source: 'Earnings Desk',
            publishedAt: '2026-05-18T16:20:00Z',
            tag: 'Earnings',
            url: 'https://example.com/news/dis-streaming-profit'
        },
        {
            id: 'dis-parks-expansion',
            ticker: 'DIS',
            headline: 'Parks division announces $8B expansion plan across three continents',
            source: 'Market Wire',
            publishedAt: '2026-05-16T07:00:00Z',
            tag: 'Guidance',
            url: 'https://example.com/news/dis-parks'
        },
        {
            id: 'dis-box-office',
            ticker: 'DIS',
            headline: 'Summer film slate on track for strongest box office since 2019',
            source: 'Tech Ledger',
            publishedAt: '2026-05-14T13:40:00Z',
            tag: 'Product',
            url: 'https://example.com/news/dis-box-office'
        }
    ]
};
function getStockNews(ticker) {
    return NEWS_BY_TICKER[ticker] ?? [];
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/useStockNews.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useStockNews",
    ()=>useStockNews
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockInsights$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockInsights.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function useStockNews(ticker) {
    _s();
    const [items, setItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useStockNews.useEffect": ()=>{
            let active = true;
            setIsLoading(true);
            setError(null);
            const timer = setTimeout({
                "useStockNews.useEffect.timer": ()=>{
                    try {
                        if (!active) return;
                        setItems((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockInsights$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStockNews"])(ticker));
                        setIsLoading(false);
                    } catch  {
                        if (!active) return;
                        setItems([]);
                        setError('Failed to load news');
                        setIsLoading(false);
                    }
                }
            }["useStockNews.useEffect.timer"], 140);
            return ({
                "useStockNews.useEffect": ()=>{
                    active = false;
                    clearTimeout(timer);
                }
            })["useStockNews.useEffect"];
        }
    }["useStockNews.useEffect"], [
        ticker
    ]);
    return {
        items,
        isLoading,
        error
    };
}
_s(useStockNews, "AX0aDFsbyXDOTJu0ZGMj0hIoUFs=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/format.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compactAmount",
    ()=>compactAmount,
    "formatAmount",
    ()=>formatAmount,
    "formatTradeAmount",
    ()=>formatTradeAmount,
    "formatUsdValue",
    ()=>formatUsdValue,
    "sanitizeNumericInput",
    ()=>sanitizeNumericInput
]);
const ABBREVIATIONS = [
    [
        1e18,
        'Qi'
    ],
    [
        1e15,
        'Q'
    ],
    [
        1e12,
        'T'
    ],
    [
        1e9,
        'B'
    ],
    [
        1e6,
        'M'
    ]
];
function formatAmount(value, maxDecimals = 6) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num === 0) return '0';
    const abs = Math.abs(num);
    for (const [threshold, suffix] of ABBREVIATIONS){
        if (abs >= threshold) {
            const abbreviated = num / threshold;
            const fixed = abbreviated.toFixed(2).replace(/\.?0+$/, '');
            return `${fixed}${suffix}`;
        }
    }
    if (abs >= 1000) {
        const intPart = Math.floor(abs);
        const decPart = abs - intPart;
        const formatted = intPart.toLocaleString('en-US');
        if (decPart > 0.005) {
            const decimals = Math.min(maxDecimals, 2);
            const decStr = decPart.toFixed(decimals).slice(1).replace(/0+$/, '').replace(/\.$/, '');
            return (num < 0 ? '-' : '') + formatted + decStr;
        }
        return (num < 0 ? '-' : '') + formatted;
    }
    if (abs >= 1) {
        const decimals = Math.min(maxDecimals, 4);
        return trimTrailingZeros(num.toFixed(decimals));
    }
    const significantDecimals = Math.min(maxDecimals, 6);
    if (abs < Math.pow(10, -significantDecimals)) {
        return '< 0.000001';
    }
    return trimTrailingZeros(num.toFixed(significantDecimals));
}
function compactScientific(num) {
    // toExponential picks the smallest mantissa precision that still survives
    // JS's Number → string round-trip, then we trim trailing zeros so e.g.
    // 1e-12 → "1e-12" rather than "1.000000e-12".
    const raw = num.toExponential();
    const [mantissa, exponent] = raw.split('e');
    const cleanMantissa = mantissa.includes('.') ? mantissa.replace(/0+$/, '').replace(/\.$/, '') : mantissa;
    return `${cleanMantissa}e${exponent}`;
}
function trimTrailingZeros(s) {
    if (!s.includes('.')) return s;
    return s.replace(/0+$/, '').replace(/\.$/, '');
}
const COMPACT_THRESHOLDS = [
    [
        1e12,
        'T'
    ],
    [
        1e9,
        'B'
    ],
    [
        1e6,
        'M'
    ],
    [
        1e3,
        'K'
    ]
];
function compactAmount(value, maxChars) {
    if (value === 0 || isNaN(value)) return '0';
    const full = formatAmount(value);
    if (full.length <= maxChars) return full;
    for (const [threshold, suffix] of COMPACT_THRESHOLDS){
        if (Math.abs(value) >= threshold) {
            const abbreviated = value / threshold;
            const decimals = abbreviated >= 100 ? 0 : abbreviated >= 10 ? 1 : 2;
            let fixed = abbreviated.toFixed(decimals);
            if (fixed.includes('.')) fixed = fixed.replace(/0+$/, '').replace(/\.$/, '');
            return `${fixed}${suffix}`;
        }
    }
    return full;
}
const USD_COMPACT = [
    [
        1e12,
        'T'
    ],
    [
        1e9,
        'B'
    ],
    [
        1e6,
        'M'
    ]
];
function formatUsdValue(usd) {
    if (!usd || isNaN(usd)) return '';
    if (usd < 0.01) return '< $0.01';
    for (const [threshold, suffix] of USD_COMPACT){
        if (usd >= threshold) {
            const abbr = usd / threshold;
            const fixed = abbr >= 100 ? abbr.toFixed(0) : abbr >= 10 ? abbr.toFixed(1) : abbr.toFixed(2);
            const clean = fixed.includes('.') ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed;
            return `~$${clean}${suffix}`;
        }
    }
    if (usd >= 100_000) {
        const k = usd / 1000;
        const fixed = k >= 100 ? k.toFixed(0) : k.toFixed(1);
        const clean = fixed.includes('.') ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed;
        return `~$${clean}K`;
    }
    if (usd >= 1000) {
        const intPart = Math.floor(usd);
        const decPart = usd - intPart;
        const formatted = intPart.toLocaleString('en-US');
        if (decPart >= 0.005) {
            return `~$${formatted}.${decPart.toFixed(2).slice(2)}`;
        }
        return `~$${formatted}`;
    }
    if (Number.isInteger(usd)) return `~$${usd}`;
    return `~$${usd.toFixed(2)}`;
}
function formatTradeAmount(n) {
    if (!isFinite(n) || isNaN(n)) return '$0.00';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs === 0) return '$0.00';
    if (abs < 0.01) return '< $0.01';
    if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}K`;
    return `${sign}$${abs.toFixed(2)}`;
}
function sanitizeNumericInput(value) {
    let sanitized = value.replace(/[^0-9.]/g, '');
    const dotIndex = sanitized.indexOf('.');
    if (dotIndex !== -1) {
        sanitized = sanitized.slice(0, dotIndex + 1) + sanitized.slice(dotIndex + 1).replace(/\./g, '');
    }
    if (dotIndex !== -1) {
        const intPart = sanitized.slice(0, dotIndex);
        const stripped = intPart.replace(/^0+/, '') || '0';
        sanitized = stripped + sanitized.slice(dotIndex);
    } else if (sanitized.length > 1) {
        sanitized = sanitized.replace(/^0+/, '') || '0';
    }
    if (sanitized.length > 20) {
        sanitized = sanitized.slice(0, 20);
    }
    return sanitized;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/chartData.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "computeSMA",
    ()=>computeSMA,
    "generateProbabilityHistory",
    ()=>generateProbabilityHistory,
    "getChartData",
    ()=>getChartData
]);
const TIMEFRAME_CONFIG = {
    '1H': {
        points: 60,
        intervalMs: 60_000,
        useTimestamp: true
    },
    '4H': {
        points: 42,
        intervalMs: 14_400_000,
        useTimestamp: true
    },
    '1D': {
        points: 24,
        intervalMs: 3_600_000,
        useTimestamp: true
    },
    '1W': {
        points: 28,
        intervalMs: 6 * 3_600_000,
        useTimestamp: true
    },
    '1M': {
        points: 30,
        intervalMs: 86_400_000,
        useTimestamp: false
    },
    '3M': {
        points: 90,
        intervalMs: 86_400_000,
        useTimestamp: false
    },
    '1Y': {
        points: 365,
        intervalMs: 86_400_000,
        useTimestamp: false
    }
};
function generateOHLC(basePrice, config, volatility = 0.02) {
    const { points, intervalMs, useTimestamp } = config;
    const data = [];
    const nowMs = Date.now();
    const prices = [
        basePrice
    ];
    for(let i = 1; i < points; i++){
        const prev = prices[0];
        const change = (Math.random() - 0.52) * volatility * prev;
        prices.unshift(prev - change);
    }
    for(let i = 0; i < points; i++){
        const candleMs = nowMs - (points - 1 - i) * intervalMs;
        const time = useTimestamp ? Math.floor(candleMs / 1000) : new Date(candleMs).toISOString().split('T')[0];
        const close = prices[i];
        const open = i > 0 ? prices[i - 1] : close * (1 + (Math.random() - 0.5) * volatility);
        const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
        const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
        const volume = Math.floor(1_000_000 + Math.random() * 50_000_000);
        data.push({
            time,
            open,
            high,
            low,
            close,
            volume
        });
    }
    return data;
}
const CHART_CACHE = new Map();
function computeSMA(data, period) {
    if (data.length < period) return [];
    const result = [];
    let sum = 0;
    for(let i = 0; i < data.length; i++){
        sum += data[i].close;
        if (i >= period) sum -= data[i - period].close;
        if (i >= period - 1) {
            result.push({
                time: data[i].time,
                value: sum / period
            });
        }
    }
    return result;
}
function getChartData(symbol, timeframe, basePrice) {
    if (!CHART_CACHE.has(symbol)) {
        CHART_CACHE.set(symbol, new Map());
    }
    const symbolCache = CHART_CACHE.get(symbol);
    if (!symbolCache.has(timeframe)) {
        symbolCache.set(timeframe, generateOHLC(basePrice, TIMEFRAME_CONFIG[timeframe]));
    }
    return symbolCache.get(timeframe);
}
function generateProbabilityHistory(currentProb, days) {
    const data = [];
    let prob = 0.3 + Math.random() * 0.4;
    const now = new Date();
    for(let i = days; i >= 0; i--){
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const drift = (currentProb - prob) * 0.02;
        const noise = (Math.random() - 0.5) * 0.06;
        prob = Math.max(0.01, Math.min(0.99, prob + drift + noise));
        data.push({
            time: dateStr,
            value: prob
        });
    }
    if (data.length > 0) {
        data[data.length - 1].value = currentProb;
    }
    return data;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/useStocks.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useListedCount",
    ()=>useListedCount,
    "useMintSynthetic",
    ()=>useMintSynthetic,
    "useRedeemSynthetic",
    ()=>useRedeemSynthetic,
    "useStockPosition",
    ()=>useStockPosition
]);
/**
 * useStocks — wagmi hooks for GoodStocks on-chain interactions.
 *
 * GoodStocks uses:
 *   - CollateralVault: deposit G$ collateral → mint synthetic stocks → redeem
 *   - SyntheticAssetFactory: list of available synthetic assets
 *
 * CollateralVault and SyntheticAssetFactory are deployed to devnet (chain 42069).
 * Addresses are set in CONTRACTS in chain.ts.
 * Initial synthetic assets (sAAPL, sTSLA etc.) must be listed via listAsset()
 * before users can mint positions.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContract.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useWriteContract.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$readContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@wagmi/core/dist/esm/actions/readContract.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$wagmi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/wagmi.ts [app-client] (ecmascript) <locals>");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
const VAULT = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].CollateralVault;
const FACTORY = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].SyntheticAssetFactory;
function useStockPosition(ticker) {
    _s();
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    const posResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: VAULT ?? undefined,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CollateralVaultABI"],
        functionName: 'getPosition',
        args: VAULT && address ? [
            address,
            ticker
        ] : undefined,
        query: {
            enabled: !!(VAULT && address && ticker),
            refetchInterval: 15_000
        }
    });
    const ratioResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: VAULT ?? undefined,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CollateralVaultABI"],
        functionName: 'getCollateralRatio',
        args: VAULT && address ? [
            address,
            ticker
        ] : undefined,
        query: {
            enabled: !!(VAULT && address && ticker),
            refetchInterval: 15_000
        }
    });
    if (!posResult.data) return {
        position: null,
        isLoading: posResult.isLoading
    };
    const [collateralAmount, debtAmount] = posResult.data;
    const ratio = ratioResult.data ?? BigInt(0);
    return {
        position: {
            collateralAmount,
            debtAmount,
            collateralFloat: Number(collateralAmount) / 1e18,
            debtFloat: Number(debtAmount) / 1e18,
            collateralRatio: Number(ratio) / 10_000
        },
        isLoading: posResult.isLoading
    };
}
_s(useStockPosition, "yEcFdb1DGg+QCDheD+4mptC/eR8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"]
    ];
});
function useListedCount() {
    _s1();
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: FACTORY ?? undefined,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SyntheticAssetFactoryABI"],
        functionName: 'listedCount',
        query: {
            enabled: !!FACTORY,
            refetchInterval: 60_000
        }
    });
    return {
        count: result.data ?? BigInt(0),
        isLoading: result.isLoading
    };
}
_s1(useListedCount, "E9zKaZ5TCqsAryIFg4ebcJTTBkw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"]
    ];
});
function useMintSynthetic() {
    _s2();
    const [phase, setPhase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const { writeContractAsync } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWriteContract"])();
    const { isConnected, address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    const reset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMintSynthetic.useCallback[reset]": ()=>{
            setPhase('idle');
            setError(null);
        }
    }["useMintSynthetic.useCallback[reset]"], []);
    const mint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useMintSynthetic.useCallback[mint]": async (ticker, collateralAmount, mintAmount)=>{
            if (!isConnected || !address) {
                setError('Wallet not connected');
                return;
            }
            if (!VAULT) {
                setError('CollateralVault not deployed yet');
                return;
            }
            try {
                // Read the exact fee before approving so the approval covers collateral + fee.
                // This prevents viem's internal eth_call simulation of depositAndMint from
                // reverting with InsufficientAllowance (GOO-183).
                const [, fee] = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$readContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readContract"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$wagmi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["config"], {
                    address: VAULT,
                    abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CollateralVaultABI"],
                    functionName: 'getMintRequirements',
                    args: [
                        address,
                        ticker,
                        mintAmount,
                        collateralAmount
                    ]
                });
                setPhase('approving');
                await writeContractAsync({
                    address: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].GoodDollarToken,
                    abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ERC20ABI"],
                    functionName: 'approve',
                    args: [
                        VAULT,
                        collateralAmount + fee
                    ]
                });
                setPhase('pending');
                await writeContractAsync({
                    address: VAULT,
                    abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CollateralVaultABI"],
                    functionName: 'depositAndMint',
                    args: [
                        ticker,
                        collateralAmount,
                        mintAmount
                    ]
                });
                setPhase('done');
            } catch (err) {
                const e = err;
                setError(e?.shortMessage ?? e?.message ?? 'Transaction failed');
                setPhase('error');
            }
        }
    }["useMintSynthetic.useCallback[mint]"], [
        isConnected,
        address,
        writeContractAsync
    ]);
    return {
        mint,
        phase,
        error,
        reset,
        isConnected,
        isDeployed: !!VAULT
    };
}
_s2(useMintSynthetic, "Vm7xMd1jWYAuOowsTQS3QYasEZg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWriteContract"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"]
    ];
});
function useRedeemSynthetic() {
    _s3();
    const [phase, setPhase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const { writeContractAsync } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWriteContract"])();
    const { isConnected } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    const reset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useRedeemSynthetic.useCallback[reset]": ()=>{
            setPhase('idle');
            setError(null);
        }
    }["useRedeemSynthetic.useCallback[reset]"], []);
    const redeem = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useRedeemSynthetic.useCallback[redeem]": async (ticker, burnAmount, withdrawAmount)=>{
            if (!isConnected) {
                setError('Wallet not connected');
                return;
            }
            if (!VAULT) {
                setError('CollateralVault not deployed yet');
                return;
            }
            try {
                setPhase('pending');
                await writeContractAsync({
                    address: VAULT,
                    abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CollateralVaultABI"],
                    functionName: 'burn',
                    args: [
                        ticker,
                        burnAmount
                    ]
                });
                await writeContractAsync({
                    address: VAULT,
                    abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CollateralVaultABI"],
                    functionName: 'withdrawCollateral',
                    args: [
                        ticker,
                        withdrawAmount
                    ]
                });
                setPhase('done');
            } catch (err) {
                const e = err;
                setError(e?.shortMessage ?? e?.message ?? 'Transaction failed');
                setPhase('error');
            }
        }
    }["useRedeemSynthetic.useCallback[redeem]"], [
        isConnected,
        writeContractAsync
    ]);
    return {
        redeem,
        phase,
        error,
        reset,
        isConnected,
        isDeployed: !!VAULT
    };
}
_s3(useRedeemSynthetic, "0VzTVF0mma6fNcoeYGqXKGpu5VI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWriteContract"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/stocksOrderValidation.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * stocksOrderValidation — side-aware sell-guard helpers for GoodStocks.
 *
 * Selling a synthetic stock on `/stocks/[ticker]` burns sToken debt
 * (CollateralVault.burn) and withdraws the freed collateral. You can
 * never burn more debt than you actually minted, so the user's current
 * `debtAmount` is the precise gate for "Sell is allowed" and the
 * precise ceiling for the sell amount.
 *
 * This helper returns pure booleans so the order form can:
 *   - disable the Sell submit button when the user has no position,
 *   - disable the Sell submit button when requested shares exceed
 *     the held balance,
 *   - render inline warning chips that explain both states.
 *
 * It deliberately stays silent for the Buy side and for disconnected
 * wallets — those cases are already handled by WalletGatedTradeButton
 * and the existing `hasAmount` gate in StockDetailPage.
 */ __turbopack_context__.s([
    "computeSellGuards",
    ()=>computeSellGuards,
    "isLimitDisabledOnChain",
    ()=>isLimitDisabledOnChain
]);
const CLEAN = {
    hasPosition: false,
    balanceShares: 0,
    sellGated: false,
    sellSharesExceedsBalance: false
};
function computeSellGuards(input) {
    const { side, isConnected, debtFloat, sharesRequested, epsilon = 1e-9 } = input;
    if (side !== 'sell') return CLEAN;
    const balanceShares = typeof debtFloat === 'number' && Number.isFinite(debtFloat) && debtFloat > 0 ? debtFloat : 0;
    const hasPosition = balanceShares > 0;
    const sellGated = isConnected && !hasPosition;
    const sellSharesExceedsBalance = isConnected && hasPosition && Number.isFinite(sharesRequested) && sharesRequested > 0 && sharesRequested > balanceShares + epsilon;
    return {
        hasPosition,
        balanceShares,
        sellGated,
        sellSharesExceedsBalance
    };
}
const ALLOWED = {
    disabled: false,
    reason: null
};
function isLimitDisabledOnChain(input) {
    if (input.isDeployed && input.orderType === 'limit') {
        return {
            disabled: true,
            reason: 'limit-not-supported-on-chain'
        };
    }
    return ALLOWED;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/gDollarAmount.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toG$Wei",
    ()=>toG$Wei
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$parseUnits$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/utils/unit/parseUnits.js [app-client] (ecmascript)");
;
function toG$Wei(amountG$) {
    if (!Number.isFinite(amountG$)) {
        throw new Error(`toG$Wei: non-finite input ${String(amountG$)}`);
    }
    if (amountG$ < 0) {
        throw new Error(`toG$Wei: negative amount ${amountG$}`);
    }
    // toFixed(18) preserves every wei-precise digit the IEEE-754 number
    // can encode, and parseUnits then treats it as an exact base-10 string.
    // No float multiplication ever touches the resulting BigInt.
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$parseUnits$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseUnits"])(amountG$.toFixed(18), 18);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/useMounted.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useMounted",
    ()=>useMounted
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
function useMounted() {
    _s();
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useMounted.useEffect": ()=>{
            setMounted(true);
        }
    }["useMounted.useEffect"], []);
    return mounted;
}
_s(useMounted, "LrrVfNW3d1raFE0BNzCTILYmIfo=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/stockDiscovery.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getDailyMovers",
    ()=>getDailyMovers,
    "getMarketAnalysisPicks",
    ()=>getMarketAnalysisPicks,
    "getRelatedSymbols",
    ()=>getRelatedSymbols,
    "getTopMovers",
    ()=>getTopMovers,
    "getTrendingStocks",
    ()=>getTrendingStocks
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockInsights$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockInsights.ts [app-client] (ecmascript)");
;
function getRelatedSymbols(stocks, ticker, limit = 4) {
    const current = stocks.find((s)=>s.ticker === ticker);
    if (!current) return [];
    return stocks.filter((s)=>s.ticker !== ticker).sort((a, b)=>{
        const aScore = (a.sector === current.sector ? 1000 : 0) - Math.abs(a.marketCap - current.marketCap) / 1e10;
        const bScore = (b.sector === current.sector ? 1000 : 0) - Math.abs(b.marketCap - current.marketCap) / 1e10;
        return bScore - aScore;
    }).slice(0, limit);
}
function getTopMovers(stocks, limit = 4) {
    return [
        ...stocks
    ].sort((a, b)=>Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, limit);
}
function getDailyMovers(stocks, limit = 6) {
    return [
        ...stocks
    ].sort((a, b)=>Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, limit);
}
function getTrendingStocks(stocks, limit = 6) {
    return [
        ...stocks
    ].sort((a, b)=>{
        const aScore = a.volume24h * 0.7 + a.marketCap * 0.3;
        const bScore = b.volume24h * 0.7 + b.marketCap * 0.3;
        return bScore - aScore;
    }).slice(0, limit);
}
function getMarketAnalysisPicks(stocks, limit = 6) {
    return [
        ...stocks
    ].map((stock)=>{
        const outlook = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockInsights$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAnalystOutlook"])(stock.ticker);
        const upside = outlook ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockInsights$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calcUpsidePercent"])(stock.price, outlook.targetMean) : 0;
        const confidence = outlook?.analystCount ?? 0;
        return {
            stock,
            score: upside * 2 + confidence * 0.5 + stock.change24h
        };
    }).sort((a, b)=>b.score - a.score).slice(0, limit).map((entry)=>entry.stock);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RelatedMoversPanel",
    ()=>RelatedMoversPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-client] (ecmascript)");
;
;
;
function RelatedMoversPanel({ currentTicker, related, movers }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-4 bg-dark-100 rounded-2xl border border-gray-700/20 p-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-sm font-semibold text-white",
                children: "Discover More Stocks"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx",
                lineNumber: 16,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[11px] text-gray-500 mb-1.5",
                        children: "Related symbols"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx",
                        lineNumber: 19,
                        columnNumber: 9
                    }, this),
                    related.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-gray-400",
                        children: "No related symbols available yet."
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx",
                        lineNumber: 21,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-1.5",
                        children: related.map((stock)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: `/stocks/${stock.ticker}`,
                                prefetch: false,
                                className: "flex items-center justify-between gap-2 rounded-lg border border-gray-700/25 bg-dark-50/25 px-2.5 py-2 hover:bg-dark-50/40 transition-colors",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-gray-200",
                                        children: stock.ticker
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx",
                                        lineNumber: 31,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-gray-400",
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockPrice"])(stock.price)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx",
                                        lineNumber: 32,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, `rel-${stock.ticker}`, true, {
                                fileName: "[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx",
                                lineNumber: 25,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx",
                        lineNumber: 23,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[11px] text-gray-500 mb-1.5",
                        children: "Daily movers"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx",
                        lineNumber: 40,
                        columnNumber: 9
                    }, this),
                    movers.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-gray-400",
                        children: "Mover data unavailable."
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx",
                        lineNumber: 42,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-1.5",
                        children: movers.filter((stock)=>stock.ticker !== currentTicker).slice(0, 3).map((stock)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: `/stocks/${stock.ticker}`,
                                prefetch: false,
                                className: "flex items-center justify-between gap-2 rounded-lg border border-gray-700/25 bg-dark-50/25 px-2.5 py-2 hover:bg-dark-50/40 transition-colors",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-gray-200",
                                        children: stock.ticker
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx",
                                        lineNumber: 52,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `text-xs font-medium ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                        children: [
                                            stock.change24h >= 0 ? '+' : '',
                                            stock.change24h.toFixed(2),
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx",
                                        lineNumber: 53,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, `mov-${stock.ticker}`, true, {
                                fileName: "[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx",
                                lineNumber: 46,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx",
                        lineNumber: 44,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx",
        lineNumber: 15,
        columnNumber: 5
    }, this);
}
_c = RelatedMoversPanel;
var _c;
__turbopack_context__.k.register(_c, "RelatedMoversPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/useStockPrices.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getStockPrice",
    ()=>getStockPrice,
    "useStockPrices",
    ()=>useStockPrices
]);
/**
 * useStockPrices — live USD prices for GoodStocks synthetic equities.
 *
 * Data source priority:
 *   1. On-chain PriceOracle contract (when StocksPriceOracle is deployed)
 *      Reads all ticker prices in a single multicall via wagmi useReadContracts.
 *   2. Static fallback prices from stockData.ts
 *
 * Prices are returned as plain JavaScript numbers (dollars, NOT 8-decimal bigint).
 * The on-chain oracle returns 8-decimal integers — we convert via / 1e8.
 *
 * Refresh: on-chain data uses wagmi's built-in refetch interval (30s).
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContracts.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
// ─── Static fallback from stockData seeds ────────────────────────────────────
function buildFallbackPrices() {
    const out = {};
    for (const ticker of (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAllTickers"])()){
        const stock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStockByTicker"])(ticker);
        if (stock) out[ticker] = stock.price;
    }
    return out;
}
const FALLBACK_PRICES = buildFallbackPrices();
function useStockPrices() {
    _s();
    const oracleAddress = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].StocksPriceOracle;
    const tickers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useStockPrices.useMemo[tickers]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAllTickers"])()
    }["useStockPrices.useMemo[tickers]"], []);
    // Build a wagmi multicall for every ticker when the oracle is available.
    const contracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useStockPrices.useMemo[contracts]": ()=>{
            if (!oracleAddress) return [];
            return tickers.map({
                "useStockPrices.useMemo[contracts]": (ticker)=>({
                        address: oracleAddress,
                        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceOracleABI"],
                        functionName: 'getPrice',
                        args: [
                            ticker
                        ]
                    })
            }["useStockPrices.useMemo[contracts]"]);
        }
    }["useStockPrices.useMemo[contracts]"], [
        oracleAddress,
        tickers
    ]);
    const { data, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts,
        query: {
            enabled: contracts.length > 0,
            refetchInterval: 30_000,
            staleTime: 30_000
        }
    });
    const { prices, sources } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useStockPrices.useMemo": ()=>{
            if (!data || data.length === 0) {
                const fbSources = {};
                for (const t of tickers)fbSources[t] = 'fallback';
                return {
                    prices: FALLBACK_PRICES,
                    sources: fbSources
                };
            }
            const outPrices = {
                ...FALLBACK_PRICES
            };
            const outSources = {};
            let anyLive = false;
            for(let i = 0; i < tickers.length; i++){
                const result = data[i];
                if (result?.status === 'success' && typeof result.result === 'bigint') {
                    // Oracle returns 8-decimal price (e.g. 17872000000 = $178.72)
                    outPrices[tickers[i]] = Number(result.result) / 1e8;
                    outSources[tickers[i]] = 'chain-oracle';
                    anyLive = true;
                } else {
                    outSources[tickers[i]] = 'fallback';
                }
            }
            return {
                prices: anyLive ? outPrices : FALLBACK_PRICES,
                sources: outSources
            };
        }
    }["useStockPrices.useMemo"], [
        data,
        tickers
    ]);
    const isLive = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useStockPrices.useMemo[isLive]": ()=>{
            if (!data || data.length === 0) return false;
            return data.some({
                "useStockPrices.useMemo[isLive]": (r)=>r?.status === 'success'
            }["useStockPrices.useMemo[isLive]"]);
        }
    }["useStockPrices.useMemo[isLive]"], [
        data
    ]);
    return {
        prices,
        isLive,
        isLoading,
        sources
    };
}
_s(useStockPrices, "CA0SJtdAjpgYpgPc2ifzd2FHQSQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"]
    ];
});
function getStockPrice(prices, ticker) {
    return prices[ticker] ?? FALLBACK_PRICES[ticker] ?? 0;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/useStockHoldings.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useStockHoldings",
    ()=>useStockHoldings
]);
/**
 * useStockHoldings — live portfolio positions from CollateralVault.
 *
 * Reads getPosition(user, ticker) for all listed stocks in a single multicall.
 * Only positions with non-zero debt (minted synthetic tokens) are returned.
 *
 * Returned PortfolioHolding fields:
 *   shares             – synthetic tokens minted (userDebt / 1e18)
 *   collateralDeposited – G$ locked as collateral / 1e18
 *   currentPrice       – live USD price from PriceOracle via useStockPrices
 *   collateralRequired  – minimum G$ needed at 150% ratio (shares × price × 1.5)
 *   avgCost            – not recoverable from vault state; always 0
 *
 * Refresh: every 30 s (inherits wagmi refetchInterval).
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContracts.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockPrices$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useStockPrices.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
const MIN_COLLATERAL_RATIO = 1.5 // 150% — matches CollateralVault.MIN_COLLATERAL_RATIO
;
function useStockHoldings(userAddress) {
    _s();
    const tickers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useStockHoldings.useMemo[tickers]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAllTickers"])()
    }["useStockHoldings.useMemo[tickers]"], []);
    const { prices, isLoading: pricesLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockPrices$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStockPrices"])();
    const contracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useStockHoldings.useMemo[contracts]": ()=>{
            if (!userAddress) return [];
            return tickers.map({
                "useStockHoldings.useMemo[contracts]": (ticker)=>({
                        address: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].CollateralVault,
                        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CollateralVaultABI"],
                        functionName: 'getPosition',
                        args: [
                            userAddress,
                            ticker
                        ]
                    })
            }["useStockHoldings.useMemo[contracts]"]);
        }
    }["useStockHoldings.useMemo[contracts]"], [
        userAddress,
        tickers
    ]);
    const { data, isLoading: positionsLoading, isError, refetch } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts,
        query: {
            enabled: contracts.length > 0,
            refetchInterval: 30_000,
            staleTime: 30_000
        }
    });
    const holdings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useStockHoldings.useMemo[holdings]": ()=>{
            if (!data || !userAddress) return [];
            const result = [];
            for(let i = 0; i < tickers.length; i++){
                const r = data[i];
                if (r?.status !== 'success') continue;
                const [userCollateral, userDebt] = r.result;
                if (userDebt === BigInt(0)) continue;
                const ticker = tickers[i];
                const shares = Number(userDebt) / 1e18;
                const collateralDeposited = Number(userCollateral) / 1e18;
                const currentPrice = prices[ticker] ?? 0;
                const collateralRequired = shares * currentPrice * MIN_COLLATERAL_RATIO;
                result.push({
                    ticker,
                    shares,
                    avgCost: 0,
                    currentPrice,
                    collateralDeposited,
                    collateralRequired
                });
            }
            return result;
        }
    }["useStockHoldings.useMemo[holdings]"], [
        data,
        userAddress,
        tickers,
        prices
    ]);
    const summary = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useStockHoldings.useMemo[summary]": ()=>{
            const totalValue = holdings.reduce({
                "useStockHoldings.useMemo[summary].totalValue": (s, h)=>s + h.shares * h.currentPrice
            }["useStockHoldings.useMemo[summary].totalValue"], 0);
            const totalCost = holdings.reduce({
                "useStockHoldings.useMemo[summary].totalCost": (s, h)=>s + h.shares * h.avgCost
            }["useStockHoldings.useMemo[summary].totalCost"], 0);
            const totalCollateral = holdings.reduce({
                "useStockHoldings.useMemo[summary].totalCollateral": (s, h)=>s + h.collateralDeposited
            }["useStockHoldings.useMemo[summary].totalCollateral"], 0);
            const totalRequired = holdings.reduce({
                "useStockHoldings.useMemo[summary].totalRequired": (s, h)=>s + h.collateralRequired
            }["useStockHoldings.useMemo[summary].totalRequired"], 0);
            const unrealizedPnl = totalValue - totalCost;
            const pnlPercent = totalCost > 0 ? unrealizedPnl / totalCost * 100 : 0;
            const healthRatio = totalRequired > 0 ? totalCollateral / totalRequired * 100 : 0;
            return {
                totalValue,
                totalCollateral,
                totalRequired,
                unrealizedPnl,
                pnlPercent,
                healthRatio
            };
        }
    }["useStockHoldings.useMemo[summary]"], [
        holdings
    ]);
    const isLive = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useStockHoldings.useMemo[isLive]": ()=>!!data && data.some({
                "useStockHoldings.useMemo[isLive]": (r)=>r?.status === 'success'
            }["useStockHoldings.useMemo[isLive]"])
    }["useStockHoldings.useMemo[isLive]"], [
        data
    ]);
    // Only report loading while the user actually has data being fetched.
    // When `userAddress` is undefined, neither the positions multicall nor any
    // user-specific work is in flight, so the hook must report idle so the UI can
    // render its disconnected/empty state instead of an indefinite spinner.
    const isLoading = userAddress ? positionsLoading || pricesLoading : false;
    return {
        holdings,
        ...summary,
        isLive,
        isLoading,
        isError,
        refetch
    };
}
_s(useStockHoldings, "ontMSXHY7fpxeerak0kk9nxHXMo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockPrices$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStockPrices"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/stocks/StockAccountPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StockAccountPanel",
    ()=>StockAccountPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockHoldings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useStockHoldings.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function HealthBar({ ratio }) {
    const clamped = Math.min(Math.max(ratio, 0), 300);
    const pct = Math.min(clamped / 300 * 100, 100);
    const color = ratio >= 200 ? 'bg-green-400' : ratio >= 150 ? 'bg-yellow-400' : 'bg-red-400';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "h-1.5 w-full rounded-full bg-dark-50/50 overflow-hidden",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: `h-full rounded-full transition-all ${color}`,
            style: {
                width: `${pct}%`
            }
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
            lineNumber: 14,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
_c = HealthBar;
function StockAccountPanel() {
    _s();
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    const holdings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockHoldings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStockHoldings"])(address);
    if (!address || holdings.isLoading || !holdings.isLive) return null;
    const buyingPower = Math.max(holdings.totalCollateral - holdings.totalRequired, 0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-testid": "stock-account-panel",
        className: "mt-4 bg-dark-100 rounded-2xl border border-gray-700/20 p-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-sm font-semibold text-white mb-3",
                children: "Account Summary"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-2.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-baseline justify-between text-xs",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-400",
                                children: "Total Value"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                                lineNumber: 38,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-white font-medium tabular-nums",
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockPrice"])(holdings.totalValue)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                                lineNumber: 39,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-baseline justify-between text-xs",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-400",
                                children: "Unrealized P&L"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                                lineNumber: 44,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `font-medium tabular-nums ${holdings.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                children: [
                                    holdings.unrealizedPnl >= 0 ? '+' : '-',
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockPrice"])(Math.abs(holdings.unrealizedPnl)),
                                    ' ',
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[10px] opacity-70",
                                        children: [
                                            "(",
                                            holdings.pnlPercent >= 0 ? '+' : '',
                                            holdings.pnlPercent.toFixed(2),
                                            "%)"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                                        lineNumber: 52,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                                lineNumber: 45,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-baseline justify-between text-xs",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-400",
                                children: "Collateral"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                                lineNumber: 59,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-white font-medium tabular-nums",
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockPrice"])(holdings.totalCollateral)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                                lineNumber: 60,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-baseline justify-between text-xs",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-400",
                                children: "Buying Power"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                                lineNumber: 65,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-goodgreen font-medium tabular-nums",
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockPrice"])(buyingPower)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                                lineNumber: 66,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pt-1.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between text-[10px] mb-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-500",
                                        children: "Collateral Health"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                                        lineNumber: 72,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `font-medium ${holdings.healthRatio >= 200 ? 'text-green-400' : holdings.healthRatio >= 150 ? 'text-yellow-400' : 'text-red-400'}`,
                                        children: [
                                            holdings.healthRatio.toFixed(0),
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                                        lineNumber: 73,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                                lineNumber: 71,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(HealthBar, {
                                ratio: holdings.healthRatio
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                                lineNumber: 85,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                        lineNumber: 70,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/stocks/StockAccountPanel.tsx",
        lineNumber: 31,
        columnNumber: 5
    }, this);
}
_s(StockAccountPanel, "EE/fWjiLGjfEUzY2khJ+n8FF8lY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockHoldings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStockHoldings"]
    ];
});
_c1 = StockAccountPanel;
var _c, _c1;
__turbopack_context__.k.register(_c, "HealthBar");
__turbopack_context__.k.register(_c1, "StockAccountPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/stocks/WalletConnectConfigWarning.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WalletConnectConfigWarning",
    ()=>WalletConnectConfigWarning
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$walletConnectConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/walletConnectConfig.ts [app-client] (ecmascript)");
'use client';
;
;
function WalletConnectConfigWarning({ className = '' }) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$walletConnectConfig$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWalletConnectConfigured"]) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        role: "status",
        className: `rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 ${className}`.trim(),
        children: "Mobile wallet connectors are unavailable in this environment. Use an injected browser wallet, or configure WalletConnect project ID."
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/stocks/WalletConnectConfigWarning.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
_c = WalletConnectConfigWarning;
var _c;
__turbopack_context__.k.register(_c, "WalletConnectConfigWarning");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/usePriceServiceStatus.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__resetPriceServiceStatusStoreForTests",
    ()=>__resetPriceServiceStatusStoreForTests,
    "getDominantSession",
    ()=>getDominantSession,
    "getSessionLabel",
    ()=>getSessionLabel,
    "refreshPriceServiceStatus",
    ()=>refreshPriceServiceStatus,
    "resolvePriceStatusEndpoint",
    ()=>resolvePriceStatusEndpoint,
    "usePriceServiceStatus",
    ()=>usePriceServiceStatus
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
function sanitizeBaseUrl(url) {
    return url.replace(/\/+$/, '');
}
function resolvePriceStatusEndpoint(explicitBaseUrl) {
    const baseUrl = (explicitBaseUrl ?? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? '').trim();
    if (!baseUrl) return '/api/status/quotes';
    return `${sanitizeBaseUrl(baseUrl)}/status/quotes`;
}
const PRICE_STATUS_ENDPOINT = resolvePriceStatusEndpoint();
const POLL_INTERVAL_MS = 10_000;
const FAILURE_BACKOFF_BASE_MS = 15_000;
const FAILURE_BACKOFF_MAX_MS = 120_000;
const store = {
    state: {
        status: null,
        isLoading: true,
        error: null,
        nextRetryAt: null
    },
    subscribers: new Set(),
    intervalId: null,
    inFlight: false,
    failureCount: 0,
    cooldownUntil: 0
};
function notify() {
    for (const sub of store.subscribers)sub(store.state);
}
async function fetchStatus(force = false) {
    if (store.inFlight) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (!force && Date.now() < store.cooldownUntil) return;
    store.inFlight = true;
    try {
        const res = await fetch(PRICE_STATUS_ENDPOINT, {
            signal: AbortSignal.timeout(5000)
        });
        if (!res.ok) throw new Error(`Status endpoint returned ${res.status}`);
        const data = await res.json();
        store.failureCount = 0;
        store.cooldownUntil = 0;
        store.state = {
            status: data,
            isLoading: false,
            error: null,
            nextRetryAt: null
        };
    } catch (err) {
        store.failureCount += 1;
        const backoffMs = Math.min(FAILURE_BACKOFF_MAX_MS, FAILURE_BACKOFF_BASE_MS * 2 ** Math.max(0, store.failureCount - 1));
        store.cooldownUntil = Date.now() + backoffMs;
        store.state = {
            ...store.state,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Oracle status unavailable',
            nextRetryAt: store.cooldownUntil
        };
    } finally{
        store.inFlight = false;
        notify();
    }
}
function startPolling() {
    if (store.intervalId !== null) return;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    store.intervalId = setInterval(fetchStatus, POLL_INTERVAL_MS);
}
function stopPolling() {
    if (store.subscribers.size > 0) return;
    if (store.intervalId !== null) {
        clearInterval(store.intervalId);
        store.intervalId = null;
    }
}
function usePriceServiceStatus() {
    _s();
    const [snapshot, setSnapshot] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(store.state);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "usePriceServiceStatus.useEffect": ()=>{
            const subscriber = {
                "usePriceServiceStatus.useEffect.subscriber": (next)=>setSnapshot(next)
            }["usePriceServiceStatus.useEffect.subscriber"];
            store.subscribers.add(subscriber);
            startPolling();
            if (!store.state.status && !store.inFlight) {
                void fetchStatus();
            } else {
                setSnapshot(store.state);
            }
            return ({
                "usePriceServiceStatus.useEffect": ()=>{
                    store.subscribers.delete(subscriber);
                    stopPolling();
                }
            })["usePriceServiceStatus.useEffect"];
        }
    }["usePriceServiceStatus.useEffect"], []);
    return snapshot;
}
_s(usePriceServiceStatus, "W+4Q255jx141yV6+gTsNlFWfkPE=");
function getSessionLabel(state) {
    switch(state){
        case 'open':
            return 'Market Open';
        case 'pre-market':
            return 'Pre-Market';
        case 'after-hours':
            return 'After Hours';
        case 'closed':
            return 'Market Closed';
        case 'halted':
            return 'Halted';
        default:
            return 'Unknown';
    }
}
async function refreshPriceServiceStatus(force = true) {
    await fetchStatus(force);
}
function getDominantSession(quotes) {
    if (quotes.length === 0) return 'unknown';
    const counts = new Map();
    for (const q of quotes){
        counts.set(q.sessionState, (counts.get(q.sessionState) ?? 0) + 1);
    }
    let max = 0;
    let dominant = 'unknown';
    for (const [state, count] of counts){
        if (count > max) {
            max = count;
            dominant = state;
        }
    }
    return dominant;
}
function __resetPriceServiceStatusStoreForTests() {
    if (store.intervalId !== null) {
        clearInterval(store.intervalId);
    }
    store.state = {
        status: null,
        isLoading: true,
        error: null,
        nextRetryAt: null
    };
    store.subscribers.clear();
    store.intervalId = null;
    store.inFlight = false;
    store.failureCount = 0;
    store.cooldownUntil = 0;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/stocksOracleHealth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deriveStocksOracleHealth",
    ()=>deriveStocksOracleHealth
]);
const STALE_MS = 60_000;
function deriveStocksOracleHealth(payload, now = Date.now(), onChainReachable) {
    const data = payload;
    if (!data || !Array.isArray(data.services)) return 'offline';
    const service = data.services.find((s)=>s?.name === 'stocks-keeper');
    if (!service) return 'offline';
    if (service.status === 'auth' || service.status === 'unauthorized') return 'auth';
    if (service.status !== 'ok') return 'degraded';
    if (!service.lastChecked) return liveOrFallback(onChainReachable);
    const ts = Date.parse(service.lastChecked);
    if (!Number.isFinite(ts)) return 'degraded';
    if (now - ts > STALE_MS) return 'degraded';
    return liveOrFallback(onChainReachable);
}
// Keeper is healthy: distinguish live (on-chain oracle reachable) vs fallback
// (keeper green, but on-chain oracle is unreachable so UI is showing demo data).
// Undefined = unknown reachability → preserve legacy "live" behaviour.
function liveOrFallback(onChainReachable) {
    return onChainReachable === false ? 'fallback' : 'live';
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/OracleStatusBadge.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OracleStatusBadge",
    ()=>OracleStatusBadge,
    "__resetOracleStatusFallbackForTests",
    ()=>__resetOracleStatusFallbackForTests
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceServiceStatus.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stocksOracleHealth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stocksOracleHealth.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function formatAge(ms) {
    if (ms < 1000) return 'just now';
    if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
    return `${Math.floor(ms / 3_600_000)}h ago`;
}
const FALLBACK_STATUS_TTL_MS = 30_000;
let fallbackCache = null;
let fallbackInFlight = null;
async function resolveStocksFallbackStatus({ force = false } = {}) {
    const now = Date.now();
    if (!force && fallbackCache && fallbackCache.expiresAt > now) {
        return fallbackCache.value;
    }
    if (!force && fallbackInFlight) {
        return fallbackInFlight;
    }
    let request;
    request = fetch('/api/status', {
        cache: 'no-store'
    }).then(async (res)=>{
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stocksOracleHealth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deriveStocksOracleHealth"])(data);
    }).catch(()=>'offline').then((value)=>{
        fallbackCache = {
            value,
            expiresAt: Date.now() + FALLBACK_STATUS_TTL_MS
        };
        return value;
    }).finally(()=>{
        if (fallbackInFlight === request) fallbackInFlight = null;
    });
    fallbackInFlight = request;
    return fallbackInFlight;
}
function OracleStatusBadge({ variant = 'compact', symbol, useStocksFallback = false }) {
    _s();
    const { status, error } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceServiceStatus"])();
    const [fallbackState, setFallbackState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('offline');
    const [fallbackLoading, setFallbackLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [fallbackReady, setFallbackReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [timeoutPhase, setTimeoutPhase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('loading');
    const [retryCount, setRetryCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const slowTimer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const timedOutTimer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const clearTimers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "OracleStatusBadge.useCallback[clearTimers]": ()=>{
            if (slowTimer.current) {
                clearTimeout(slowTimer.current);
                slowTimer.current = null;
            }
            if (timedOutTimer.current) {
                clearTimeout(timedOutTimer.current);
                timedOutTimer.current = null;
            }
        }
    }["OracleStatusBadge.useCallback[clearTimers]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "OracleStatusBadge.useEffect": ()=>{
            let cancelled = false;
            if (!useStocksFallback || status || !error) return;
            setFallbackReady(false);
            setFallbackLoading(true);
            setTimeoutPhase('loading');
            slowTimer.current = setTimeout({
                "OracleStatusBadge.useEffect": ()=>{
                    if (!cancelled) setTimeoutPhase('slow');
                }
            }["OracleStatusBadge.useEffect"], 5000);
            timedOutTimer.current = setTimeout({
                "OracleStatusBadge.useEffect": ()=>{
                    if (!cancelled) setTimeoutPhase('timed-out');
                }
            }["OracleStatusBadge.useEffect"], 15000);
            resolveStocksFallbackStatus({
                force: retryCount > 0
            }).then({
                "OracleStatusBadge.useEffect": (nextState)=>{
                    if (cancelled) return;
                    clearTimers();
                    setFallbackState(nextState);
                }
            }["OracleStatusBadge.useEffect"]).finally({
                "OracleStatusBadge.useEffect": ()=>{
                    if (!cancelled) {
                        setFallbackLoading(false);
                        setFallbackReady(true);
                    }
                }
            }["OracleStatusBadge.useEffect"]);
            return ({
                "OracleStatusBadge.useEffect": ()=>{
                    cancelled = true;
                    clearTimers();
                }
            })["OracleStatusBadge.useEffect"];
        }
    }["OracleStatusBadge.useEffect"], [
        useStocksFallback,
        status,
        error,
        retryCount,
        clearTimers
    ]);
    if (error || !status) {
        if (useStocksFallback) {
            if (fallbackLoading || !fallbackReady) {
                if (timeoutPhase === 'timed-out') {
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline-flex items-center gap-1.5 text-xs text-yellow-400",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "w-1.5 h-1.5 rounded-full bg-yellow-400"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                                lineNumber: 119,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Price feed unavailable"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                                lineNumber: 120,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>setRetryCount((c)=>c + 1),
                                className: "underline hover:text-yellow-300 transition-colors",
                                children: "Retry"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                                lineNumber: 121,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                        lineNumber: 118,
                        columnNumber: 13
                    }, this);
                }
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "inline-flex items-center gap-1.5",
                    "aria-label": timeoutPhase === 'slow' ? 'Price feed connecting' : 'Checking price feed',
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "animate-pulse h-5 w-24 rounded-full bg-dark-50/30"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                        lineNumber: 133,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 132,
                    columnNumber: 11
                }, this);
            }
            if (fallbackState === 'live') {
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "inline-flex items-center gap-1.5 text-xs text-gray-400",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                            lineNumber: 140,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Live"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                            lineNumber: 141,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-gray-600",
                            children: "·"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                            lineNumber: 142,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "stocks-keeper"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                            lineNumber: 143,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 139,
                    columnNumber: 11
                }, this);
            }
            if (fallbackState === 'degraded') {
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "inline-flex items-center gap-1.5 text-xs text-gray-400",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "w-1.5 h-1.5 rounded-full bg-yellow-400"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                            lineNumber: 150,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Oracle degraded"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                            lineNumber: 151,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 149,
                    columnNumber: 11
                }, this);
            }
        }
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "inline-flex items-center gap-1.5 text-xs text-gray-500",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "w-1.5 h-1.5 rounded-full bg-gray-500"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 158,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: "Oracle offline"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 159,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
            lineNumber: 157,
            columnNumber: 7
        }, this);
    }
    const { healthy, freshCount, totalCount, quotes } = status;
    if (variant === 'detail' && symbol) {
        const quoteStatus = quotes.find((q)=>q.symbol === symbol);
        if (!quoteStatus) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inline-flex items-center gap-1.5 text-xs text-gray-500",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "w-1.5 h-1.5 rounded-full bg-gray-500"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                        lineNumber: 171,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            "No oracle data for ",
                            symbol
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                        lineNumber: 172,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                lineNumber: 170,
                columnNumber: 9
            }, this);
        }
        const isStale = quoteStatus.lastUpdateMs > 60_000;
        const dotColor = quoteStatus.lastUpdateMs < 15_000 ? 'bg-green-400' : isStale ? 'bg-red-400' : 'bg-yellow-400';
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "inline-flex items-center gap-1.5 text-xs",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: `w-1.5 h-1.5 rounded-full ${dotColor}`
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 186,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-gray-400",
                    children: [
                        "Updated ",
                        formatAge(quoteStatus.lastUpdateMs)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 187,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-gray-600",
                    children: "·"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 190,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-gray-400",
                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSessionLabel"])(quoteStatus.sessionState)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 191,
                    columnNumber: 9
                }, this),
                quoteStatus.confidence > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-gray-600",
                            children: "·"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                            lineNumber: 196,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: quoteStatus.confidence >= 70 ? 'text-gray-400' : 'text-yellow-400',
                            children: [
                                quoteStatus.confidence,
                                "% conf"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                            lineNumber: 197,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
            lineNumber: 185,
            columnNumber: 7
        }, this);
    }
    const dominantSession = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDominantSession"])(quotes);
    const maxAge = quotes.length > 0 ? Math.max(...quotes.map((q)=>q.lastUpdateMs)) : 0;
    const anyStale = maxAge > 60_000;
    const dotColor = healthy && !anyStale ? 'bg-green-400' : healthy && anyStale ? 'bg-yellow-400' : 'bg-red-400';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "inline-flex items-center gap-1.5 text-xs text-gray-400",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `w-1.5 h-1.5 rounded-full ${dotColor} ${healthy && !anyStale ? 'animate-pulse' : ''}`
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                lineNumber: 217,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: [
                    freshCount,
                    "/",
                    totalCount,
                    " feeds"
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                lineNumber: 218,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-gray-600",
                children: "·"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                lineNumber: 219,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSessionLabel"])(dominantSession)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                lineNumber: 220,
                columnNumber: 7
            }, this),
            anyStale && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-600",
                        children: "·"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                        lineNumber: 223,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-yellow-400",
                        children: "delayed"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                        lineNumber: 224,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
        lineNumber: 216,
        columnNumber: 5
    }, this);
}
_s(OracleStatusBadge, "q5hLBXFCw6CB3hbYQ2KUthgZXgU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceServiceStatus"]
    ];
});
_c = OracleStatusBadge;
function __resetOracleStatusFallbackForTests() {
    fallbackCache = null;
    fallbackInFlight = null;
}
var _c;
__turbopack_context__.k.register(_c, "OracleStatusBadge");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/watchlist.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addToWatchlist",
    ()=>addToWatchlist,
    "getWatchlist",
    ()=>getWatchlist,
    "isWatched",
    ()=>isWatched,
    "removeFromWatchlist",
    ()=>removeFromWatchlist,
    "subscribeWatchlist",
    ()=>subscribeWatchlist,
    "toggleWatchlist",
    ()=>toggleWatchlist
]);
// Local watchlist storage for the Stocks UX — task 0034.
//
// Pure client-side, LocalStorage-backed, with a tiny pub/sub so multiple React
// components on the same page can stay in sync when one toggles a ticker.
//
// SSR-safe: every `window`/`localStorage` access is guarded.
const KEY = 'gooddollar.stocks.watchlist.v1';
// Module-scoped state. Survives across `useWatchlist` instances within a single
// page-load and is hydrated from LocalStorage on first access.
const tickers = new Set();
const listeners = new Set();
let initialized = false;
/** True when the runtime has access to `window` + `localStorage`. */ function hasStorage() {
    return ("TURBOPACK compile-time value", "object") !== 'undefined' && typeof window.localStorage !== 'undefined';
}
/**
 * Lazy, idempotent hydration from LocalStorage. Safe to call from any helper.
 * Tolerates malformed JSON by silently defaulting to an empty list — we never
 * want a corrupt entry to crash the page.
 */ function init() {
    if (initialized) return;
    initialized = true;
    if (!hasStorage()) return;
    try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            for (const t of parsed){
                if (typeof t === 'string' && t.length > 0) {
                    tickers.add(t.toUpperCase());
                }
            }
        }
    } catch  {
    // Malformed payload — leave the set empty. Next write will overwrite.
    }
}
function persist() {
    if (!hasStorage()) return;
    try {
        window.localStorage.setItem(KEY, JSON.stringify([
            ...tickers
        ]));
    } catch  {
    // Quota or privacy-mode failures: tolerate silently. In-memory state stays
    // correct for the rest of the session.
    }
}
function notify() {
    for (const fn of listeners)fn();
}
function getWatchlist() {
    init();
    return [
        ...tickers
    ].sort();
}
function isWatched(ticker) {
    init();
    return tickers.has(ticker.toUpperCase());
}
function addToWatchlist(ticker) {
    init();
    const t = ticker.toUpperCase();
    if (tickers.has(t)) return;
    tickers.add(t);
    persist();
    notify();
}
function removeFromWatchlist(ticker) {
    init();
    const t = ticker.toUpperCase();
    if (!tickers.has(t)) return;
    tickers.delete(t);
    persist();
    notify();
}
function toggleWatchlist(ticker) {
    init();
    const t = ticker.toUpperCase();
    if (tickers.has(t)) {
        tickers.delete(t);
    } else {
        tickers.add(t);
    }
    persist();
    notify();
}
function subscribeWatchlist(listener) {
    listeners.add(listener);
    return ()=>{
        listeners.delete(listener);
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/useWatchlist.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useWatchlist",
    ()=>useWatchlist
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$watchlist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/watchlist.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function useWatchlist() {
    _s();
    const [watchlist, setWatchlist] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "useWatchlist.useState": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$watchlist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getWatchlist"])()
    }["useWatchlist.useState"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useWatchlist.useEffect": ()=>{
            // Snapshot on mount in case the store was already mutated before this
            // component subscribed (e.g. another hook on the page).
            setWatchlist((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$watchlist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getWatchlist"])());
            const unsubscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$watchlist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["subscribeWatchlist"])({
                "useWatchlist.useEffect.unsubscribe": ()=>{
                    setWatchlist((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$watchlist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getWatchlist"])());
                }
            }["useWatchlist.useEffect.unsubscribe"]);
            return unsubscribe;
        }
    }["useWatchlist.useEffect"], []);
    const add = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useWatchlist.useCallback[add]": (ticker)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$watchlist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addToWatchlist"])(ticker)
    }["useWatchlist.useCallback[add]"], []);
    const remove = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useWatchlist.useCallback[remove]": (ticker)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$watchlist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["removeFromWatchlist"])(ticker)
    }["useWatchlist.useCallback[remove]"], []);
    const toggle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useWatchlist.useCallback[toggle]": (ticker)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$watchlist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toggleWatchlist"])(ticker)
    }["useWatchlist.useCallback[toggle]"], []);
    const isWatchedFn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useWatchlist.useCallback[isWatchedFn]": (ticker)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$watchlist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isWatched"])(ticker)
    }["useWatchlist.useCallback[isWatchedFn]"], // We intentionally re-create on every render so reads always reflect the
    // latest snapshot, but since the underlying call is pure, this is cheap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        watchlist
    ]);
    return {
        watchlist,
        isWatched: isWatchedFn,
        add,
        remove,
        toggle
    };
}
_s(useWatchlist, "THlH5a9J/K+xNPI01v7jaH1ClUs=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/stocks/WatchlistStarButton.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WatchlistStarButton",
    ()=>WatchlistStarButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useWatchlist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useWatchlist.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
const SIZE_CLASS = {
    sm: 'h-7 w-7 text-[14px]',
    md: 'h-9 w-9 text-[18px]',
    lg: 'h-11 w-11 text-[22px]'
};
function WatchlistStarButton({ ticker, size = 'md', className = '' }) {
    _s();
    const { isWatched, toggle } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useWatchlist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWatchlist"])();
    const watched = isWatched(ticker);
    const handleClick = (event)=>{
        event.stopPropagation();
        event.preventDefault();
        toggle(ticker);
    };
    const label = watched ? `Remove ${ticker} from watchlist` : `Add ${ticker} to watchlist`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        onClick: handleClick,
        "aria-pressed": watched,
        "aria-label": label,
        title: label,
        className: [
            'inline-flex items-center justify-center rounded-full transition-colors',
            'border border-white/10 bg-white/5 hover:bg-white/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60',
            SIZE_CLASS[size],
            watched ? 'text-yellow-300' : 'text-slate-400 hover:text-yellow-200',
            className
        ].join(' '),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            "aria-hidden": "true",
            children: watched ? '★' : '☆'
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/stocks/WatchlistStarButton.tsx",
            lineNumber: 62,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/stocks/WatchlistStarButton.tsx",
        lineNumber: 47,
        columnNumber: 5
    }, this);
}
_s(WatchlistStarButton, "35GxJrufn6xGCoChxmlxpCp78B4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useWatchlist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWatchlist"]
    ];
});
_c = WatchlistStarButton;
var _c;
__turbopack_context__.k.register(_c, "WatchlistStarButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/stocks/MobileTradeStickyBar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MobileTradeStickyBar",
    ()=>MobileTradeStickyBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
function MobileTradeStickyBar({ targetRef, ticker }) {
    _s();
    const [isFormVisible, setIsFormVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MobileTradeStickyBar.useEffect": ()=>{
            const el = targetRef.current;
            if (!el || typeof IntersectionObserver === 'undefined') return;
            const observer = new IntersectionObserver({
                "MobileTradeStickyBar.useEffect": ([entry])=>setIsFormVisible(entry.isIntersecting)
            }["MobileTradeStickyBar.useEffect"], {
                threshold: 0.1
            });
            observer.observe(el);
            return ({
                "MobileTradeStickyBar.useEffect": ()=>observer.disconnect()
            })["MobileTradeStickyBar.useEffect"];
        }
    }["MobileTradeStickyBar.useEffect"], [
        targetRef
    ]);
    if (isFormVisible) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed bottom-0 left-0 right-0 z-40 lg:hidden",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-dark-100/90 backdrop-blur-lg border-t border-gray-700/30 px-4 py-3 safe-area-pb",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>targetRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    }),
                className: "w-full py-3 rounded-xl bg-goodgreen hover:bg-goodgreen/90 text-white font-semibold text-sm transition-colors active:scale-[0.98]",
                children: [
                    "Trade ",
                    ticker
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/MobileTradeStickyBar.tsx",
                lineNumber: 30,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/stocks/MobileTradeStickyBar.tsx",
            lineNumber: 29,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/stocks/MobileTradeStickyBar.tsx",
        lineNumber: 28,
        columnNumber: 5
    }, this);
}
_s(MobileTradeStickyBar, "sAHGhZBc5xWFMwRhvX+YETojea4=");
_c = MobileTradeStickyBar;
var _c;
__turbopack_context__.k.register(_c, "MobileTradeStickyBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/stockLogos.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getStockLogoUrl",
    ()=>getStockLogoUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const STOCK_LOGO_DOMAINS = {
    AAPL: 'apple.com',
    TSLA: 'tesla.com',
    NVDA: 'nvidia.com',
    MSFT: 'microsoft.com',
    AMZN: 'amazon.com',
    GOOGL: 'google.com',
    META: 'meta.com',
    JPM: 'jpmorganchase.com',
    V: 'visa.com',
    DIS: 'thewaltdisneycompany.com',
    NFLX: 'netflix.com',
    AMD: 'amd.com'
};
function getStockLogoUrl(ticker) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_ENABLE_CLEARBIT_LOGOS !== 'true') return null;
    const domain = STOCK_LOGO_DOMAINS[ticker.toUpperCase()];
    return domain ? `https://logo.clearbit.com/${domain}` : null;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/ui/stock-logo.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StockLogo",
    ()=>StockLogo
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockLogos$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockLogos.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 text-xs'
};
const imgSizes = {
    sm: 28,
    md: 40
};
function StockLogo({ ticker, size = 'sm' }) {
    _s();
    const [failed, setFailed] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const logoUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockLogos$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStockLogoUrl"])(ticker);
    const fallback = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `${sizeClasses[size]} rounded-full bg-gradient-to-br from-goodgreen/30 to-goodgreen/10 border border-goodgreen/20 flex items-center justify-center font-bold text-goodgreen shrink-0`,
        children: ticker.slice(0, 2)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/stock-logo.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
    if (!logoUrl || failed) return fallback;
    const px = imgSizes[size];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `${sizeClasses[size]} rounded-full overflow-hidden bg-white/10 border border-gray-700/20 shrink-0`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
            src: logoUrl,
            alt: `${ticker} logo`,
            width: px,
            height: px,
            className: "w-full h-full object-cover",
            onError: ()=>setFailed(true),
            loading: "lazy"
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/ui/stock-logo.tsx",
            lineNumber: 35,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/stock-logo.tsx",
        lineNumber: 33,
        columnNumber: 5
    }, this);
}
_s(StockLogo, "BFa/7w0IiJnSoWJxZHxuU4kOwF4=");
_c = StockLogo;
var _c;
__turbopack_context__.k.register(_c, "StockLogo");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/stocks/StockStatsBar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StockStatsBar",
    ()=>StockStatsBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-client] (ecmascript)");
'use client';
;
;
function derive24hRange(price, change24h) {
    if (change24h === 0) return {
        high: price,
        low: price
    };
    const baseline = price / (1 + change24h / 100);
    return {
        high: Math.max(price, baseline),
        low: Math.min(price, baseline)
    };
}
function StockStatsBar({ stock }) {
    const { high, low } = derive24hRange(stock.price, stock.change24h);
    const tileCls = 'flex flex-col sm:flex-row sm:items-baseline';
    const labelCls = 'text-[10px] uppercase tracking-wide text-gray-500 sm:text-xs sm:normal-case sm:tracking-normal';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-testid": "stock-stats-bar",
        className: "grid grid-cols-2 sm:flex sm:flex-wrap gap-x-3 gap-y-2 sm:gap-x-6 sm:gap-y-0 text-xs py-2 mb-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: tileCls,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: labelCls,
                        children: "Mark"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                        lineNumber: 28,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-white font-medium sm:ml-1.5",
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockPrice"])(stock.price)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                lineNumber: 27,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: tileCls,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: labelCls,
                        children: "24h"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `font-medium sm:ml-1.5 ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`,
                        children: [
                            stock.change24h >= 0 ? '▲ +' : '▼ ',
                            stock.change24h.toFixed(2),
                            "%"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: tileCls,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: labelCls,
                        children: "24h H"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-green-400 font-medium sm:ml-1.5",
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockPrice"])(high)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: tileCls,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: labelCls,
                        children: "24h L"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-red-400 font-medium sm:ml-1.5",
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockPrice"])(low)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                        lineNumber: 50,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                lineNumber: 48,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: tileCls,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: labelCls,
                        children: "Vol"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                        lineNumber: 55,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-white font-medium sm:ml-1.5",
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatLargeNumber"])(stock.volume24h)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                        lineNumber: 56,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: tileCls,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: labelCls,
                        children: "Funding"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-400 font-medium sm:ml-1.5",
                        children: "—"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                        lineNumber: 62,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                lineNumber: 60,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: tileCls,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: labelCls,
                        children: "OI"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-400 font-medium sm:ml-1.5",
                        children: "—"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                        lineNumber: 66,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
                lineNumber: 64,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/stocks/StockStatsBar.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
_c = StockStatsBar;
var _c;
__turbopack_context__.k.register(_c, "StockStatsBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/app/(app)/stocks/[ticker]/tickerTabState.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildFundamentalsRows",
    ()=>buildFundamentalsRows,
    "parseTickerTab",
    ()=>parseTickerTab
]);
function parseTickerTab(value) {
    if (value === 'fundamentals' || value === 'events') return value;
    return 'overview';
}
function buildFundamentalsRows(stock) {
    const revenueBillions = stock.marketCap / Math.max(stock.peRatio, 1) / 1_000_000_000;
    const grossMargin = 42 + Math.min(12, Math.max(-8, stock.change24h));
    const fcfMargin = 18 + Math.min(8, Math.max(-6, stock.change24h / 1.5));
    const epsGrowth = stock.change24h * 2.1;
    const revGrowth = stock.change24h * 1.4;
    return [
        {
            label: 'Revenue (TTM)',
            value: `$${revenueBillions.toFixed(1)}B`,
            delta: `${revGrowth >= 0 ? '+' : ''}${revGrowth.toFixed(1)}% YoY`,
            positive: revGrowth >= 0
        },
        {
            label: 'EPS (TTM)',
            value: `$${stock.eps.toFixed(2)}`,
            delta: `${epsGrowth >= 0 ? '+' : ''}${epsGrowth.toFixed(1)}% YoY`,
            positive: epsGrowth >= 0
        },
        {
            label: 'P/E',
            value: `${stock.peRatio.toFixed(1)}x`,
            delta: stock.peRatio < 25 ? 'Below sector median' : 'Above sector median',
            positive: null
        },
        {
            label: 'Gross Margin',
            value: `${grossMargin.toFixed(1)}%`,
            delta: `${stock.change24h >= 0 ? '+' : ''}${Math.abs(stock.change24h * 0.4).toFixed(1)} pts`,
            positive: stock.change24h >= 0
        },
        {
            label: 'FCF Margin',
            value: `${fcfMargin.toFixed(1)}%`,
            delta: `${stock.change24h >= 0 ? '+' : ''}${Math.abs(stock.change24h * 0.3).toFixed(1)} pts`,
            positive: stock.change24h >= 0
        },
        {
            label: 'Dividend Yield',
            value: stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : '—',
            delta: stock.dividendYield > 0 ? 'Forward annualized' : 'No cash dividend',
            positive: null
        }
    ];
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>StockDetailPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@rainbow-me/rainbowkit/dist/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainStocks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useOnChainStocks.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStocksRebalanceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useStocksRebalanceStatus.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockInsights$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockInsights.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockNews$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useStockNews.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/format.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chartData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/chartData.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$WalletReadyContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/WalletReadyContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStocks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useStocks.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stocksOrderValidation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stocksOrderValidation.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$gDollarAmount$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/gDollarAmount.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useMounted$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useMounted.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockDiscovery$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockDiscovery.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$RelatedMoversPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/stocks/RelatedMoversPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$StockAccountPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/stocks/StockAccountPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$WalletConnectConfigWarning$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/stocks/WalletConnectConfigWarning.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$OracleStatusBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/OracleStatusBadge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$WatchlistStarButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/stocks/WatchlistStarButton.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$MobileTradeStickyBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/stocks/MobileTradeStickyBar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$stock$2d$logo$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/stock-logo.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$StockStatsBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/stocks/StockStatsBar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$app$2f28$app$292f$stocks$2f5b$ticker$5d2f$tickerTabState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/app/(app)/stocks/[ticker]/tickerTabState.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
const AnalystOutlookCard = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.A("[project]/frontend/src/components/stocks/AnalystOutlookCard.tsx [app-client] (ecmascript, async loader)").then((mod)=>({
            default: mod.AnalystOutlookCard
        })));
_c = AnalystOutlookCard;
const NewsEventsPanel = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.A("[project]/frontend/src/components/stocks/NewsEventsPanel.tsx [app-client] (ecmascript, async loader)").then((mod)=>({
            default: mod.NewsEventsPanel
        })));
_c1 = NewsEventsPanel;
const PriceChart = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.A("[project]/frontend/src/components/PriceChart.tsx [app-client] (ecmascript, async loader)").then((mod)=>({
            default: mod.PriceChart
        })));
_c2 = PriceChart;
const DepthChart = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.A("[project]/frontend/src/components/stocks/DepthChart.tsx [app-client] (ecmascript, async loader)").then((mod)=>({
            default: mod.DepthChart
        })));
_c3 = DepthChart;
const StockMarketData = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.A("[project]/frontend/src/components/stocks/StockMarketData.tsx [app-client] (ecmascript, async loader)").then((mod)=>({
            default: mod.StockMarketData
        })));
_c4 = StockMarketData;
// NOTE: Keep these imports STATIC. Inside an App Router dynamic-segment
// page (e.g. `[ticker]/page.tsx`), wrapping a client component in
// the framework dynamic helper with the no-SSR option produces a broken client-reference
// manifest in Next.js 14 production builds and causes a runtime
// `TypeError: Cannot read properties of undefined (reading 'call')`, which
// surfaces as HTTP 500. Use static imports plus the `useMounted()` gate
// below to defer rendering until after hydration instead.
// See task 0090 (initiative 0002) and task 0025 (initiative 0006).
// (A regression test at `src/__tests__/dynamic-routes-no-ssr-false.test.ts`
// enforces this rule; do not reintroduce the forbidden token here.)
const RESERVED_STOCK_SUBROUTES = new Set([
    'markets',
    'portfolio'
]);
function WalletGatedTradeButton({ hasAmount, children }) {
    _s();
    const { isConnected } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    if (!isConnected) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ConnectButton"].Custom, {
            children: ({ openConnectModal })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: openConnectModal,
                    className: "w-full py-3 rounded-xl font-semibold text-sm bg-goodgreen text-black hover:bg-goodgreen/90 transition-colors",
                    children: "Connect Wallet to Trade"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                    lineNumber: 57,
                    columnNumber: 11
                }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
            lineNumber: 55,
            columnNumber: 7
        }, this);
    }
    if (!hasAmount) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            disabled: true,
            className: "w-full py-3 rounded-xl font-semibold text-sm bg-dark-50 text-gray-400 cursor-not-allowed",
            children: "Enter Amount"
        }, void 0, false, {
            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
            lineNumber: 67,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
_s(WalletGatedTradeButton, "zfhL8yMEhsc9LbuqnTKJ2EdeNdk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"]
    ];
});
_c5 = WalletGatedTradeButton;
const TIMEFRAMES = [
    '1H',
    '4H',
    '1D',
    '1W',
    '1M',
    '3M',
    '1Y'
];
const INVALID_TICKER_RECOVERY = [
    'AAPL',
    'MSFT',
    'NVDA'
];
const DETAIL_BACK_LINKS = {
    watchlist: {
        label: 'Back to Watchlist',
        href: '/stocks/watchlist'
    },
    portfolio: {
        label: 'Back to Portfolio',
        href: '/stocks/portfolio'
    }
};
const DEFAULT_DETAIL_BACK_LINK = {
    label: 'Back to Markets',
    href: '/stocks'
};
const SAFE_TICKER_PATTERN = /^[A-Z0-9]{1,16}$/;
const UNSAFE_TICKER_PATTERN = /[%/\\\u0000-\u001F\u007F]|\.{2}/;
const TRAILING_TICKER_DELIMITERS = /[/\\]+$/g;
function decodeTickerBounded(rawTicker) {
    if (!rawTicker) return '';
    let decoded = rawTicker;
    for(let i = 0; i < 3; i += 1){
        try {
            const next = decodeURIComponent(decoded);
            if (next === decoded) break;
            decoded = next;
        } catch  {
            break;
        }
    }
    return decoded;
}
function normalizeTickerForLookup(rawTicker) {
    const decoded = decodeTickerBounded(rawTicker);
    if (decoded.length > 64) return '';
    const normalized = decoded.trim().toUpperCase().replace(TRAILING_TICKER_DELIMITERS, '');
    if (!normalized) return '';
    if (UNSAFE_TICKER_PATTERN.test(normalized)) return '';
    if (!SAFE_TICKER_PATTERN.test(normalized)) return '';
    return normalized;
}
function formatEventDate(offsetDays) {
    const now = new Date();
    const date = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
    });
}
function formatCalendarDate(dateInput) {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
    });
}
function OrderForm({ stock, position, riskIncreaseAllowed, riskStopReasons }) {
    _s1();
    const [side, setSide] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('buy');
    const [orderType, setOrderType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('market');
    const [amount, setAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [limitPrice, setLimitPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [triggerPrice, setTriggerPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [submitted, setSubmitted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showTpSl, setShowTpSl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [tp, setTp] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [sl, setSl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [showAdvanced, setShowAdvanced] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [slippage, setSlippage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('0.5');
    const walletReady = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$WalletReadyContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWalletReady"])();
    const { isConnected } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    const { mint, phase: mintPhase, error: mintError, isDeployed } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStocks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMintSynthetic"])();
    const { redeem, phase: redeemPhase, error: redeemError } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStocks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRedeemSynthetic"])();
    const parsedLimitPrice = parseFloat(limitPrice);
    const parsedTriggerPrice = parseFloat(triggerPrice);
    const limitPriceInvalid = orderType !== 'market' && limitPrice !== '' && (isNaN(parsedLimitPrice) || parsedLimitPrice <= 0);
    const triggerPriceInvalid = orderType === 'stop-limit' && triggerPrice !== '' && (isNaN(parsedTriggerPrice) || parsedTriggerPrice <= 0);
    const hasValidPrice = orderType === 'market' || parsedLimitPrice > 0;
    const effectivePrice = orderType !== 'market' && parsedLimitPrice > 0 ? parsedLimitPrice : orderType !== 'market' ? 0 : stock.price;
    const parsedTp = parseFloat(tp) || 0;
    const parsedSl = parseFloat(sl) || 0;
    const tpWrongSide = parsedTp > 0 && effectivePrice > 0 && (side === 'buy' && parsedTp <= effectivePrice || side === 'sell' && parsedTp >= effectivePrice);
    const slWrongSide = parsedSl > 0 && effectivePrice > 0 && (side === 'buy' && parsedSl >= effectivePrice || side === 'sell' && parsedSl <= effectivePrice);
    const shares = amount && effectivePrice > 0 ? parseFloat(amount) / effectivePrice : 0;
    const fee = amount ? parseFloat(amount) * 0.001 : 0;
    const ubiFee = fee * 0.33;
    const SLIPPAGE_TOLERANCE = parseFloat(slippage) / 100 || 0.005;
    const priceImpact = amount ? parseFloat(amount) / 100_000 * 0.01 : 0;
    const minReceived = shares * (1 - SLIPPAGE_TOLERANCE);
    const totalCost = amount ? parseFloat(amount) + fee : 0;
    // Sanity-cap the Amount (USD) input so the summary cannot advertise
    // implausibly large notional values (e.g. $1T phantom orders) and so
    // we never submit an order the chain would just revert. See task 0058.
    const parsedAmount = parseFloat(amount);
    const amountTooLarge = !!amount && Number.isFinite(parsedAmount) && parsedAmount > __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MAX_STOCK_ORDER_USD"];
    const hasAmount = !!amount && parsedAmount > 0 && !amountTooLarge;
    // Sell-side balance gating: when a user is on the Sell tab we must not
    // let them attempt to burn more sToken debt than they actually minted —
    // the on-chain `burn` call would revert with poor UX. See task 0057.
    const { sellGated, sellSharesExceedsBalance, balanceShares } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stocksOrderValidation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["computeSellGuards"])({
        side,
        isConnected,
        debtFloat: position?.debtFloat ?? null,
        sharesRequested: shares
    });
    const sellDisabled = sellGated || sellSharesExceedsBalance;
    const actionPhase = side === 'buy' ? mintPhase : redeemPhase;
    const actionError = side === 'buy' ? mintError : redeemError;
    const isPending = actionPhase === 'approving' || actionPhase === 'pending';
    const buyBlockedBySync = side === 'buy' && !riskIncreaseAllowed;
    const buySyncReason = riskStopReasons.length > 0 ? riskStopReasons.join(', ') : 'stale_propagation';
    const handleSubmit = async (e)=>{
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0 || limitPriceInvalid || triggerPriceInvalid || !hasValidPrice) return;
        if (amountTooLarge) return;
        if (sellDisabled) return;
        if (side === 'buy' && !riskIncreaseAllowed) return;
        if (isDeployed && orderType === 'market') {
            const amountNum = parseFloat(amount);
            // Assume G$ ≈ $0.01 on devnet for collateral calculation.
            // Route through toG$Wei (parseUnits) — never `Math.round(x * 1e18)`,
            // which drifts by tens of millions of wei on realistic trade sizes.
            const GD_PRICE_USD = 0.01;
            const collateralGD = amountNum / GD_PRICE_USD;
            const collateralWei = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$gDollarAmount$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toG$Wei"])(collateralGD);
            const sharesWei = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$gDollarAmount$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toG$Wei"])(shares);
            if (side === 'buy') {
                await mint(stock.ticker, collateralWei, sharesWei);
            } else {
                // Redeem: burn shares and withdraw equivalent collateral
                await redeem(stock.ticker, sharesWei, collateralWei);
            }
        } else {
            setSubmitted(true);
            setTimeout(()=>setSubmitted(false), 3000);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        id: "stock-order-form",
        onSubmit: handleSubmit,
        className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2 mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setSide('buy'),
                        className: `flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${side === 'buy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-dark-50/50 text-gray-400 border border-transparent'}`,
                        children: "Buy"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 226,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setSide('sell'),
                        className: `flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${side === 'sell' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-dark-50/50 text-gray-400 border border-transparent'}`,
                        children: "Sell"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 230,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 225,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-1 mb-4",
                children: [
                    'market',
                    'limit',
                    'stop-limit'
                ].map((ot)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setOrderType(ot),
                        className: `flex-1 px-2 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${orderType === ot ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`,
                        children: ot
                    }, ot, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 238,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 236,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setShowAdvanced(!showAdvanced),
                        className: "text-[11px] text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1",
                        children: [
                            showAdvanced ? '▾' : '▸',
                            " Advanced Options",
                            !showAdvanced && slippage !== '0.5' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] text-gray-600 ml-1",
                                children: [
                                    "Slippage ",
                                    slippage,
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 251,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 247,
                        columnNumber: 9
                    }, this),
                    showAdvanced && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "text-xs text-gray-400 mb-1 block",
                                children: "Slippage Tolerance (%)"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 256,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-1.5",
                                children: [
                                    [
                                        '0.1',
                                        '0.5',
                                        '1.0'
                                    ].map((val)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>setSlippage(val),
                                            className: `px-2 py-1 rounded text-[10px] font-medium transition-colors ${slippage === val ? 'bg-goodgreen/15 text-goodgreen' : 'bg-dark-50 text-gray-400 hover:text-white'}`,
                                            children: [
                                                val,
                                                "%"
                                            ]
                                        }, val, true, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                            lineNumber: 259,
                                            columnNumber: 17
                                        }, this)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        inputMode: "decimal",
                                        value: slippage,
                                        "aria-label": "Slippage Tolerance",
                                        onChange: (e)=>setSlippage((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumericInput"])(e.target.value)),
                                        className: "flex-1 px-2 py-1 rounded bg-dark-50 border border-gray-700/30 text-white text-[10px] outline-none focus-visible:ring-1 focus-visible:ring-goodgreen/50 min-w-0"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 264,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 257,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 255,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 246,
                columnNumber: 7
            }, this),
            orderType === 'stop-limit' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "text-xs text-gray-400 mb-1 block",
                        children: "Trigger Price"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 276,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        inputMode: "decimal",
                        placeholder: stock.price.toFixed(2),
                        value: triggerPrice,
                        "aria-label": "Trigger Price",
                        onChange: (e)=>setTriggerPrice((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumericInput"])(e.target.value)),
                        className: `w-full px-3 py-2.5 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${triggerPriceInvalid ? 'border-red-500/50' : 'border-gray-700/30'}`
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 277,
                        columnNumber: 11
                    }, this),
                    triggerPriceInvalid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-red-400 text-[10px] mt-1",
                        children: "Price must be greater than 0"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 282,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 275,
                columnNumber: 9
            }, this),
            orderType !== 'market' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "text-xs text-gray-400 mb-1 block",
                        children: "Limit Price"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 290,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        inputMode: "decimal",
                        placeholder: "0.00",
                        value: limitPrice,
                        onChange: (e)=>setLimitPrice((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumericInput"])(e.target.value)),
                        className: `w-full px-3 py-2.5 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${limitPriceInvalid ? 'border-red-500/50' : 'border-gray-700/30'}`
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 291,
                        columnNumber: 11
                    }, this),
                    limitPriceInvalid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-red-400 text-[10px] mt-1",
                        children: "Price must be greater than 0"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 294,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 289,
                columnNumber: 9
            }, this),
            sellGated && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                role: "alert",
                "aria-live": "polite",
                className: "mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300",
                children: [
                    "You have no ",
                    stock.ticker,
                    " to sell. Switch to ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-semibold",
                        children: "Buy"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 302,
                        columnNumber: 57
                    }, this),
                    " to open a position first."
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 300,
                columnNumber: 9
            }, this),
            sellSharesExceedsBalance && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                role: "alert",
                "aria-live": "polite",
                className: "mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300",
                children: [
                    "You only hold ",
                    balanceShares.toFixed(4),
                    " ",
                    stock.ticker,
                    ". Reduce the amount to sell."
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 306,
                columnNumber: 9
            }, this),
            buyBlockedBySync && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                role: "alert",
                "aria-live": "polite",
                className: "mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300",
                children: [
                    "Risk-increasing orders are paused until symbol sync reaches the current block (",
                    buySyncReason,
                    ")."
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 312,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "text-xs text-gray-400 mb-1 block",
                        children: "Amount (USD)"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 319,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        inputMode: "decimal",
                        placeholder: "0.00",
                        value: amount,
                        onChange: (e)=>setAmount((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumericInput"])(e.target.value)),
                        "aria-invalid": sellSharesExceedsBalance || amountTooLarge || undefined,
                        className: `w-full px-3 py-2.5 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${sellSharesExceedsBalance || amountTooLarge ? 'border-red-500/50' : 'border-gray-700/30'}`
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 320,
                        columnNumber: 9
                    }, this),
                    amountTooLarge && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-red-400 text-[10px] mt-1",
                        children: [
                            "Max order is $",
                            __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MAX_STOCK_ORDER_USD"].toLocaleString('en-US'),
                            " per trade. Split larger orders into multiple smaller ones."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 324,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 318,
                columnNumber: 7
            }, this),
            amount && parseFloat(amount) > 0 && hasValidPrice && effectivePrice > 0 && !sellGated && !amountTooLarge && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "trade-preview",
                className: "mb-4 rounded-xl border border-gray-700/30 bg-dark-50/50 p-3 space-y-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[10px] uppercase tracking-wide text-gray-500 mb-2",
                        children: "Trade Preview"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 332,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-1.5 text-xs",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between text-gray-400",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Entry Price"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 335,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-white truncate ml-2",
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockPrice"])(effectivePrice)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 336,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 334,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between text-gray-400",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Price Impact"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 339,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `truncate ml-2 ${priceImpact > 0.5 ? 'text-yellow-400' : 'text-white'}`,
                                        children: [
                                            "~",
                                            priceImpact.toFixed(2),
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 340,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 338,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between text-gray-400",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Trading Fee (0.1%)"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 343,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-white truncate ml-2",
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatTradeAmount"])(fee)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 344,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 342,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between text-goodgreen/80",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "→ UBI Contribution (33%)"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 347,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "truncate ml-2",
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatTradeAmount"])(ubiFee)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 348,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 346,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "border-t border-gray-700/30 my-1.5"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 350,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between text-gray-400",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: side === 'buy' ? 'You Receive' : 'You Sell'
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 352,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-white font-medium truncate ml-2",
                                        children: [
                                            "~",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockShares"])(shares),
                                            " ",
                                            stock.ticker
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 353,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 351,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between text-gray-400",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Min. Received"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 356,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-300 truncate ml-2",
                                        children: [
                                            "~",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockShares"])(minReceived),
                                            " ",
                                            stock.ticker
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 357,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 355,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between text-gray-400",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-500 text-[10px]",
                                    children: [
                                        slippage,
                                        "% slippage tolerance"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                    lineNumber: 360,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 359,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "border-t border-gray-700/30 my-1.5"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 362,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between text-gray-400 font-medium",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: side === 'buy' ? 'Total Cost' : 'Proceeds'
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 364,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-white truncate ml-2",
                                        children: side === 'buy' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatTradeAmount"])(totalCost) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatTradeAmount"])(parseFloat(amount) - fee)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 365,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 363,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 333,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 331,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setShowTpSl(!showTpSl),
                        className: "text-[11px] text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1",
                        children: [
                            showTpSl ? '▾' : '▸',
                            " TP / SL",
                            (tp || sl) && !showTpSl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] text-gray-600 ml-1",
                                children: [
                                    tp ? `TP $${parsedTp.toFixed(2)}` : '',
                                    tp && sl ? ' / ' : '',
                                    sl ? `SL $${parsedSl.toFixed(2)}` : ''
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 377,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 373,
                        columnNumber: 9
                    }, this),
                    showTpSl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-2 mt-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "text-xs text-gray-400 mb-1 block",
                                        children: "Take Profit"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 385,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        inputMode: "decimal",
                                        "aria-label": "Take Profit",
                                        placeholder: side === 'buy' ? (stock.price * 1.1).toFixed(2) : (stock.price * 0.9).toFixed(2),
                                        value: tp,
                                        onChange: (e)=>setTp((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumericInput"])(e.target.value)),
                                        className: `w-full px-3 py-2 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${tpWrongSide ? 'border-yellow-500/50' : 'border-gray-700/30'}`
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 386,
                                        columnNumber: 15
                                    }, this),
                                    tpWrongSide && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-yellow-400 text-[10px] mt-1",
                                        children: side === 'buy' ? 'Take profit should be above current price' : 'Take profit should be below current price'
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 393,
                                        columnNumber: 17
                                    }, this),
                                    !tpWrongSide && parsedTp > 0 && shares > 0 && effectivePrice > 0 && (()=>{
                                        const diff = side === 'buy' ? parsedTp - effectivePrice : effectivePrice - parsedTp;
                                        const pnl = diff * shares;
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: `text-[10px] mt-1 ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                            children: [
                                                pnl >= 0 ? 'Est. Profit' : 'Est. Loss',
                                                ": ",
                                                pnl >= 0 ? '+' : '',
                                                "$",
                                                pnl.toFixed(2)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                            lineNumber: 401,
                                            columnNumber: 19
                                        }, this);
                                    })()
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 384,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "text-xs text-gray-400 mb-1 block",
                                        children: "Stop Loss"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 408,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        inputMode: "decimal",
                                        "aria-label": "Stop Loss",
                                        placeholder: side === 'buy' ? (stock.price * 0.95).toFixed(2) : (stock.price * 1.05).toFixed(2),
                                        value: sl,
                                        onChange: (e)=>setSl((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumericInput"])(e.target.value)),
                                        className: `w-full px-3 py-2 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${slWrongSide ? 'border-yellow-500/50' : 'border-gray-700/30'}`
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 409,
                                        columnNumber: 15
                                    }, this),
                                    slWrongSide && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-yellow-400 text-[10px] mt-1",
                                        children: side === 'buy' ? 'Stop loss should be below current price' : 'Stop loss should be above current price'
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 416,
                                        columnNumber: 17
                                    }, this),
                                    !slWrongSide && parsedSl > 0 && shares > 0 && effectivePrice > 0 && (()=>{
                                        const diff = side === 'buy' ? parsedSl - effectivePrice : effectivePrice - parsedSl;
                                        const pnl = diff * shares;
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: `text-[10px] mt-1 ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                            children: [
                                                pnl < 0 ? 'Est. Loss' : 'Est. Profit',
                                                ": ",
                                                pnl >= 0 ? '+' : '',
                                                "$",
                                                pnl.toFixed(2)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                            lineNumber: 424,
                                            columnNumber: 19
                                        }, this);
                                    })()
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 407,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 383,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 372,
                columnNumber: 7
            }, this),
            actionError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[10px] text-red-400 text-center truncate mb-2",
                children: actionError
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 435,
                columnNumber: 9
            }, this),
            walletReady && sellGated ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                disabled: true,
                className: "w-full py-3 rounded-xl font-semibold text-sm bg-dark-50 text-gray-400 cursor-not-allowed",
                children: [
                    "No ",
                    stock.ticker,
                    " to sell"
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 438,
                columnNumber: 9
            }, this) : walletReady ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(WalletGatedTradeButton, {
                hasAmount: hasAmount && hasValidPrice && !sellSharesExceedsBalance,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "submit",
                    disabled: limitPriceInvalid || triggerPriceInvalid || !hasValidPrice || isPending || sellSharesExceedsBalance || amountTooLarge || buyBlockedBySync,
                    className: `w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${side === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`,
                    children: actionPhase === 'approving' ? 'Approving…' : actionPhase === 'pending' ? 'Confirming…' : actionPhase === 'done' ? 'Order Submitted!' : submitted ? 'Order Submitted!' : `${side === 'buy' ? 'Buy' : 'Sell'} ${stock.ticker}`
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                    lineNumber: 444,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 443,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "submit",
                disabled: !hasAmount || limitPriceInvalid || triggerPriceInvalid || !hasValidPrice || sellDisabled || amountTooLarge || buyBlockedBySync,
                className: `w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${side === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`,
                children: submitted ? 'Order Submitted!' : `${side === 'buy' ? 'Buy' : 'Sell'} ${stock.ticker}`
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 452,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3 flex items-center justify-center gap-1.5 text-[10px] text-goodgreen",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-3 h-3",
                        fill: "currentColor",
                        viewBox: "0 0 20 20",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            fillRule: "evenodd",
                            d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
                            clipRule: "evenodd"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                            lineNumber: 461,
                            columnNumber: 74
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 461,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "0.1% fee → 33% funds UBI"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 462,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 460,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
        lineNumber: 224,
        columnNumber: 5
    }, this);
}
_s1(OrderForm, "oX2G7SL6dPAacX/D8NOuZA4PzgM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$WalletReadyContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWalletReady"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStocks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMintSynthetic"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStocks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRedeemSynthetic"]
    ];
});
_c6 = OrderForm;
function StockDetailPage() {
    _s2();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const rawTicker = Array.isArray(params.ticker) ? params.ticker[0] : params.ticker;
    const isReservedSubroute = !!rawTicker && RESERVED_STOCK_SUBROUTES.has(rawTicker.toLowerCase());
    const ticker = normalizeTickerForLookup(rawTicker);
    const { stocks, isLive } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainStocks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOnChainStocks"])();
    const { bySymbol: rebalanceBySymbol } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStocksRebalanceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStocksRebalanceStatus"])(ticker ? [
        ticker
    ] : []);
    const tickerRebalance = ticker ? rebalanceBySymbol[ticker] : undefined;
    const riskIncreaseAllowed = tickerRebalance?.riskIncreaseAllowed ?? true;
    const riskStopReasons = tickerRebalance?.stopReasons ?? [];
    const stock = stocks.find((s)=>s.ticker === ticker);
    const { position } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStocks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStockPosition"])(ticker ?? '');
    const [timeframe, setTimeframe] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('3M');
    const [chartView, setChartView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('price');
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "StockDetailPage.useState": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$app$2f28$app$292f$stocks$2f5b$ticker$5d2f$tickerTabState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseTickerTab"])(searchParams.get('tab'))
    }["StockDetailPage.useState"]);
    const [analysisExpanded, setAnalysisExpanded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [peerMetric, setPeerMetric] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('change24h');
    const orderFormRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [analystLoading, setAnalystLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const analystOutlook = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StockDetailPage.useMemo[analystOutlook]": ()=>ticker ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockInsights$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAnalystOutlook"])(ticker) : null
    }["StockDetailPage.useMemo[analystOutlook]"], [
        ticker
    ]);
    const { items: newsItems, isLoading: newsLoading, error: newsError } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockNews$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStockNews"])(ticker ?? '');
    // Defer chart render until after hydration to avoid SSR layout glitches
    // and the Next.js 14 dynamic-segment manifest bug. See task 0090.
    const chartMounted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useMounted$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMounted"])();
    const chartData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StockDetailPage.useMemo[chartData]": ()=>{
            if (!stock || !chartMounted) return [];
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chartData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChartData"])(stock.ticker, timeframe, stock.price);
        }
    }["StockDetailPage.useMemo[chartData]"], [
        chartMounted,
        stock,
        timeframe
    ]);
    const hasPosition = !!position && position.debtFloat > 0;
    const relatedSymbols = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StockDetailPage.useMemo[relatedSymbols]": ()=>stock ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockDiscovery$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRelatedSymbols"])(stocks, stock.ticker, 4) : []
    }["StockDetailPage.useMemo[relatedSymbols]"], [
        stocks,
        stock
    ]);
    const topMovers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StockDetailPage.useMemo[topMovers]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockDiscovery$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getTopMovers"])(stocks, 5)
    }["StockDetailPage.useMemo[topMovers]"], [
        stocks
    ]);
    const peerCandidates = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StockDetailPage.useMemo[peerCandidates]": ()=>{
            if (!stock) return [];
            const directPeers = relatedSymbols.length > 0 ? relatedSymbols : topMovers.filter({
                "StockDetailPage.useMemo[peerCandidates]": (candidate)=>candidate.ticker !== stock.ticker
            }["StockDetailPage.useMemo[peerCandidates]"]);
            return directPeers.slice(0, 5);
        }
    }["StockDetailPage.useMemo[peerCandidates]"], [
        relatedSymbols,
        stock,
        topMovers
    ]);
    const trendSummary = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StockDetailPage.useMemo[trendSummary]": ()=>{
            if (!chartData.length) return null;
            const first = chartData[0]?.close ?? 0;
            const last = chartData[chartData.length - 1]?.close ?? 0;
            if (first <= 0 || last <= 0) return null;
            const changePct = (last - first) / first * 100;
            let signal = 'Neutral';
            if (changePct > 2) signal = 'Bullish';
            if (changePct < -2) signal = 'Bearish';
            const high = Math.max(...chartData.map({
                "StockDetailPage.useMemo[trendSummary].high": (point)=>point.high
            }["StockDetailPage.useMemo[trendSummary].high"]));
            const low = Math.min(...chartData.map({
                "StockDetailPage.useMemo[trendSummary].low": (point)=>point.low
            }["StockDetailPage.useMemo[trendSummary].low"]));
            const spreadPct = first > 0 ? (high - low) / first * 100 : 0;
            return {
                signal,
                changePct,
                spreadPct
            };
        }
    }["StockDetailPage.useMemo[trendSummary]"], [
        chartData
    ]);
    const fundamentalsRows = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StockDetailPage.useMemo[fundamentalsRows]": ()=>stock ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$app$2f28$app$292f$stocks$2f5b$ticker$5d2f$tickerTabState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildFundamentalsRows"])(stock) : []
    }["StockDetailPage.useMemo[fundamentalsRows]"], [
        stock
    ]);
    const backLink = DETAIL_BACK_LINKS[searchParams.get('from') ?? ''] ?? DEFAULT_DETAIL_BACK_LINK;
    const eventTimeline = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StockDetailPage.useMemo[eventTimeline]": ()=>{
            if (!stock) return [];
            const upcoming = [
                {
                    id: `${stock.ticker}-earnings-next`,
                    label: 'Earnings call',
                    date: formatEventDate(7),
                    status: 'Upcoming'
                },
                {
                    id: `${stock.ticker}-dividend-next`,
                    label: 'Dividend ex-date',
                    date: stock.dividendYield > 0 ? formatEventDate(13) : 'Not scheduled',
                    status: stock.dividendYield > 0 ? 'Upcoming' : 'Info'
                }
            ];
            const recent = newsItems.slice(0, 2).map({
                "StockDetailPage.useMemo[eventTimeline].recent": (item, idx)=>({
                        id: item.id,
                        label: item.headline,
                        date: formatCalendarDate(item.publishedAt),
                        status: idx === 0 ? 'Recent' : 'Catalyst'
                    })
            }["StockDetailPage.useMemo[eventTimeline].recent"]);
            return [
                ...upcoming,
                ...recent
            ];
        }
    }["StockDetailPage.useMemo[eventTimeline]"], [
        newsItems,
        stock
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StockDetailPage.useEffect": ()=>{
            setAnalystLoading(true);
            const timer = setTimeout({
                "StockDetailPage.useEffect.timer": ()=>setAnalystLoading(false)
            }["StockDetailPage.useEffect.timer"], 140);
            return ({
                "StockDetailPage.useEffect": ()=>clearTimeout(timer)
            })["StockDetailPage.useEffect"];
        }
    }["StockDetailPage.useEffect"], [
        ticker
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StockDetailPage.useEffect": ()=>{
            const nextTab = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$app$2f28$app$292f$stocks$2f5b$ticker$5d2f$tickerTabState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseTickerTab"])(searchParams.get('tab'));
            if (nextTab !== activeTab) {
                setActiveTab(nextTab);
            }
        }
    }["StockDetailPage.useEffect"], [
        activeTab,
        searchParams
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StockDetailPage.useEffect": ()=>{
            const rawTab = searchParams.get('tab');
            if (rawTab === null) return;
            const canonicalTab = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$app$2f28$app$292f$stocks$2f5b$ticker$5d2f$tickerTabState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseTickerTab"])(rawTab);
            if (rawTab === canonicalTab) return;
            const nextParams = new URLSearchParams(searchParams.toString());
            if (canonicalTab === 'overview') {
                nextParams.delete('tab');
            } else {
                nextParams.set('tab', canonicalTab);
            }
            const next = nextParams.toString();
            router.replace(next ? `${pathname}?${next}` : pathname, {
                scroll: false
            });
        }
    }["StockDetailPage.useEffect"], [
        pathname,
        router,
        searchParams
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StockDetailPage.useEffect": ()=>{
            if (isReservedSubroute) {
                router.replace('/stocks');
            }
        }
    }["StockDetailPage.useEffect"], [
        isReservedSubroute,
        router
    ]);
    const handleTabChange = (nextTab)=>{
        setActiveTab(nextTab);
        const nextParams = new URLSearchParams(searchParams.toString());
        if (nextTab === 'overview') {
            nextParams.delete('tab');
        } else {
            nextParams.set('tab', nextTab);
        }
        const next = nextParams.toString();
        router.replace(next ? `${pathname}?${next}` : pathname, {
            scroll: false
        });
    };
    if (isReservedSubroute) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center min-h-[60vh]",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-6 w-6 animate-spin rounded-full border-2 border-goodgreen border-t-transparent"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 588,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
            lineNumber: 587,
            columnNumber: 7
        }, this);
    }
    if (!stock) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col items-center justify-center min-h-[60vh] text-center px-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-2xl font-bold text-white mb-3",
                    children: "Stock Not Found"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                    lineNumber: 596,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm text-gray-400 mb-6 max-w-md",
                    children: "This stock symbol is not available."
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                    lineNumber: 597,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    href: "/stocks",
                    className: "px-6 py-3 rounded-xl bg-goodgreen text-black font-semibold hover:bg-goodgreen-600 transition-colors",
                    children: "Back to Stocks"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                    lineNumber: 600,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-5 flex items-center gap-2 text-xs text-gray-400",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Try:"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                            lineNumber: 604,
                            columnNumber: 11
                        }, this),
                        INVALID_TICKER_RECOVERY.map((symbol)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: `/stocks/${symbol}`,
                                className: "px-2.5 py-1 rounded-lg border border-gray-700/40 bg-dark-50/40 text-gray-200 hover:text-white hover:border-goodgreen/40 transition-colors",
                                children: symbol
                            }, symbol, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 606,
                                columnNumber: 13
                            }, this))
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                    lineNumber: 603,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
            lineNumber: 595,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-5xl mx-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                href: backLink.href,
                prefetch: false,
                "data-testid": "stocks-detail-back-link",
                className: "inline-flex items-center gap-1 text-sm text-slate-400 hover:text-teal-400 transition-colors mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "←"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 622,
                        columnNumber: 9
                    }, this),
                    " ",
                    backLink.label
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 621,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$WalletConnectConfigWarning$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletConnectConfigWarning"], {
                className: "mb-4"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 624,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col lg:flex-row gap-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 min-w-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 mb-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$stock$2d$logo$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StockLogo"], {
                                        ticker: stock.ticker,
                                        size: "md"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 628,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 min-w-0",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                                        className: "text-2xl font-bold text-white",
                                                        children: stock.ticker
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 631,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$WatchlistStarButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WatchlistStarButton"], {
                                                        ticker: stock.ticker,
                                                        size: "md"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 632,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 630,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm text-gray-400",
                                                children: [
                                                    stock.name,
                                                    " · ",
                                                    stock.sector
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 634,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 629,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 627,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-baseline gap-3 mb-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-3xl font-bold text-white",
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockPrice"])(stock.price)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 639,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `text-sm font-medium ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                        children: [
                                            stock.change24h >= 0 ? '+' : '',
                                            stock.change24h.toFixed(2),
                                            "%"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 640,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 638,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4 min-h-[1.75rem]",
                                children: chartMounted ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$OracleStatusBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OracleStatusBadge"], {
                                    variant: "detail",
                                    symbol: stock.ticker,
                                    useStocksFallback: true
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                    lineNumber: 646,
                                    columnNumber: 15
                                }, this) : null
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 644,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$StockStatsBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StockStatsBar"], {
                                stock: stock
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 654,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
                                fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mb-4 h-24 rounded-2xl bg-dark-100 animate-pulse"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                    lineNumber: 656,
                                    columnNumber: 31
                                }, this),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AnalystOutlookCard, {
                                    currentPrice: stock.price,
                                    outlook: analystOutlook,
                                    isLoading: analystLoading
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                    lineNumber: 657,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 656,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-4 mb-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between mb-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex gap-1",
                                                children: chartView === 'price' && TIMEFRAMES.map((tf)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setTimeframe(tf),
                                                        className: `px-3 py-1 rounded-lg text-xs font-medium transition-colors ${timeframe === tf ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`,
                                                        children: tf
                                                    }, tf, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 668,
                                                        columnNumber: 19
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 666,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex gap-0.5 rounded-lg bg-dark-50/60 p-0.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setChartView('price'),
                                                        className: `px-3 py-1 rounded-md text-xs font-medium transition-colors ${chartView === 'price' ? 'bg-dark-200 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`,
                                                        children: "Price"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 675,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setChartView('depth'),
                                                        className: `px-3 py-1 rounded-md text-xs font-medium transition-colors ${chartView === 'depth' ? 'bg-dark-200 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`,
                                                        children: "Depth"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 679,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 674,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 665,
                                        columnNumber: 13
                                    }, this),
                                    chartView === 'price' ? chartMounted ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
                                        fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-full bg-dark-50/30 rounded-xl animate-pulse",
                                            style: {
                                                height: 350
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                            lineNumber: 687,
                                            columnNumber: 37
                                        }, this),
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PriceChart, {
                                            data: chartData,
                                            height: 350
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                            lineNumber: 688,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 687,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-full bg-dark-50/30 rounded-xl animate-pulse",
                                        style: {
                                            height: 350
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 691,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
                                        fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-full bg-dark-50/30 rounded-xl animate-pulse",
                                            style: {
                                                height: 350
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                            lineNumber: 694,
                                            columnNumber: 35
                                        }, this),
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DepthChart, {
                                            oraclePrice: stock.price,
                                            height: 350
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                            lineNumber: 695,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 694,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 664,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-700/20 bg-dark-100/70 p-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>handleTabChange('overview'),
                                        className: `rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === 'overview' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`,
                                        children: "Overview"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 701,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>handleTabChange('fundamentals'),
                                        className: `rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === 'fundamentals' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`,
                                        children: "Fundamentals"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 708,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>handleTabChange('events'),
                                        className: `rounded-lg px-3 py-2 text-xs font-semibold ${activeTab === 'events' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`,
                                        children: "Events"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 715,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 700,
                                columnNumber: 11
                            }, this),
                            activeTab === 'overview' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-sm font-semibold text-white mb-3",
                                            children: "Key Statistics"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                            lineNumber: 727,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-sm",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "min-w-0",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-gray-500 text-xs mb-0.5",
                                                            children: "Market Cap"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 730,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-white font-medium truncate",
                                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatLargeNumber"])(stock.marketCap)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 731,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                    lineNumber: 729,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "min-w-0",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-gray-500 text-xs mb-0.5",
                                                            children: "24h Volume"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 734,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-white font-medium truncate",
                                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatLargeNumber"])(stock.volume24h)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 735,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                    lineNumber: 733,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "min-w-0",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-gray-500 text-xs mb-0.5",
                                                            children: "Sector"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 738,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-white font-medium truncate",
                                                            children: stock.sector
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 739,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                    lineNumber: 737,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "min-w-0",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-gray-500 text-xs mb-0.5",
                                                            children: "52W High"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 742,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-white font-medium truncate",
                                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockPrice"])(stock.high52w)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 743,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                    lineNumber: 741,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "min-w-0",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-gray-500 text-xs mb-0.5",
                                                            children: "52W Low"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 746,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-white font-medium truncate",
                                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockPrice"])(stock.low52w)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 747,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                    lineNumber: 745,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "min-w-0",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-gray-500 text-xs mb-0.5",
                                                            children: "24h Change"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 750,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: `font-medium ${stock.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                                            children: [
                                                                stock.change24h >= 0 ? '+' : '',
                                                                stock.change24h.toFixed(2),
                                                                "%"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 751,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                    lineNumber: 749,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-gray-500 text-xs mb-0.5",
                                                            children: "P/E Ratio"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 756,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-white font-medium",
                                                            children: [
                                                                stock.peRatio.toFixed(1),
                                                                "x"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 757,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                    lineNumber: 755,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-gray-500 text-xs mb-0.5",
                                                            children: "EPS"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 760,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: `font-medium ${stock.eps >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                                            children: [
                                                                "$",
                                                                stock.eps.toFixed(2)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 761,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                    lineNumber: 759,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-gray-500 text-xs mb-0.5",
                                                            children: "Dividend Yield"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 764,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-white font-medium",
                                                            children: stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : '—'
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 765,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                    lineNumber: 763,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-gray-500 text-xs mb-0.5",
                                                            children: "Avg Volume"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 768,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-white font-medium",
                                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatLargeNumber"])(stock.avgVolume).replace('$', '')
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 769,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                    lineNumber: 767,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                            lineNumber: 728,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                    lineNumber: 726,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false),
                            activeTab === 'fundamentals' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "rounded-2xl border border-gray-700/20 bg-dark-100 p-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "mb-3 text-sm font-semibold text-white",
                                        children: "Fundamentals"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 778,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid grid-cols-1 gap-2 sm:grid-cols-2",
                                        children: fundamentalsRows.map((row)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "rounded-xl border border-gray-700/20 bg-dark-50/20 px-3 py-2.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-[11px] text-gray-500",
                                                        children: row.label
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 782,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-0.5 text-sm font-semibold text-white",
                                                        children: row.value
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 783,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: `mt-0.5 text-[11px] ${row.positive === null ? 'text-gray-400' : row.positive ? 'text-green-400' : 'text-red-400'}`,
                                                        children: row.delta
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 784,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, row.label, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 781,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 779,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 777,
                                columnNumber: 13
                            }, this),
                            activeTab === 'events' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "rounded-2xl border border-gray-700/20 bg-dark-100 p-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "mb-3 text-sm font-semibold text-white",
                                        children: "Events"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 793,
                                        columnNumber: 15
                                    }, this),
                                    eventTimeline.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500",
                                        children: "No event data available right now."
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 795,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "space-y-2",
                                        children: eventTimeline.map((event)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                className: "rounded-xl border border-gray-700/20 bg-dark-50/20 p-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mb-1 flex items-center justify-between gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-xs font-semibold text-white",
                                                                children: event.label
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                lineNumber: 801,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-[10px] text-gray-500",
                                                                children: event.status
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                lineNumber: 802,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 800,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs text-gray-400",
                                                        children: event.date
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 804,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, event.id, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 799,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 797,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 792,
                                columnNumber: 13
                            }, this),
                            activeTab === 'overview' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mt-4",
                                "aria-labelledby": "analysis-heading",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                id: "analysis-heading",
                                                className: "text-sm font-semibold text-white",
                                                children: "Analysis"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 815,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                className: "text-xs text-gray-400 hover:text-white transition-colors",
                                                onClick: ()=>setAnalysisExpanded((open)=>!open),
                                                "aria-expanded": analysisExpanded,
                                                children: analysisExpanded ? 'Collapse' : 'Expand'
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 816,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 814,
                                        columnNumber: 13
                                    }, this),
                                    analysisExpanded && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-4 space-y-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "grid grid-cols-2 sm:grid-cols-4 gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "rounded-xl border border-gray-700/30 bg-dark-50/30 p-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-[10px] uppercase tracking-wide text-gray-500",
                                                                children: "Valuation"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                lineNumber: 829,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-1 text-sm font-medium text-white",
                                                                children: [
                                                                    "P/E ",
                                                                    stock.peRatio.toFixed(1),
                                                                    "x"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                lineNumber: 830,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 828,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "rounded-xl border border-gray-700/30 bg-dark-50/30 p-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-[10px] uppercase tracking-wide text-gray-500",
                                                                children: "Profitability"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                lineNumber: 833,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: `mt-1 text-sm font-medium ${stock.eps >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                                                children: [
                                                                    "EPS $",
                                                                    stock.eps.toFixed(2)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                lineNumber: 834,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 832,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "rounded-xl border border-gray-700/30 bg-dark-50/30 p-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-[10px] uppercase tracking-wide text-gray-500",
                                                                children: "Income"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                lineNumber: 837,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-1 text-sm font-medium text-white",
                                                                children: stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}% yield` : 'No dividend'
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                lineNumber: 838,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 836,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "rounded-xl border border-gray-700/30 bg-dark-50/30 p-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-[10px] uppercase tracking-wide text-gray-500",
                                                                children: "Liquidity"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                lineNumber: 841,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-1 text-sm font-medium text-white",
                                                                children: [
                                                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatLargeNumber"])(stock.avgVolume).replace('$', ''),
                                                                    " avg vol"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                lineNumber: 842,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 840,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 827,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "rounded-xl border border-gray-700/30 bg-dark-50/20 p-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                className: "text-xs font-semibold uppercase tracking-wide text-gray-300",
                                                                children: "Peer Compare"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                lineNumber: 848,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex flex-wrap gap-1",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        type: "button",
                                                                        className: `px-2 py-1 rounded-md text-[11px] ${peerMetric === 'change24h' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`,
                                                                        onClick: ()=>setPeerMetric('change24h'),
                                                                        children: "24h%"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                        lineNumber: 850,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        type: "button",
                                                                        className: `px-2 py-1 rounded-md text-[11px] ${peerMetric === 'marketCap' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`,
                                                                        onClick: ()=>setPeerMetric('marketCap'),
                                                                        children: "Mkt Cap"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                        lineNumber: 851,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        type: "button",
                                                                        className: `px-2 py-1 rounded-md text-[11px] ${peerMetric === 'peRatio' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`,
                                                                        onClick: ()=>setPeerMetric('peRatio'),
                                                                        children: "P/E"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                        lineNumber: 852,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                lineNumber: 849,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 847,
                                                        columnNumber: 19
                                                    }, this),
                                                    peerCandidates.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs text-gray-500",
                                                        children: "Peer data unavailable right now."
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 856,
                                                        columnNumber: 21
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "space-y-1.5",
                                                        children: peerCandidates.toSorted((a, b)=>b[peerMetric] - a[peerMetric]).map((peer)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center justify-between rounded-lg border border-gray-700/20 bg-dark-100/70 px-3 py-2 text-xs",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                                        href: `/stocks/${peer.ticker}`,
                                                                        className: "font-medium text-white hover:text-goodgreen transition-colors",
                                                                        children: peer.ticker
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                        lineNumber: 863,
                                                                        columnNumber: 29
                                                                    }, this),
                                                                    peerMetric === 'change24h' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: peer.change24h >= 0 ? 'text-green-400' : 'text-red-400',
                                                                        children: [
                                                                            peer.change24h >= 0 ? '+' : '',
                                                                            peer.change24h.toFixed(2),
                                                                            "%"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                        lineNumber: 865,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    peerMetric === 'marketCap' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-gray-200",
                                                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatLargeNumber"])(peer.marketCap)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                        lineNumber: 869,
                                                                        columnNumber: 60
                                                                    }, this),
                                                                    peerMetric === 'peRatio' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-gray-200",
                                                                        children: [
                                                                            peer.peRatio.toFixed(1),
                                                                            "x"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                        lineNumber: 870,
                                                                        columnNumber: 58
                                                                    }, this)
                                                                ]
                                                            }, peer.ticker, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                lineNumber: 862,
                                                                columnNumber: 27
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 858,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 846,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "rounded-xl border border-gray-700/30 bg-dark-50/20 p-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        className: "text-xs font-semibold uppercase tracking-wide text-gray-300 mb-2",
                                                        children: "Trend Summary"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 878,
                                                        columnNumber: 19
                                                    }, this),
                                                    !trendSummary ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs text-gray-500",
                                                        children: "Trend signal unavailable while chart data loads."
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 880,
                                                        columnNumber: 21
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "rounded-lg border border-gray-700/20 bg-dark-100/70 px-3 py-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-gray-500",
                                                                        children: "Signal"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                        lineNumber: 884,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: `mt-1 font-semibold ${trendSummary.signal === 'Bullish' ? 'text-green-400' : trendSummary.signal === 'Bearish' ? 'text-red-400' : 'text-gray-200'}`,
                                                                        children: trendSummary.signal
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                        lineNumber: 885,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                lineNumber: 883,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "rounded-lg border border-gray-700/20 bg-dark-100/70 px-3 py-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-gray-500",
                                                                        children: [
                                                                            timeframe,
                                                                            " move"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                        lineNumber: 888,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: `mt-1 font-semibold ${trendSummary.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                                                        children: [
                                                                            trendSummary.changePct >= 0 ? '+' : '',
                                                                            trendSummary.changePct.toFixed(2),
                                                                            "%"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                        lineNumber: 889,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                lineNumber: 887,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "rounded-lg border border-gray-700/20 bg-dark-100/70 px-3 py-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-gray-500",
                                                                        children: "Range spread"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                        lineNumber: 894,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "mt-1 font-semibold text-gray-200",
                                                                        children: [
                                                                            trendSummary.spreadPct.toFixed(2),
                                                                            "%"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                        lineNumber: 895,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                                lineNumber: 893,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 882,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 877,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 826,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 813,
                                columnNumber: 11
                            }, this),
                            activeTab === 'overview' && stock.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-5 mt-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-sm font-semibold text-white mb-2",
                                        children: [
                                            "About ",
                                            stock.name
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 907,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-gray-400 leading-relaxed",
                                        children: stock.description
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 908,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 906,
                                columnNumber: 13
                            }, this),
                            activeTab === 'overview' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
                                fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 h-32 rounded-2xl bg-dark-100 animate-pulse"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                    lineNumber: 913,
                                    columnNumber: 33
                                }, this),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NewsEventsPanel, {
                                    ticker: stock.ticker,
                                    isLoading: newsLoading,
                                    error: newsError,
                                    items: newsItems
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                    lineNumber: 914,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 913,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 626,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "lg:w-80 shrink-0",
                        children: [
                            !isLive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                                role: "note",
                                className: "mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200",
                                title: "On-chain StocksPriceOracle is unreachable. Prices on this page are demo data.",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-semibold",
                                        children: "Demo data:"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 931,
                                        columnNumber: 15
                                    }, this),
                                    ' ',
                                    "On-chain stocks oracle is not reachable. Prices are illustrative only and orders cannot settle."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 926,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: orderFormRef,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OrderForm, {
                                    stock: stock,
                                    position: position,
                                    riskIncreaseAllowed: riskIncreaseAllowed,
                                    riskStopReasons: riskStopReasons
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                    lineNumber: 936,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 935,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
                                fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 h-28 rounded-2xl bg-dark-100 animate-pulse"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                    lineNumber: 944,
                                    columnNumber: 31
                                }, this),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StockMarketData, {
                                    markPrice: stock.price
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                    lineNumber: 945,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 944,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 bg-dark-100 rounded-2xl border border-gray-700/20 p-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-sm font-semibold text-white mb-3",
                                        children: "Your Position"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 949,
                                        columnNumber: 13
                                    }, this),
                                    hasPosition ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-baseline justify-between gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-2xl font-bold text-white tabular-nums",
                                                        children: position.debtFloat.toFixed(4)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 953,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-xs font-medium text-gray-400",
                                                        children: stock.ticker
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 956,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 952,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-baseline justify-between text-xs text-gray-400",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Notional value"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 959,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-white tabular-nums",
                                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockPrice"])(position.debtFloat * stock.price)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 960,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 958,
                                                columnNumber: 17
                                            }, this),
                                            position.collateralFloat > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-baseline justify-between text-xs text-gray-400",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Collateral locked"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 964,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-white tabular-nums",
                                                        children: [
                                                            position.collateralFloat.toFixed(2),
                                                            " G$"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 965,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 963,
                                                columnNumber: 19
                                            }, this),
                                            position.collateralRatio > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-baseline justify-between text-xs text-gray-400",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Collateral ratio"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 970,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-white tabular-nums",
                                                        children: [
                                                            (position.collateralRatio * 100).toFixed(0),
                                                            "%"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 971,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 969,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 951,
                                        columnNumber: 15
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-center py-6 text-gray-500 text-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: "w-8 h-8 mx-auto mb-2 text-gray-600",
                                                fill: "none",
                                                stroke: "currentColor",
                                                viewBox: "0 0 24 24",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: 1.5,
                                                    d: "M20 12H4"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                    lineNumber: 978,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 977,
                                                columnNumber: 17
                                            }, this),
                                            "No position in ",
                                            stock.ticker,
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-1 text-xs text-gray-600",
                                                children: "Place an order to get started"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 981,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 976,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 948,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$StockAccountPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StockAccountPanel"], {}, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 986,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$RelatedMoversPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RelatedMoversPanel"], {
                                currentTicker: stock.ticker,
                                related: relatedSymbols,
                                movers: topMovers
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 988,
                                columnNumber: 11
                            }, this),
                            hasPosition ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 bg-dark-100/50 rounded-2xl border border-gray-700/10 p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500 mb-2",
                                        children: "Also on GoodDollar"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 996,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col gap-1.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/explore",
                                                prefetch: false,
                                                className: "text-xs text-gray-400 hover:text-goodgreen transition-colors inline-flex items-center gap-1",
                                                children: [
                                                    "Explore crypto tokens",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        className: "w-3 h-3",
                                                        fill: "none",
                                                        stroke: "currentColor",
                                                        viewBox: "0 0 24 24",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M9 5l7 7-7 7"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 1000,
                                                            columnNumber: 98
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 1000,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 998,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/perps",
                                                prefetch: false,
                                                className: "text-xs text-gray-400 hover:text-goodgreen transition-colors inline-flex items-center gap-1",
                                                children: [
                                                    "Trade crypto perpetual futures",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        className: "w-3 h-3",
                                                        fill: "none",
                                                        stroke: "currentColor",
                                                        viewBox: "0 0 24 24",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M9 5l7 7-7 7"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 1004,
                                                            columnNumber: 98
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 1004,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 1002,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/predict",
                                                prefetch: false,
                                                className: "text-xs text-gray-400 hover:text-goodgreen transition-colors inline-flex items-center gap-1",
                                                children: [
                                                    "Prediction markets",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        className: "w-3 h-3",
                                                        fill: "none",
                                                        stroke: "currentColor",
                                                        viewBox: "0 0 24 24",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M9 5l7 7-7 7"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 1008,
                                                            columnNumber: 98
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 1008,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 1006,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 997,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 995,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 bg-dark-100/50 rounded-2xl border border-goodgreen/20 p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500 mb-2",
                                        children: "Next steps in stocks"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 1014,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col gap-1.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                href: `/stocks/${stock.ticker}#stock-order-form`,
                                                prefetch: false,
                                                className: "text-xs text-goodgreen hover:text-goodgreen/80 transition-colors inline-flex items-center gap-1",
                                                children: [
                                                    "Buy s",
                                                    stock.ticker,
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        className: "w-3 h-3",
                                                        fill: "none",
                                                        stroke: "currentColor",
                                                        viewBox: "0 0 24 24",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M9 5l7 7-7 7"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 1018,
                                                            columnNumber: 98
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 1018,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 1016,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/stocks/portfolio",
                                                prefetch: false,
                                                className: "text-xs text-gray-300 hover:text-goodgreen transition-colors inline-flex items-center gap-1",
                                                children: [
                                                    "Open Stock Portfolio",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        className: "w-3 h-3",
                                                        fill: "none",
                                                        stroke: "currentColor",
                                                        viewBox: "0 0 24 24",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M9 5l7 7-7 7"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 1022,
                                                            columnNumber: 98
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 1022,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 1020,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/stocks",
                                                prefetch: false,
                                                className: "text-xs text-gray-300 hover:text-goodgreen transition-colors inline-flex items-center gap-1",
                                                children: [
                                                    "Browse Stocks",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        className: "w-3 h-3",
                                                        fill: "none",
                                                        stroke: "currentColor",
                                                        viewBox: "0 0 24 24",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M9 5l7 7-7 7"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                            lineNumber: 1026,
                                                            columnNumber: 98
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                        lineNumber: 1026,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                                lineNumber: 1024,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                        lineNumber: 1015,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                                lineNumber: 1013,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                        lineNumber: 924,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 625,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$MobileTradeStickyBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MobileTradeStickyBar"], {
                targetRef: orderFormRef,
                ticker: stock.ticker
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
                lineNumber: 1034,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/stocks/[ticker]/page.tsx",
        lineNumber: 620,
        columnNumber: 5
    }, this);
}
_s2(StockDetailPage, "9VC6FHmyJvnxaDEqLLuIexbsW+Q=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainStocks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOnChainStocks"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStocksRebalanceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStocksRebalanceStatus"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStocks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStockPosition"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockNews$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStockNews"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useMounted$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMounted"]
    ];
});
_c7 = StockDetailPage;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7;
__turbopack_context__.k.register(_c, "AnalystOutlookCard");
__turbopack_context__.k.register(_c1, "NewsEventsPanel");
__turbopack_context__.k.register(_c2, "PriceChart");
__turbopack_context__.k.register(_c3, "DepthChart");
__turbopack_context__.k.register(_c4, "StockMarketData");
__turbopack_context__.k.register(_c5, "WalletGatedTradeButton");
__turbopack_context__.k.register(_c6, "OrderForm");
__turbopack_context__.k.register(_c7, "StockDetailPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_src_0duu~t0._.js.map