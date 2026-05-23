module.exports = [
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
function StocksRebalanceDashboard({ symbols, totalCount, isFiltered = false, isLoading = false, error = null }) {
    const showFilteredHeading = isFiltered && typeof totalCount === 'number';
    // When every visible row is unsynced, the per-row em-dash policy renders
    // 12 nearly-identical "Unknown" rows that hide the real signal (oracle
    // offline). Collapse to one banner instead. The row-by-row dash policy
    // (task 0012) is preserved unchanged for the mixed case.
    const allUnsynced = !isLoading && !error && symbols.length > 0 && symbols.every(isUnsynced);
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
                            "data-testid": "rebalance-heading",
                            children: [
                                "Drift & Rebalance",
                                showFilteredHeading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-400 font-normal",
                                    children: ` · Showing ${symbols.length} of ${totalCount} (filtered)`
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                    lineNumber: 61,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                            lineNumber: 58,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-gray-400",
                            children: "Per-symbol block coherence across AMM, perps, prediction, lend, and yield."
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                            lineNumber: 66,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                    lineNumber: 57,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                lineNumber: 56,
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
                        lineNumber: 73,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                lineNumber: 71,
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
                lineNumber: 79,
                columnNumber: 9
            }, this),
            !isLoading && !error && symbols.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-gray-400",
                "data-testid": "rebalance-empty",
                children: isFiltered ? 'No symbols match the current filters.' : 'No active symbols reported.'
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                lineNumber: 83,
                columnNumber: 9
            }, this),
            allUnsynced && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-xl border border-gray-700/25 bg-dark-50/30 p-4 text-center",
                "data-testid": "rebalance-all-unsynced",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-200 font-medium",
                        children: [
                            "Oracle has not synced any of ",
                            symbols.length,
                            " symbols yet"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                        lineNumber: 93,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-1 text-xs text-gray-500",
                        children: [
                            "Drift, skew, and divergence will populate once oracles publish their first block. Symbols tracked:",
                            ' ',
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-300",
                                children: symbols.map((s)=>s.symbol).join(', ')
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                lineNumber: 99,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                        lineNumber: 96,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                lineNumber: 89,
                columnNumber: 9
            }, this),
            !isLoading && !error && symbols.length > 0 && !allUnsynced && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                                        lineNumber: 111,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 text-right font-medium",
                                        children: "Oracle block"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                        lineNumber: 112,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 text-right font-medium",
                                        children: "Last synced"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                        lineNumber: 113,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 text-right font-medium",
                                        children: "Skew"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                        lineNumber: 114,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 text-right font-medium",
                                        children: "Divergence"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                        lineNumber: 115,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 text-right font-medium",
                                        children: "Risk gate"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                        lineNumber: 116,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                lineNumber: 110,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                            lineNumber: 109,
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
                                            lineNumber: 124,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 text-right text-gray-300",
                                            children: unsynced ? __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatNoData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NO_DATA_DASH"] : entry.oracleBlock
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                            lineNumber: 125,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 text-right text-gray-300",
                                            children: unsynced ? __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatNoData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NO_DATA_DASH"] : entry.lastSyncedBlock
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                            lineNumber: 126,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 text-right text-gray-300",
                                            children: unsynced ? __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatNoData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NO_DATA_DASH"] : entry.blockSkew
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                            lineNumber: 127,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 text-right text-gray-300",
                                            children: unsynced ? __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$formatNoData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NO_DATA_DASH"] : formatBps(entry.divergenceBps)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                            lineNumber: 128,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 text-right",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `inline-flex rounded-md border px-2 py-1 ${statusTone(entry)}`,
                                                children: statusLabel(entry)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                                lineNumber: 130,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                            lineNumber: 129,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, entry.symbol, true, {
                                    fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                                    lineNumber: 123,
                                    columnNumber: 19
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                            lineNumber: 119,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                    lineNumber: 108,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
                lineNumber: 107,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx [app-ssr] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/frontend/src/components/stocks/StocksRebalanceDashboard.tsx [app-ssr] (ecmascript)"));
}),
];

//# sourceMappingURL=frontend_src_components_stocks_StocksRebalanceDashboard_tsx_0h1-6ft._.js.map