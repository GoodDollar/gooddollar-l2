module.exports = [
"[project]/frontend/src/lib/perpsData.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/frontend/src/components/OrderBook.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OrderBook",
    ()=>OrderBook,
    "aggregateBookLevels",
    ()=>aggregateBookLevels,
    "generateOrderBook",
    ()=>generateOrderBook
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/perpsData.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
function aggregateBookLevels(entries, format) {
    if (entries.length === 0) return [];
    const out = [];
    let groupKey = format(entries[0].price);
    let groupPrice = entries[0].price;
    let groupSize = entries[0].size;
    let groupTotal = entries[0].total;
    for(let i = 1; i < entries.length; i++){
        const e = entries[i];
        const k = format(e.price);
        if (k === groupKey) {
            groupSize += e.size;
            if (e.total > groupTotal) groupTotal = e.total;
        } else {
            out.push({
                price: groupPrice,
                size: groupSize,
                total: groupTotal
            });
            groupKey = k;
            groupPrice = e.price;
            groupSize = e.size;
            groupTotal = e.total;
        }
    }
    out.push({
        price: groupPrice,
        size: groupSize,
        total: groupTotal
    });
    return out;
}
function generateOrderBook(midPrice, levels = 12) {
    const bids = [];
    const asks = [];
    const tickSize = midPrice > 1000 ? 1 : midPrice > 10 ? 0.01 : 0.0001;
    for(let i = 1; i <= levels; i++){
        const bidPrice = midPrice - i * tickSize * (1 + Math.random() * 0.5);
        const askPrice = midPrice + i * tickSize * (1 + Math.random() * 0.5);
        const bidSize = parseFloat((0.5 + Math.random() * 5).toFixed(3));
        const askSize = parseFloat((0.5 + Math.random() * 5).toFixed(3));
        bids.push({
            price: bidPrice,
            size: bidSize,
            total: 0
        });
        asks.push({
            price: askPrice,
            size: askSize,
            total: 0
        });
    }
    bids.sort((a, b)=>b.price - a.price);
    asks.sort((a, b)=>a.price - b.price);
    let bidSum = 0;
    for (const b of bids){
        bidSum += b.size;
        b.total = bidSum;
    }
    let askSum = 0;
    for (const a of asks){
        askSum += a.size;
        a.total = askSum;
    }
    const spread = asks[0].price - bids[0].price;
    return {
        bids,
        asks: asks.reverse(),
        spread
    };
}
// Render exactly this many rows on each side, so best bid and best ask
// are always visible (no scroll required). Six is enough vertical density
// to show meaningful depth without overflowing the sidebar.
const VISIBLE_ROWS = 6;
function OrderBook({ markPrice }) {
    const { visibleBids, visibleAsks, displaySpread, maxTotal } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const { bids, asks } = generateOrderBook(markPrice);
        // bids: best→deep order, asks: deep→best order (post-reverse).
        // Aggregate each side independently so adjacent levels that round to
        // the same display string collapse into one row.
        const aggBids = aggregateBookLevels(bids, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatPerpsPrice"]);
        const aggAsks = aggregateBookLevels(asks, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatPerpsPrice"]);
        const vBids = aggBids.slice(0, VISIBLE_ROWS) // first N = nearest the spread
        ;
        const vAsks = aggAsks.slice(-VISIBLE_ROWS) // last N = nearest the spread
        ;
        // Spread label must reflect the visible best quotes, otherwise the
        // displayed delta can disagree with the rows the user can actually see.
        const bestAsk = vAsks[vAsks.length - 1]?.price ?? 0;
        const bestBid = vBids[0]?.price ?? 0;
        const spread = Math.max(0, bestAsk - bestBid);
        const max = Math.max(vBids[vBids.length - 1]?.total ?? 0, vAsks[0]?.total ?? 0);
        return {
            visibleBids: vBids,
            visibleAsks: vAsks,
            displaySpread: spread,
            maxTotal: max
        };
    }, [
        markPrice
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-xs",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between text-gray-500 px-2 py-1.5 border-b border-gray-700/20",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Price"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/OrderBook.tsx",
                        lineNumber: 122,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Size"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/OrderBook.tsx",
                        lineNumber: 123,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Total"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/OrderBook.tsx",
                        lineNumber: 124,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                lineNumber: 121,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "divide-y divide-gray-700/5",
                children: visibleAsks.map((a, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between px-2 py-1 relative",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-y-0 right-0 bg-red-500/8 transition-all",
                                style: {
                                    width: `${a.total / maxTotal * 100}%`
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                                lineNumber: 130,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-red-400 z-10",
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(a.price)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                                lineNumber: 131,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-300 z-10",
                                children: a.size.toFixed(3)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                                lineNumber: 132,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-500 z-10",
                                children: a.total.toFixed(3)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                                lineNumber: 133,
                                columnNumber: 13
                            }, this)
                        ]
                    }, `a-${i}`, true, {
                        fileName: "[project]/frontend/src/components/OrderBook.tsx",
                        lineNumber: 129,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                lineNumber: 127,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-center py-2 border-y border-gray-700/20 bg-dark-50/30",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-white font-semibold mr-2",
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(markPrice)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/OrderBook.tsx",
                        lineNumber: 139,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-500 text-[10px]",
                        children: [
                            "Spread: ",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(displaySpread)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/OrderBook.tsx",
                        lineNumber: 140,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                lineNumber: 138,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "divide-y divide-gray-700/5",
                children: visibleBids.map((b, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between px-2 py-1 relative",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-y-0 right-0 bg-green-500/8 transition-all",
                                style: {
                                    width: `${b.total / maxTotal * 100}%`
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                                lineNumber: 146,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-green-400 z-10",
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(b.price)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                                lineNumber: 147,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-300 z-10",
                                children: b.size.toFixed(3)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                                lineNumber: 148,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-500 z-10",
                                children: b.total.toFixed(3)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                                lineNumber: 149,
                                columnNumber: 13
                            }, this)
                        ]
                    }, `b-${i}`, true, {
                        fileName: "[project]/frontend/src/components/OrderBook.tsx",
                        lineNumber: 145,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                lineNumber: 143,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/OrderBook.tsx",
        lineNumber: 120,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/RecentTrades.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RecentTrades",
    ()=>RecentTrades
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/perpsData.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
function generateRecentTrades(midPrice, count = 20) {
    const trades = [];
    const now = new Date();
    for(let i = 0; i < count; i++){
        const drift = (Math.random() - 0.5) * midPrice * 0.002;
        const side = Math.random() > 0.5 ? 'buy' : 'sell';
        const time = new Date(now.getTime() - i * (2000 + Math.random() * 8000));
        trades.push({
            price: midPrice + drift,
            size: parseFloat((0.01 + Math.random() * 3).toFixed(3)),
            side,
            time: time.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        });
    }
    return trades;
}
function RecentTrades({ markPrice }) {
    const trades = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>generateRecentTrades(markPrice), [
        markPrice
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-xs",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between text-gray-500 px-2 py-1.5 border-b border-gray-700/20",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Price"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/RecentTrades.tsx",
                        lineNumber: 41,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Size"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/RecentTrades.tsx",
                        lineNumber: 42,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Time"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/RecentTrades.tsx",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/RecentTrades.tsx",
                lineNumber: 40,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-h-[300px] overflow-y-auto divide-y divide-gray-700/5 scrollbar-none",
                tabIndex: 0,
                role: "region",
                "aria-label": "Recent trades list",
                children: trades.map((t, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between px-2 py-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: t.side === 'buy' ? 'text-green-400' : 'text-red-400',
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(t.price)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/RecentTrades.tsx",
                                lineNumber: 48,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-300",
                                children: t.size.toFixed(3)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/RecentTrades.tsx",
                                lineNumber: 49,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-500",
                                children: t.time
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/RecentTrades.tsx",
                                lineNumber: 50,
                                columnNumber: 13
                            }, this)
                        ]
                    }, i, true, {
                        fileName: "[project]/frontend/src/components/RecentTrades.tsx",
                        lineNumber: 47,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/RecentTrades.tsx",
                lineNumber: 45,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/RecentTrades.tsx",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/stocks/StockMarketData.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StockMarketData",
    ()=>StockMarketData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$OrderBook$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/OrderBook.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$RecentTrades$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/RecentTrades.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const TABS = [
    {
        id: 'orderbook',
        label: 'Order Book'
    },
    {
        id: 'trades',
        label: 'Trades'
    }
];
function StockMarketData({ markPrice }) {
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('orderbook');
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-4 bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex border-b border-gray-700/20",
                role: "tablist",
                children: TABS.map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        role: "tab",
                        "aria-selected": activeTab === tab.id,
                        onClick: ()=>setActiveTab(tab.id),
                        className: `flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${activeTab === tab.id ? 'text-white border-b-2 border-goodgreen bg-goodgreen/5' : 'text-gray-500 hover:text-gray-300'}`,
                        children: tab.label
                    }, tab.id, false, {
                        fileName: "[project]/frontend/src/components/stocks/StockMarketData.tsx",
                        lineNumber: 25,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/stocks/StockMarketData.tsx",
                lineNumber: 23,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-0",
                children: [
                    activeTab === 'orderbook' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$OrderBook$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["OrderBook"], {
                        markPrice: markPrice
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/StockMarketData.tsx",
                        lineNumber: 42,
                        columnNumber: 39
                    }, this),
                    activeTab === 'trades' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$RecentTrades$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RecentTrades"], {
                        markPrice: markPrice
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/StockMarketData.tsx",
                        lineNumber: 43,
                        columnNumber: 36
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/StockMarketData.tsx",
                lineNumber: 41,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/stocks/StockMarketData.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=frontend_src_0zt_tkj._.js.map