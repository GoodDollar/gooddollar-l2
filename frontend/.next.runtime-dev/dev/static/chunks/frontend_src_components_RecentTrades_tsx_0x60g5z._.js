(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/components/RecentTrades.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RecentTrades",
    ()=>RecentTrades
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/perpsData.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
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
    _s();
    const trades = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "RecentTrades.useMemo[trades]": ()=>generateRecentTrades(markPrice)
    }["RecentTrades.useMemo[trades]"], [
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
                        fileName: "[project]/frontend/src/components/RecentTrades.tsx",
                        lineNumber: 41,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Size"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/RecentTrades.tsx",
                        lineNumber: 42,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-h-[300px] overflow-y-auto divide-y divide-gray-700/5 scrollbar-none",
                tabIndex: 0,
                role: "region",
                "aria-label": "Recent trades list",
                children: trades.map((t, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-between px-2 py-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: t.side === 'buy' ? 'text-green-400' : 'text-red-400',
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(t.price)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/RecentTrades.tsx",
                                lineNumber: 48,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-300",
                                children: t.size.toFixed(3)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/RecentTrades.tsx",
                                lineNumber: 49,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_s(RecentTrades, "3wUny5lnCjpAqJxI2PG+1JNPh3g=");
_c = RecentTrades;
var _c;
__turbopack_context__.k.register(_c, "RecentTrades");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/RecentTrades.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/frontend/src/components/RecentTrades.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=frontend_src_components_RecentTrades_tsx_0x60g5z._.js.map