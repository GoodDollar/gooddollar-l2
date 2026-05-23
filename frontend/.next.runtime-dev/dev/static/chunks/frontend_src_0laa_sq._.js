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
"[project]/frontend/src/components/Sparkline.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Sparkline",
    ()=>Sparkline
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
;
const Sparkline = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memo"])(_c = function Sparkline({ data, width = 80, height = 32, positive = true, unavailableLabel = 'Price history unavailable' }) {
    // Unavailable data — render a faint dashed baseline placeholder.
    if (data === null || data === undefined || data.length === 0) {
        const midY = height / 2;
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            width: width,
            height: height,
            viewBox: `0 0 ${width} ${height}`,
            className: "inline-block",
            role: "img",
            "aria-label": unavailableLabel,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                    children: unavailableLabel
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/Sparkline.tsx",
                    lineNumber: 37,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                    x1: 2,
                    y1: midY,
                    x2: width - 2,
                    y2: midY,
                    stroke: "currentColor",
                    strokeOpacity: 0.25,
                    strokeWidth: 1,
                    strokeDasharray: "3 3",
                    strokeLinecap: "round"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/Sparkline.tsx",
                    lineNumber: 38,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/Sparkline.tsx",
            lineNumber: 29,
            columnNumber: 7
        }, this);
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 2;
    const points = data.map((v, i)=>{
        const x = pad + i / (data.length - 1) * (width - pad * 2);
        const y = pad + (1 - (v - min) / range) * (height - pad * 2);
        return `${x},${y}`;
    }).join(' ');
    const color = positive ? '#4ade80' : '#f87171';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: width,
        height: height,
        viewBox: `0 0 ${width} ${height}`,
        className: "inline-block",
        "aria-hidden": "true",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
            points: points,
            fill: "none",
            stroke: color,
            strokeWidth: 1.5,
            strokeLinecap: "round",
            strokeLinejoin: "round"
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/Sparkline.tsx",
            lineNumber: 76,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/Sparkline.tsx",
        lineNumber: 69,
        columnNumber: 5
    }, this);
});
_c1 = Sparkline;
var _c, _c1;
__turbopack_context__.k.register(_c, "Sparkline$memo");
__turbopack_context__.k.register(_c1, "Sparkline");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/InfoBanner.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "InfoBanner",
    ()=>InfoBanner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
function InfoBanner({ title, description, storageKey }) {
    _s();
    const [visible, setVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "InfoBanner.useEffect": ()=>{
            try {
                if (localStorage.getItem(storageKey) !== 'true') {
                    setVisible(true);
                }
            } catch  {
                setVisible(true);
            }
        }
    }["InfoBanner.useEffect"], [
        storageKey
    ]);
    if (!visible) return null;
    const handleDismiss = ()=>{
        setVisible(false);
        try {
            localStorage.setItem(storageKey, 'true');
        } catch  {}
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full mb-2 sm:mb-4 p-2 sm:p-3 md:p-4 rounded-xl bg-goodgreen/5 border border-goodgreen/20 flex items-start gap-2 sm:gap-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-5 h-5 mt-0.5 shrink-0 text-goodgreen",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    className: "w-5 h-5",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 1.5,
                        d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/InfoBanner.tsx",
                        lineNumber: 37,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/InfoBanner.tsx",
                    lineNumber: 36,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/InfoBanner.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 min-w-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm font-medium text-goodgreen mb-0.5",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/InfoBanner.tsx",
                        lineNumber: 41,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-gray-400 leading-relaxed",
                        children: description
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/InfoBanner.tsx",
                        lineNumber: 42,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/InfoBanner.tsx",
                lineNumber: 40,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleDismiss,
                "aria-label": "Dismiss",
                className: "p-1 rounded-lg text-gray-500 hover:text-white hover:bg-dark-50 transition-colors shrink-0",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    className: "w-4 h-4",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M6 18L18 6M6 6l12 12"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/InfoBanner.tsx",
                        lineNumber: 50,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/InfoBanner.tsx",
                    lineNumber: 49,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/InfoBanner.tsx",
                lineNumber: 44,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/InfoBanner.tsx",
        lineNumber: 34,
        columnNumber: 5
    }, this);
}
_s(InfoBanner, "cz/DzCD06IMMsoBJ0A1IgCy1P5M=");
_c = InfoBanner;
var _c;
__turbopack_context__.k.register(_c, "InfoBanner");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/StalePriceBanner.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StalePriceBanner",
    ()=>StalePriceBanner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
'use client';
;
const MESSAGES = {
    swap: {
        icon: '⚠️',
        text: 'Live prices unavailable: showing cached rates. Swap at your own risk.'
    },
    stocks: {
        icon: '📡',
        text: 'Oracle offline: showing demo prices. Data may not reflect current market values.'
    }
};
function StalePriceBanner({ variant, className = '' }) {
    const { icon, text } = MESSAGES[variant];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `flex items-center gap-2 px-3 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs ${className}`,
        role: "alert",
        "data-testid": "stale-price-banner",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-sm shrink-0",
                children: icon
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/StalePriceBanner.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: text
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/StalePriceBanner.tsx",
                lineNumber: 29,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/StalePriceBanner.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
_c = StalePriceBanner;
var _c;
__turbopack_context__.k.register(_c, "StalePriceBanner");
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
"[project]/frontend/src/lib/priceSource.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * priceSource — shared discriminated union for the provenance of every
 * price rendered anywhere in the app.
 *
 * Lane 4 (`0007d-app-integration`) requires every visible price to carry
 * a single, honest attribution. This module is the canonical helper:
 *
 *   resolvePriceSource({ chainOk, statusQuote, coinGeckoLive, hasFallback })
 *
 * Returns one of:
 *   - `chain-oracle`  — on-chain `*PriceOracle` answered with a sane value
 *   - `etoro-demo`    — price-service marks the symbol as eToro-fed
 *   - `coingecko`     — CoinGecko proxy returned a live value
 *   - `fallback`      — only the static seed is available (cached, fabricated)
 *   - `stale`         — last known value is past `STALE_THRESHOLD_MS`
 *   - `closed`        — sessionState is `closed` or `halted`
 *   - `unknown`       — no signal whatsoever
 *
 * The function is pure. No React, no fetch.
 */ __turbopack_context__.s([
    "STALE_THRESHOLD_MS",
    ()=>STALE_THRESHOLD_MS,
    "WARN_THRESHOLD_MS",
    ()=>WARN_THRESHOLD_MS,
    "priceSourceLabel",
    ()=>priceSourceLabel,
    "resolvePriceSource",
    ()=>resolvePriceSource
]);
const STALE_THRESHOLD_MS = 60_000;
const WARN_THRESHOLD_MS = 15_000;
function resolvePriceSource(input) {
    const { chainOk, coinGeckoLive = false, hasFallback = false, statusQuote } = input;
    if (chainOk) return 'chain-oracle';
    if (statusQuote) {
        const session = statusQuote.sessionState;
        if (session === 'closed' || session === 'halted') return 'closed';
        if (statusQuote.lastUpdateMs > STALE_THRESHOLD_MS) return 'stale';
        if (statusQuote.source === 'etoro') return 'etoro-demo';
    }
    if (coinGeckoLive) return 'coingecko';
    if (hasFallback) return 'fallback';
    return 'unknown';
}
function priceSourceLabel(source) {
    switch(source){
        case 'chain-oracle':
            return 'Chain oracle';
        case 'etoro-demo':
            return 'eToro demo';
        case 'coingecko':
            return 'Cached (CoinGecko)';
        case 'fallback':
            return 'Fallback price';
        case 'stale':
            return 'Stale';
        case 'closed':
            return 'Market closed';
        case 'unknown':
            return 'Unknown';
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/PriceSourceBadge.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PriceSourceBadge",
    ()=>PriceSourceBadge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$priceSource$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/priceSource.ts [app-client] (ecmascript)");
'use client';
;
;
function PriceSourceBadge({ source, size = 'md', className = '' }) {
    const label = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$priceSource$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["priceSourceLabel"])(source);
    const variant = VARIANTS[source];
    const dotSize = size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5';
    const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
    const gap = size === 'sm' ? 'gap-1' : 'gap-1.5';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "price-source-badge",
        "data-source": source,
        "aria-label": `Price source: ${label}`,
        className: `inline-flex items-center ${gap} ${textSize} ${variant.textClass} ${className}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "data-testid": "price-source-dot",
                "aria-hidden": "true",
                className: `${dotSize} rounded-full ${variant.dotClass} ${variant.animateClass ?? ''}`
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PriceSourceBadge.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: label
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PriceSourceBadge.tsx",
                lineNumber: 41,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/PriceSourceBadge.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
_c = PriceSourceBadge;
const VARIANTS = {
    'chain-oracle': {
        dotClass: 'bg-green-400',
        textClass: 'text-green-400',
        animateClass: 'animate-pulse'
    },
    'etoro-demo': {
        dotClass: 'bg-sky-400',
        textClass: 'text-sky-400'
    },
    'coingecko': {
        dotClass: 'bg-gray-400',
        textClass: 'text-gray-400'
    },
    'fallback': {
        dotClass: 'bg-yellow-400',
        textClass: 'text-yellow-400'
    },
    'stale': {
        dotClass: 'bg-amber-400',
        textClass: 'text-amber-400'
    },
    'closed': {
        dotClass: 'bg-gray-500',
        textClass: 'text-gray-400'
    },
    'unknown': {
        dotClass: 'bg-gray-600',
        textClass: 'text-gray-500'
    }
};
var _c;
__turbopack_context__.k.register(_c, "PriceSourceBadge");
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
"[project]/frontend/src/lib/useStockSources.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useStockSources",
    ()=>useStockSources
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockPrices$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useStockPrices.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceServiceStatus.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function useStockSources() {
    _s();
    const { sources: baseSources } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockPrices$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStockPrices"])();
    const { status } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceServiceStatus"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useStockSources.useMemo": ()=>{
            const out = {};
            for (const ticker of Object.keys(baseSources)){
                const base = baseSources[ticker] ?? 'fallback';
                const sq = status?.quotes.find({
                    "useStockSources.useMemo": (q)=>q.symbol === ticker
                }["useStockSources.useMemo"]);
                if (sq && (sq.sessionState === 'closed' || sq.sessionState === 'halted')) {
                    out[ticker] = 'closed';
                } else if (sq && sq.lastUpdateMs > 60_000 && base === 'chain-oracle') {
                    out[ticker] = 'stale';
                } else {
                    out[ticker] = base;
                }
            }
            return out;
        }
    }["useStockSources.useMemo"], [
        baseSources,
        status
    ]);
}
_s(useStockSources, "j3iWA81oMsKWJj5ChgGH/NMHG24=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockPrices$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStockPrices"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceServiceStatus"]
    ];
});
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
"[project]/frontend/src/lib/marketHours.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getMarketSession",
    ()=>getMarketSession
]);
const ET_OFFSET = -5;
function toET(utc) {
    const d = new Date(utc);
    d.setHours(d.getHours() + ET_OFFSET);
    return d;
}
function hhmm(d) {
    return d.getUTCHours() * 60 + d.getUTCMinutes();
}
const US_HOLIDAYS_2026 = [
    '2026-01-01',
    '2026-01-19',
    '2026-02-16',
    '2026-04-03',
    '2026-05-25',
    '2026-06-19',
    '2026-07-03',
    '2026-09-07',
    '2026-11-26',
    '2026-12-25'
];
function isUSHoliday(et) {
    const iso = `${et.getUTCFullYear()}-${String(et.getUTCMonth() + 1).padStart(2, '0')}-${String(et.getUTCDate()).padStart(2, '0')}`;
    return US_HOLIDAYS_2026.includes(iso);
}
function getMarketSession(now = new Date()) {
    const et = toET(now);
    const day = et.getUTCDay();
    const min = hhmm(et);
    const isWeekend = day === 0 || day === 6;
    const isHoliday = isUSHoliday(et);
    if (isWeekend || isHoliday) {
        return {
            label: 'Market Closed',
            state: 'closed',
            color: 'text-gray-400',
            dotColor: 'bg-gray-400',
            nextEventLabel: 'Opens Mon',
            nextEventDate: null
        };
    }
    const PRE_OPEN = 4 * 60;
    const OPEN = 9 * 60 + 30;
    const CLOSE = 16 * 60;
    const AFTER_CLOSE = 20 * 60;
    if (min >= OPEN && min < CLOSE) {
        return {
            label: 'Market Open',
            state: 'open',
            color: 'text-green-400',
            dotColor: 'bg-green-400',
            nextEventLabel: 'Closes 4:00 PM ET',
            nextEventDate: null
        };
    }
    if (min >= PRE_OPEN && min < OPEN) {
        return {
            label: 'Pre-Market',
            state: 'pre-market',
            color: 'text-yellow-400',
            dotColor: 'bg-yellow-400',
            nextEventLabel: 'Opens 9:30 AM ET',
            nextEventDate: null
        };
    }
    if (min >= CLOSE && min < AFTER_CLOSE) {
        return {
            label: 'After-Hours',
            state: 'after-hours',
            color: 'text-yellow-400',
            dotColor: 'bg-yellow-400',
            nextEventLabel: 'Closes 8:00 PM ET',
            nextEventDate: null
        };
    }
    return {
        label: 'Market Closed',
        state: 'closed',
        color: 'text-gray-400',
        dotColor: 'bg-gray-400',
        nextEventLabel: min < PRE_OPEN ? 'Pre-market 4:00 AM ET' : 'Opens tomorrow',
        nextEventDate: null
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/stocks/MarketSessionBadge.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MarketSessionBadge",
    ()=>MarketSessionBadge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$marketHours$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/marketHours.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function MarketSessionBadge() {
    _s();
    const [session, setSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$marketHours$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMarketSession"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MarketSessionBadge.useEffect": ()=>{
            const id = setInterval({
                "MarketSessionBadge.useEffect.id": ()=>setSession((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$marketHours$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMarketSession"])())
            }["MarketSessionBadge.useEffect.id"], 60_000);
            return ({
                "MarketSessionBadge.useEffect": ()=>clearInterval(id)
            })["MarketSessionBadge.useEffect"];
        }
    }["MarketSessionBadge.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "market-session-badge",
        className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${session.state === 'open' ? 'border-green-500/30 bg-green-500/10' : session.state === 'closed' ? 'border-gray-500/30 bg-gray-500/10' : 'border-yellow-500/30 bg-yellow-500/10'}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `w-1.5 h-1.5 rounded-full ${session.dotColor} ${session.state === 'open' ? 'animate-pulse' : ''}`
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/stocks/MarketSessionBadge.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: session.color,
                children: session.label
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/stocks/MarketSessionBadge.tsx",
                lineNumber: 30,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-gray-500 text-[10px] hidden sm:inline",
                children: [
                    "· ",
                    session.nextEventLabel
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/MarketSessionBadge.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/stocks/MarketSessionBadge.tsx",
        lineNumber: 15,
        columnNumber: 5
    }, this);
}
_s(MarketSessionBadge, "A2N2ahLf7VLAdph6OR1ZtffbA/A=");
_c = MarketSessionBadge;
var _c;
__turbopack_context__.k.register(_c, "MarketSessionBadge");
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
"[project]/frontend/src/components/ui/percentage-change.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PercentageChange",
    ()=>PercentageChange,
    "percentageChangeVariants",
    ()=>percentageChangeVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-client] (ecmascript)");
'use client';
;
;
;
;
const percentageChangeVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])('inline-flex items-center gap-1 font-medium transition-colors', {
    variants: {
        variant: {
            default: 'text-foreground',
            positive: 'text-green-400',
            negative: 'text-red-400',
            muted: 'text-muted-foreground',
            subtle: 'text-muted-foreground'
        },
        size: {
            xs: 'text-xs',
            sm: 'text-sm',
            md: 'text-base',
            lg: 'text-lg'
        },
        showIcon: {
            true: '',
            false: ''
        }
    },
    defaultVariants: {
        variant: 'default',
        size: 'sm',
        showIcon: true
    }
});
/**
 * Standardized percentage change component for financial data.
 *
 * Features:
 * - Automatic positive/negative styling and icons
 * - Configurable decimal precision
 * - Optional +/- sign display
 * - Consistent with design system
 * - Triangle icons for visual clarity
 * - Null-safe: renders "—" when value is null/undefined (data unavailable)
 *
 * Used across: GoodSwap, GoodStocks, GoodPredict, GoodPerps
 */ const PercentageChange = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ value, decimals = 2, showSign = false, showIcon = true, variant, size, className, unavailableLabel = 'Data unavailable', ...props }, ref)=>{
    // Unavailable (null/undefined) — render neutral placeholder with tooltip.
    if (value === null || value === undefined) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            ref: ref,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(percentageChangeVariants({
                variant: 'muted',
                size,
                showIcon: false
            }), className),
            title: unavailableLabel,
            "aria-label": unavailableLabel,
            ...props,
            children: "—"
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/ui/percentage-change.tsx",
            lineNumber: 80,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0));
    }
    // Auto-detect positive/negative variant if not specified
    const isPositive = value > 0;
    const isNegative = value < 0;
    const finalVariant = variant || (isPositive ? 'positive' : isNegative ? 'negative' : 'muted');
    const formattedValue = Math.abs(value).toFixed(decimals);
    const sign = showSign && value !== 0 ? isPositive ? '+' : '-' : '';
    const TriangleIcon = ({ direction })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: "w-2.5 h-2.5",
            fill: "currentColor",
            viewBox: "0 0 24 24",
            "aria-hidden": "true",
            children: direction === 'up' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 5l8 14H4L12 5z"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/percentage-change.tsx",
                lineNumber: 111,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 19L4 5h16L12 19z"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/percentage-change.tsx",
                lineNumber: 113,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/ui/percentage-change.tsx",
            lineNumber: 104,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(percentageChangeVariants({
            variant: finalVariant,
            size,
            showIcon
        }), className),
        ...props,
        children: [
            showIcon && value !== 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TriangleIcon, {
                direction: isPositive ? 'up' : 'down'
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/percentage-change.tsx",
                lineNumber: 125,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: [
                    sign,
                    formattedValue,
                    "%"
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/ui/percentage-change.tsx",
                lineNumber: 127,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/percentage-change.tsx",
        lineNumber: 119,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = PercentageChange;
PercentageChange.displayName = 'PercentageChange';
;
var _c, _c1;
__turbopack_context__.k.register(_c, "PercentageChange$forwardRef");
__turbopack_context__.k.register(_c1, "PercentageChange");
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
"[project]/frontend/src/lib/useStockWatchlist.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useStockWatchlist",
    ()=>useStockWatchlist
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
const STORAGE_KEY = 'goodswap-stock-watchlist';
function readFromStorage() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return new Set();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed.filter((t)=>typeof t === 'string'));
    } catch  {
    // corrupted data
    }
    return new Set();
}
function writeToStorage(favorites) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([
            ...favorites
        ]));
    } catch  {
    // storage full or unavailable
    }
}
function useStockWatchlist() {
    _s();
    const [favorites, setFavorites] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [hydrated, setHydrated] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useStockWatchlist.useEffect": ()=>{
            setFavorites(readFromStorage());
            setHydrated(true);
        }
    }["useStockWatchlist.useEffect"], []);
    const toggleFavorite = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useStockWatchlist.useCallback[toggleFavorite]": (ticker)=>{
            setFavorites({
                "useStockWatchlist.useCallback[toggleFavorite]": (prev)=>{
                    const next = new Set(prev);
                    if (next.has(ticker)) {
                        next.delete(ticker);
                    } else {
                        next.add(ticker);
                    }
                    writeToStorage(next);
                    return next;
                }
            }["useStockWatchlist.useCallback[toggleFavorite]"]);
        }
    }["useStockWatchlist.useCallback[toggleFavorite]"], []);
    const isFavorite = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useStockWatchlist.useCallback[isFavorite]": (ticker)=>{
            return favorites.has(ticker);
        }
    }["useStockWatchlist.useCallback[isFavorite]"], [
        favorites
    ]);
    return {
        favorites,
        toggleFavorite,
        isFavorite,
        hydrated
    };
}
_s(useStockWatchlist, "lXSv29Wzfr9uIFUS11aW89T3GNc=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/app/(app)/stocks/screenerQueryState.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_STOCKS_SCREENER_STATE",
    ()=>DEFAULT_STOCKS_SCREENER_STATE,
    "parseStocksScreenerState",
    ()=>parseStocksScreenerState,
    "serializeStocksScreenerState",
    ()=>serializeStocksScreenerState
]);
const DEFAULT_STOCKS_SCREENER_STATE = {
    query: '',
    sortField: 'marketCap',
    sortDir: 'desc',
    sectorFilter: 'all',
    capFilter: 'all',
    momentumFilter: 'all',
    liquidityFilter: 'all'
};
function isSortField(value) {
    return value === 'price' || value === 'change24h' || value === 'volume24h' || value === 'marketCap';
}
function isSortDir(value) {
    return value === 'asc' || value === 'desc';
}
function isCapFilter(value) {
    return value === 'all' || value === 'mega' || value === 'large' || value === 'mid';
}
function isMomentumFilter(value) {
    return value === 'all' || value === 'gainers' || value === 'losers';
}
function isLiquidityFilter(value) {
    return value === 'all' || value === 'active' || value === 'quiet';
}
function parseStocksScreenerState(searchParams) {
    const search = searchParams.get('search')?.trim() ?? '';
    const sector = searchParams.get('sector')?.trim() ?? '';
    const sortFieldParam = searchParams.get('sortField');
    const sortDirParam = searchParams.get('sortDir');
    const capParam = searchParams.get('cap');
    const momentumParam = searchParams.get('momentum');
    const liquidityParam = searchParams.get('liquidity');
    return {
        query: search,
        sortField: isSortField(sortFieldParam) ? sortFieldParam : DEFAULT_STOCKS_SCREENER_STATE.sortField,
        sortDir: isSortDir(sortDirParam) ? sortDirParam : DEFAULT_STOCKS_SCREENER_STATE.sortDir,
        sectorFilter: sector && sector !== 'all' ? sector : DEFAULT_STOCKS_SCREENER_STATE.sectorFilter,
        capFilter: isCapFilter(capParam) ? capParam : DEFAULT_STOCKS_SCREENER_STATE.capFilter,
        momentumFilter: isMomentumFilter(momentumParam) ? momentumParam : DEFAULT_STOCKS_SCREENER_STATE.momentumFilter,
        liquidityFilter: isLiquidityFilter(liquidityParam) ? liquidityParam : DEFAULT_STOCKS_SCREENER_STATE.liquidityFilter
    };
}
function serializeStocksScreenerState(state) {
    const params = new URLSearchParams();
    const query = state.query.trim();
    if (query) params.set('search', query);
    if (state.sectorFilter !== DEFAULT_STOCKS_SCREENER_STATE.sectorFilter) params.set('sector', state.sectorFilter);
    if (state.capFilter !== DEFAULT_STOCKS_SCREENER_STATE.capFilter) params.set('cap', state.capFilter);
    if (state.momentumFilter !== DEFAULT_STOCKS_SCREENER_STATE.momentumFilter) params.set('momentum', state.momentumFilter);
    if (state.liquidityFilter !== DEFAULT_STOCKS_SCREENER_STATE.liquidityFilter) params.set('liquidity', state.liquidityFilter);
    if (state.sortField !== DEFAULT_STOCKS_SCREENER_STATE.sortField) params.set('sortField', state.sortField);
    if (state.sortDir !== DEFAULT_STOCKS_SCREENER_STATE.sortDir) params.set('sortDir', state.sortDir);
    return params;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/app/(app)/stocks/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>StocksPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/shared/lib/app-dynamic.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainStocks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useOnChainStocks.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStocksRebalanceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useStocksRebalanceStatus.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$Sparkline$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/Sparkline.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$InfoBanner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/InfoBanner.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$StalePriceBanner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/StalePriceBanner.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$OracleStatusBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/OracleStatusBadge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/PriceSourceBadge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockSources$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useStockSources.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$WalletConnectConfigWarning$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/stocks/WalletConnectConfigWarning.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$MarketSessionBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/stocks/MarketSessionBadge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$WatchlistStarButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/stocks/WatchlistStarButton.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$percentage$2d$change$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/percentage-change.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$stock$2d$logo$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/stock-logo.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useMounted$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useMounted.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockWatchlist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useStockWatchlist.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$app$2f28$app$292f$stocks$2f$screenerQueryState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/app/(app)/stocks/screenerQueryState.ts [app-client] (ecmascript)");
;
;
;
var _s = __turbopack_context__.k.signature();
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
const MarketIntelligencePanel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx [app-client] (ecmascript, next/dynamic entry, async loader)").then((mod)=>mod.MarketIntelligencePanel), {
    loadableGenerated: {
        modules: [
            "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            "aria-label": "Loading market intelligence",
            className: "mb-4 rounded-2xl border border-gray-700/20 bg-dark-100 p-4 text-sm text-gray-400",
            children: "Loading market intelligence..."
        }, void 0, false, {
            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
            lineNumber: 39,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
});
_c = MarketIntelligencePanel;
const StocksRebalanceDashboard = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx [app-client] (ecmascript, next/dynamic entry, async loader)").then((mod)=>mod.StocksRebalanceDashboard), {
    loadableGenerated: {
        modules: [
            "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            "aria-label": "Loading rebalance diagnostics",
            className: "rounded-2xl border border-gray-700/20 bg-dark-100 p-4 text-sm text-gray-400",
            children: "Loading rebalance diagnostics..."
        }, void 0, false, {
            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
            lineNumber: 53,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
});
_c1 = StocksRebalanceDashboard;
function SortArrow({ active, dir }) {
    if (!active) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        className: "inline-block w-3 h-3 text-gray-600 ml-1",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        "aria-hidden": "true",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M8 9l4-4 4 4M16 15l-4 4-4-4"
        }, void 0, false, {
            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
            lineNumber: 66,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
        lineNumber: 65,
        columnNumber: 5
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        className: "inline-block w-3 h-3 text-goodgreen ml-1",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        "aria-hidden": "true",
        children: dir === 'asc' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M5 15l7-7 7 7"
        }, void 0, false, {
            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
            lineNumber: 72,
            columnNumber: 11
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
            lineNumber: 73,
            columnNumber: 11
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
        lineNumber: 70,
        columnNumber: 5
    }, this);
}
_c2 = SortArrow;
function StockIcon({ ticker }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$stock$2d$logo$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StockLogo"], {
        ticker: ticker,
        size: "sm"
    }, void 0, false, {
        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
        lineNumber: 79,
        columnNumber: 10
    }, this);
}
_c3 = StockIcon;
function StarButton({ active, onClick }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        onClick: onClick,
        className: "w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0",
        "aria-label": active ? 'Remove from watchlist' : 'Add to watchlist',
        children: active ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: "w-4 h-4 text-yellow-400",
            viewBox: "0 0 20 20",
            fill: "currentColor",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 92,
                columnNumber: 11
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
            lineNumber: 91,
            columnNumber: 9
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: "w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors",
            viewBox: "0 0 20 20",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 1.5,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 96,
                columnNumber: 11
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
            lineNumber: 95,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
        lineNumber: 84,
        columnNumber: 5
    }, this);
}
_c4 = StarButton;
const StockRow = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memo"])(function StockRow({ stock, idx, isLive, canIncreaseRisk, isFavorite, source, onToggleFavorite, onRowClick }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
        onClick: ()=>onRowClick(stock.ticker),
        className: `group border-b border-gray-700/10 hover:bg-white/[0.04] cursor-pointer transition-colors ${idx % 2 === 1 ? 'bg-dark-50/15' : ''}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "py-3 px-3 text-gray-500 text-right",
                children: idx + 1
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 120,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "py-3 px-2 w-10",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$WatchlistStarButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WatchlistStarButton"], {
                    ticker: stock.ticker,
                    size: "sm"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                    lineNumber: 122,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 121,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "py-3 px-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2.5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StarButton, {
                            active: isFavorite,
                            onClick: (e)=>{
                                e.stopPropagation();
                                onToggleFavorite(stock.ticker);
                            }
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                            lineNumber: 126,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StockIcon, {
                            ticker: stock.ticker
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                            lineNumber: 127,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "font-semibold text-white",
                                    children: stock.ticker
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                    lineNumber: 129,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-500 ml-1.5 text-xs truncate max-w-[120px] inline-block align-middle",
                                    children: stock.name
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                    lineNumber: 130,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                            lineNumber: 128,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                    lineNumber: 125,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 124,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "py-3 px-3 text-right text-white font-medium",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col items-end gap-0.5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            "data-testid": "price-cell",
                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockPrice"])(stock.price)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                            lineNumber: 136,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceSourceBadge"], {
                            source: source,
                            size: "sm"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                            lineNumber: 137,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                    lineNumber: 135,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 134,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "py-3 px-3 text-right font-medium",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$percentage$2d$change$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PercentageChange"], {
                    value: stock.change24h,
                    decimals: 2,
                    size: "sm"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                    lineNumber: 141,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 140,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "py-3 px-3 text-right text-gray-300 hidden sm:table-cell",
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatLargeNumber"])(stock.volume24h)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 143,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "py-3 px-3 text-right text-gray-300 hidden md:table-cell",
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatLargeNumber"])(stock.marketCap)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 146,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "py-3 px-2 hidden sm:table-cell",
                "aria-label": `7-day trend: ${stock.change24h >= 0 ? 'up' : 'down'} ${Math.abs(stock.change24h).toFixed(1)}%`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$Sparkline$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sparkline"], {
                    data: stock.sparkline7d,
                    positive: stock.change24h >= 0
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                    lineNumber: 150,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 149,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "py-3 px-1 text-right w-24 hidden sm:table-cell",
                children: isLive && canIncreaseRisk ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: (e)=>{
                        e.stopPropagation();
                        onRowClick(stock.ticker);
                    },
                    className: "px-3 py-1 text-xs font-semibold rounded-lg bg-goodgreen/15 text-goodgreen hover:bg-goodgreen/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50",
                    children: "Trade"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                    lineNumber: 154,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-end gap-1.5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
                            "aria-hidden": "true",
                            children: "Demo"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                            lineNumber: 162,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: (e)=>{
                                e.stopPropagation();
                                onRowClick(stock.ticker);
                            },
                            className: "px-3 py-1 text-xs font-semibold rounded-lg bg-dark-100 text-gray-300 border border-gray-700/40 hover:bg-dark-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/50",
                            "aria-label": `Preview ${stock.ticker} — ${isLive && !canIncreaseRisk ? 'sync pending' : 'demo data'}`,
                            children: "Trade"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                            lineNumber: 168,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                    lineNumber: 161,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 152,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
        lineNumber: 116,
        columnNumber: 5
    }, this);
});
_c5 = StockRow;
function StocksPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    const mounted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useMounted$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMounted"])();
    const initialScreenerState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StocksPage.useMemo[initialScreenerState]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$app$2f28$app$292f$stocks$2f$screenerQueryState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseStocksScreenerState"])(searchParams)
    }["StocksPage.useMemo[initialScreenerState]"], [
        searchParams
    ]);
    const [query, setQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialScreenerState.query);
    const [sortField, setSortField] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialScreenerState.sortField);
    const [sortDir, setSortDir] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialScreenerState.sortDir);
    const [sectorFilter, setSectorFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialScreenerState.sectorFilter);
    const [capFilter, setCapFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialScreenerState.capFilter);
    const [momentumFilter, setMomentumFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialScreenerState.momentumFilter);
    const [liquidityFilter, setLiquidityFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialScreenerState.liquidityFilter);
    const { stocks: data, isLoading, isLive } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainStocks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOnChainStocks"])();
    const stockSources = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockSources$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStockSources"])();
    const { favorites, toggleFavorite, isFavorite } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockWatchlist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStockWatchlist"])();
    const [watchlistActive, setWatchlistActive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isMobileViewport, setIsMobileViewport] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const rebalanceSymbols = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StocksPage.useMemo[rebalanceSymbols]": ()=>data.map({
                "StocksPage.useMemo[rebalanceSymbols]": (stock)=>stock.ticker
            }["StocksPage.useMemo[rebalanceSymbols]"])
    }["StocksPage.useMemo[rebalanceSymbols]"], [
        data
    ]);
    const { data: rebalanceStatus, isLoading: rebalanceLoading, error: rebalanceError, bySymbol: rebalanceBySymbol } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStocksRebalanceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStocksRebalanceStatus"])(rebalanceSymbols);
    const sectors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StocksPage.useMemo[sectors]": ()=>Array.from(new Set(data.map({
                "StocksPage.useMemo[sectors]": (stock)=>stock.sector
            }["StocksPage.useMemo[sectors]"]).filter(Boolean))).sort({
                "StocksPage.useMemo[sectors]": (a, b)=>a.localeCompare(b)
            }["StocksPage.useMemo[sectors]"])
    }["StocksPage.useMemo[sectors]"], [
        data
    ]);
    const handleSort = (field)=>{
        if (sortField === field) {
            setSortDir((d)=>d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };
    const filtered = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StocksPage.useMemo[filtered]": ()=>{
            let stocks = data;
            if (watchlistActive) {
                stocks = stocks.filter({
                    "StocksPage.useMemo[filtered]": (s)=>favorites.has(s.ticker)
                }["StocksPage.useMemo[filtered]"]);
            }
            const trimmed = query.trim();
            if (trimmed) {
                const q = trimmed.toLowerCase();
                stocks = stocks.filter({
                    "StocksPage.useMemo[filtered]": (s)=>s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
                }["StocksPage.useMemo[filtered]"]);
            }
            if (sectorFilter !== 'all') {
                stocks = stocks.filter({
                    "StocksPage.useMemo[filtered]": (s)=>s.sector === sectorFilter
                }["StocksPage.useMemo[filtered]"]);
            }
            if (capFilter !== 'all') {
                stocks = stocks.filter({
                    "StocksPage.useMemo[filtered]": (s)=>{
                        if (capFilter === 'mega') return s.marketCap >= 200_000_000_000;
                        if (capFilter === 'large') return s.marketCap >= 10_000_000_000 && s.marketCap < 200_000_000_000;
                        return s.marketCap >= 2_000_000_000 && s.marketCap < 10_000_000_000;
                    }
                }["StocksPage.useMemo[filtered]"]);
            }
            if (momentumFilter !== 'all') {
                stocks = stocks.filter({
                    "StocksPage.useMemo[filtered]": (s)=>momentumFilter === 'gainers' ? s.change24h >= 0 : s.change24h < 0
                }["StocksPage.useMemo[filtered]"]);
            }
            if (liquidityFilter !== 'all') {
                stocks = stocks.filter({
                    "StocksPage.useMemo[filtered]": (s)=>liquidityFilter === 'active' ? s.volume24h >= 50_000_000 : s.volume24h < 50_000_000
                }["StocksPage.useMemo[filtered]"]);
            }
            return [
                ...stocks
            ].sort({
                "StocksPage.useMemo[filtered]": (a, b)=>{
                    const mul = sortDir === 'asc' ? 1 : -1;
                    return (a[sortField] - b[sortField]) * mul;
                }
            }["StocksPage.useMemo[filtered]"]);
        }
    }["StocksPage.useMemo[filtered]"], [
        data,
        query,
        sortField,
        sortDir,
        sectorFilter,
        capFilter,
        momentumFilter,
        liquidityFilter,
        watchlistActive,
        favorites
    ]);
    const activeFilterCount = Number(sectorFilter !== 'all') + Number(capFilter !== 'all') + Number(momentumFilter !== 'all') + Number(liquidityFilter !== 'all');
    const hasSearchQuery = query.trim().length > 0;
    const hasActiveFilters = activeFilterCount > 0;
    const screenerQueryString = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StocksPage.useMemo[screenerQueryString]": ()=>{
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$app$2f28$app$292f$stocks$2f$screenerQueryState$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serializeStocksScreenerState"])({
                query,
                sortField,
                sortDir,
                sectorFilter,
                capFilter,
                momentumFilter,
                liquidityFilter
            }).toString();
        }
    }["StocksPage.useMemo[screenerQueryString]"], [
        query,
        sortField,
        sortDir,
        sectorFilter,
        capFilter,
        momentumFilter,
        liquidityFilter
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StocksPage.useEffect": ()=>{
            const current = searchParams.toString();
            if (current === screenerQueryString) return;
            const nextUrl = screenerQueryString ? `${pathname}?${screenerQueryString}` : pathname;
            router.replace(nextUrl, {
                scroll: false
            });
        }
    }["StocksPage.useEffect"], [
        pathname,
        router,
        screenerQueryString,
        searchParams
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StocksPage.useEffect": ()=>{
            const mediaQuery = window.matchMedia('(max-width: 639px)');
            const updateViewport = {
                "StocksPage.useEffect.updateViewport": ()=>setIsMobileViewport(mediaQuery.matches)
            }["StocksPage.useEffect.updateViewport"];
            updateViewport();
            mediaQuery.addEventListener('change', updateViewport);
            return ({
                "StocksPage.useEffect": ()=>mediaQuery.removeEventListener('change', updateViewport)
            })["StocksPage.useEffect"];
        }
    }["StocksPage.useEffect"], []);
    const clearAllFilters = ()=>{
        setSectorFilter('all');
        setCapFilter('all');
        setMomentumFilter('all');
        setLiquidityFilter('all');
    };
    const clearEmptyStateConstraints = ()=>{
        if (watchlistActive) setWatchlistActive(false);
        if (hasSearchQuery) setQuery('');
        if (hasActiveFilters) clearAllFilters();
    };
    const emptyStateMessage = watchlistActive && favorites.size === 0 ? 'Your watchlist is empty. Star a stock to add it here.' : watchlistActive ? 'No watchlist stocks match your filters.' : hasSearchQuery && hasActiveFilters ? 'No stocks match your search and filters.' : hasActiveFilters ? 'No stocks match your current filters.' : hasSearchQuery ? `No matches for “${query.trim()}”.` : 'No stocks available right now.';
    const emptyStateActionLabel = watchlistActive && favorites.size === 0 ? 'Show all stocks' : watchlistActive ? 'Show all stocks' : hasSearchQuery && hasActiveFilters ? 'Clear search & filters' : hasActiveFilters ? 'Clear filters' : hasSearchQuery ? 'Clear search' : null;
    const pushTickerRoute = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "StocksPage.useCallback[pushTickerRoute]": (ticker)=>{
            const next = screenerQueryString ? `/stocks/${ticker}?${screenerQueryString}` : `/stocks/${ticker}`;
            router.push(next);
        }
    }["StocksPage.useCallback[pushTickerRoute]"], [
        router,
        screenerQueryString
    ]);
    const handleRowClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "StocksPage.useCallback[handleRowClick]": (ticker)=>{
            pushTickerRoute(ticker);
        }
    }["StocksPage.useCallback[handleRowClick]"], [
        pushTickerRoute
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-5xl mx-auto min-h-screen bg-dark-200 pb-24 md:pr-24 space-y-5 sm:space-y-0",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-5 sm:mb-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-3 mb-1",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-9 h-9 rounded-xl bg-goodgreen/10 border border-goodgreen/20 flex items-center justify-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-5 h-5 text-goodgreen",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 1.5,
                                    d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                    lineNumber: 338,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                lineNumber: 337,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                            lineNumber: 336,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3 flex-wrap",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                            className: "text-2xl font-bold text-white",
                                            children: "Tokenized Stocks"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 343,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$MarketSessionBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MarketSessionBadge"], {}, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 344,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                    lineNumber: 342,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-400",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "Trade synthetic equities 24/7 with fractional shares"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 346,
                                            columnNumber: 50
                                        }, this),
                                        ". Every trade funds UBI."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                    lineNumber: 346,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                            lineNumber: 341,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                    lineNumber: 335,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 334,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-2 sm:mb-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$InfoBanner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InfoBanner"], {
                    title: "How Tokenized Stocks Work",
                    description: "Synthetic stock tokens track real equity prices via StockOracleV2 multi-signer oracles. Trade 24/7 with fractional amounts starting at $1. Every trade routes 33% of fees to UBI.",
                    storageKey: "gd-banner-dismissed-stocks"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                    lineNumber: 352,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 351,
                columnNumber: 7
            }, this),
            !isLive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$StalePriceBanner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StalePriceBanner"], {
                    variant: "stocks"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                    lineNumber: 361,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 360,
                columnNumber: 9
            }, this),
            !address && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$stocks$2f$WalletConnectConfigWarning$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletConnectConfigWarning"], {
                        className: "mb-2 sm:mb-4"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                        lineNumber: 367,
                        columnNumber: 11
                    }, this),
                    isLive ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-2 sm:mb-4 p-3 sm:p-4 md:p-5 rounded-2xl border border-goodgreen/25 bg-gradient-to-r from-goodgreen/10 to-goodgreen/5",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-base sm:text-lg font-semibold text-white",
                                            children: "Connect Wallet to Trade Stocks"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 372,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs sm:text-sm text-gray-300 mt-1",
                                            children: "Get started in under a minute: connect wallet, pick a stock, place your first buy or sell order."
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 373,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[11px] sm:text-xs text-gray-400 mt-2",
                                            children: "1. Connect wallet  2. Select stock  3. Tap Trade"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 374,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                    lineNumber: 371,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>pushTickerRoute(data[0]?.ticker || 'AAPL'),
                                    className: "shrink-0 px-4 py-2.5 rounded-xl bg-goodgreen text-dark-900 font-semibold text-sm hover:brightness-110 transition",
                                    children: "Connect Wallet to Trade Stocks"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                    lineNumber: 376,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                            lineNumber: 370,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                        lineNumber: 369,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-2 sm:mb-4 p-3 sm:p-4 md:p-5 rounded-2xl border border-yellow-500/25 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                    className: "text-base sm:text-lg font-semibold text-white",
                                                    children: "Stocks Oracle in Demo Mode"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                                    lineNumber: 389,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
                                                    "aria-hidden": "true",
                                                    children: "Demo"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                                    lineNumber: 390,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 388,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs sm:text-sm text-gray-300 mt-1",
                                            children: "The on-chain stocks oracle isn't live yet. You can preview the trading experience, but orders cannot be placed."
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 397,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[11px] sm:text-xs text-gray-400 mt-2",
                                            children: "Preview a stock to see the trade UI. Trading will unlock once the oracle is reachable."
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 398,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                    lineNumber: 387,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>pushTickerRoute(data[0]?.ticker || 'AAPL'),
                                    className: "shrink-0 px-4 py-2.5 rounded-xl bg-dark-100 text-gray-200 border border-gray-700/40 font-semibold text-sm hover:bg-dark-50/40 transition",
                                    "aria-label": "Preview stocks demo",
                                    children: "Trade Stocks Demo"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                    lineNumber: 400,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                            lineNumber: 386,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                        lineNumber: 385,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MarketIntelligencePanel, {
                stocks: data,
                isLive: isLive,
                isLoading: isLoading,
                onSelectTicker: pushTickerRoute
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 413,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4 sm:mb-5 flex flex-col lg:flex-row lg:items-center gap-3 rounded-2xl border border-gray-700/20 bg-dark-100/35 p-3 sm:p-0 sm:border-0 sm:bg-transparent sm:rounded-none",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        placeholder: "Search stocks...",
                        value: query,
                        onChange: (e)=>setQuery(e.target.value),
                        disabled: !mounted,
                        className: "w-full sm:w-72 px-4 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-white placeholder:text-gray-500 text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:border-goodgreen/30 disabled:opacity-70 disabled:cursor-not-allowed"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                        lineNumber: 421,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setWatchlistActive((v)=>!v),
                        className: `shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${watchlistActive ? 'bg-yellow-400/15 border-yellow-400/30 text-yellow-400' : 'bg-dark-100 border-gray-700/30 text-gray-400 hover:text-gray-200 hover:border-gray-600/40'}`,
                        "aria-pressed": watchlistActive,
                        "aria-label": "Filter watchlist",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-4 h-4",
                                viewBox: "0 0 20 20",
                                fill: "currentColor",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                    lineNumber: 441,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                lineNumber: 440,
                                columnNumber: 11
                            }, this),
                            "Watchlist",
                            favorites.size > 0 ? ` (${favorites.size})` : ''
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                        lineNumber: 429,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                "aria-label": "Filter by sector",
                                className: "px-3 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-gray-200 text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50",
                                value: sectorFilter,
                                onChange: (e)=>setSectorFilter(e.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "all",
                                        children: "All sectors"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 452,
                                        columnNumber: 13
                                    }, this),
                                    sectors.map((sector)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: sector,
                                            children: sector
                                        }, sector, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 454,
                                            columnNumber: 15
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                lineNumber: 446,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                "aria-label": "Filter by market cap",
                                className: "px-3 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-gray-200 text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50",
                                value: capFilter,
                                onChange: (e)=>setCapFilter(e.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "all",
                                        children: "All caps"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 463,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "mega",
                                        children: "Mega cap"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 464,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "large",
                                        children: "Large cap"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 465,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "mid",
                                        children: "Mid cap"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 466,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                lineNumber: 457,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                "aria-label": "Filter by momentum",
                                className: "px-3 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-gray-200 text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50",
                                value: momentumFilter,
                                onChange: (e)=>setMomentumFilter(e.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "all",
                                        children: "All momentum"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 474,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "gainers",
                                        children: "Gainers"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 475,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "losers",
                                        children: "Losers"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 476,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                lineNumber: 468,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                "aria-label": "Filter by liquidity",
                                className: "px-3 py-2.5 rounded-xl bg-dark-100 border border-gray-700/30 text-gray-200 text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50",
                                value: liquidityFilter,
                                onChange: (e)=>setLiquidityFilter(e.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "all",
                                        children: "All liquidity"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 484,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "active",
                                        children: "High volume"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 485,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "quiet",
                                        children: "Lower volume"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 486,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                lineNumber: 478,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                        lineNumber: 445,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$OracleStatusBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OracleStatusBadge"], {
                        useStocksFallback: true
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                        lineNumber: 489,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 420,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StocksRebalanceDashboard, {
                    symbols: rebalanceStatus?.symbols ?? [],
                    isLoading: rebalanceLoading,
                    error: rebalanceError
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                    lineNumber: 492,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 491,
                columnNumber: 7
            }, this),
            activeFilterCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4 flex flex-wrap items-center gap-2",
                children: [
                    sectorFilter !== 'all' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-goodgreen/30 bg-goodgreen/10 text-goodgreen text-xs font-medium hover:bg-goodgreen/15",
                        onClick: ()=>setSectorFilter('all'),
                        children: [
                            "Sector: ",
                            sectorFilter,
                            " ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "aria-hidden": "true",
                                children: "x"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                lineNumber: 503,
                                columnNumber: 38
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                        lineNumber: 502,
                        columnNumber: 13
                    }, this),
                    capFilter !== 'all' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-goodgreen/30 bg-goodgreen/10 text-goodgreen text-xs font-medium hover:bg-goodgreen/15",
                        onClick: ()=>setCapFilter('all'),
                        children: [
                            "Cap: ",
                            capFilter,
                            " ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "aria-hidden": "true",
                                children: "x"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                lineNumber: 508,
                                columnNumber: 32
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                        lineNumber: 507,
                        columnNumber: 13
                    }, this),
                    momentumFilter !== 'all' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-goodgreen/30 bg-goodgreen/10 text-goodgreen text-xs font-medium hover:bg-goodgreen/15",
                        onClick: ()=>setMomentumFilter('all'),
                        children: [
                            "Momentum: ",
                            momentumFilter,
                            " ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "aria-hidden": "true",
                                children: "x"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                lineNumber: 513,
                                columnNumber: 42
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                        lineNumber: 512,
                        columnNumber: 13
                    }, this),
                    liquidityFilter !== 'all' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-goodgreen/30 bg-goodgreen/10 text-goodgreen text-xs font-medium hover:bg-goodgreen/15",
                        onClick: ()=>setLiquidityFilter('all'),
                        children: [
                            "Liquidity: ",
                            liquidityFilter,
                            " ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "aria-hidden": "true",
                                children: "x"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                lineNumber: 518,
                                columnNumber: 44
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                        lineNumber: 517,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "text-xs text-gray-300 hover:text-white underline underline-offset-2",
                        onClick: clearAllFilters,
                        children: "Clear all filters"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                        lineNumber: 521,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 500,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "sm:hidden space-y-2 mb-2",
                children: filtered.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "py-12 text-center text-gray-500 bg-dark-100 rounded-2xl border border-gray-700/20",
                    children: [
                        emptyStateMessage,
                        ' ',
                        emptyStateActionLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: clearEmptyStateConstraints,
                            className: "text-goodgreen underline",
                            children: emptyStateActionLabel
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                            lineNumber: 533,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                    lineNumber: 530,
                    columnNumber: 11
                }, this) : filtered.map((stock)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        onClick: ()=>handleRowClick(stock.ticker),
                        className: "bg-dark-100 rounded-xl border border-gray-700/20 px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-dark-50/30 transition-colors active:scale-[0.99]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StarButton, {
                                active: isFavorite(stock.ticker),
                                onClick: (e)=>{
                                    e.stopPropagation();
                                    toggleFavorite(stock.ticker);
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                lineNumber: 545,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StockIcon, {
                                ticker: stock.ticker
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                lineNumber: 546,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 min-w-0 overflow-hidden",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-1.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-semibold text-white text-sm truncate max-w-[52px]",
                                                children: stock.ticker
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                                lineNumber: 549,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-gray-500 text-xs truncate max-w-[84px]",
                                                children: stock.name
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                                lineNumber: 550,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 548,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 mt-0.5",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$Sparkline$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sparkline"], {
                                            data: stock.sparkline7d,
                                            positive: stock.change24h >= 0
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 553,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 552,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                lineNumber: 547,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-right shrink-0 w-[96px]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-white font-medium text-sm whitespace-nowrap",
                                        "data-testid": "price-cell",
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockPrice"])(stock.price)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 557,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs font-medium inline-flex justify-end w-full whitespace-nowrap",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$percentage$2d$change$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PercentageChange"], {
                                            value: stock.change24h,
                                            decimals: 2,
                                            size: "xs",
                                            showSign: true
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 559,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 558,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "inline-flex justify-end w-full mt-0.5",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceSourceBadge"], {
                                            source: stockSources[stock.ticker] ?? 'fallback',
                                            size: "sm"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 562,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 561,
                                        columnNumber: 17
                                    }, this),
                                    isLive && (rebalanceBySymbol[stock.ticker]?.riskIncreaseAllowed ?? true) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "inline-flex mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-goodgreen/10 text-goodgreen",
                                        children: "Tap to trade"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 565,
                                        columnNumber: 19
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "inline-flex mt-1 items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-dark-50/40 text-gray-300 border border-gray-700/40",
                                        "aria-label": isLive && rebalanceBySymbol[stock.ticker] && !rebalanceBySymbol[stock.ticker].riskIncreaseAllowed ? 'Sync pending — preview only' : 'Demo data — preview only',
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "px-1 py-0 rounded bg-yellow-500/10 text-yellow-400 text-[9px] border border-yellow-500/20",
                                                children: isLive ? 'Sync' : 'Demo'
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                                lineNumber: 575,
                                                columnNumber: 21
                                            }, this),
                                            "Tap to trade"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 569,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                lineNumber: 556,
                                columnNumber: 15
                            }, this)
                        ]
                    }, stock.ticker, true, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                        lineNumber: 540,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 528,
                columnNumber: 7
            }, this),
            !isMobileViewport && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "hidden sm:block bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "overflow-x-auto",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                        className: "w-full text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    className: "border-b border-gray-700/30 text-gray-400 bg-dark-50/25",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            scope: "col",
                                            className: "text-right py-3 px-3 font-semibold w-10",
                                            children: "#"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 594,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            scope: "col",
                                            className: "py-3 px-2 w-10",
                                            "aria-label": "Watchlist"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 595,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            scope: "col",
                                            className: "text-left py-3 px-3 font-semibold",
                                            children: "Stock"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 596,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            scope: "col",
                                            className: "text-right py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors",
                                            onClick: ()=>handleSort('price'),
                                            children: [
                                                "Price ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SortArrow, {
                                                    active: sortField === 'price',
                                                    dir: sortDir
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                                    lineNumber: 598,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 597,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            scope: "col",
                                            className: "text-right py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors",
                                            onClick: ()=>handleSort('change24h'),
                                            children: [
                                                "24h Change ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SortArrow, {
                                                    active: sortField === 'change24h',
                                                    dir: sortDir
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                                    lineNumber: 601,
                                                    columnNumber: 30
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 600,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            scope: "col",
                                            className: "text-right py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors hidden sm:table-cell",
                                            onClick: ()=>handleSort('volume24h'),
                                            children: [
                                                "Volume ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SortArrow, {
                                                    active: sortField === 'volume24h',
                                                    dir: sortDir
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                                    lineNumber: 604,
                                                    columnNumber: 26
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 603,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            scope: "col",
                                            className: "text-right py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors hidden md:table-cell",
                                            onClick: ()=>handleSort('marketCap'),
                                            children: [
                                                "Market Cap ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SortArrow, {
                                                    active: sortField === 'marketCap',
                                                    dir: sortDir
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                                    lineNumber: 607,
                                                    columnNumber: 30
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 606,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            scope: "col",
                                            className: "py-3 px-2 font-semibold hidden sm:table-cell",
                                            children: "7d Trend"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 609,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            scope: "col",
                                            className: "w-24 hidden sm:table-cell"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                            lineNumber: 610,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                    lineNumber: 593,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                lineNumber: 592,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                children: filtered.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        colSpan: 9,
                                        className: "py-12 text-center text-gray-500",
                                        children: [
                                            emptyStateMessage,
                                            ' ',
                                            emptyStateActionLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: clearEmptyStateConstraints,
                                                className: "text-goodgreen underline",
                                                children: emptyStateActionLabel
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                                lineNumber: 619,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 616,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                    lineNumber: 615,
                                    columnNumber: 17
                                }, this) : filtered.map((stock, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StockRow, {
                                        stock: stock,
                                        idx: idx,
                                        isLive: isLive,
                                        canIncreaseRisk: rebalanceBySymbol[stock.ticker]?.riskIncreaseAllowed ?? true,
                                        isFavorite: isFavorite(stock.ticker),
                                        source: stockSources[stock.ticker] ?? 'fallback',
                                        onToggleFavorite: toggleFavorite,
                                        onRowClick: handleRowClick
                                    }, stock.ticker, false, {
                                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                        lineNumber: 627,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                                lineNumber: 613,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                        lineNumber: 591,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                    lineNumber: 590,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 589,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-gray-600 text-center mt-4",
                children: isLive ? 'Prices sourced from on-chain oracle. Updated on every block.' : 'Prices sourced from on-chain oracle when live. Showing demo data — stocks oracle is not reachable, so prices below are illustrative only and cannot be traded.'
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
                lineNumber: 646,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/stocks/page.tsx",
        lineNumber: 333,
        columnNumber: 5
    }, this);
}
_s(StocksPage, "NKdlakMjzwPlZeatsIiAblyyWyQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useMounted$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMounted"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainStocks$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOnChainStocks"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockSources$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStockSources"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStockWatchlist$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStockWatchlist"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useStocksRebalanceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useStocksRebalanceStatus"]
    ];
});
_c6 = StocksPage;
var _c, _c1, _c2, _c3, _c4, _c5, _c6;
__turbopack_context__.k.register(_c, "MarketIntelligencePanel");
__turbopack_context__.k.register(_c1, "StocksRebalanceDashboard");
__turbopack_context__.k.register(_c2, "SortArrow");
__turbopack_context__.k.register(_c3, "StockIcon");
__turbopack_context__.k.register(_c4, "StarButton");
__turbopack_context__.k.register(_c5, "StockRow");
__turbopack_context__.k.register(_c6, "StocksPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_src_0laa_sq._.js.map