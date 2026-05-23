(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/lib/perpsData.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * perpsData.ts — Types and formatting utilities for GoodPerps.
 *
 * MOCK DATA REMOVED — all data now comes from on-chain hooks:
 *   - useOnChainPairs() for perpetual market listings
 *   - useOnChainPositions() for open positions
 *   - useOnChainAccountSummary() for account balance/margin
 *   - usePerps hooks for trade execution
 *
 * This file retains types and formatting functions used by components.
 */ // ─── Types ────────────────────────────────────────────────────────────────────
__turbopack_context__.s([
    "formatFundingRate",
    ()=>formatFundingRate,
    "formatLargeValue",
    ()=>formatLargeValue,
    "formatPerpsPrice",
    ()=>formatPerpsPrice,
    "getAccountSummary",
    ()=>getAccountSummary,
    "getFundingCountdown",
    ()=>getFundingCountdown,
    "getFundingPayments",
    ()=>getFundingPayments,
    "getLeaderboard",
    ()=>getLeaderboard,
    "getOpenPositions",
    ()=>getOpenPositions,
    "getPairBySymbol",
    ()=>getPairBySymbol,
    "getPairs",
    ()=>getPairs,
    "getPendingOrders",
    ()=>getPendingOrders,
    "getTradeHistory",
    ()=>getTradeHistory
]);
// ─── Formatting ───────────────────────────────────────────────────────────────
const PRICE_TIERS = [
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
function formatPerpsPrice(price) {
    if (price === 0) return '$0.00';
    const abs = Math.abs(price);
    const sign = price < 0 ? '-' : '';
    for (const [threshold, suffix] of PRICE_TIERS){
        if (abs >= threshold) {
            const abbr = abs / threshold;
            const decimals = abbr >= 100 ? 0 : abbr >= 10 ? 1 : 2;
            return `${sign}$${abbr.toFixed(decimals)}${suffix}`;
        }
    }
    if (abs >= 1000) return `${sign}$${abs.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
    if (abs >= 1) return `${sign}$${abs.toFixed(2)}`;
    if (abs >= 0.01) return `${sign}$${abs.toFixed(4)}`;
    return `${sign}$${abs.toFixed(6)}`;
}
function formatLargeValue(n) {
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    for (const [threshold, suffix] of PRICE_TIERS){
        if (abs >= threshold) {
            const abbr = abs / threshold;
            const decimals = abbr >= 100 ? 0 : abbr >= 10 ? 1 : 2;
            return `${sign}$${abbr.toFixed(decimals)}${suffix}`;
        }
    }
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
    return `${sign}$${abs.toFixed(2)}`;
}
function formatFundingRate(rate) {
    return `${rate >= 0 ? '+' : ''}${(rate * 100).toFixed(4)}%`;
}
function getFundingCountdown(nextTime) {
    const diff = Math.max(0, nextTime - Date.now());
    const hours = Math.floor(diff / (3600 * 1000));
    const minutes = Math.floor(diff % (3600 * 1000) / (60 * 1000));
    return `${hours}h ${minutes}m`;
}
function getPairs() {
    return [];
}
function getPairBySymbol(_symbol) {
    return undefined;
}
function getAccountSummary() {
    return {
        balance: 0,
        equity: 0,
        unrealizedPnl: 0,
        marginUsed: 0,
        availableMargin: 0,
        marginRatio: 0
    };
}
function getOpenPositions() {
    return [];
}
function getPendingOrders() {
    return [];
}
function getTradeHistory() {
    return [];
}
function getFundingPayments() {
    return [];
}
function getLeaderboard() {
    return [];
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/usePerpsHistory.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useFundingPayments",
    ()=>useFundingPayments,
    "useLeaderboard",
    ()=>useLeaderboard,
    "useOracleMarkPrices",
    ()=>useOracleMarkPrices,
    "useTradeHistory",
    ()=>useTradeHistory
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * usePerpsHistory — reads perps trade history, funding payments, and leaderboard
 * from the GoodDollar L2 indexer API and on-chain PerpPriceOracle.
 *
 * The indexer (backend/indexer) stores PositionOpened, PositionClosed,
 * FundingApplied, and PositionLiquidated events. We query its REST API
 * and transform them into the types expected by the portfolio page.
 *
 * Also exports useOracleMarkPrices() which reads mark prices from PerpPriceOracle.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContracts.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-client] (ecmascript) <locals>");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature();
'use client';
;
;
;
// ─── Config ───────────────────────────────────────────────────────────────────
// Public indexer URL. MUST be a public origin in production; if unset we treat
// the indexer as unavailable and short-circuit to empty results rather than
// shipping a `localhost:NNNN` literal into the production client bundle (where
// it would either CORS-fail or, worse, be blocked as mixed content). For local
// development, set NEXT_PUBLIC_INDEXER_URL=http://localhost:4200 in
// frontend/.env.local. See docs/testnet/iter12-frontend-env-freeze.md.
const INDEXER_URL = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_INDEXER_URL || '';
// Market oracle keys (keccak256 of ticker string) — used for oracle reads
// Market ordering matches PerpEngine.markets[] array (verified via on-chain reads)
const MARKET_ORACLE_KEYS = {
    0: {
        key: '0xaaaebeba3810b1e6b70781f14b2d72c1cb89c0b2b320c43bb67ff79f562f5ff4',
        symbol: 'ETH-USD'
    },
    1: {
        key: '0xe98e2830be1a7e4156d656a7505e65d08c67660dc618072422e9c78053c261e9',
        symbol: 'BTC-USD'
    },
    2: {
        key: '0x0a3ec4fc70eaf64faf6eeda4e9b2bd4742a785464053aa23afad8bd24650e86f',
        symbol: 'SOL-USD'
    },
    3: {
        key: '0x3ed03c38e59dc60c7b69c2a4bf68f9214acd953252b5a90e8f5f59583e9bc3ae',
        symbol: 'BNB-USD'
    },
    4: {
        key: '0xa6a7de01e8b7ba6a4a61c782a73188d808fc1f3cf5743fadb68a02ed884b594f',
        symbol: 'MATIC-USD'
    },
    5: {
        key: '0xc07524b7a4eecc2784fc7ac17ff2730f877f3cf7a2ceb4e2375fa40a103115d0',
        symbol: 'ARB-USD'
    }
};
// Minimal ABI for PerpPriceOracle reads
const PerpPriceOracleABI = [
    {
        name: 'getMarkPrice',
        inputs: [
            {
                name: 'key',
                type: 'bytes32'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        name: 'getIndexPrice',
        inputs: [
            {
                name: 'key',
                type: 'bytes32'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const ORACLE = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].PerpPriceOracle;
function useOracleMarkPrices(marketCount) {
    _s();
    const contracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useOracleMarkPrices.useMemo[contracts]": ()=>{
            const list = [];
            for(let i = 0; i < marketCount; i++){
                const m = MARKET_ORACLE_KEYS[i];
                if (!m || m.key === '0x0000000000000000000000000000000000000000000000000000000000000000') continue;
                list.push({
                    address: ORACLE,
                    abi: PerpPriceOracleABI,
                    functionName: 'getMarkPrice',
                    args: [
                        m.key
                    ]
                });
                list.push({
                    address: ORACLE,
                    abi: PerpPriceOracleABI,
                    functionName: 'getIndexPrice',
                    args: [
                        m.key
                    ]
                });
            }
            return list;
        }
    }["useOracleMarkPrices.useMemo[contracts]"], [
        marketCount
    ]);
    const { data, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts,
        query: {
            enabled: contracts.length > 0,
            refetchInterval: 10_000,
            retry: false
        }
    });
    const { markPrices, indexPrices } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useOracleMarkPrices.useMemo": ()=>{
            const mark = {};
            const index = {};
            if (!data) return {
                markPrices: mark,
                indexPrices: index
            };
            let dataIdx = 0;
            for(let i = 0; i < Math.min(marketCount, Object.keys(MARKET_ORACLE_KEYS).length); i++){
                const m = MARKET_ORACLE_KEYS[i];
                if (!m || m.key === '0x0000000000000000000000000000000000000000000000000000000000000000') continue;
                const markResult = data[dataIdx];
                const indexResult = data[dataIdx + 1];
                dataIdx += 2;
                if (markResult?.status === 'success' && markResult.result) {
                    mark[i] = Number(markResult.result) / 1e8;
                }
                if (indexResult?.status === 'success' && indexResult.result) {
                    index[i] = Number(indexResult.result) / 1e8;
                }
            }
            return {
                markPrices: mark,
                indexPrices: index
            };
        }
    }["useOracleMarkPrices.useMemo"], [
        data,
        marketCount
    ]);
    return {
        markPrices,
        indexPrices,
        isLoading
    };
}
_s(useOracleMarkPrices, "O9vxWlpYHtUQ4EvJyBf5OPz8gnE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"]
    ];
});
async function fetchIndexerEvents(protocol, eventName, limit = 100) {
    // No indexer URL configured → treat as unavailable. Callers already render
    // empty-state UI for empty arrays, so this is safe and avoids spurious
    // CORS/network errors in the browser console.
    if (!INDEXER_URL) return [];
    try {
        const params = new URLSearchParams({
            limit: String(limit)
        });
        if (eventName) params.set('event', eventName);
        const url = `${INDEXER_URL}/api/events/${protocol}?${params}`;
        const res = await fetch(url, {
            next: {
                revalidate: 15
            }
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.ok ? json.data : [];
    } catch  {
        return [];
    }
}
// Map marketId → symbol
const MARKET_SYMBOLS = {
    0: 'ETH-USD',
    1: 'BTC-USD',
    2: 'SOL-USD',
    3: 'BNB-USD',
    4: 'MATIC-USD',
    5: 'ARB-USD'
};
function useTradeHistory() {
    _s1();
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    const [trades, setTrades] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useTradeHistory.useEffect": ()=>{
            if (!address) {
                setTrades([]);
                setIsLoading(false);
                return;
            }
            let cancelled = false;
            async function load() {
                setIsLoading(true);
                // Fetch PositionClosed (completed trades) and PositionOpened (entry info)
                // in parallel. Both are independent reads against the same indexer
                // endpoint; serializing them was an unnecessary waterfall that doubled
                // the Trades-tab load latency. fetchIndexerEvents already returns [] on
                // failure, so Promise.all here cannot reject.
                const [closedEvents, openedEvents] = await Promise.all([
                    fetchIndexerEvents('perps', 'PositionClosed', 200),
                    fetchIndexerEvents('perps', 'PositionOpened', 200)
                ]);
                if (cancelled) return;
                const userAddr = address.toLowerCase();
                // Build a map of opened events by tx hash for cross-reference
                const openedByKey = new Map();
                for (const ev of openedEvents){
                    const trader = String(ev.args.trader || '').toLowerCase();
                    const mktId = Number(ev.args.marketId ?? 0);
                    if (trader === userAddr) {
                        openedByKey.set(`${trader}-${mktId}`, ev);
                    }
                }
                // Map closed events to TradeHistoryRecord
                const records = closedEvents.filter({
                    "useTradeHistory.useEffect.load.records": (ev)=>String(ev.args.trader || '').toLowerCase() === userAddr
                }["useTradeHistory.useEffect.load.records"]).map({
                    "useTradeHistory.useEffect.load.records": (ev, idx)=>{
                        const mktId = Number(ev.args.marketId ?? 0);
                        const pnl = Number(ev.args.pnl ?? 0) / 1e18;
                        const exitPrice = Number(ev.args.exitPrice ?? 0) / 1e8;
                        const opened = openedByKey.get(`${userAddr}-${mktId}`);
                        const entryPrice = opened ? Number(opened.args.entryPrice ?? 0) / 1e8 : exitPrice;
                        const size = opened ? Number(opened.args.size ?? 0) / 1e18 : 0;
                        const isLong = opened ? Boolean(opened.args.isLong) : true;
                        const notional = size * entryPrice;
                        const fee = notional * 0.001 // 0.1% fee
                        ;
                        return {
                            id: ev.tx_hash.slice(0, 10) + '-' + idx,
                            pair: MARKET_SYMBOLS[mktId] ?? `MKT-${mktId}`,
                            side: isLong ? 'long' : 'short',
                            type: 'market',
                            size,
                            price: exitPrice || entryPrice,
                            fee,
                            pnl,
                            timestamp: ev.timestamp * 1000
                        };
                    }
                }["useTradeHistory.useEffect.load.records"]);
                // Also include open events as "entry" trades for visibility
                const entryRecords = openedEvents.filter({
                    "useTradeHistory.useEffect.load.entryRecords": (ev)=>String(ev.args.trader || '').toLowerCase() === userAddr
                }["useTradeHistory.useEffect.load.entryRecords"]).map({
                    "useTradeHistory.useEffect.load.entryRecords": (ev, idx)=>{
                        const mktId = Number(ev.args.marketId ?? 0);
                        const entryPrice = Number(ev.args.entryPrice ?? 0) / 1e8;
                        const size = Number(ev.args.size ?? 0) / 1e18;
                        const isLong = Boolean(ev.args.isLong);
                        const notional = size * entryPrice;
                        const fee = notional * 0.001;
                        return {
                            id: 'open-' + ev.tx_hash.slice(0, 10) + '-' + idx,
                            pair: MARKET_SYMBOLS[mktId] ?? `MKT-${mktId}`,
                            side: isLong ? 'long' : 'short',
                            type: 'market',
                            size,
                            price: entryPrice,
                            fee,
                            pnl: 0,
                            timestamp: ev.timestamp * 1000
                        };
                    }
                }["useTradeHistory.useEffect.load.entryRecords"]);
                setTrades([
                    ...records,
                    ...entryRecords
                ].sort({
                    "useTradeHistory.useEffect.load": (a, b)=>b.timestamp - a.timestamp
                }["useTradeHistory.useEffect.load"]));
                setIsLoading(false);
            }
            load();
            // Refresh every 30 seconds
            const interval = setInterval(load, 30_000);
            return ({
                "useTradeHistory.useEffect": ()=>{
                    cancelled = true;
                    clearInterval(interval);
                }
            })["useTradeHistory.useEffect"];
        }
    }["useTradeHistory.useEffect"], [
        address
    ]);
    return {
        trades,
        isLoading
    };
}
_s1(useTradeHistory, "nS4+En+7LstI5Pq8i8lAHtWzj9E=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"]
    ];
});
function useFundingPayments() {
    _s2();
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    const [funding, setFunding] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useFundingPayments.useEffect": ()=>{
            if (!address) {
                setFunding([]);
                setIsLoading(false);
                return;
            }
            let cancelled = false;
            async function load() {
                setIsLoading(true);
                const events = await fetchIndexerEvents('perps', 'FundingApplied', 100);
                if (cancelled) return;
                // FundingApplied events are per-market, not per-user.
                // We show all funding events for markets the user has/had positions in.
                const payments = events.map({
                    "useFundingPayments.useEffect.load.payments": (ev)=>{
                        const mktId = Number(ev.args.marketId ?? 0);
                        const rate = Number(ev.args.rate ?? 0) / 1e18;
                        // Estimate user's funding payment based on rate (simplified)
                        // In production, we'd track per-position funding accumulation
                        const amount = rate * 100 // placeholder magnitude
                        ;
                        return {
                            pair: MARKET_SYMBOLS[mktId] ?? `MKT-${mktId}`,
                            amount,
                            rate,
                            timestamp: ev.timestamp * 1000
                        };
                    }
                }["useFundingPayments.useEffect.load.payments"]);
                setFunding(payments.sort({
                    "useFundingPayments.useEffect.load": (a, b)=>b.timestamp - a.timestamp
                }["useFundingPayments.useEffect.load"]));
                setIsLoading(false);
            }
            load();
            const interval = setInterval(load, 60_000);
            return ({
                "useFundingPayments.useEffect": ()=>{
                    cancelled = true;
                    clearInterval(interval);
                }
            })["useFundingPayments.useEffect"];
        }
    }["useFundingPayments.useEffect"], [
        address
    ]);
    return {
        funding,
        isLoading
    };
}
_s2(useFundingPayments, "/pfT0dvXgiPoA7yFaX2fBCWBZ2s=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"]
    ];
});
function useLeaderboard() {
    _s3();
    const [leaderboard, setLeaderboard] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useLeaderboard.useEffect": ()=>{
            let cancelled = false;
            async function load() {
                setIsLoading(true);
                const closedEvents = await fetchIndexerEvents('perps', 'PositionClosed', 500);
                if (cancelled) return;
                // Aggregate PnL per trader
                const traders = new Map();
                for (const ev of closedEvents){
                    const trader = String(ev.args.trader || '').toLowerCase();
                    const pnl = Number(ev.args.pnl ?? 0) / 1e18;
                    const mktId = Number(ev.args.marketId ?? 0);
                    if (!traders.has(trader)) {
                        traders.set(trader, {
                            pnl: 0,
                            wins: 0,
                            total: 0,
                            markets: new Set()
                        });
                    }
                    const t = traders.get(trader);
                    t.pnl += pnl;
                    t.total += 1;
                    if (pnl > 0) t.wins += 1;
                    t.markets.add(MARKET_SYMBOLS[mktId] ?? `MKT-${mktId}`);
                }
                const sorted = [
                    ...traders.entries()
                ].sort({
                    "useLeaderboard.useEffect.load.sorted": ([, a], [, b])=>b.pnl - a.pnl
                }["useLeaderboard.useEffect.load.sorted"]).slice(0, 20).map({
                    "useLeaderboard.useEffect.load.sorted": ([addr, data], i)=>({
                            rank: i + 1,
                            address: addr.slice(0, 6) + '...' + addr.slice(-4),
                            pnl: data.pnl,
                            winRate: data.total > 0 ? data.wins / data.total : 0,
                            totalTrades: data.total,
                            topPair: [
                                ...data.markets
                            ][0] || 'N/A'
                        })
                }["useLeaderboard.useEffect.load.sorted"]);
                setLeaderboard(sorted);
                setIsLoading(false);
            }
            load();
            const interval = setInterval(load, 120_000);
            return ({
                "useLeaderboard.useEffect": ()=>{
                    cancelled = true;
                    clearInterval(interval);
                }
            })["useLeaderboard.useEffect"];
        }
    }["useLeaderboard.useEffect"], []);
    return {
        leaderboard,
        isLoading
    };
}
_s3(useLeaderboard, "shDvd2ed4Ktqwl9gi4SdUPytTAU=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/useOnChainPerps.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useOnChainAccountSummary",
    ()=>useOnChainAccountSummary,
    "useOnChainPairs",
    ()=>useOnChainPairs,
    "useOnChainPositions",
    ()=>useOnChainPositions
]);
/**
 * useOnChainPerps — reads perpetual futures data from PerpEngine + MarginVault on-chain.
 *
 * Replaces mock data from perpsData.ts with real contract reads.
 * Falls back to empty arrays when no on-chain data is available.
 *
 * PerpEngine (chain 42069): markets, positions, unrealized PnL
 * MarginVault: deposited margin balances
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContract.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContracts.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerpsHistory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePerpsHistory.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
// ─── Fallback demo pairs when on-chain data is unavailable ───────────────────
function derive24hHighLow(markPrice, change24h) {
    const swing = Math.abs(change24h) / 100 * 0.6;
    return {
        high24h: markPrice * (1 + swing),
        low24h: markPrice * (1 - swing)
    };
}
const FALLBACK_PAIRS = [
    {
        marketId: 0,
        symbol: 'BTC-USD',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        markPrice: 84250,
        indexPrice: 84200,
        change24h: 2.4,
        volume24h: 1_250_000_000,
        fundingRate: 0.0045,
        nextFundingTime: Date.now() + 4 * 3600000,
        openInterest: 890_000_000,
        maxLeverage: 100,
        ...derive24hHighLow(84250, 2.4)
    },
    {
        marketId: 1,
        symbol: 'ETH-USD',
        baseAsset: 'ETH',
        quoteAsset: 'USD',
        markPrice: 1820,
        indexPrice: 1818,
        change24h: -1.2,
        volume24h: 580_000_000,
        fundingRate: -0.0012,
        nextFundingTime: Date.now() + 4 * 3600000,
        openInterest: 420_000_000,
        maxLeverage: 50,
        ...derive24hHighLow(1820, -1.2)
    },
    {
        marketId: 2,
        symbol: 'SOL-USD',
        baseAsset: 'SOL',
        quoteAsset: 'USD',
        markPrice: 134.5,
        indexPrice: 134.2,
        change24h: 5.8,
        volume24h: 180_000_000,
        fundingRate: 0.0078,
        nextFundingTime: Date.now() + 4 * 3600000,
        openInterest: 95_000_000,
        maxLeverage: 25,
        ...derive24hHighLow(134.5, 5.8)
    },
    {
        marketId: 3,
        symbol: 'BNB-USD',
        baseAsset: 'BNB',
        quoteAsset: 'USD',
        markPrice: 608,
        indexPrice: 607,
        change24h: 0.8,
        volume24h: 45_000_000,
        fundingRate: 0.0015,
        nextFundingTime: Date.now() + 4 * 3600000,
        openInterest: 32_000_000,
        maxLeverage: 25,
        ...derive24hHighLow(608, 0.8)
    },
    {
        marketId: 5,
        symbol: 'ARB-USD',
        baseAsset: 'ARB',
        quoteAsset: 'USD',
        markPrice: 0.82,
        indexPrice: 0.819,
        change24h: -3.1,
        volume24h: 28_000_000,
        fundingRate: -0.0025,
        nextFundingTime: Date.now() + 4 * 3600000,
        openInterest: 18_000_000,
        maxLeverage: 20,
        ...derive24hHighLow(0.82, -3.1)
    }
];
const ENGINE = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].PerpEngine;
const VAULT = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].MarginVault;
const FUNDING_RATE = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].FundingRate;
const FUNDING_INTERVAL_MS = 8 * 3600 * 1000 // 8 hours fallback
;
// ─── Static market metadata (pairs the PerpEngine supports) ──────────────────
// The on-chain PerpEngine stores markets by ID with a bytes32 key.
// We map known market IDs to human-readable pair info.
// On-chain market ordering (DeployPerps.s.sol seed + keccak256 ticker keys):
//   Market 0: keccak256("BTC") → BTC-USD
//   Market 1: keccak256("ETH") → ETH-USD
const MARKET_META = {
    0: {
        symbol: 'BTC-USD',
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        maxLeverage: 100
    },
    1: {
        symbol: 'ETH-USD',
        baseAsset: 'ETH',
        quoteAsset: 'USD',
        maxLeverage: 50
    },
    2: {
        symbol: 'SOL-USD',
        baseAsset: 'SOL',
        quoteAsset: 'USD',
        maxLeverage: 25
    },
    3: {
        symbol: 'BNB-USD',
        baseAsset: 'BNB',
        quoteAsset: 'USD',
        maxLeverage: 25
    },
    4: {
        symbol: 'MATIC-USD',
        baseAsset: 'MATIC',
        quoteAsset: 'USD',
        maxLeverage: 20
    },
    5: {
        symbol: 'ARB-USD',
        baseAsset: 'ARB',
        quoteAsset: 'USD',
        maxLeverage: 20
    }
};
function useOnChainPairs() {
    _s();
    const countResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: ENGINE,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerpEngineABI"],
        functionName: 'marketCount',
        query: {
            enabled: !!ENGINE,
            refetchInterval: 60_000,
            retry: false
        }
    });
    const count = Number(countResult.data ?? BigInt(0));
    const maxRead = Math.min(count, 10);
    const marketContracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useOnChainPairs.useMemo[marketContracts]": ()=>{
            if (maxRead === 0) return [];
            return Array.from({
                length: maxRead
            }, {
                "useOnChainPairs.useMemo[marketContracts]": (_, i)=>({
                        address: ENGINE,
                        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerpEngineABI"],
                        functionName: 'markets',
                        args: [
                            BigInt(i)
                        ]
                    })
            }["useOnChainPairs.useMemo[marketContracts]"]);
        }
    }["useOnChainPairs.useMemo[marketContracts]"], [
        maxRead
    ]);
    const fundingContracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useOnChainPairs.useMemo[fundingContracts]": ()=>{
            if (maxRead === 0) return [];
            return Array.from({
                length: maxRead
            }, {
                "useOnChainPairs.useMemo[fundingContracts]": (_, i)=>({
                        address: FUNDING_RATE,
                        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FundingRateABI"],
                        functionName: 'lastFundingTime',
                        args: [
                            BigInt(i)
                        ]
                    })
            }["useOnChainPairs.useMemo[fundingContracts]"]);
        }
    }["useOnChainPairs.useMemo[fundingContracts]"], [
        maxRead
    ]);
    const { data, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts: marketContracts,
        query: {
            enabled: maxRead > 0,
            refetchInterval: 30_000,
            retry: false
        }
    });
    const { data: fundingData } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts: fundingContracts,
        query: {
            enabled: maxRead > 0,
            refetchInterval: 60_000,
            retry: false
        }
    });
    // Read oracle prices for all active markets
    const { markPrices, indexPrices } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerpsHistory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOracleMarkPrices"])(maxRead);
    const pairs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useOnChainPairs.useMemo[pairs]": ()=>{
            if (!data || data.length === 0) return [];
            const result = [];
            for(let i = 0; i < data.length; i++){
                const r = data[i];
                if (r.status !== 'success' || !r.result) continue;
                const [, maxLeverage, isActive] = r.result;
                if (!isActive) continue;
                const meta = MARKET_META[i] ?? {
                    symbol: `MKT-${i}`,
                    baseAsset: `MKT${i}`,
                    quoteAsset: 'USD',
                    maxLeverage: 10
                };
                const lastFundingTime = fundingData?.[i]?.status === 'success' ? Number(fundingData[i].result) * 1000 // convert seconds to ms
                 : 0;
                const nextFundingTime = lastFundingTime > 0 ? lastFundingTime + FUNDING_INTERVAL_MS : Date.now() + FUNDING_INTERVAL_MS;
                const fallbackPair = FALLBACK_PAIRS.find({
                    "useOnChainPairs.useMemo[pairs].fallbackPair": (p)=>p.symbol === meta.symbol
                }["useOnChainPairs.useMemo[pairs].fallbackPair"]);
                const mark = markPrices[i] && markPrices[i] > 0 ? markPrices[i] : fallbackPair?.markPrice ?? 0;
                const index = indexPrices[i] && indexPrices[i] > 0 ? indexPrices[i] : fallbackPair?.indexPrice ?? mark;
                const change = fallbackPair?.change24h ?? 0;
                const hl = derive24hHighLow(mark, change);
                result.push({
                    marketId: i,
                    symbol: meta.symbol,
                    baseAsset: meta.baseAsset,
                    quoteAsset: meta.quoteAsset,
                    markPrice: mark,
                    indexPrice: index,
                    change24h: change,
                    volume24h: fallbackPair?.volume24h ?? 0,
                    fundingRate: fallbackPair?.fundingRate ?? 0,
                    nextFundingTime,
                    openInterest: fallbackPair?.openInterest ?? 0,
                    maxLeverage: Number(maxLeverage),
                    high24h: hl.high24h,
                    low24h: hl.low24h
                });
            }
            return result;
        }
    }["useOnChainPairs.useMemo[pairs]"], [
        data,
        fundingData,
        markPrices,
        indexPrices
    ]);
    const finalPairs = pairs.length > 0 ? pairs : FALLBACK_PAIRS;
    return {
        pairs: finalPairs,
        isLoading,
        isLive: pairs.length > 0
    };
}
_s(useOnChainPairs, "/uTs0U2N+fqinMi1IN7Xypfo9T0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerpsHistory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOracleMarkPrices"]
    ];
});
function useOnChainPositions() {
    _s1();
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    const { pairs } = useOnChainPairs();
    const { markPrices } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerpsHistory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOracleMarkPrices"])(pairs.length);
    const contracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useOnChainPositions.useMemo[contracts]": ()=>{
            if (!address || pairs.length === 0) return [];
            return pairs.flatMap({
                "useOnChainPositions.useMemo[contracts]": (pair)=>[
                        {
                            address: ENGINE,
                            abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerpEngineABI"],
                            functionName: 'positions',
                            args: [
                                address,
                                BigInt(pair.marketId)
                            ]
                        },
                        {
                            address: ENGINE,
                            abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerpEngineABI"],
                            functionName: 'unrealizedPnL',
                            args: [
                                address,
                                BigInt(pair.marketId)
                            ]
                        }
                    ]
            }["useOnChainPositions.useMemo[contracts]"]);
        }
    }["useOnChainPositions.useMemo[contracts]"], [
        address,
        pairs
    ]) // eslint-disable-line react-hooks/exhaustive-deps
    ;
    const { data, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts,
        query: {
            enabled: contracts.length > 0,
            refetchInterval: 10_000
        }
    });
    const positions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useOnChainPositions.useMemo[positions]": ()=>{
            if (!data || data.length === 0) return [];
            const result = [];
            for(let i = 0; i < pairs.length; i++){
                const pair = pairs[i];
                const posResult = data[i * 2];
                const pnlResult = data[i * 2 + 1];
                if (posResult?.status !== 'success' || !posResult.result) continue;
                const [isOpen, isLong, size, entryPrice, margin] = posResult.result;
                if (!isOpen || size === BigInt(0)) continue; // no position
                const pnl = pnlResult?.status === 'success' ? Number(pnlResult.result) / 1e18 : 0;
                const sizeFloat = Number(size) / 1e18;
                const entryFloat = Number(entryPrice) / 1e8;
                const collFloat = Number(margin) / 1e18;
                const leverage = collFloat > 0 ? Math.round(sizeFloat * entryFloat / collFloat) : 1;
                const mark = markPrices[pair.marketId] ?? entryFloat // oracle mark price, fallback to entry
                ;
                // Liquidation price estimate: entry ± (margin / size) adjusted by maintenance margin
                const marginPerUnit = collFloat > 0 ? collFloat / sizeFloat : 0;
                const maintenanceRatio = 0.02 // 2% maintenance margin
                ;
                const liqPrice = isLong ? entryFloat - marginPerUnit * (1 - maintenanceRatio) : entryFloat + marginPerUnit * (1 - maintenanceRatio);
                result.push({
                    pair: pair.symbol,
                    side: isLong ? 'long' : 'short',
                    size: sizeFloat,
                    leverage,
                    entryPrice: entryFloat,
                    markPrice: mark,
                    liquidationPrice: Math.max(0, liqPrice),
                    unrealizedPnl: pnl,
                    margin: collFloat,
                    marginMode: 'cross'
                });
            }
            return result;
        }
    }["useOnChainPositions.useMemo[positions]"], [
        data,
        pairs,
        markPrices
    ]);
    return {
        positions,
        isLoading
    };
}
_s1(useOnChainPositions, "ACpHKz5MkXfdYnR5w5OX+H7O7i8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"],
        useOnChainPairs,
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerpsHistory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOracleMarkPrices"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"]
    ];
});
function useOnChainAccountSummary() {
    _s2();
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    const { positions } = useOnChainPositions();
    const balResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: VAULT,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MarginVaultABI"],
        functionName: 'balances',
        args: address ? [
            address
        ] : undefined,
        query: {
            enabled: !!address,
            refetchInterval: 10_000,
            retry: false
        }
    });
    const summary = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useOnChainAccountSummary.useMemo[summary]": ()=>{
            const balance = balResult.data ? Number(balResult.data) / 1e18 : 0;
            const unrealizedPnl = positions.reduce({
                "useOnChainAccountSummary.useMemo[summary].unrealizedPnl": (sum, p)=>sum + p.unrealizedPnl
            }["useOnChainAccountSummary.useMemo[summary].unrealizedPnl"], 0);
            const equity = balance + unrealizedPnl;
            const marginUsed = positions.reduce({
                "useOnChainAccountSummary.useMemo[summary].marginUsed": (sum, p)=>sum + p.margin
            }["useOnChainAccountSummary.useMemo[summary].marginUsed"], 0);
            const availableMargin = Math.max(0, equity - marginUsed);
            const marginRatio = equity > 0 ? marginUsed / equity : 0;
            return {
                balance,
                equity,
                unrealizedPnl,
                marginUsed,
                availableMargin,
                marginRatio
            };
        }
    }["useOnChainAccountSummary.useMemo[summary]"], [
        balResult.data,
        positions
    ]);
    return {
        summary,
        isLoading: balResult.isLoading
    };
}
_s2(useOnChainAccountSummary, "pMTUaB9KJdA11SVBUU+snaYJz3s=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"],
        useOnChainPositions,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"]
    ];
});
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
"[project]/frontend/src/lib/perpsInput.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Defensive input bounding helpers for the /perps order form.
 *
 * The Size <AmountInput> on /perps had no upper bound on either typed
 * string length or numeric magnitude. Pasting a 21-digit value caused
 * (a) the digits to visually overlap the unit-symbol label inside the
 * input and (b) the Notional / Margin / Fee / → UBI summary rows to
 * render as compact-notation `$104.97Q` (quintillion), which reads as
 * a broken number rather than "this trade is impossibly large".
 *
 * `boundPerpsSize` is the pure normalizer used by the Size input's
 * onChange handler. `MAX_PERPS_SIZE_INT_DIGITS` and
 * `MAX_PERPS_SIZE_DEC_DIGITS` are deliberately exposed so the
 * acceptance criteria in task 0055 can be unit-tested directly without
 * mounting the full /perps page.
 *
 * Filed under Phase 1 Security Hardening as a defensive input fix
 * (task 0055).
 */ __turbopack_context__.s([
    "MAX_PERPS_SIZE_DEC_DIGITS",
    ()=>MAX_PERPS_SIZE_DEC_DIGITS,
    "MAX_PERPS_SIZE_INT_DIGITS",
    ()=>MAX_PERPS_SIZE_INT_DIGITS,
    "boundPerpsSize",
    ()=>boundPerpsSize
]);
const MAX_PERPS_SIZE_INT_DIGITS = 18;
const MAX_PERPS_SIZE_DEC_DIGITS = 8;
function boundPerpsSize(next) {
    const cleaned = next.replace(/[^0-9.]/g, '');
    const dot = cleaned.indexOf('.');
    if (dot === -1) {
        return cleaned.slice(0, MAX_PERPS_SIZE_INT_DIGITS);
    }
    const intPart = cleaned.slice(0, dot);
    // Everything after the FIRST dot, with any subsequent dots stripped so
    // accidental `1.2.3` collapses to `1.23` rather than throwing.
    const tail = cleaned.slice(dot + 1).replace(/\./g, '');
    const boundedInt = intPart.slice(0, MAX_PERPS_SIZE_INT_DIGITS);
    const boundedDec = tail.slice(0, MAX_PERPS_SIZE_DEC_DIGITS);
    return `${boundedInt}.${boundedDec}`;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/perpsStopLimitValidation.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Side-aware semantic validation for Stop-Limit perp orders.
 *
 * A Stop-Limit order has two prices:
 *   - triggerPrice — when crossed by the mark price, the order activates.
 *   - limitPrice   — the price at which the resulting limit order is placed.
 *
 * For the configuration to make economic sense:
 *   LONG  stop-limit: trigger MUST be strictly above mark, limit MUST be ≥ trigger.
 *   SHORT stop-limit: trigger MUST be strictly below mark, limit MUST be ≤ trigger.
 *
 * This helper returns side-aware flags + human-readable error messages so the
 * UI can paint inputs red, render inline errors and disable the submit button.
 *
 * It deliberately stays silent for empty / partially-typed / non-numeric values
 * so the user is not yelled at while typing. `triggerPriceInvalid` (the simple
 * "must be > 0" check) is handled elsewhere in PerpsOrderPanel and remains the
 * source of truth for that lower-level concern.
 */ __turbopack_context__.s([
    "validateStopLimitOrder",
    ()=>validateStopLimitOrder
]);
const CLEAN = {
    triggerWrongSide: false,
    limitVsTriggerWrong: false,
    triggerErrorMessage: null,
    limitErrorMessage: null
};
function parsePositive(value) {
    if (typeof value !== 'string' || value.trim() === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
}
function validateStopLimitOrder(input) {
    const { orderType, side, markPrice, triggerPrice, limitPrice } = input;
    // Helper only applies to stop-limit orders.
    if (orderType !== 'stop-limit') return CLEAN;
    // Without a usable mark price, we cannot make a directional claim.
    if (!Number.isFinite(markPrice) || markPrice <= 0) return CLEAN;
    const trigger = parsePositive(triggerPrice);
    const limit = parsePositive(limitPrice);
    let triggerWrongSide = false;
    let triggerErrorMessage = null;
    let limitVsTriggerWrong = false;
    let limitErrorMessage = null;
    if (trigger !== null) {
        if (side === 'long' && trigger <= markPrice) {
            triggerWrongSide = true;
            triggerErrorMessage = 'Trigger must be above mark price';
        } else if (side === 'short' && trigger >= markPrice) {
            triggerWrongSide = true;
            triggerErrorMessage = 'Trigger must be below mark price';
        }
    }
    // Only evaluate limit-vs-trigger once both are present.
    if (trigger !== null && limit !== null) {
        if (side === 'long' && limit < trigger) {
            limitVsTriggerWrong = true;
            limitErrorMessage = 'Limit must be ≥ trigger price';
        } else if (side === 'short' && limit > trigger) {
            limitVsTriggerWrong = true;
            limitErrorMessage = 'Limit must be ≤ trigger price';
        }
    }
    return {
        triggerWrongSide,
        limitVsTriggerWrong,
        triggerErrorMessage,
        limitErrorMessage
    };
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
"[project]/frontend/src/lib/indicators.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_INDICATORS",
    ()=>DEFAULT_INDICATORS,
    "calculateEMA",
    ()=>calculateEMA,
    "calculateSMA",
    ()=>calculateSMA
]);
function calculateSMA(data, period) {
    if (data.length < period) return [];
    const result = [];
    let sum = 0;
    for(let i = 0; i < period; i++){
        sum += data[i].close;
    }
    result.push({
        time: data[period - 1].time,
        value: sum / period
    });
    for(let i = period; i < data.length; i++){
        sum += data[i].close - data[i - period].close;
        result.push({
            time: data[i].time,
            value: sum / period
        });
    }
    return result;
}
function calculateEMA(data, period) {
    if (data.length < period) return [];
    const k = 2 / (period + 1);
    const result = [];
    let sum = 0;
    for(let i = 0; i < period; i++){
        sum += data[i].close;
    }
    let ema = sum / period;
    result.push({
        time: data[period - 1].time,
        value: ema
    });
    for(let i = period; i < data.length; i++){
        ema = data[i].close * k + ema * (1 - k);
        result.push({
            time: data[i].time,
            value: ema
        });
    }
    return result;
}
const DEFAULT_INDICATORS = {
    vol: true,
    sma20: false,
    ema50: false
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/usePerps.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useClosePosition",
    ()=>useClosePosition,
    "useOpenPosition",
    ()=>useOpenPosition,
    "usePerpMarketCount",
    ()=>usePerpMarketCount,
    "usePosition",
    ()=>usePosition
]);
/**
 * usePerps — wagmi hooks for GoodPerps PerpEngine on-chain interactions.
 *
 * Trade flow:
 *   1. Approve MarginVault.collateral() token (G$ on devnet)
 *   2. MarginVault.deposit(margin)
 *   3. PerpEngine.openPosition(marketId, size, isLong, margin)
 *
 * PerpEngine and MarginVault are deployed on devnet (chain 42069).
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$waitForTransactionReceipt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@wagmi/core/dist/esm/actions/waitForTransactionReceipt.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContract.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useWriteContract.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useBytecode$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useBytecode.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$wagmi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/wagmi.ts [app-client] (ecmascript) <locals>");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature(), _s4 = __turbopack_context__.k.signature(), _s5 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
const ENGINE = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].PerpEngine;
const VAULT = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].MarginVault;
function usePosition(marketId) {
    _s();
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: ENGINE ?? undefined,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerpEngineABI"],
        functionName: 'positions',
        args: ENGINE && address ? [
            address,
            marketId
        ] : undefined,
        query: {
            enabled: !!(ENGINE && address),
            refetchInterval: 10_000,
            retry: false
        }
    });
    if (!result.data) return {
        position: null,
        isLoading: result.isLoading
    };
    const [isOpen, isLong, size, entryPrice, margin] = result.data;
    if (!isOpen) return {
        position: null,
        isLoading: result.isLoading
    };
    return {
        position: {
            size,
            entryPrice,
            isLong,
            collateral: margin,
            sizeFloat: Number(size) / 1e18,
            entryPriceFloat: Number(entryPrice) / 1e8,
            collateralFloat: Number(margin) / 1e18
        },
        isLoading: result.isLoading
    };
}
_s(usePosition, "DFdOxYEvlO0ke2icRdHY351RdsE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"]
    ];
});
function usePerpMarketCount() {
    _s1();
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: ENGINE ?? undefined,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerpEngineABI"],
        functionName: 'marketCount',
        query: {
            enabled: !!ENGINE,
            refetchInterval: 60_000,
            retry: false
        }
    });
    return {
        count: result.data ?? BigInt(0),
        isLoading: result.isLoading
    };
}
_s1(usePerpMarketCount, "E9zKaZ5TCqsAryIFg4ebcJTTBkw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"]
    ];
});
function usePerpsCollateralToken() {
    _s2();
    const { data } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: VAULT,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MarginVaultABI"],
        functionName: 'collateral',
        query: {
            enabled: !!VAULT,
            retry: false
        }
    });
    return data;
}
_s2(usePerpsCollateralToken, "f6/Cq4RfYjR+ieJIJRGmTPh6dOQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"]
    ];
});
function usePerpsDeployed() {
    _s3();
    const collateral = usePerpsCollateralToken();
    const { data: engineCode } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useBytecode$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBytecode"])({
        address: ENGINE,
        query: {
            enabled: !!ENGINE
        }
    });
    const { data: collateralCode } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useBytecode$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBytecode"])({
        address: collateral,
        query: {
            enabled: !!collateral
        }
    });
    return Boolean(ENGINE && VAULT && collateral && engineCode && engineCode !== '0x' && collateralCode && collateralCode !== '0x');
}
_s3(usePerpsDeployed, "erARitO5nWp8JsIiaKmeYYcdmyQ=", false, function() {
    return [
        usePerpsCollateralToken,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useBytecode$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBytecode"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useBytecode$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBytecode"]
    ];
});
function useOpenPosition() {
    _s4();
    const [phase, setPhase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const { writeContractAsync } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWriteContract"])();
    const { address, isConnected } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    const collateralToken = usePerpsCollateralToken();
    const isDeployed = usePerpsDeployed();
    const vaultBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: VAULT,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MarginVaultABI"],
        functionName: 'balances',
        args: address ? [
            address
        ] : undefined,
        query: {
            enabled: !!address,
            refetchInterval: 10_000,
            retry: false
        }
    });
    const reset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useOpenPosition.useCallback[reset]": ()=>{
            setPhase('idle');
            setError(null);
        }
    }["useOpenPosition.useCallback[reset]"], []);
    const openPosition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useOpenPosition.useCallback[openPosition]": async (marketId, margin, size, isLong)=>{
            if (!isConnected) {
                setError('Wallet not connected');
                return;
            }
            if (!isDeployed || !ENGINE || !VAULT || !collateralToken) {
                setError('PerpEngine not deployed yet');
                return;
            }
            try {
                // PerpEngine requires margin + trade fee to already be present in
                // MarginVault. Top up only the missing amount, then open the position.
                const fee = size * 10n / 10_000n // PerpEngine.TRADE_FEE_BPS = 10 = 0.1%
                ;
                const totalRequired = margin + fee;
                const currentVaultBalance = vaultBalance.data ?? 0n;
                const depositAmount = currentVaultBalance >= totalRequired ? 0n : totalRequired - currentVaultBalance;
                if (depositAmount > 0n) {
                    setPhase('approving');
                    const approveHash = await writeContractAsync({
                        address: collateralToken,
                        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ERC20ABI"],
                        functionName: 'approve',
                        args: [
                            VAULT,
                            depositAmount
                        ]
                    });
                    const approveReceipt = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$waitForTransactionReceipt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["waitForTransactionReceipt"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$wagmi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["config"], {
                        hash: approveHash
                    });
                    if (approveReceipt.status === 'reverted') throw new Error('Approval reverted');
                    setPhase('pending');
                    const depositHash = await writeContractAsync({
                        address: VAULT,
                        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MarginVaultABI"],
                        functionName: 'deposit',
                        args: [
                            depositAmount
                        ]
                    });
                    const depositReceipt = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$waitForTransactionReceipt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["waitForTransactionReceipt"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$wagmi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["config"], {
                        hash: depositHash
                    });
                    if (depositReceipt.status === 'reverted') throw new Error('Margin deposit reverted');
                }
                setPhase('pending');
                const openHash = await writeContractAsync({
                    address: ENGINE,
                    abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerpEngineABI"],
                    functionName: 'openPosition',
                    args: [
                        marketId,
                        size,
                        isLong,
                        margin
                    ]
                });
                const openReceipt = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$waitForTransactionReceipt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["waitForTransactionReceipt"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$wagmi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["config"], {
                    hash: openHash
                });
                if (openReceipt.status === 'reverted') throw new Error('Open position reverted');
                setPhase('done');
            } catch (err) {
                const e = err;
                setError(e?.shortMessage ?? e?.message ?? 'Transaction failed');
                setPhase('error');
            }
        }
    }["useOpenPosition.useCallback[openPosition]"], [
        isConnected,
        isDeployed,
        collateralToken,
        vaultBalance.data,
        writeContractAsync
    ]);
    return {
        openPosition,
        phase,
        error,
        reset,
        isConnected,
        isDeployed
    };
}
_s4(useOpenPosition, "fsyZrVKrsOf48KWrzo8AJo8IsN8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWriteContract"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"],
        usePerpsCollateralToken,
        usePerpsDeployed,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"]
    ];
});
function useClosePosition() {
    _s5();
    const [phase, setPhase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const { writeContractAsync } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWriteContract"])();
    const { isConnected } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    const isDeployed = usePerpsDeployed();
    const reset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useClosePosition.useCallback[reset]": ()=>{
            setPhase('idle');
            setError(null);
        }
    }["useClosePosition.useCallback[reset]"], []);
    const closePosition = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useClosePosition.useCallback[closePosition]": async (marketId)=>{
            if (!isConnected) {
                setError('Wallet not connected');
                return;
            }
            if (!isDeployed || !ENGINE) {
                setError('PerpEngine not deployed yet');
                return;
            }
            try {
                setPhase('pending');
                const closeHash = await writeContractAsync({
                    address: ENGINE,
                    abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerpEngineABI"],
                    functionName: 'closePosition',
                    args: [
                        marketId
                    ]
                });
                const closeReceipt = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$wagmi$2f$core$2f$dist$2f$esm$2f$actions$2f$waitForTransactionReceipt$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["waitForTransactionReceipt"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$wagmi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["config"], {
                    hash: closeHash
                });
                if (closeReceipt.status === 'reverted') throw new Error('Close position reverted');
                setPhase('done');
            } catch (err) {
                const e = err;
                setError(e?.shortMessage ?? e?.message ?? 'Transaction failed');
                setPhase('error');
            }
        }
    }["useClosePosition.useCallback[closePosition]"], [
        isConnected,
        isDeployed,
        writeContractAsync
    ]);
    return {
        closePosition,
        phase,
        error,
        reset,
        isConnected,
        isDeployed
    };
}
_s5(useClosePosition, "/xksyIgnGeFEK9uUQqlqKytFdDI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWriteContract"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"],
        usePerpsDeployed
    ];
});
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
"[project]/frontend/src/components/ui/animated-number.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AnimatedNumber",
    ()=>AnimatedNumber
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-spring.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-motion-value.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-transform.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function AnimatedNumber({ value, decimals = 2, className }) {
    _s();
    const motionValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"])(value);
    const spring = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"])(motionValue, {
        stiffness: 80,
        damping: 20
    });
    const display = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransform"])(spring, {
        "AnimatedNumber.useTransform[display]": (v)=>v.toFixed(decimals)
    }["AnimatedNumber.useTransform[display]"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnimatedNumber.useEffect": ()=>{
            motionValue.set(value);
        }
    }["AnimatedNumber.useEffect"], [
        value,
        motionValue
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].span, {
        className: className,
        children: display
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/animated-number.tsx",
        lineNumber: 22,
        columnNumber: 10
    }, this);
}
_s(AnimatedNumber, "P6nQ//zngBBnrbVNmgbUKXUZrtU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransform"]
    ];
});
_c = AnimatedNumber;
var _c;
__turbopack_context__.k.register(_c, "AnimatedNumber");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/ui/price-display.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PriceDisplay",
    ()=>PriceDisplay,
    "priceDisplayVariants",
    ()=>priceDisplayVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$animated$2d$number$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/animated-number.tsx [app-client] (ecmascript)");
'use client';
;
;
;
;
;
const priceDisplayVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])('font-medium transition-colors', {
    variants: {
        variant: {
            default: 'text-foreground',
            positive: 'text-green-400',
            negative: 'text-red-400',
            muted: 'text-muted-foreground',
            accent: 'text-goodgreen'
        },
        size: {
            xs: 'text-xs',
            sm: 'text-sm',
            md: 'text-base',
            lg: 'text-lg',
            xl: 'text-xl',
            '2xl': 'text-2xl',
            '3xl': 'text-3xl'
        }
    },
    defaultVariants: {
        variant: 'default',
        size: 'md'
    }
});
/**
 * Standardized price display component for financial data across all dApps.
 *
 * Features:
 * - Automatic positive/negative variant detection
 * - Configurable decimal precision
 * - Optional animation for live price updates
 * - Compact formatting for large numbers
 * - Contextual timing labels (e.g., "vs 24h ago", "since yesterday")
 * - Consistent styling with design system
 *
 * Used across: GoodSwap, GoodStocks, GoodPredict, GoodPerps
 */ const PriceDisplay = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ value, symbol = '', prefix = '', decimals = 2, showSign = false, animated = false, compact = false, contextLabel, showContext = false, variant, size, className, ...props }, ref)=>{
    // Auto-detect positive/negative variant if not specified
    const finalVariant = variant || (value > 0 ? 'positive' : value < 0 ? 'negative' : 'default');
    // Format the number
    const formatNumber = (num)=>{
        if (compact && Math.abs(num) >= 1000) {
            if (Math.abs(num) >= 1_000_000_000) {
                return (num / 1_000_000_000).toFixed(1) + 'B';
            } else if (Math.abs(num) >= 1_000_000) {
                return (num / 1_000_000).toFixed(1) + 'M';
            } else if (Math.abs(num) >= 1_000) {
                return (num / 1_000).toFixed(1) + 'K';
            }
        }
        return num.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };
    const formattedValue = formatNumber(Math.abs(value));
    const sign = showSign && value !== 0 ? value > 0 ? '+' : '-' : '';
    // Determine contextual label text and styling
    const getContextLabel = ()=>{
        if (!showContext) return null;
        // Use provided contextLabel or smart defaults based on value
        const labelText = contextLabel || (showSign ? 'vs 24h ago' : 'current');
        return labelText;
    };
    const contextLabelText = getContextLabel();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(priceDisplayVariants({
            variant: finalVariant,
            size
        }), className),
        ...props,
        children: [
            prefix,
            sign,
            animated ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$animated$2d$number$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatedNumber"], {
                value: Math.abs(value),
                decimals: decimals,
                className: "inline"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/price-display.tsx",
                lineNumber: 124,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)) : formattedValue,
            symbol && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "ml-1 text-muted-foreground text-[0.85em]",
                children: symbol
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/price-display.tsx",
                lineNumber: 133,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)),
            contextLabelText && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "ml-1.5 text-gray-400 text-[0.75em]",
                children: contextLabelText
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/price-display.tsx",
                lineNumber: 138,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/price-display.tsx",
        lineNumber: 116,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = PriceDisplay;
PriceDisplay.displayName = 'PriceDisplay';
;
var _c, _c1;
__turbopack_context__.k.register(_c, "PriceDisplay$forwardRef");
__turbopack_context__.k.register(_c1, "PriceDisplay");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/ui/calculator-overlay.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CalculatorOverlay",
    ()=>CalculatorOverlay
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const CALCULATOR_BUTTONS = [
    [
        '7',
        '8',
        '9',
        '/'
    ],
    [
        '4',
        '5',
        '6',
        '*'
    ],
    [
        '1',
        '2',
        '3',
        '-'
    ],
    [
        '0',
        '.',
        '=',
        '+'
    ]
];
const PRESET_PERCENTAGES = [
    25,
    50,
    75,
    100
];
const PRESET_AMOUNTS = [
    10,
    100,
    1000,
    5000
];
function CalculatorOverlay({ isOpen, onClose, onValueSelect, currentValue, maxValue, maxValueLabel = 'max', className }) {
    _s();
    const [expression, setExpression] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const overlayRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CalculatorOverlay.useEffect": ()=>{
            if (isOpen) {
                setExpression(currentValue || '');
                setResult('');
            }
        }
    }["CalculatorOverlay.useEffect"], [
        isOpen,
        currentValue
    ]);
    // Close overlay when clicking outside
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CalculatorOverlay.useEffect": ()=>{
            const handleClickOutside = {
                "CalculatorOverlay.useEffect.handleClickOutside": (event)=>{
                    if (overlayRef.current && !overlayRef.current.contains(event.target)) {
                        onClose();
                    }
                }
            }["CalculatorOverlay.useEffect.handleClickOutside"];
            if (isOpen) {
                document.addEventListener('mousedown', handleClickOutside);
                return ({
                    "CalculatorOverlay.useEffect": ()=>document.removeEventListener('mousedown', handleClickOutside)
                })["CalculatorOverlay.useEffect"];
            }
        }
    }["CalculatorOverlay.useEffect"], [
        isOpen,
        onClose
    ]);
    const evaluateExpression = (expr)=>{
        try {
            // Replace common percentage patterns
            let cleanExpr = expr.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)') // Convert percentages
            .replace(/[^0-9+\-*/.() ]/g, '') // Remove invalid characters
            ;
            if (!cleanExpr || cleanExpr === '') return '';
            // Use Function constructor for safer evaluation than eval
            const result = new Function(`return ${cleanExpr}`)();
            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                return result.toString();
            }
            return '';
        } catch  {
            return '';
        }
    };
    const handleButtonClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CalculatorOverlay.useCallback[handleButtonClick]": (value)=>{
            if (value === '=') {
                const evaluated = evaluateExpression(expression);
                if (evaluated) {
                    onValueSelect(evaluated);
                    onClose();
                }
            } else {
                const newExpression = expression + value;
                setExpression(newExpression);
                // Real-time evaluation for immediate feedback
                const evaluated = evaluateExpression(newExpression);
                setResult(evaluated);
            }
        }
    }["CalculatorOverlay.useCallback[handleButtonClick]"], [
        expression,
        onValueSelect,
        onClose
    ]);
    const handleCalculate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CalculatorOverlay.useCallback[handleCalculate]": ()=>{
            const evaluated = evaluateExpression(expression);
            if (evaluated) {
                onValueSelect(evaluated);
                onClose();
            }
        }
    }["CalculatorOverlay.useCallback[handleCalculate]"], [
        expression,
        onValueSelect,
        onClose
    ]);
    const handleBackspace = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CalculatorOverlay.useCallback[handleBackspace]": ()=>{
            const newExpression = expression.slice(0, -1);
            setExpression(newExpression);
            const evaluated = evaluateExpression(newExpression);
            setResult(evaluated);
        }
    }["CalculatorOverlay.useCallback[handleBackspace]"], [
        expression
    ]);
    const handleKeyDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "CalculatorOverlay.useCallback[handleKeyDown]": (e)=>{
            if (!isOpen) return;
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleCalculate();
            } else if (/[0-9+\-*/.=]/.test(e.key)) {
                e.preventDefault();
                handleButtonClick(e.key);
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                handleBackspace();
            }
        }
    }["CalculatorOverlay.useCallback[handleKeyDown]"], [
        isOpen,
        onClose,
        handleCalculate,
        handleButtonClick,
        handleBackspace
    ]);
    // Keyboard support
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CalculatorOverlay.useEffect": ()=>{
            window.addEventListener('keydown', handleKeyDown);
            return ({
                "CalculatorOverlay.useEffect": ()=>window.removeEventListener('keydown', handleKeyDown)
            })["CalculatorOverlay.useEffect"];
        }
    }["CalculatorOverlay.useEffect"], [
        handleKeyDown
    ]);
    const handleClear = ()=>{
        setExpression('');
        setResult('');
    };
    const handlePercentage = (percent)=>{
        if (maxValue !== undefined) {
            const value = (maxValue * percent / 100).toString();
            onValueSelect(value);
            onClose();
        }
    };
    const handlePresetAmount = (amount)=>{
        onValueSelect(amount.toString());
        onClose();
    };
    if (!isOpen) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: overlayRef,
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": "calculator-title",
            "aria-describedby": "calculator-description",
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('bg-dark-100 rounded-2xl border border-gray-700/20 p-4 w-full max-w-sm shadow-2xl', className),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    id: "calculator-description",
                    className: "sr-only",
                    children: "Interactive calculator for amount inputs with basic arithmetic operations, percentage calculations, and preset amounts"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                    lineNumber: 182,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            id: "calculator-title",
                            className: "text-sm font-semibold text-white",
                            children: "Calculator"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 187,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            "aria-label": "Close calculator",
                            className: "p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/30 transition-colors",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-4 h-4",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                "aria-hidden": "true",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M6 18L18 6M6 6l12 12"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                    lineNumber: 194,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                lineNumber: 193,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 188,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                    lineNumber: 186,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-dark-50 rounded-xl p-3 mb-4",
                    role: "region",
                    "aria-labelledby": "calculator-display",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            id: "calculator-display",
                            className: "text-xs text-gray-400 mb-1",
                            children: "Expression:"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 201,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-white font-mono text-sm min-h-[20px]",
                            "aria-label": `Current expression: ${expression || '0'}`,
                            children: expression || '0'
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 202,
                            columnNumber: 11
                        }, this),
                        result && result !== expression && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-gray-400 mt-2 mb-1",
                                    children: "Result:"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                    lineNumber: 207,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-goodgreen font-mono text-sm",
                                    "aria-live": "polite",
                                    "aria-label": `Calculation result: ${result}`,
                                    children: [
                                        "= ",
                                        result
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                    lineNumber: 208,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                    lineNumber: 200,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-2 gap-2 mb-4",
                    children: [
                        maxValue !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "col-span-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-gray-400 mb-2",
                                    children: [
                                        "% of ",
                                        maxValueLabel,
                                        ":"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                    lineNumber: 224,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-4 gap-1",
                                    children: PRESET_PERCENTAGES.map((percent)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>handlePercentage(percent),
                                            "aria-label": `Use ${percent}% of ${maxValueLabel}`,
                                            className: "py-2 px-2 rounded-lg bg-gray-700/30 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-600/40 transition-colors",
                                            children: [
                                                percent,
                                                "%"
                                            ]
                                        }, percent, true, {
                                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                            lineNumber: 227,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                    lineNumber: 225,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 223,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "col-span-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-gray-400 mb-2",
                                    children: "Quick amounts:"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                    lineNumber: 242,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-4 gap-1",
                                    children: PRESET_AMOUNTS.map((amount)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>handlePresetAmount(amount),
                                            "aria-label": `Use preset amount ${amount}`,
                                            className: "py-2 px-2 rounded-lg bg-gray-700/30 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-600/40 transition-colors",
                                            children: amount >= 1000 ? `${amount / 1000}K` : amount
                                        }, amount, false, {
                                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                            lineNumber: 245,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                    lineNumber: 243,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 241,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                    lineNumber: 220,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-4 gap-2 mb-4",
                    role: "grid",
                    "aria-labelledby": "calculator-grid-label",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            id: "calculator-grid-label",
                            className: "sr-only",
                            children: "Calculator number pad and operations"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 260,
                            columnNumber: 11
                        }, this),
                        CALCULATOR_BUTTONS.flat().map((btn, index)=>{
                            let ariaLabel = '';
                            if (btn === '=') ariaLabel = 'Calculate result';
                            else if (btn === '+') ariaLabel = 'Add';
                            else if (btn === '-') ariaLabel = 'Subtract';
                            else if (btn === '*') ariaLabel = 'Multiply';
                            else if (btn === '/') ariaLabel = 'Divide';
                            else if (btn === '.') ariaLabel = 'Decimal point';
                            else ariaLabel = `Number ${btn}`;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>handleButtonClick(btn),
                                "aria-label": ariaLabel,
                                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('aspect-square rounded-lg font-medium transition-colors text-sm', btn === '=' ? 'bg-goodgreen text-black hover:bg-goodgreen/80' : [
                                    '+',
                                    '-',
                                    '*',
                                    '/'
                                ].includes(btn) ? 'bg-gray-600/40 text-gray-200 hover:text-white hover:bg-gray-500/50' : 'bg-gray-700/30 text-gray-300 hover:text-white hover:bg-gray-600/40'),
                                children: btn
                            }, `${btn}-${index}`, false, {
                                fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                                lineNumber: 272,
                                columnNumber: 15
                            }, this);
                        })
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                    lineNumber: 259,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-3 gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleClear,
                            "aria-label": "Clear all input",
                            className: "py-2 px-3 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 hover:text-red-300 transition-colors",
                            children: "Clear"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 293,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleBackspace,
                            "aria-label": "Delete last character",
                            className: "py-2 px-3 rounded-lg bg-gray-700/30 text-gray-300 text-xs font-medium hover:text-white hover:bg-gray-600/40 transition-colors",
                            children: "⌫"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 300,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleCalculate,
                            "aria-label": "Apply calculated result to input field",
                            className: "py-2 px-3 rounded-lg bg-goodgreen text-black text-xs font-medium hover:bg-goodgreen/80 transition-colors",
                            children: "Apply"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                            lineNumber: 307,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
                    lineNumber: 292,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
            lineNumber: 171,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/calculator-overlay.tsx",
        lineNumber: 170,
        columnNumber: 5
    }, this);
}
_s(CalculatorOverlay, "6tI9f5iW5SYQ6RGKdIETb6W7zII=");
_c = CalculatorOverlay;
var _c;
__turbopack_context__.k.register(_c, "CalculatorOverlay");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/formatCompactCaption.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatCompactCaption",
    ()=>formatCompactCaption,
    "formatCompactUsdCaption",
    ()=>formatCompactUsdCaption
]);
/**
 * Compact number formatters for `AmountInput` auxiliary captions.
 *
 * `Intl.NumberFormat` (via `Number.prototype.toLocaleString`) silently
 * falls back to scientific notation when the integer part exceeds ~21
 * digits, and renders unreasonably wide grouped strings well before
 * that. The `AmountInput` caption row was designed for short labels
 * like `balance: 1,234.56 USDC`, not for `9.9999999999999e+21`. When a
 * user lands on a low-priced pair on `/perps` (SHIB-class assets) the
 * leverage-adjusted maximum position size easily exceeds
 * `Number.MAX_SAFE_INTEGER`, producing scientific notation that wraps,
 * overflows its container, and breaks the visual hierarchy of the
 * order summary panel.
 *
 * These helpers mirror the K/M/B/T/Q suffix vocabulary already used by
 * `formatPerpsPrice()` and `formatLargeValue()` in `perpsData.ts` so
 * the visual language stays consistent across the trading UI. They
 * differ in two ways:
 *
 *   1. `formatCompactCaption` is unit-less because the caption row
 *      already supplies its own `{symbol}` suffix.
 *   2. Non-finite inputs (`Infinity`, `NaN`) render as an em-dash
 *      placeholder instead of emitting the literal string `"Infinity"`
 *      or `"NaN"`.
 */ const TIERS = [
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
    ]
];
function pickDecimals(v) {
    return v >= 100 ? 0 : v >= 10 ? 1 : 2;
}
function formatCompactCaption(n, fractionDigits = 4) {
    if (!Number.isFinite(n)) return '—';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    for (const [threshold, suffix] of TIERS){
        if (abs >= threshold) {
            const v = abs / threshold;
            return `${sign}${v.toFixed(pickDecimals(v))}${suffix}`;
        }
    }
    return n.toLocaleString('en-US', {
        minimumFractionDigits: Math.min(2, fractionDigits),
        maximumFractionDigits: fractionDigits
    });
}
function formatCompactUsdCaption(n) {
    if (!Number.isFinite(n)) return '$—';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    for (const [threshold, suffix] of TIERS){
        if (abs >= threshold) {
            const v = abs / threshold;
            return `${sign}$${v.toFixed(pickDecimals(v))}${suffix}`;
        }
    }
    return `${sign}$${abs.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/ui/amount-input.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AmountInput",
    ()=>AmountInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$calculator$2d$overlay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/calculator-overlay.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/format.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatCompactCaption$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/formatCompactCaption.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
/**
 * Enhanced amount input component with integrated calculator overlay.
 *
 * Features:
 * - Built-in calculator overlay with arithmetic operations
 * - Percentage calculations based on max available amount
 * - Quick preset amounts and max button
 * - USD value display for context
 * - Input validation and sanitization
 * - Consistent styling across all trading interfaces
 * - Accessibility support with keyboard navigation
 *
 * Used across: SwapCard, Perps, Lending, Bridge, Yield farming
 */ const AmountInput = /*#__PURE__*/ _s((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = _s(({ value, onChange, maxValue, maxValueLabel = 'balance', showCalculator = true, showMaxButton = true, symbol, usdValue, error, className, placeholder = '0.00', ...props }, ref)=>{
    _s();
    const [isCalculatorOpen, setIsCalculatorOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const handleCalculatorValue = (calculatedValue)=>{
        onChange(calculatedValue);
    };
    const handleMaxClick = ()=>{
        if (maxValue !== undefined) {
            onChange(maxValue.toString());
        }
    };
    const handleInputChange = (e)=>{
        onChange((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumericInput"])(e.target.value));
    };
    const hasError = !!error;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('relative', className),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('relative flex items-center', 'bg-dark-50 border rounded-xl', 'focus-within:ring-2 focus-within:ring-goodgreen/50', hasError ? 'border-red-500/50 focus-within:border-red-500/50' : 'border-gray-700/30 focus-within:border-goodgreen/30'),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        ref: ref,
                        type: "text",
                        inputMode: "decimal",
                        value: value,
                        onChange: handleInputChange,
                        placeholder: placeholder,
                        className: "flex-1 px-3 py-2.5 bg-transparent text-white text-sm outline-none placeholder:text-gray-500",
                        ...props
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                        lineNumber: 83,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-1 px-2",
                        children: [
                            symbol && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-gray-400 mr-1",
                                children: symbol
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                                lineNumber: 98,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            showMaxButton && maxValue !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: handleMaxClick,
                                className: "px-2 py-1 rounded-md text-xs font-medium text-goodgreen hover:text-goodgreen-400 hover:bg-goodgreen/10 transition-colors",
                                children: "MAX"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                                lineNumber: 105,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            showCalculator && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>setIsCalculatorOpen(true),
                                className: "p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/30 transition-colors",
                                title: "Open calculator",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "w-4 h-4",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        strokeWidth: 2,
                                        d: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                                        lineNumber: 123,
                                        columnNumber: 19
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                                    lineNumber: 122,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                                lineNumber: 116,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                        lineNumber: 95,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                lineNumber: 74,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mt-1 px-1",
                children: [
                    usdValue !== undefined && value && parseFloat(value) > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs text-gray-500",
                        children: [
                            "≈ ",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatCompactCaption$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCompactUsdCaption"])(usdValue)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                        lineNumber: 134,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)),
                    maxValue !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs text-gray-500",
                        children: [
                            maxValueLabel,
                            ": ",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatCompactCaption$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCompactCaption"])(maxValue),
                            symbol && ` ${symbol}`
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                        lineNumber: 141,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                lineNumber: 131,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            error && typeof error === 'string' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-red-400 text-xs mt-1 px-1",
                children: error
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                lineNumber: 150,
                columnNumber: 11
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$calculator$2d$overlay$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CalculatorOverlay"], {
                isOpen: isCalculatorOpen,
                onClose: ()=>setIsCalculatorOpen(false),
                onValueSelect: handleCalculatorValue,
                currentValue: value,
                maxValue: maxValue,
                maxValueLabel: maxValueLabel
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
                lineNumber: 156,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/amount-input.tsx",
        lineNumber: 73,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
}, "cF9gmvNtpEJPDNqKHOTnkg/zxEE=")), "cF9gmvNtpEJPDNqKHOTnkg/zxEE=");
_c1 = AmountInput;
AmountInput.displayName = 'AmountInput';
;
var _c, _c1;
__turbopack_context__.k.register(_c, "AmountInput$forwardRef");
__turbopack_context__.k.register(_c1, "AmountInput");
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
"[project]/frontend/src/lib/symbolSyncInvariant.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DIVERGENCE_STOP_BPS",
    ()=>DIVERGENCE_STOP_BPS,
    "STALE_QUOTE_STOP_MS",
    ()=>STALE_QUOTE_STOP_MS,
    "SYNC_PRODUCTS",
    ()=>SYNC_PRODUCTS,
    "buildSymbolSyncSnapshot",
    ()=>buildSymbolSyncSnapshot,
    "evaluateRiskIncrease",
    ()=>evaluateRiskIncrease,
    "shouldRequireStrictSync",
    ()=>shouldRequireStrictSync
]);
const SYNC_PRODUCTS = [
    'amm',
    'perps',
    'prediction',
    'lend',
    'yield'
];
const DIVERGENCE_STOP_BPS = 50;
const STALE_QUOTE_STOP_MS = 120_000;
const KNOWN_STOCK_SYMBOLS = new Set([
    'AAPL',
    'MSFT',
    'NVDA',
    'GOOGL',
    'AMZN',
    'META',
    'TSLA',
    'NFLX',
    'AMD',
    'COIN',
    'JPM',
    'V',
    'DIS'
]);
function normalizeBlock(block, fallback) {
    if (!Number.isFinite(block) || !block || block < 1) return fallback;
    return Math.floor(block);
}
function normalizeProductSync(oracleBlock, provided) {
    const out = {};
    for (const product of SYNC_PRODUCTS){
        const state = provided?.[product];
        out[product] = {
            lastSyncedBlock: normalizeBlock(state?.lastSyncedBlock, oracleBlock),
            value: state?.value
        };
    }
    return out;
}
function buildSymbolSyncSnapshot(quote, now = Date.now()) {
    const inferredOracleBlock = Math.max(1, Math.floor(now / 12_000));
    const oracleBlock = normalizeBlock(quote.oracleBlock, inferredOracleBlock);
    const stale = quote.lastUpdateMs > STALE_QUOTE_STOP_MS;
    const divergenceBps = Number.isFinite(quote.divergenceBps) ? Math.max(0, quote.divergenceBps ?? 0) : 0;
    return {
        symbol: quote.symbol,
        oracleBlock,
        divergenceBps,
        stale,
        productSync: normalizeProductSync(oracleBlock, quote.productSync)
    };
}
function evaluateRiskIncrease(snapshot, product) {
    if (snapshot.stale) {
        return {
            allowRiskIncrease: false,
            stopCode: 'stale-propagation',
            reason: `Trading paused: ${snapshot.symbol} price data is too old to trade safely.`
        };
    }
    if (snapshot.divergenceBps > DIVERGENCE_STOP_BPS) {
        return {
            allowRiskIncrease: false,
            stopCode: 'divergence',
            reason: `Trading paused: ${snapshot.symbol} price is out of range. Please wait for prices to stabilize.`
        };
    }
    const productState = snapshot.productSync[product];
    if (productState.lastSyncedBlock < snapshot.oracleBlock) {
        return {
            allowRiskIncrease: false,
            stopCode: 'lagging-sync',
            reason: `Trading paused: ${product} price data is updating. Please wait a moment.`
        };
    }
    return {
        allowRiskIncrease: true,
        stopCode: 'none',
        reason: null
    };
}
function shouldRequireStrictSync(symbol) {
    if (!symbol) return false;
    return KNOWN_STOCK_SYMBOLS.has(symbol.toUpperCase());
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/useSymbolSyncGuard.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSymbolSyncGuard",
    ()=>useSymbolSyncGuard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceServiceStatus.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$symbolSyncInvariant$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/symbolSyncInvariant.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function useSymbolSyncGuard(symbol, product) {
    _s();
    const { status, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceServiceStatus"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useSymbolSyncGuard.useMemo": ()=>{
            const strictSyncRequired = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$symbolSyncInvariant$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shouldRequireStrictSync"])(symbol);
            // Crypto perps (BTC/ETH/SOL/etc.) are backed by the on-chain perps oracle,
            // not the equity-price propagation service used for strict stock gating.
            // Do not block valid devnet/test-funded market orders just because the
            // generic price-service status contains a lagging quote for the same symbol.
            if (!strictSyncRequired) {
                return {
                    allowRiskIncrease: true,
                    stopCode: 'none',
                    reason: null,
                    loading: false,
                    hasSnapshot: false
                };
            }
            if (!symbol || !status) {
                return {
                    allowRiskIncrease: false,
                    stopCode: 'lagging-sync',
                    reason: 'Price data is not yet available. Please wait.',
                    loading: isLoading,
                    hasSnapshot: false
                };
            }
            const quote = status.quotes.find({
                "useSymbolSyncGuard.useMemo.quote": (q)=>q.symbol?.toUpperCase() === symbol.toUpperCase()
            }["useSymbolSyncGuard.useMemo.quote"]);
            if (!quote) {
                return {
                    allowRiskIncrease: !(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$symbolSyncInvariant$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shouldRequireStrictSync"])(symbol),
                    stopCode: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$symbolSyncInvariant$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shouldRequireStrictSync"])(symbol) ? 'lagging-sync' : 'none',
                    reason: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$symbolSyncInvariant$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shouldRequireStrictSync"])(symbol) ? `No price data available for ${symbol}. Please wait.` : null,
                    loading: false,
                    hasSnapshot: false
                };
            }
            const snapshot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$symbolSyncInvariant$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildSymbolSyncSnapshot"])(quote, status.timestamp || Date.now());
            const gate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$symbolSyncInvariant$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["evaluateRiskIncrease"])(snapshot, product);
            return {
                ...gate,
                loading: false,
                hasSnapshot: true
            };
        }
    }["useSymbolSyncGuard.useMemo"], [
        symbol,
        product,
        status,
        isLoading
    ]);
}
_s(useSymbolSyncGuard, "Q4Elh8+79VUOekMnM+HxddJ9yx4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceServiceStatus"]
    ];
});
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
"[project]/frontend/src/components/LivePriceCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LivePriceCard",
    ()=>LivePriceCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/PriceSourceBadge.tsx [app-client] (ecmascript)");
'use client';
;
;
;
function formatPrice(value) {
    if (!Number.isFinite(value)) return '$–';
    if (Math.abs(value) >= 1000) return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
    if (Math.abs(value) >= 1) return `$${value.toFixed(2)}`;
    if (Math.abs(value) >= 0.01) return `$${value.toFixed(4)}`;
    return `$${value.toFixed(6)}`;
}
function formatAge(ms) {
    if (ms == null) return 'just now';
    if (ms < 1000) return 'just now';
    if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
    return `${Math.floor(ms / 3_600_000)}h ago`;
}
const WARNING_SOURCES = new Set([
    'closed',
    'stale'
]);
function LivePriceCard(props) {
    const { symbol, price, change24h, source, updatedAgoMs, compact = false, className = '' } = props;
    const isFallback = source === 'fallback';
    const showWarning = WARNING_SOURCES.has(source);
    const changeColor = change24h == null ? 'text-gray-500' : change24h > 0 ? 'text-green-400' : change24h < 0 ? 'text-red-400' : 'text-gray-400';
    const changeText = change24h == null ? '' : `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-testid": "live-price-card",
        className: `flex flex-col ${compact ? 'p-2.5' : 'p-3'} min-w-[120px] rounded-xl bg-dark-100/70 border border-gray-700/30 ${className}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mb-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs font-semibold text-gray-300",
                        children: symbol
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                        lineNumber: 70,
                        columnNumber: 9
                    }, this),
                    showWarning && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                        "data-testid": "live-price-warning",
                        "aria-label": source === 'closed' ? 'Market closed' : 'Stale price',
                        className: "size-3.5 text-amber-400 shrink-0"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                        lineNumber: 72,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 69,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "live-price",
                className: `font-semibold ${compact ? 'text-sm' : 'text-base'} ${isFallback ? 'text-gray-500 opacity-70' : 'text-white'}`,
                ...isFallback ? {
                    'data-testid-fallback': ''
                } : {},
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    "data-testid": isFallback ? 'fallback-price' : undefined,
                    children: formatPrice(price)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                    lineNumber: 85,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 80,
                columnNumber: 7
            }, this),
            !compact && change24h != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "live-price-change",
                className: `text-[11px] mt-0.5 ${changeColor}`,
                children: changeText
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 89,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mt-2 gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceSourceBadge"], {
                        source: source,
                        size: "sm"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                        lineNumber: 98,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[10px] text-gray-500 shrink-0",
                        children: [
                            "Updated ",
                            formatAge(updatedAgoMs)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                        lineNumber: 99,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 97,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
        lineNumber: 65,
        columnNumber: 5
    }, this);
}
_c = LivePriceCard;
var _c;
__turbopack_context__.k.register(_c, "LivePriceCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/LivePriceStrip.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LivePriceStrip",
    ()=>LivePriceStrip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/LivePriceCard.tsx [app-client] (ecmascript)");
'use client';
;
;
const DEFAULT_EMPTY_MESSAGE = 'No positions yet — connect a wallet to track live prices for the stocks and crypto you hold.';
function LivePriceStrip({ entries, compact = false, className = '', title, loading = false, emptyMessage = DEFAULT_EMPTY_MESSAGE }) {
    const isEmpty = entries.length === 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `w-full ${className}`,
        children: [
            title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-xs uppercase tracking-wider text-gray-500 mb-2 px-1",
                children: title
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                lineNumber: 53,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "live-price-strip",
                className: "flex items-stretch gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide",
                children: [
                    isEmpty && loading && Array.from({
                        length: 3
                    }, (_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            "data-testid": "live-price-skeleton",
                            className: "min-w-[120px] h-[78px] rounded-xl bg-dark-100/70 border border-gray-700/30 animate-pulse",
                            "aria-hidden": "true"
                        }, `skeleton-${i}`, false, {
                            fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                            lineNumber: 61,
                            columnNumber: 13
                        }, this)),
                    isEmpty && !loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "data-testid": "live-price-empty",
                        role: "status",
                        className: "flex-1 min-w-0 flex items-center gap-2 rounded-xl bg-dark-100/70 border border-gray-700/30 px-3 py-3 text-xs text-gray-400",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "aria-hidden": "true",
                                className: "inline-block w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                                lineNumber: 75,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "leading-snug",
                                children: emptyMessage
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                                lineNumber: 79,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                        lineNumber: 70,
                        columnNumber: 11
                    }, this),
                    !isEmpty && entries.map((e)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LivePriceCard"], {
                            ...e,
                            compact: compact
                        }, e.symbol, false, {
                            fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                            lineNumber: 83,
                            columnNumber: 11
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
        lineNumber: 51,
        columnNumber: 5
    }, this);
}
_c = LivePriceStrip;
var _c;
__turbopack_context__.k.register(_c, "LivePriceStrip");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/usePerpsPriceSources.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "usePerpsPriceSources",
    ()=>usePerpsPriceSources
]);
/**
 * usePerpsPriceSources — per-pair price provenance for the /perps surface.
 *
 * Lane 4 (`0007d-app-integration`, task 0003) wants every perp price the
 * user sees — pair selector, pair info bar, chart header, open positions
 * — to carry an honest source attribution.
 *
 * Composition:
 *   - `useOnChainPairs` — provides `pair.markPrice`; > 0 means the chain
 *     oracle answered for that market. We treat that as `chain-oracle`.
 *   - `usePriceServiceStatus` — per-symbol session/freshness/source info.
 *     Used to override the chain win with `closed` / `stale` / `etoro-demo`
 *     where the upstream tells us trading is not really live.
 *
 * The result is a plain `Record<pairSymbol, PriceSource>` and a tiny
 * `LivePriceEntry[]` builder helper. No new wagmi reads — just composing
 * what /perps already subscribes to.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPerps$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useOnChainPerps.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceServiceStatus.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$priceSource$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/priceSource.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function findStatusQuote(quotes, baseAsset) {
    if (!quotes) return undefined;
    // price-service status entries can be keyed by base asset (e.g. "BTC")
    // OR by the perp pair (e.g. "BTC-USD") depending on upstream config.
    // Try both for robustness.
    const direct = quotes.find((q)=>q.symbol === baseAsset);
    if (direct) return direct;
    return quotes.find((q)=>q.symbol === `${baseAsset}-USD`);
}
function usePerpsPriceSources() {
    _s();
    const { pairs } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPerps$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOnChainPairs"])();
    const { status } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceServiceStatus"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "usePerpsPriceSources.useMemo": ()=>{
            const sources = {};
            for (const pair of pairs){
                const chainOk = pair.markPrice > 0;
                const sq = findStatusQuote(status?.quotes, pair.baseAsset);
                // /perps-specific policy: explicit session-closure on the underlying
                // market dominates the chain reading. Even if the oracle still has a
                // last price, the user cannot actually trade at it while the market
                // is closed or halted, so surfacing "Market closed" is the honest UI.
                // This is layered on top of the generic resolver in `priceSource.ts`,
                // which preserves the "chain wins always" contract for surfaces that
                // intentionally don't care about session state (e.g. /analytics).
                if (sq && (sq.sessionState === 'closed' || sq.sessionState === 'halted')) {
                    sources[pair.symbol] = 'closed';
                    continue;
                }
                sources[pair.symbol] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$priceSource$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolvePriceSource"])({
                    chainOk,
                    statusQuote: sq && {
                        lastUpdateMs: sq.lastUpdateMs,
                        sessionState: sq.sessionState,
                        source: sq.source
                    },
                    hasFallback: true
                });
            }
            const buildEntries = {
                "usePerpsPriceSources.useMemo.buildEntries": (symbols)=>{
                    return symbols.map({
                        "usePerpsPriceSources.useMemo.buildEntries": (symbol)=>{
                            const pair = pairs.find({
                                "usePerpsPriceSources.useMemo.buildEntries.pair": (p)=>p.symbol === symbol
                            }["usePerpsPriceSources.useMemo.buildEntries.pair"]);
                            if (!pair) {
                                return {
                                    symbol,
                                    price: 0,
                                    change24h: null,
                                    source: 'unknown',
                                    updatedAgoMs: null
                                };
                            }
                            return {
                                symbol,
                                price: pair.markPrice,
                                change24h: pair.change24h ?? null,
                                source: sources[pair.symbol] ?? 'unknown',
                                updatedAgoMs: null
                            };
                        }
                    }["usePerpsPriceSources.useMemo.buildEntries"]);
                }
            }["usePerpsPriceSources.useMemo.buildEntries"];
            return {
                sources,
                buildEntries
            };
        }
    }["usePerpsPriceSources.useMemo"], [
        pairs,
        status
    ]);
}
_s(usePerpsPriceSources, "lN0sS7zup55JBFPfyFGH7JBifp8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPerps$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOnChainPairs"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceServiceStatus"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/PerpsPriceStrip.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PerpsPriceStrip",
    ()=>PerpsPriceStrip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/LivePriceStrip.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerpsPriceSources$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePerpsPriceSources.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const ALWAYS_ON_PAIRS = [
    'BTC-USD',
    'ETH-USD'
];
function PerpsPriceStrip({ activeSymbol, className = '' }) {
    _s();
    const { buildEntries } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerpsPriceSources$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePerpsPriceSources"])();
    const symbols = ALWAYS_ON_PAIRS.includes(activeSymbol) ? [
        ...ALWAYS_ON_PAIRS
    ] : [
        ...ALWAYS_ON_PAIRS,
        activeSymbol
    ];
    const entries = buildEntries(symbols);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LivePriceStrip"], {
        entries: entries,
        className: className
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/PerpsPriceStrip.tsx",
        lineNumber: 26,
        columnNumber: 10
    }, this);
}
_s(PerpsPriceStrip, "2ULexC0bWosvQIrsnGLEt+YJe0k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerpsPriceSources$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePerpsPriceSources"]
    ];
});
_c = PerpsPriceStrip;
var _c;
__turbopack_context__.k.register(_c, "PerpsPriceStrip");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/ChartErrorBoundary.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ChartErrorBoundary",
    ()=>ChartErrorBoundary
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
'use client';
;
;
class ChartErrorBoundary extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Component"] {
    state = {
        hasError: false,
        retryKey: 0
    };
    static getDerivedStateFromError() {
        return {
            hasError: true
        };
    }
    componentDidCatch(_error, _errorInfo) {
    // Chart or dynamic import failure — inline fallback only
    }
    handleRetry = ()=>{
        this.setState((prev)=>({
                hasError: false,
                retryKey: prev.retryKey + 1
            }));
    };
    render() {
        if (this.state.hasError) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center justify-center rounded-xl border border-gray-700/20 bg-dark-100 px-4 py-8 text-center",
                style: {
                    minHeight: 200
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-gray-700/20 bg-dark-50/50",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "h-5 w-5 text-gray-400",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24",
                            "aria-hidden": true,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                strokeWidth: 2,
                                d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/ChartErrorBoundary.tsx",
                                lineNumber: 44,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/ChartErrorBoundary.tsx",
                            lineNumber: 43,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ChartErrorBoundary.tsx",
                        lineNumber: 42,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mb-4 text-sm text-gray-400",
                        children: "Chart unavailable"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ChartErrorBoundary.tsx",
                        lineNumber: 52,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: this.handleRetry,
                        className: "rounded-xl bg-goodgreen px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-goodgreen-600 active:scale-[0.98]",
                        children: "Retry"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/ChartErrorBoundary.tsx",
                        lineNumber: 53,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/ChartErrorBoundary.tsx",
                lineNumber: 38,
                columnNumber: 9
            }, this);
        }
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: this.props.children
        }, this.state.retryKey, false, {
            fileName: "[project]/frontend/src/components/ChartErrorBoundary.tsx",
            lineNumber: 64,
            columnNumber: 12
        }, this);
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/IndicatorToggle.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "IndicatorToggle",
    ()=>IndicatorToggle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
'use client';
;
const INDICATOR_CONFIG = [
    {
        id: 'vol',
        label: 'Vol',
        color: '#10B981'
    },
    {
        id: 'sma20',
        label: 'SMA 20',
        color: '#FBBF24'
    },
    {
        id: 'ema50',
        label: 'EMA 50',
        color: '#A78BFA'
    }
];
function IndicatorToggle({ indicators, onChange }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-1",
        children: INDICATOR_CONFIG.map(({ id, label, color })=>{
            const active = indicators[id];
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>onChange(id),
                className: `inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors ${active ? 'bg-white/5 text-white border border-white/10' : 'text-gray-300 hover:text-white border border-transparent'}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "w-2 h-2 rounded-full shrink-0",
                        style: {
                            backgroundColor: active ? color : 'rgba(156,163,175,0.9)'
                        }
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/IndicatorToggle.tsx",
                        lineNumber: 32,
                        columnNumber: 13
                    }, this),
                    label
                ]
            }, id, true, {
                fileName: "[project]/frontend/src/components/IndicatorToggle.tsx",
                lineNumber: 22,
                columnNumber: 11
            }, this);
        })
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/IndicatorToggle.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, this);
}
_c = IndicatorToggle;
var _c;
__turbopack_context__.k.register(_c, "IndicatorToggle");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/app/(app)/perps/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PerpsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContract.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useWriteContract.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@rainbow-me/rainbowkit/dist/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/perpsData.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPerps$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useOnChainPerps.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/format.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsInput$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/perpsInput.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsStopLimitValidation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/perpsStopLimitValidation.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chartData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/chartData.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$indicators$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/indicators.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$WalletReadyContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/WalletReadyContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerps$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePerps.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$gDollarAmount$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/gDollarAmount.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/shared/lib/app-dynamic.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$percentage$2d$change$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/percentage-change.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$price$2d$display$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/price-display.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$amount$2d$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/amount-input.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useSymbolSyncGuard$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useSymbolSyncGuard.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PerpsPriceStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/PerpsPriceStrip.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/PriceSourceBadge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerpsPriceSources$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePerpsPriceSources.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ChartErrorBoundary$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ChartErrorBoundary.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$IndicatorToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/IndicatorToggle.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ScrollStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ScrollStrip.tsx [app-client] (ecmascript)");
;
;
;
;
;
;
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature(), _s4 = __turbopack_context__.k.signature();
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
function WalletGatedTradeButton({ hasSize, exceedsMargin, children }) {
    _s();
    const { isConnected } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    if (!isConnected) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ConnectButton"].Custom, {
            children: ({ openConnectModal })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: openConnectModal,
                    className: "w-full py-2.5 rounded-xl font-semibold text-sm bg-goodgreen text-black hover:bg-goodgreen/90 transition-colors",
                    children: "Connect Wallet to Trade"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                    lineNumber: 36,
                    columnNumber: 11
                }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
            lineNumber: 34,
            columnNumber: 7
        }, this);
    }
    if (!hasSize) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            disabled: true,
            className: "w-full py-2.5 rounded-xl font-semibold text-sm bg-dark-50 text-gray-400 cursor-not-allowed",
            children: "Enter Size"
        }, void 0, false, {
            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
            lineNumber: 46,
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
_c = WalletGatedTradeButton;
const PriceChart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/frontend/src/components/PriceChart.tsx [app-client] (ecmascript, next/dynamic entry, async loader)").then((m)=>({
            default: m.PriceChart
        })), {
    loadableGenerated: {
        modules: [
            "[project]/frontend/src/components/PriceChart.tsx [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false,
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full bg-dark-50/30 rounded-xl animate-pulse",
            style: {
                height: 400
            }
        }, void 0, false, {
            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
            lineNumber: 60,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
});
_c1 = PriceChart;
;
;
;
const OrderBook = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/frontend/src/components/OrderBook.tsx [app-client] (ecmascript, next/dynamic entry, async loader)").then((m)=>({
            default: m.OrderBook
        })), {
    loadableGenerated: {
        modules: [
            "[project]/frontend/src/components/OrderBook.tsx [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false,
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-xs",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between text-gray-500 px-2 py-1.5 border-b border-gray-700/20",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Price"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 75,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Size"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 75,
                            columnNumber: 29
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Total"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 75,
                            columnNumber: 46
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                    lineNumber: 74,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                Array.from({
                    length: 8
                }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between px-2 py-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-3 w-16 bg-dark-50/40 rounded animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 79,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-3 w-10 bg-dark-50/40 rounded animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 80,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-3 w-10 bg-dark-50/40 rounded animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 81,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, i, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 78,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)))
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
            lineNumber: 73,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
});
_c2 = OrderBook;
const RecentTrades = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/frontend/src/components/RecentTrades.tsx [app-client] (ecmascript, next/dynamic entry, async loader)").then((m)=>({
            default: m.RecentTrades
        })), {
    loadableGenerated: {
        modules: [
            "[project]/frontend/src/components/RecentTrades.tsx [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false,
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-xs",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between text-gray-500 px-2 py-1.5 border-b border-gray-700/20",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Price"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 96,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Size"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 96,
                            columnNumber: 29
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Time"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 96,
                            columnNumber: 46
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                    lineNumber: 95,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                Array.from({
                    length: 8
                }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between px-2 py-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-3 w-16 bg-dark-50/40 rounded animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 100,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-3 w-10 bg-dark-50/40 rounded animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 101,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-3 w-14 bg-dark-50/40 rounded animate-pulse"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 102,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, i, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 99,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)))
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
            lineNumber: 94,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
});
_c3 = RecentTrades;
const PerpsHistoryTabs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/frontend/src/components/PerpsHistoryTabs.tsx [app-client] (ecmascript, next/dynamic entry, async loader)").then((m)=>({
            default: m.PerpsHistoryTabs
        })), {
    loadableGenerated: {
        modules: [
            "[project]/frontend/src/components/PerpsHistoryTabs.tsx [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false,
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex gap-4 mb-4",
                    children: Array.from({
                        length: 4
                    }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-4 w-20 bg-dark-50/40 rounded animate-pulse"
                        }, i, false, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 118,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)))
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                    lineNumber: 116,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-2",
                    children: Array.from({
                        length: 3
                    }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-6 bg-dark-50/40 rounded animate-pulse"
                        }, i, false, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 123,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)))
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                    lineNumber: 121,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
            lineNumber: 115,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
});
_c4 = PerpsHistoryTabs;
const FundingRateChart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/frontend/src/components/FundingRateChart.tsx [app-client] (ecmascript, next/dynamic entry, async loader)").then((m)=>({
            default: m.FundingRateChart
        })), {
    loadableGenerated: {
        modules: [
            "[project]/frontend/src/components/FundingRateChart.tsx [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false,
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between mb-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-4 w-36 bg-dark-50/40 rounded animate-pulse"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 138,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-1",
                            children: Array.from({
                                length: 3
                            }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-6 w-10 bg-dark-50/40 rounded animate-pulse"
                                }, i, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 141,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)))
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 139,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                    lineNumber: 137,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full bg-dark-50/30 rounded-xl animate-pulse",
                    style: {
                        height: 200
                    }
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                    lineNumber: 145,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
            lineNumber: 136,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
});
_c5 = FundingRateChart;
const OpenPositions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/frontend/src/components/OpenPositions.tsx [app-client] (ecmascript, next/dynamic entry, async loader)").then((m)=>({
            default: m.OpenPositions
        })), {
    loadableGenerated: {
        modules: [
            "[project]/frontend/src/components/OpenPositions.tsx [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false,
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "px-3 py-6 text-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-4 w-32 bg-dark-50/40 rounded animate-pulse mx-auto"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 157,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
            lineNumber: 156,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
});
_c6 = OpenPositions;
const TIMEFRAMES = [
    '1D',
    '1W',
    '1M',
    '3M',
    '1Y'
];
function PairSelector({ pairs, selected, onSelect }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ScrollStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ScrollStrip"], {
        className: "flex gap-1.5 pb-1",
        ariaLabel: "Select perpetual market pair",
        children: pairs.map((p)=>{
            const isActive = selected === p.symbol;
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>onSelect(p.symbol),
                className: `shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${isActive ? 'bg-goodgreen/15 text-goodgreen border border-goodgreen/20' : 'text-gray-400 hover:text-white bg-dark-50/50 border border-transparent'}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "block font-semibold",
                        children: p.symbol
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 173,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "flex items-center gap-1.5 mt-0.5",
                        style: {
                            fontVariantNumeric: 'tabular-nums'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: isActive ? 'text-goodgreen/80' : 'text-gray-500',
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(p.markPrice)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 175,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$percentage$2d$change$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PercentageChange"], {
                                value: p.change24h,
                                decimals: 1,
                                showSign: true,
                                size: "xs"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 176,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 174,
                        columnNumber: 13
                    }, this)
                ]
            }, p.symbol, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 171,
                columnNumber: 11
            }, this);
        })
    }, void 0, false, {
        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
        lineNumber: 167,
        columnNumber: 5
    }, this);
}
_c7 = PairSelector;
function PairInfoBar({ pair }) {
    // Mobile (≤640px): 2-column grid of stacked label/value tiles, so each
    // stat reads as a single unit. Desktop (≥640px): inline flex-wrap, identical
    // to the previous layout. See task 0099.
    const tileCls = "flex flex-col sm:flex-row sm:items-baseline";
    const labelCls = "text-[10px] uppercase tracking-wide text-gray-500 sm:text-xs sm:normal-case sm:tracking-normal";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-testid": "pair-info-bar",
        className: "grid grid-cols-2 sm:flex sm:flex-wrap gap-x-3 gap-y-2 sm:gap-x-6 sm:gap-y-0 text-xs py-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: tileCls,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: labelCls,
                        children: "Mark"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 198,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-white font-medium sm:ml-1.5",
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(pair.markPrice)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 199,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 197,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: tileCls,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: labelCls,
                        children: "24h"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 202,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-medium sm:ml-1.5",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$percentage$2d$change$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PercentageChange"], {
                            value: pair.change24h,
                            decimals: 2,
                            showSign: true,
                            size: "sm"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 204,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 203,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 201,
                columnNumber: 7
            }, this),
            pair.high24h != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: tileCls,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: labelCls,
                        children: "24h H"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 209,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-green-400 font-medium sm:ml-1.5",
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(pair.high24h)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 210,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 208,
                columnNumber: 9
            }, this),
            pair.low24h != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: tileCls,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: labelCls,
                        children: "24h L"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 215,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-red-400 font-medium sm:ml-1.5",
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(pair.low24h)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 216,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 214,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: tileCls,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: labelCls,
                        children: "Vol"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 220,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-white font-medium sm:ml-1.5",
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatLargeValue"])(pair.volume24h)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 221,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 219,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: tileCls,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: labelCls,
                        children: "Funding"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 224,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `font-medium sm:ml-1.5 ${pair.fundingRate >= 0 ? 'text-green-400' : 'text-red-400'}`,
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatFundingRate"])(pair.fundingRate)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 225,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 223,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: tileCls,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: labelCls,
                        children: "Funding in"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 230,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-300 sm:ml-1.5",
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getFundingCountdown"])(pair.nextFundingTime)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 231,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 229,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: tileCls,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: labelCls,
                        children: "OI"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 234,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-white font-medium sm:ml-1.5",
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatLargeValue"])(pair.openInterest)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 235,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 233,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
        lineNumber: 193,
        columnNumber: 5
    }, this);
}
_c8 = PairInfoBar;
function LeverageSlider({ value, onChange, max }) {
    const presets = [
        1,
        2,
        5,
        10,
        25,
        max
    ].filter((v, i, a)=>v <= max && a.indexOf(v) === i).sort((a, b)=>a - b);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mb-1.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        htmlFor: "leverage-slider",
                        className: "text-xs text-gray-400",
                        children: "Leverage"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 246,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-sm font-bold text-goodgreen",
                        children: [
                            value,
                            "x"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 247,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 245,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                id: "leverage-slider",
                type: "range",
                min: 1,
                max: max,
                step: 1,
                value: value,
                onChange: (e)=>onChange(parseInt(e.target.value)),
                className: "w-full h-1.5 bg-dark-50 rounded-full appearance-none cursor-pointer accent-goodgreen"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 249,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between mt-1",
                children: presets.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>onChange(p),
                        className: `text-xs min-h-[44px] flex-1 rounded transition-colors ${value === p ? 'text-goodgreen font-medium' : 'text-gray-500 hover:text-gray-300'}`,
                        children: [
                            p,
                            "x"
                        ]
                    }, p, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 253,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 251,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
        lineNumber: 244,
        columnNumber: 5
    }, this);
}
_c9 = LeverageSlider;
function OrderForm({ pair, account, marketId }) {
    _s1();
    const [side, setSide] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('long');
    const [orderType, setOrderType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('market');
    const [size, setSize] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [limitPrice, setLimitPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [triggerPrice, setTriggerPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [leverage, setLeverage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(10);
    const [marginMode, setMarginMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('cross');
    const [submitted, setSubmitted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showTpSl, setShowTpSl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showAdvanced, setShowAdvanced] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [tp, setTp] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [sl, setSl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const walletReady = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$WalletReadyContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWalletReady"])();
    const { address } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    const { openPosition, phase: perpPhase, error: perpError, isDeployed } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerps$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOpenPosition"])();
    const syncGuard = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useSymbolSyncGuard$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSymbolSyncGuard"])(pair.baseAsset, 'perps');
    const syncBlocked = !syncGuard.allowRiskIncrease;
    const marginCollateral = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].MarginVault,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MarginVaultABI"],
        functionName: 'collateral',
        query: {
            enabled: !!__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].MarginVault,
            retry: false
        }
    }).data;
    // Read wallet collateral as soon as the wallet connects. While MarginVault
    // collateral() is still loading, fall back to GoodDollarToken so margin math
    // does not briefly treat wallet G$ as zero and disable the submit button.
    const walletCollateral = marginCollateral ?? __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].GoodDollarToken;
    const walletG$Result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: walletCollateral,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ERC20ABI"],
        functionName: 'balanceOf',
        args: address ? [
            address
        ] : undefined,
        query: {
            enabled: !!address,
            refetchInterval: 10_000,
            retry: false
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "OrderForm.useEffect": ()=>{
            if (leverage > pair.maxLeverage) {
                setLeverage(pair.maxLeverage);
            }
        }
    }["OrderForm.useEffect"], [
        pair.maxLeverage,
        leverage
    ]);
    // Reset market-relative price fields when the user switches pairs.
    // Without this, a $1,900 limit price typed for ETH-USD would persist
    // when switching to SOL-USD (~$134) and submit at the wrong price.
    // User preferences (side, orderType, leverage, marginMode, size) are
    // intentionally preserved.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "OrderForm.useEffect": ()=>{
            setLimitPrice('');
            setTriggerPrice('');
            setTp('');
            setSl('');
        }
    }["OrderForm.useEffect"], [
        pair.symbol
    ]);
    const sizeNum = parseFloat(size) || 0;
    const parsedLimitPrice = parseFloat(limitPrice);
    const limitPriceInvalid = orderType !== 'market' && limitPrice !== '' && (isNaN(parsedLimitPrice) || parsedLimitPrice <= 0);
    const parsedTriggerPrice = parseFloat(triggerPrice);
    const triggerPriceInvalid = orderType === 'stop-limit' && triggerPrice !== '' && (isNaN(parsedTriggerPrice) || parsedTriggerPrice <= 0);
    // Side-aware semantic validation for stop-limit orders. For longs the
    // trigger must be strictly above mark and the limit ≥ trigger; for shorts
    // the trigger must be strictly below mark and the limit ≤ trigger.
    const stopLimitCheck = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsStopLimitValidation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateStopLimitOrder"])({
        orderType,
        side,
        markPrice: pair.markPrice,
        triggerPrice,
        limitPrice
    });
    const hasValidPrice = orderType === 'market' || parsedLimitPrice > 0 && (orderType !== 'stop-limit' || parsedTriggerPrice > 0);
    const effectivePrice = orderType === 'market' ? pair.markPrice : parsedLimitPrice > 0 ? parsedLimitPrice : 0;
    const notional = sizeNum * effectivePrice;
    const marginRequired = effectivePrice > 0 ? notional / leverage : 0;
    const GD_PRICE_USD = 0.01;
    const feeRate = orderType === 'market' ? 0.001 : 0.0002 // on-chain market fee is 0.1%
    ;
    const fee = notional * feeRate;
    const ubiFee = fee * 0.33;
    const marginRequiredGD = effectivePrice > 0 ? marginRequired / GD_PRICE_USD : 0;
    const feeGD = orderType === 'market' ? notional / GD_PRICE_USD * feeRate : 0;
    const totalRequiredGD = marginRequiredGD + feeGD;
    const walletG$ = walletG$Result.data ? Number(walletG$Result.data) / 1e18 : 0;
    const liqPrice = effectivePrice > 0 ? side === 'long' ? effectivePrice * (1 - 0.9 / leverage) : effectivePrice * (1 + 0.9 / leverage) : 0;
    const parsedTp = parseFloat(tp);
    const parsedSl = parseFloat(sl);
    const tpInvalid = tp !== '' && (isNaN(parsedTp) || parsedTp <= 0 || side === 'long' && effectivePrice > 0 && parsedTp <= effectivePrice || side === 'short' && effectivePrice > 0 && parsedTp >= effectivePrice);
    const slInvalid = sl !== '' && (isNaN(parsedSl) || parsedSl <= 0 || side === 'long' && effectivePrice > 0 && parsedSl >= effectivePrice || side === 'short' && effectivePrice > 0 && parsedSl <= effectivePrice);
    const tpPnl = !isNaN(parsedTp) && parsedTp > 0 && sizeNum > 0 ? side === 'long' ? (parsedTp - effectivePrice) * sizeNum : (effectivePrice - parsedTp) * sizeNum : 0;
    const slPnl = !isNaN(parsedSl) && parsedSl > 0 && sizeNum > 0 ? side === 'long' ? (parsedSl - effectivePrice) * sizeNum : (effectivePrice - parsedSl) * sizeNum : 0;
    const availableFundingGD = account.availableMargin + walletG$;
    const walletBalanceReady = !address || !walletG$Result.isLoading;
    const exceedsMargin = sizeNum > 0 && walletBalanceReady && totalRequiredGD > availableFundingGD;
    // Calculate max size based on vault + wallet G$ that can be auto-deposited
    const availableFundingUsd = availableFundingGD * GD_PRICE_USD;
    const maxSize = effectivePrice > 0 ? availableFundingUsd * leverage / effectivePrice : 0;
    const notionalValue = sizeNum * effectivePrice;
    const handleSubmit = async (e)=>{
        e.preventDefault();
        if (sizeNum <= 0 || exceedsMargin || !hasValidPrice || limitPriceInvalid || triggerPriceInvalid || stopLimitCheck.triggerWrongSide || stopLimitCheck.limitVsTriggerWrong || syncBlocked) return;
        if (isDeployed && orderType === 'market') {
            // Convert to G$ wei (18 decimals). Assume G$ ≈ $0.01 on devnet.
            // Route through toG$Wei (parseUnits) — never `Math.round(x * 1e18)`,
            // which drifts by tens of millions of wei on realistic positions.
            const notionalGD = notional / GD_PRICE_USD;
            const marginGD = marginRequired / GD_PRICE_USD;
            const sizeWei = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$gDollarAmount$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toG$Wei"])(notionalGD);
            const marginWei = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$gDollarAmount$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toG$Wei"])(marginGD);
            await openPosition(BigInt(marketId), marginWei, sizeWei, side === 'long');
        } else {
            // Limit/stop orders or contracts not deployed: UI-only preview
            setSubmitted(true);
            setTimeout(()=>setSubmitted(false), 3000);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        onSubmit: handleSubmit,
        className: "space-y-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setSide('long'),
                        className: `flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${side === 'long' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-dark-50/50 text-gray-400 border border-transparent'}`,
                        children: "Long"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 412,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setSide('short'),
                        className: `flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${side === 'short' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-dark-50/50 text-gray-400 border border-transparent'}`,
                        children: "Short"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 416,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 411,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-1",
                children: [
                    'market',
                    'limit',
                    'stop-limit'
                ].map((ot)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setOrderType(ot),
                        className: `flex-1 px-2 min-h-[44px] rounded-lg text-xs font-medium capitalize transition-colors ${orderType === ot ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`,
                        children: ot
                    }, ot, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 424,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 422,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LeverageSlider, {
                value: leverage,
                onChange: setLeverage,
                max: pair.maxLeverage
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 431,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>setShowAdvanced(!showAdvanced),
                        className: "text-[11px] text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1",
                        children: [
                            showAdvanced ? '▾' : '▸',
                            " Advanced Options",
                            marginMode === 'isolated' && !showAdvanced && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] text-gray-600 ml-1",
                                children: "Isolated"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 438,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 434,
                        columnNumber: 9
                    }, this),
                    showAdvanced && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-3 mt-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "text-xs text-gray-400 mb-1 block",
                                        children: "Margin Mode"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                        lineNumber: 444,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setMarginMode('cross'),
                                                className: `flex-1 min-h-[44px] rounded text-xs font-medium transition-colors ${marginMode === 'cross' ? 'bg-dark-50 text-white' : 'text-gray-500'}`,
                                                children: "Cross"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                                lineNumber: 446,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setMarginMode('isolated'),
                                                className: `flex-1 min-h-[44px] rounded text-xs font-medium transition-colors ${marginMode === 'isolated' ? 'bg-dark-50 text-white' : 'text-gray-500'}`,
                                                children: "Isolated"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                                lineNumber: 450,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                        lineNumber: 445,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 443,
                                columnNumber: 13
                            }, this),
                            effectivePrice > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "text-xs text-gray-400 mb-1 block",
                                        children: "Quick Size"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                        lineNumber: 458,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-1",
                                        children: [
                                            0.25,
                                            0.5,
                                            0.75,
                                            1
                                        ].map((pct)=>{
                                            const availableFundingGD = account.availableMargin + walletG$;
                                            const availableFundingUsd = availableFundingGD * GD_PRICE_USD;
                                            const maxSize = effectivePrice > 0 ? availableFundingUsd * leverage / effectivePrice : 0;
                                            const targetSize = maxSize * pct;
                                            const decimals = effectivePrice >= 10000 ? 4 : effectivePrice >= 100 ? 3 : effectivePrice >= 1 ? 2 : 0;
                                            const rounded = parseFloat(targetSize.toFixed(decimals));
                                            const isActive = sizeNum > 0 && Math.abs(sizeNum - rounded) < 10 ** -decimals * 0.6;
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setSize(rounded.toString()),
                                                className: `flex-1 min-h-[44px] rounded text-xs font-medium transition-colors ${isActive ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-500 hover:text-gray-300 bg-dark-50/30'}`,
                                                children: [
                                                    pct * 100,
                                                    "%"
                                                ]
                                            }, pct, true, {
                                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                                lineNumber: 469,
                                                columnNumber: 23
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                        lineNumber: 459,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 457,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 442,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 433,
                columnNumber: 7
            }, this),
            orderType === 'stop-limit' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "text-xs text-gray-400 mb-1 block",
                        children: "Trigger Price"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 484,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        inputMode: "decimal",
                        placeholder: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(pair.markPrice),
                        value: triggerPrice,
                        onChange: (e)=>setTriggerPrice((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumericInput"])(e.target.value)),
                        className: `w-full px-3 py-2 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${triggerPriceInvalid || stopLimitCheck.triggerWrongSide ? 'border-red-500/50' : 'border-gray-700/30'}`
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 485,
                        columnNumber: 11
                    }, this),
                    triggerPriceInvalid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-red-400 text-[10px] mt-1",
                        children: "Price must be greater than 0"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 489,
                        columnNumber: 13
                    }, this),
                    !triggerPriceInvalid && stopLimitCheck.triggerErrorMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-red-400 text-[10px] mt-1",
                        children: stopLimitCheck.triggerErrorMessage
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 492,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 483,
                columnNumber: 9
            }, this),
            orderType !== 'market' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "text-xs text-gray-400 mb-1 block",
                        children: "Limit Price"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 499,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        inputMode: "decimal",
                        placeholder: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(pair.markPrice),
                        value: limitPrice,
                        onChange: (e)=>setLimitPrice((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumericInput"])(e.target.value)),
                        className: `w-full px-3 py-2 rounded-xl bg-dark-50 border text-white text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${limitPriceInvalid || stopLimitCheck.limitVsTriggerWrong ? 'border-red-500/50' : 'border-gray-700/30'}`
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 500,
                        columnNumber: 11
                    }, this),
                    limitPriceInvalid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-red-400 text-[10px] mt-1",
                        children: "Price must be greater than 0"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 504,
                        columnNumber: 13
                    }, this),
                    !limitPriceInvalid && stopLimitCheck.limitErrorMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-red-400 text-[10px] mt-1",
                        children: stopLimitCheck.limitErrorMessage
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 507,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 498,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "text-xs text-gray-400 mb-1 block",
                        children: [
                            "Size (",
                            pair.baseAsset,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 513,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$amount$2d$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AmountInput"], {
                        value: size,
                        onChange: (next)=>setSize((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsInput$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["boundPerpsSize"])(next)),
                        maxValue: maxSize,
                        maxValueLabel: "max size",
                        symbol: pair.baseAsset,
                        usdValue: notionalValue,
                        error: exceedsMargin ? `Needs ${formatG$Amount(totalRequiredGD)} total; available ${formatG$Amount(availableFundingGD)}` : false,
                        placeholder: "0.00"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 514,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 512,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                                    tp ? `TP ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(parsedTp)}` : '',
                                    tp && sl ? ' / ' : '',
                                    sl ? `SL ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(parsedSl)}` : ''
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 531,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 527,
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
                                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                        lineNumber: 539,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$amount$2d$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AmountInput"], {
                                        value: tp,
                                        onChange: setTp,
                                        symbol: "USD",
                                        showMaxButton: false,
                                        error: tpInvalid && tp !== '' ? side === 'long' ? 'TP must be above entry price' : 'TP must be below entry price' : false,
                                        placeholder: side === 'long' ? `Above ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(effectivePrice)}` : `Below ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(effectivePrice)}`
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                        lineNumber: 540,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 538,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "text-xs text-gray-400 mb-1 block",
                                        children: "Stop Loss"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                        lineNumber: 550,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$amount$2d$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AmountInput"], {
                                        value: sl,
                                        onChange: setSl,
                                        symbol: "USD",
                                        showMaxButton: false,
                                        error: slInvalid && sl !== '' ? side === 'long' ? 'SL must be below entry price' : 'SL must be above entry price' : false,
                                        placeholder: side === 'long' ? `Below ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(effectivePrice)}` : `Above ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(effectivePrice)}`
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                        lineNumber: 551,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 549,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 537,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 526,
                columnNumber: 7
            }, this),
            sizeNum > 0 && hasValidPrice && effectivePrice > 0 && (()=>{
                // When the user enters a wildly oversized trade (e.g. pasting a
                // 21-digit value into Size), the summary rows would otherwise
                // render `$104.97Q` (quintillion notation) which reads as a
                // broken number rather than "this is impossible". Use 10× the
                // current max trade as the cap; anything beyond that gets a
                // single red explanation line instead of the full block. When
                // maxSize is 0 (no margin), fall back to MAX_SAFE_INTEGER so a
                // missing margin doesn't accidentally hide the summary for
                // normal trades.
                const summaryCap = maxSize > 0 ? maxSize * 10 : Number.MAX_SAFE_INTEGER;
                if (sizeNum > summaryCap) {
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[11px] text-red-400 text-center",
                        "data-testid": "perps-size-exceeds-cap",
                        children: [
                            "Trade size exceeds available margin",
                            maxSize > 0 ? ` (max ≈ ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(maxSize)} ${pair.baseAsset})` : ''
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 577,
                        columnNumber: 13
                    }, this);
                }
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-1 text-xs",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between text-gray-400",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Notional"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 585,
                                    columnNumber: 65
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-white truncate ml-2",
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(notional)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 585,
                                    columnNumber: 86
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 585,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between text-gray-400",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Margin"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 586,
                                    columnNumber: 65
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-white truncate ml-2",
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(marginRequired)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 586,
                                    columnNumber: 84
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 586,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between text-gray-400",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Liq. Price"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 587,
                                    columnNumber: 65
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-yellow-400 truncate ml-2",
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(liqPrice)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 587,
                                    columnNumber: 88
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 587,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between text-gray-400",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        "Fee (",
                                        orderType === 'market' ? '0.10%' : '0.02%',
                                        ")"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 588,
                                    columnNumber: 65
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-white truncate ml-2",
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatLargeValue"])(fee)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 588,
                                    columnNumber: 128
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 588,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between text-goodgreen",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "→ UBI (33%)"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 589,
                                    columnNumber: 66
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "truncate ml-2",
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatLargeValue"])(ubiFee)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 589,
                                    columnNumber: 90
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 589,
                            columnNumber: 13
                        }, this),
                        tpPnl !== 0 && !tpInvalid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between text-gray-400",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "TP P&L"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 591,
                                    columnNumber: 67
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "truncate ml-2",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$price$2d$display$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceDisplay"], {
                                        value: tpPnl,
                                        prefix: "$",
                                        showSign: true,
                                        size: "xs",
                                        showContext: true,
                                        contextLabel: "if hit"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                        lineNumber: 591,
                                        columnNumber: 118
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 591,
                                    columnNumber: 86
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 591,
                            columnNumber: 15
                        }, this),
                        slPnl !== 0 && !slInvalid && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between text-gray-400",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "SL P&L"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 594,
                                    columnNumber: 67
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "truncate ml-2",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$price$2d$display$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceDisplay"], {
                                        value: slPnl,
                                        prefix: "$",
                                        showSign: true,
                                        size: "xs",
                                        showContext: true,
                                        contextLabel: "if hit"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                        lineNumber: 594,
                                        columnNumber: 118
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 594,
                                    columnNumber: 86
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 594,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                    lineNumber: 584,
                    columnNumber: 11
                }, this);
            })(),
            perpError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[10px] text-red-400 text-center truncate",
                children: perpError
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 601,
                columnNumber: 9
            }, this),
            syncBlocked && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[10px] text-red-400 text-center",
                children: syncGuard.reason ?? 'Risk-increasing action blocked until symbol sync reaches current oracle block.'
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 604,
                columnNumber: 9
            }, this),
            walletReady ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(WalletGatedTradeButton, {
                hasSize: sizeNum > 0,
                exceedsMargin: exceedsMargin,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "submit",
                    disabled: exceedsMargin || limitPriceInvalid || triggerPriceInvalid || stopLimitCheck.triggerWrongSide || stopLimitCheck.limitVsTriggerWrong || !hasValidPrice || perpPhase === 'approving' || perpPhase === 'pending' || syncBlocked,
                    className: `w-full py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${side === 'long' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`,
                    children: perpPhase === 'approving' ? 'Approving…' : perpPhase === 'pending' ? 'Confirming…' : perpPhase === 'done' ? 'Order Placed!' : submitted ? 'Order Placed!' : `${side === 'long' ? 'Long' : 'Short'} ${pair.baseAsset}`
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                    lineNumber: 610,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 609,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "submit",
                disabled: sizeNum <= 0 || exceedsMargin || limitPriceInvalid || triggerPriceInvalid || stopLimitCheck.triggerWrongSide || stopLimitCheck.limitVsTriggerWrong || !hasValidPrice || syncBlocked,
                className: `w-full py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${side === 'long' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`,
                children: submitted ? 'Order Placed!' : `${side === 'long' ? 'Long' : 'Short'} ${pair.baseAsset}`
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 619,
                columnNumber: 9
            }, this),
            sizeNum <= 0 && size !== '' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-center text-[10px] text-gray-500",
                children: "Enter a valid size to place order"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 628,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-center gap-1.5 text-[10px] text-goodgreen",
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
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 632,
                            columnNumber: 74
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 632,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Fees → 33% funds UBI"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 633,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 631,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
        lineNumber: 410,
        columnNumber: 5
    }, this);
}
_s1(OrderForm, "sfgumV6GklBPdlh8sKATqFOMZfc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$WalletReadyContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWalletReady"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerps$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOpenPosition"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useSymbolSyncGuard$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSymbolSyncGuard"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"]
    ];
});
_c10 = OrderForm;
function AccountPanel() {
    _s2();
    const { summary: account } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPerps$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOnChainAccountSummary"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-2.5 text-xs",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-sm font-semibold text-white mb-3",
                children: "Account"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 643,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-400",
                        children: "Balance"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 645,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$price$2d$display$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceDisplay"], {
                        value: account.balance,
                        prefix: "$",
                        size: "sm",
                        compact: true,
                        variant: "default",
                        className: "text-white"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 646,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 644,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-400",
                        children: "Equity"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 649,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$price$2d$display$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceDisplay"], {
                        value: account.equity,
                        prefix: "$",
                        size: "sm",
                        compact: true,
                        variant: "default",
                        className: "text-white"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 650,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 648,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-400",
                        children: "Unrealized P&L"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 653,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-medium",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$price$2d$display$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceDisplay"], {
                            value: account.unrealizedPnl,
                            prefix: "$",
                            showSign: true,
                            size: "sm",
                            showContext: true,
                            contextLabel: "open positions"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 655,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 654,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 652,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-400",
                        children: "Margin Used"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 659,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$price$2d$display$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceDisplay"], {
                        value: account.marginUsed,
                        prefix: "$",
                        size: "sm",
                        compact: true,
                        variant: "default",
                        className: "text-white"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 660,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 658,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-400",
                        children: "Available"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 663,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$price$2d$display$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceDisplay"], {
                        value: account.availableMargin,
                        prefix: "$",
                        size: "sm",
                        compact: true,
                        variant: "accent"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 664,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 662,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pt-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between mb-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-400",
                                children: "Margin Ratio"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 668,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-white font-medium",
                                children: [
                                    (account.marginRatio * 100).toFixed(1),
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 669,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 667,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-1.5 bg-dark-50 rounded-full overflow-hidden",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-full bg-goodgreen rounded-full transition-all",
                            style: {
                                width: `${account.marginRatio * 100}%`
                            }
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 672,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 671,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 666,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
        lineNumber: 642,
        columnNumber: 5
    }, this);
}
_s2(AccountPanel, "QiLfXeRb2t80f1cBEmJVBce2xd4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPerps$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOnChainAccountSummary"]
    ];
});
_c11 = AccountPanel;
function formatG$Amount(value) {
    if (!Number.isFinite(value)) return '0 G$';
    return `${new Intl.NumberFormat('en-US', {
        maximumFractionDigits: value >= 1000 ? 0 : 2
    }).format(value)} G$`;
}
function MarginFundingPanel() {
    _s3();
    const { address, isConnected } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    const { writeContractAsync } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWriteContract"])();
    const [amount, setAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [phase, setPhase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const collateralToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].MarginVault,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MarginVaultABI"],
        functionName: 'collateral',
        query: {
            enabled: !!__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].MarginVault,
            retry: false
        }
    }).data;
    const walletBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: collateralToken,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ERC20ABI"],
        functionName: 'balanceOf',
        args: address ? [
            address
        ] : undefined,
        query: {
            enabled: !!(address && collateralToken),
            refetchInterval: 10_000,
            retry: false
        }
    });
    const marginBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].MarginVault,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MarginVaultABI"],
        functionName: 'balances',
        args: address ? [
            address
        ] : undefined,
        query: {
            enabled: !!address,
            refetchInterval: 10_000,
            retry: false
        }
    });
    const walletG$ = walletBalance.data ? Number(walletBalance.data) / 1e18 : 0;
    const marginG$ = marginBalance.data ? Number(marginBalance.data) / 1e18 : 0;
    const amountNum = parseFloat(amount) || 0;
    const invalidAmount = amount !== '' && (amountNum <= 0 || amountNum > walletG$);
    const deposit = async (e)=>{
        e.preventDefault();
        if (!isConnected || amountNum <= 0 || invalidAmount) return;
        try {
            setError('');
            const amountWei = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$gDollarAmount$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toG$Wei"])(amountNum);
            if (!collateralToken) {
                setError('Perps margin vault is not configured');
                setPhase('error');
                return;
            }
            setPhase('approving');
            await writeContractAsync({
                address: collateralToken,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ERC20ABI"],
                functionName: 'approve',
                args: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].MarginVault,
                    amountWei
                ]
            });
            setPhase('depositing');
            await writeContractAsync({
                address: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].MarginVault,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MarginVaultABI"],
                functionName: 'deposit',
                args: [
                    amountWei
                ]
            });
            setPhase('done');
            setAmount('');
            void walletBalance.refetch();
            void marginBalance.refetch();
        } catch (err) {
            const e = err;
            setError(e?.shortMessage ?? e?.message ?? 'Deposit failed');
            setPhase('error');
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        onSubmit: deposit,
        className: "space-y-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-sm font-semibold text-white",
                        children: "Deposit Margin"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 762,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[11px] text-gray-500 mt-1",
                        children: "GoodPerps margin uses G$ collateral. WETH stays in your wallet for other dapps."
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 763,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 761,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-2 gap-2 text-xs",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl bg-dark-50/40 border border-gray-700/20 p-2.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-gray-500",
                                children: "Wallet G$"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 768,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-white font-medium mt-0.5",
                                children: formatG$Amount(walletG$)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 769,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 767,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl bg-dark-50/40 border border-gray-700/20 p-2.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-gray-500",
                                children: "Perps margin"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 772,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-goodgreen font-medium mt-0.5",
                                children: formatG$Amount(marginG$)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 773,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 771,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 766,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$amount$2d$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AmountInput"], {
                value: amount,
                onChange: (next)=>setAmount((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumericInput"])(next)),
                maxValue: walletG$,
                maxValueLabel: "wallet",
                symbol: "G$",
                error: invalidAmount ? 'Amount exceeds wallet G$ balance' : false,
                placeholder: "0.00"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 777,
                columnNumber: 7
            }, this),
            !isConnected ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$rainbow$2d$me$2f$rainbowkit$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["ConnectButton"].Custom, {
                children: ({ openConnectModal })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: openConnectModal,
                        className: "w-full py-2.5 rounded-xl font-semibold text-sm bg-goodgreen text-black hover:bg-goodgreen/90 transition-colors",
                        children: "Connect Wallet to Deposit"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 790,
                        columnNumber: 13
                    }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 788,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "submit",
                disabled: amountNum <= 0 || invalidAmount || phase === 'approving' || phase === 'depositing',
                className: "w-full py-2.5 rounded-xl font-semibold text-sm bg-goodgreen text-black hover:bg-goodgreen/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                children: phase === 'approving' ? 'Approving G$…' : phase === 'depositing' ? 'Depositing…' : phase === 'done' ? 'Deposited!' : 'Deposit to Perps'
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 797,
                columnNumber: 9
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-[10px] text-red-400 text-center truncate",
                children: error
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 806,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
        lineNumber: 760,
        columnNumber: 5
    }, this);
}
_s3(MarginFundingPanel, "QCfNnCscWry2HmU+197uHx7KE8Y=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWriteContract"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"]
    ];
});
_c12 = MarginFundingPanel;
function PerpsPage() {
    _s4();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const { pairs } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPerps$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOnChainPairs"])();
    const { summary: account } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPerps$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOnChainAccountSummary"])();
    const [selectedSymbol, setSelectedSymbol] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "PerpsPage.useState": ()=>searchParams.get('market') || 'BTC-USD'
    }["PerpsPage.useState"]);
    const [timeframe, setTimeframe] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('1M');
    const [mobileTab, setMobileTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('trade');
    const [indicators, setIndicators] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$indicators$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_INDICATORS"]);
    const toggleIndicator = (id)=>{
        setIndicators((prev)=>({
                ...prev,
                [id]: !prev[id]
            }));
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PerpsPage.useEffect": ()=>{
            const market = searchParams.get('market');
            if (market && pairs.some({
                "PerpsPage.useEffect": (p)=>p.symbol === market
            }["PerpsPage.useEffect"])) {
                setSelectedSymbol(market);
            }
        }
    }["PerpsPage.useEffect"], [
        searchParams,
        pairs
    ]);
    const pair = pairs.find((p)=>p.symbol === selectedSymbol) ?? pairs[0];
    const { sources: priceSources } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerpsPriceSources$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePerpsPriceSources"])();
    const activePairSource = pair ? priceSources[pair.symbol] ?? 'unknown' : 'unknown';
    const chartData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "PerpsPage.useMemo[chartData]": ()=>{
            if (!pair) return [];
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chartData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChartData"])(pair.symbol, timeframe, pair.markPrice);
        }
    }["PerpsPage.useMemo[chartData]"], [
        pair,
        timeframe
    ]);
    if (!pair) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-6xl mx-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mb-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-3",
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
                                    d: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 851,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 850,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 849,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-xl font-bold text-white",
                                    children: "Perpetual Futures"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 855,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-gray-400",
                                    children: [
                                        "Perpetual Trading with up to ",
                                        pair.maxLeverage,
                                        "x leverage. Every fee funds UBI."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 856,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 854,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                    lineNumber: 848,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 847,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PerpsPriceStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerpsPriceStrip"], {
                    activeSymbol: selectedSymbol
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                    lineNumber: 862,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 861,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PairSelector, {
                pairs: pairs,
                selected: selectedSymbol,
                onSelect: setSelectedSymbol
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 865,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-3 mt-3 mb-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between gap-2 mb-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-gray-400",
                                children: "Active pair"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 869,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "data-testid": activePairSource === 'closed' ? 'perps-market-closed' : 'perps-source-badge',
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceSourceBadge"], {
                                    source: activePairSource,
                                    size: "sm"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 873,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 870,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 868,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PairInfoBar, {
                        pair: pair
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 876,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3 pt-1 text-xs",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: `/explore/${pair.baseAsset === 'BTC' ? 'WBTC' : pair.baseAsset}`,
                                className: "text-gray-500 hover:text-goodgreen transition-colors inline-flex items-center gap-1",
                                children: [
                                    "Spot ",
                                    pair.baseAsset,
                                    " on Explore",
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
                                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                            lineNumber: 881,
                                            columnNumber: 92
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                        lineNumber: 881,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 878,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: `/?buy=${pair.baseAsset === 'BTC' ? 'WBTC' : pair.baseAsset}`,
                                className: "text-gray-500 hover:text-goodgreen transition-colors inline-flex items-center gap-1",
                                children: [
                                    "Swap ",
                                    pair.baseAsset,
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
                                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                            lineNumber: 886,
                                            columnNumber: 92
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                        lineNumber: 886,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 883,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 877,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 867,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "lg:hidden flex gap-1 mb-3",
                children: [
                    'chart',
                    'book',
                    'trade'
                ].map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setMobileTab(tab),
                        className: `flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${mobileTab === tab ? 'bg-goodgreen/15 text-goodgreen border border-goodgreen/20' : 'text-gray-400 bg-dark-50/50 border border-transparent hover:text-white'}`,
                        children: tab
                    }, tab, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 894,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 892,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col lg:flex-row gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `flex-1 min-w-0 ${mobileTab !== 'chart' ? 'hidden lg:block' : ''}`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-4 overflow-hidden",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between gap-2 mb-3 min-w-0",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ScrollStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ScrollStrip"], {
                                            className: "flex gap-1 min-w-0 flex-1",
                                            ariaLabel: "Chart timeframe",
                                            children: TIMEFRAMES.map((tf)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setTimeframe(tf),
                                                    className: `shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${timeframe === tf ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`,
                                                    children: tf
                                                }, tf, false, {
                                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                                    lineNumber: 912,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                            lineNumber: 910,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$IndicatorToggle$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["IndicatorToggle"], {
                                            indicators: indicators,
                                            onChange: toggleIndicator
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                            lineNumber: 918,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 909,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ChartErrorBoundary$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ChartErrorBoundary"], {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PriceChart, {
                                        data: chartData,
                                        height: 400,
                                        indicators: indicators
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                        lineNumber: 921,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 920,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                            lineNumber: 908,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 907,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `lg:w-80 shrink-0 space-y-4 ${mobileTab !== 'trade' ? 'hidden lg:block' : ''}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-5",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OrderForm, {
                                    pair: pair,
                                    account: account,
                                    marketId: pair.marketId
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 929,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 928,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-5",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AccountPanel, {}, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 933,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 932,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-dark-100 rounded-2xl border border-gray-700/20 p-5",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MarginFundingPanel, {}, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 937,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 936,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 927,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 905,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-3 py-2 border-b border-gray-700/20",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-xs font-semibold text-white",
                                    children: "Order Book"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 947,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 946,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OrderBook, {
                                markPrice: pair.markPrice
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 949,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 945,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-3 py-2 border-b border-gray-700/20",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-xs font-semibold text-white",
                                    children: "Recent Trades"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 954,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 953,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RecentTrades, {
                                markPrice: pair.markPrice
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 956,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 952,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "data-testid": "open-positions-panel",
                        className: "bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-3 py-2 border-b border-gray-700/20",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-xs font-semibold text-white",
                                    children: "Open Positions"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                    lineNumber: 964,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 963,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OpenPositions, {}, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                                lineNumber: 966,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                        lineNumber: 959,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 944,
                columnNumber: 7
            }, this),
            pair && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FundingRateChart, {
                    symbol: pair.symbol
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                    lineNumber: 973,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 972,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PerpsHistoryTabs, {}, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                    lineNumber: 979,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
                lineNumber: 978,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/perps/page.tsx",
        lineNumber: 846,
        columnNumber: 5
    }, this);
}
_s4(PerpsPage, "NkYQEAVWTqhqj3wH+YYdo+1NSbo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPerps$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOnChainPairs"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainPerps$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOnChainAccountSummary"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePerpsPriceSources$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePerpsPriceSources"]
    ];
});
_c13 = PerpsPage;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11, _c12, _c13;
__turbopack_context__.k.register(_c, "WalletGatedTradeButton");
__turbopack_context__.k.register(_c1, "PriceChart");
__turbopack_context__.k.register(_c2, "OrderBook");
__turbopack_context__.k.register(_c3, "RecentTrades");
__turbopack_context__.k.register(_c4, "PerpsHistoryTabs");
__turbopack_context__.k.register(_c5, "FundingRateChart");
__turbopack_context__.k.register(_c6, "OpenPositions");
__turbopack_context__.k.register(_c7, "PairSelector");
__turbopack_context__.k.register(_c8, "PairInfoBar");
__turbopack_context__.k.register(_c9, "LeverageSlider");
__turbopack_context__.k.register(_c10, "OrderForm");
__turbopack_context__.k.register(_c11, "AccountPanel");
__turbopack_context__.k.register(_c12, "MarginFundingPanel");
__turbopack_context__.k.register(_c13, "PerpsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_src_0f2nz3f._.js.map