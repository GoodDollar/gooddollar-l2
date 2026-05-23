(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/components/OrderBook.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OrderBook",
    ()=>OrderBook,
    "aggregateBookLevels",
    ()=>aggregateBookLevels,
    "generateOrderBook",
    ()=>generateOrderBook
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/perpsData.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
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
    _s();
    const { visibleBids, visibleAsks, displaySpread, maxTotal } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "OrderBook.useMemo": ()=>{
            const { bids, asks } = generateOrderBook(markPrice);
            // bids: best→deep order, asks: deep→best order (post-reverse).
            // Aggregate each side independently so adjacent levels that round to
            // the same display string collapse into one row.
            const aggBids = aggregateBookLevels(bids, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"]);
            const aggAsks = aggregateBookLevels(asks, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"]);
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
        }
    }["OrderBook.useMemo"], [
        markPrice
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-xs",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between text-gray-500 px-2 py-1.5 border-b border-gray-700/20",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Price"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/OrderBook.tsx",
                        lineNumber: 122,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Size"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/OrderBook.tsx",
                        lineNumber: 123,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "divide-y divide-gray-700/5",
                children: visibleAsks.map((a, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between px-2 py-1 relative",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-y-0 right-0 bg-red-500/8 transition-all",
                                style: {
                                    width: `${a.total / maxTotal * 100}%`
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                                lineNumber: 130,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-red-400 z-10",
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(a.price)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                                lineNumber: 131,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-300 z-10",
                                children: a.size.toFixed(3)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                                lineNumber: 132,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-center py-2 border-y border-gray-700/20 bg-dark-50/30",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-white font-semibold mr-2",
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(markPrice)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/OrderBook.tsx",
                        lineNumber: 139,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-500 text-[10px]",
                        children: [
                            "Spread: ",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(displaySpread)
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "divide-y divide-gray-700/5",
                children: visibleBids.map((b, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between px-2 py-1 relative",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-y-0 right-0 bg-green-500/8 transition-all",
                                style: {
                                    width: `${b.total / maxTotal * 100}%`
                                }
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                                lineNumber: 146,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-green-400 z-10",
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(b.price)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                                lineNumber: 147,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-300 z-10",
                                children: b.size.toFixed(3)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OrderBook.tsx",
                                lineNumber: 148,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_s(OrderBook, "IsSH66K4CygN1JXyISK30UhvNg0=");
_c = OrderBook;
var _c;
__turbopack_context__.k.register(_c, "OrderBook");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/OrderBook.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/frontend/src/components/OrderBook.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=frontend_src_components_OrderBook_tsx_0jwa26f._.js.map