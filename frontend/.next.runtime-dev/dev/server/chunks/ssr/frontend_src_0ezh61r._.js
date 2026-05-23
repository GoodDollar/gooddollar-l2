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
"[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StocksRebalanceDashboard",
    ()=>StocksRebalanceDashboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatNoData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/formatNoData.ts [app-ssr] (ecmascript)");
'use client';
;
;
function formatBps(bps) {
    return `${(bps / 100).toFixed(2)}%`;
}
/** Row has never been synced — every numeric field reads as no-data. */ function isUnsynced(entry) {
    return entry.lastSyncedBlock === 0;
}
function statusTone(entry) {
    if (isUnsynced(entry)) return 'text-gray-300 bg-gray-500/10 border-gray-500/25';
    if (entry.riskIncreaseAllowed) return 'text-green-400 bg-green-500/10 border-green-500/25';
    return 'text-red-300 bg-red-500/10 border-red-500/25';
}
function statusLabel(entry) {
    if (isUnsynced(entry)) return 'Unknown';
    return entry.riskIncreaseAllowed ? 'Open' : 'Stopped';
}
function StocksRebalanceDashboard({ symbols, isLoading = false, error = null }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "rounded-2xl border border-gray-700/20 bg-dark-100/50 p-4 sm:p-5",
        "aria-label": "Stocks drift and rebalance dashboard",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between gap-3 mb-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-sm sm:text-base font-semibold text-white",
                            children: "Drift & Rebalance"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                            lineNumber: 37,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-gray-400",
                            children: "Per-symbol block coherence across AMM, perps, prediction, lend, and yield."
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                    lineNumber: 36,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, this),
            isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-2",
                "aria-busy": "true",
                children: [
                    1,
                    2,
                    3
                ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "animate-pulse h-6 rounded bg-dark-50/30"
                    }, i, false, {
                        fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                        lineNumber: 45,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                lineNumber: 43,
                columnNumber: 9
            }, this),
            !isLoading && error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-red-300",
                children: [
                    "Unable to load sync status: ",
                    error
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                lineNumber: 51,
                columnNumber: 9
            }, this),
            !isLoading && !error && symbols.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-gray-400",
                children: "No active symbols reported."
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                lineNumber: 55,
                columnNumber: 9
            }, this),
            !isLoading && !error && symbols.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "overflow-x-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    className: "w-full text-xs",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                className: "text-gray-400 border-b border-gray-700/30",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 text-left font-medium",
                                        children: "Symbol"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                        lineNumber: 63,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 text-right font-medium",
                                        children: "Oracle block"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                        lineNumber: 64,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 text-right font-medium",
                                        children: "Last synced"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                        lineNumber: 65,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 text-right font-medium",
                                        children: "Skew"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                        lineNumber: 66,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 text-right font-medium",
                                        children: "Divergence"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                        lineNumber: 67,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 text-right font-medium",
                                        children: "Risk gate"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                        lineNumber: 68,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                lineNumber: 62,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                            lineNumber: 61,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: symbols.map((entry)=>{
                                const unsynced = isUnsynced(entry);
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    className: "border-b border-gray-700/10",
                                    "data-testid": unsynced ? 'rebalance-row-unsynced' : 'rebalance-row',
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 text-white font-medium",
                                            children: entry.symbol
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                            lineNumber: 76,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 text-right text-gray-300",
                                            children: unsynced ? __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatNoData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NO_DATA_DASH"] : entry.oracleBlock
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                            lineNumber: 77,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 text-right text-gray-300",
                                            children: unsynced ? __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatNoData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NO_DATA_DASH"] : entry.lastSyncedBlock
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                            lineNumber: 78,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 text-right text-gray-300",
                                            children: unsynced ? __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatNoData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NO_DATA_DASH"] : entry.blockSkew
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                            lineNumber: 79,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 text-right text-gray-300",
                                            children: unsynced ? __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatNoData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NO_DATA_DASH"] : formatBps(entry.divergenceBps)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                            lineNumber: 80,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 text-right",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `inline-flex rounded-md border px-2 py-1 ${statusTone(entry)}`,
                                                children: statusLabel(entry)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                                lineNumber: 82,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                            lineNumber: 81,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, entry.symbol, true, {
                                    fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                    lineNumber: 75,
                                    columnNumber: 19
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                            lineNumber: 71,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                    lineNumber: 60,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                lineNumber: 59,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
        lineNumber: 34,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx [app-ssr] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx [app-ssr] (ecmascript)"));
}),
];

//# sourceMappingURL=frontend_src_0ezh61r._.js.map