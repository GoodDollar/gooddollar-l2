module.exports = [
"[project]/frontend/src/lib/formatNoData.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NO_DATA_DASH",
    ()=>NO_DATA_DASH,
    "formatCompactUsd",
    ()=>formatCompactUsd,
    "intOrDash",
    ()=>intOrDash,
    "isNoData",
    ()=>isNoData,
    "pctOrDash",
    ()=>pctOrDash,
    "usdOrDash",
    ()=>usdOrDash
]);
/**
 * formatNoData — tiny formatting helpers that render a Unicode em-dash
 * ("—") whenever the underlying number is missing, non-finite, or a
 * suspicious zero used as a "no data" sentinel.
 *
 * Why exist: several stocks-related blocks (Top Movers, Drift & Rebalance,
 * Browse table 24h Change / Volume / Market Cap, per-ticker Key Statistics)
 * currently render literal `0` / `+0.00%` / `$0` for symbols whose
 * upstream feed has no value. That makes "we don't know" indistinguishable
 * from a real zero. These helpers gate every such cell on a single,
 * auditable rule:
 *
 *   isNoData(v) === true  →  render "—"
 *
 * Callers that have a genuine known-live zero can bypass by formatting
 * the value directly; the helpers are only for the "could be zero, could
 * be missing, we can't tell" case.
 */ const DASH = '—';
function isNoData(v) {
    if (v == null) return true;
    if (typeof v !== 'number') return true;
    if (!Number.isFinite(v)) return true;
    return v === 0;
}
function pctOrDash(value, decimals = 2) {
    if (isNoData(value)) return DASH;
    const n = value;
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(decimals)}%`;
}
function usdOrDash(value) {
    if (isNoData(value)) return DASH;
    return formatCompactUsd(value);
}
function intOrDash(value) {
    if (isNoData(value)) return DASH;
    return Math.round(value).toLocaleString();
}
function formatCompactUsd(value) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
    return `$${value.toFixed(2)}`;
}
const NO_DATA_DASH = DASH;
}),
"[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MarketIntelligencePanel",
    ()=>MarketIntelligencePanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatNoData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/formatNoData.ts [app-ssr] (ecmascript)");
;
;
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
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('gainers');
    // Only consider symbols whose 24h change actually came from a live feed.
    // The seed dataset uses 0 as a "no oracle update" sentinel; ranking on it
    // produces a fake "top movers" list of 5 identical +0.00% rows.
    const liveMovers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>stocks.filter((s)=>!(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatNoData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNoData"])(s.change24h)), [
        stocks
    ]);
    const hasLiveMovers = liveMovers.length > 0;
    const movers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (liveMovers.length === 0) return [];
        if (mode === 'gainers') {
            return [
                ...liveMovers
            ].filter((stock)=>stock.change24h >= 0).sort((a, b)=>b.change24h - a.change24h).slice(0, 5);
        }
        return [
            ...liveMovers
        ].filter((stock)=>stock.change24h < 0).sort((a, b)=>a.change24h - b.change24h).slice(0, 5);
    }, [
        mode,
        liveMovers
    ]);
    const earnings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        return stocks.slice(0, 5).map((stock, idx)=>({
                ticker: stock.ticker,
                date: formatEventDate(idx + 1),
                period: `Q${idx % 4 + 1} FY${new Date().getFullYear()}`
            }));
    }, [
        stocks
    ]);
    const headlines = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>buildFallbackHeadlines(stocks), [
        stocks
    ]);
    const isDemo = !isLive;
    const hasData = stocks.length > 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "mb-4 rounded-2xl border border-gray-700/20 bg-dark-100 p-3 sm:p-4",
        "aria-label": "Market Intelligence",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-3 flex items-center justify-between gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-sm font-semibold text-white",
                                children: "Market Intelligence"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 78,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-400",
                                children: "Top movers, upcoming earnings, and a quick news flow."
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 79,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                        lineNumber: 77,
                        columnNumber: 9
                    }, this),
                    isDemo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "rounded-md border border-yellow-500/25 bg-yellow-500/10 px-2 py-1 text-[10px] font-medium text-yellow-300",
                        children: "Demo intelligence data"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                        lineNumber: 82,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                lineNumber: 76,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 gap-3 lg:grid-cols-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "rounded-xl border border-gray-700/20 bg-dark-50/30 p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-2 flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-xs font-semibold uppercase tracking-wide text-gray-300",
                                        children: "Top Movers"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                        lineNumber: 91,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-1 rounded-md border border-gray-700/25 bg-dark-100/70 p-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setMode('gainers'),
                                                className: `rounded px-2 py-1 text-[11px] ${mode === 'gainers' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`,
                                                children: "Gainers"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                lineNumber: 93,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setMode('losers'),
                                                className: `rounded px-2 py-1 text-[11px] ${mode === 'losers' ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-400 hover:text-white'}`,
                                                children: "Losers"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                lineNumber: 100,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                        lineNumber: 92,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 90,
                                columnNumber: 11
                            }, this),
                            isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1.5",
                                "aria-busy": "true",
                                children: [
                                    1,
                                    2,
                                    3
                                ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "animate-pulse h-8 rounded-lg bg-dark-50/30"
                                    }, i, false, {
                                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                        lineNumber: 112,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 110,
                                columnNumber: 13
                            }, this) : !hasData ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-500",
                                children: "No movers available."
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 116,
                                columnNumber: 13
                            }, this) : !hasLiveMovers ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-500",
                                "data-testid": "top-movers-empty",
                                children: "No movers yet, waiting for live feed."
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 118,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "space-y-1.5",
                                children: movers.map((stock)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>onSelectTicker(stock.ticker),
                                            className: "flex w-full items-center justify-between rounded-lg border border-gray-700/20 bg-dark-100/60 px-2.5 py-1.5 text-xs hover:border-goodgreen/30 hover:text-white",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium text-gray-200",
                                                    children: stock.ticker
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                    lineNumber: 130,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: stock.change24h >= 0 ? 'text-green-400' : 'text-red-400',
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatNoData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pctOrDash"])(stock.change24h)
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                    lineNumber: 131,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                            lineNumber: 125,
                                            columnNumber: 19
                                        }, this)
                                    }, stock.ticker, false, {
                                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                        lineNumber: 124,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 122,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                        lineNumber: 89,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "rounded-xl border border-gray-700/20 bg-dark-50/30 p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300",
                                children: "Upcoming Earnings"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 142,
                                columnNumber: 11
                            }, this),
                            isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1.5",
                                "aria-busy": "true",
                                children: [
                                    1,
                                    2,
                                    3
                                ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "animate-pulse h-8 rounded-lg bg-dark-50/30"
                                    }, i, false, {
                                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                        lineNumber: 146,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 144,
                                columnNumber: 13
                            }, this) : !hasData ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-500",
                                children: "No earnings events available."
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 150,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "space-y-1.5",
                                children: earnings.map((event)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>onSelectTicker(event.ticker),
                                            className: "flex w-full items-center justify-between rounded-lg border border-gray-700/20 bg-dark-100/60 px-2.5 py-1.5 text-xs hover:border-goodgreen/30 hover:text-white",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium text-gray-200",
                                                    children: event.ticker
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                    lineNumber: 160,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-gray-400",
                                                    children: [
                                                        event.date,
                                                        " · ",
                                                        event.period
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                    lineNumber: 161,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                            lineNumber: 155,
                                            columnNumber: 19
                                        }, this)
                                    }, `${event.ticker}-${event.period}`, false, {
                                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                        lineNumber: 154,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 152,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                        lineNumber: 141,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "rounded-xl border border-gray-700/20 bg-dark-50/30 p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300",
                                children: "News Flow"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 170,
                                columnNumber: 11
                            }, this),
                            isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1.5",
                                "aria-busy": "true",
                                children: [
                                    1,
                                    2,
                                    3
                                ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "animate-pulse h-8 rounded-lg bg-dark-50/30"
                                    }, i, false, {
                                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                        lineNumber: 174,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 172,
                                columnNumber: 13
                            }, this) : !hasData ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-500",
                                children: "No headlines available."
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 178,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "space-y-2",
                                children: headlines.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        className: "rounded-lg border border-gray-700/20 bg-dark-100/60 px-2.5 py-2 text-xs",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>onSelectTicker(item.ticker),
                                            className: "w-full text-left",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mb-1 flex items-center justify-between gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "font-semibold text-gray-200",
                                                            children: item.ticker
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                            lineNumber: 185,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-[10px] text-gray-500",
                                                            children: item.age
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                            lineNumber: 186,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                    lineNumber: 184,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-gray-300",
                                                    children: item.title
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                    lineNumber: 188,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-1 text-[10px] text-gray-500",
                                                    children: [
                                                        item.source,
                                                        " · ",
                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatStockPrice"])(stocks.find((s)=>s.ticker === item.ticker)?.price ?? 0)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                                    lineNumber: 189,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                            lineNumber: 183,
                                            columnNumber: 19
                                        }, this)
                                    }, item.id, false, {
                                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                        lineNumber: 182,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                                lineNumber: 180,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                        lineNumber: 169,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
                lineNumber: 88,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx",
        lineNumber: 75,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx [app-ssr] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/frontend/src/components/stocks/MarketIntelligencePanel.tsx [app-ssr] (ecmascript)"));
}),
];

//# sourceMappingURL=frontend_src_0fvywdo._.js.map