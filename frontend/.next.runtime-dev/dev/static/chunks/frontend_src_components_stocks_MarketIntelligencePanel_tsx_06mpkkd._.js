(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MarketIntelligencePanel",
    ()=>MarketIntelligencePanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
function formatEventDate(offsetDays) {
    const now = new Date();
    const date = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}
function buildFallbackHeadlines(stocks) {
    return stocks.slice(0, 5).map((stock, idx)=>({
            id: `headline-${stock.ticker}`,
            ticker: stock.ticker,
            title: `${stock.ticker} ${stock.change24h >= 0 ? 'momentum turns positive' : 'pulls back after recent run'}`,
            source: idx % 2 === 0 ? 'Market Wire' : 'Tech Ledger',
            age: `${idx + 1}h ago`
        }));
}
function MarketIntelligencePanel({ stocks, isLive, isLoading, onSelectTicker }) {
    _s();
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('gainers');
    const movers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MarketIntelligencePanel.useMemo[movers]": ()=>{
            if (stocks.length === 0) return [];
            if (mode === 'gainers') {
                return [
                    ...stocks
                ].filter({
                    "MarketIntelligencePanel.useMemo[movers]": (stock)=>stock.change24h >= 0
                }["MarketIntelligencePanel.useMemo[movers]"]).sort({
                    "MarketIntelligencePanel.useMemo[movers]": (a, b)=>b.change24h - a.change24h
                }["MarketIntelligencePanel.useMemo[movers]"]).slice(0, 5);
            }
            return [
                ...stocks
            ].filter({
                "MarketIntelligencePanel.useMemo[movers]": (stock)=>stock.change24h < 0
            }["MarketIntelligencePanel.useMemo[movers]"]).sort({
                "MarketIntelligencePanel.useMemo[movers]": (a, b)=>a.change24h - b.change24h
            }["MarketIntelligencePanel.useMemo[movers]"]).slice(0, 5);
        }
    }["MarketIntelligencePanel.useMemo[movers]"], [
        mode,
        stocks
    ]);
    const earnings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MarketIntelligencePanel.useMemo[earnings]": ()=>{
            return stocks.slice(0, 5).map({
                "MarketIntelligencePanel.useMemo[earnings]": (stock, idx)=>({
                        ticker: stock.ticker,
                        date: formatEventDate(idx + 1),
                        period: `Q${idx % 4 + 1} FY${new Date().getFullYear()}`
                    })
            }["MarketIntelligencePanel.useMemo[earnings]"]);
        }
    }["MarketIntelligencePanel.useMemo[earnings]"], [
        stocks
    ]);
    const headlines = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MarketIntelligencePanel.useMemo[headlines]": ()=>buildFallbackHeadlines(stocks)
    }["MarketIntelligencePanel.useMemo[headlines]"], [
        stocks
    ]);
    const isDemo = !isLive;
    const hasData = stocks.length > 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "mb-4 rounded-2xl border border-gray-700/20 bg-dark-100 p-3 sm:p-4",
        "aria-label": "Market Intelligence",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-3 flex items-center justify-between gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-sm font-semibold text-white",
                                children: "Market Intelligence"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 68,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-400",
                                children: "Top movers, upcoming earnings, and a quick news flow."
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 69,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                        lineNumber: 67,
                        columnNumber: 9
                    }, this),
                    isDemo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "rounded-md border border-yellow-500/25 bg-yellow-500/10 px-2 py-1 text-[10px] font-medium text-yellow-300",
                        children: "Demo intelligence data"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                        lineNumber: 72,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                lineNumber: 66,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 gap-3 lg:grid-cols-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "rounded-xl border border-gray-700/20 bg-dark-50/30 p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-2 flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-xs font-semibold uppercase tracking-wide text-gray-300",
                                        children: "Top Movers"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                        lineNumber: 81,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-1 rounded-md border border-gray-700/25 bg-dark-100/70 p-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setMode('gainers'),
                                                className: `rounded px-2 py-1 text-[11px] ${mode === 'gainers' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`,
                                                children: "Gainers"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                lineNumber: 83,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setMode('losers'),
                                                className: `rounded px-2 py-1 text-[11px] ${mode === 'losers' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`,
                                                children: "Losers"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                lineNumber: 90,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                        lineNumber: 82,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 80,
                                columnNumber: 11
                            }, this),
                            isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1.5",
                                "aria-busy": "true",
                                children: [
                                    1,
                                    2,
                                    3
                                ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "animate-pulse h-8 rounded-lg bg-dark-50/30"
                                    }, i, false, {
                                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                        lineNumber: 102,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 100,
                                columnNumber: 13
                            }, this) : !hasData ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-500",
                                children: "No movers available."
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 106,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "space-y-1.5",
                                children: movers.map((stock)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>onSelectTicker(stock.ticker),
                                            className: "flex w-full items-center justify-between rounded-lg border border-gray-700/20 bg-dark-100/60 px-2.5 py-1.5 text-xs hover:border-goodgreen/30 hover:text-white",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium text-gray-200",
                                                    children: stock.ticker
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                    lineNumber: 116,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: stock.change24h >= 0 ? 'text-green-400' : 'text-red-400',
                                                    children: [
                                                        stock.change24h >= 0 ? '+' : '',
                                                        stock.change24h.toFixed(2),
                                                        "%"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                    lineNumber: 117,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                            lineNumber: 111,
                                            columnNumber: 19
                                        }, this)
                                    }, stock.ticker, false, {
                                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                        lineNumber: 110,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 108,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                        lineNumber: 79,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "rounded-xl border border-gray-700/20 bg-dark-50/30 p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300",
                                children: "Upcoming Earnings"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 128,
                                columnNumber: 11
                            }, this),
                            isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1.5",
                                "aria-busy": "true",
                                children: [
                                    1,
                                    2,
                                    3
                                ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "animate-pulse h-8 rounded-lg bg-dark-50/30"
                                    }, i, false, {
                                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                        lineNumber: 132,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 130,
                                columnNumber: 13
                            }, this) : !hasData ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-500",
                                children: "No earnings events available."
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 136,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "space-y-1.5",
                                children: earnings.map((event)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>onSelectTicker(event.ticker),
                                            className: "flex w-full items-center justify-between rounded-lg border border-gray-700/20 bg-dark-100/60 px-2.5 py-1.5 text-xs hover:border-goodgreen/30 hover:text-white",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium text-gray-200",
                                                    children: event.ticker
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                    lineNumber: 146,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-gray-400",
                                                    children: [
                                                        event.date,
                                                        " · ",
                                                        event.period
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                    lineNumber: 147,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                            lineNumber: 141,
                                            columnNumber: 19
                                        }, this)
                                    }, `${event.ticker}-${event.period}`, false, {
                                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                        lineNumber: 140,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 138,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                        lineNumber: 127,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "rounded-xl border border-gray-700/20 bg-dark-50/30 p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300",
                                children: "News Flow"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 156,
                                columnNumber: 11
                            }, this),
                            isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1.5",
                                "aria-busy": "true",
                                children: [
                                    1,
                                    2,
                                    3
                                ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "animate-pulse h-8 rounded-lg bg-dark-50/30"
                                    }, i, false, {
                                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                        lineNumber: 160,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 158,
                                columnNumber: 13
                            }, this) : !hasData ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-500",
                                children: "No headlines available."
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 164,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "space-y-2",
                                children: headlines.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        className: "rounded-lg border border-gray-700/20 bg-dark-100/60 px-2.5 py-2 text-xs",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>onSelectTicker(item.ticker),
                                            className: "w-full text-left",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mb-1 flex items-center justify-between gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "font-semibold text-gray-200",
                                                            children: item.ticker
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                            lineNumber: 171,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-[10px] text-gray-500",
                                                            children: item.age
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                            lineNumber: 172,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                    lineNumber: 170,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-gray-300",
                                                    children: item.title
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                    lineNumber: 174,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-1 text-[10px] text-gray-500",
                                                    children: [
                                                        item.source,
                                                        " · ",
                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatStockPrice"])(stocks.find((s)=>s.ticker === item.ticker)?.price ?? 0)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                    lineNumber: 175,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                            lineNumber: 169,
                                            columnNumber: 19
                                        }, this)
                                    }, item.id, false, {
                                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                        lineNumber: 168,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 166,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                        lineNumber: 155,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                lineNumber: 78,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
        lineNumber: 65,
        columnNumber: 5
    }, this);
}
_s(MarketIntelligencePanel, "dSoZjCHtB5xnzbP7z9KUMc+ZRfc=");
_c = MarketIntelligencePanel;
var _c;
__turbopack_context__.k.register(_c, "MarketIntelligencePanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=frontend_src_components_stocks_MarketIntelligencePanel_tsx_06mpkkd._.js.map